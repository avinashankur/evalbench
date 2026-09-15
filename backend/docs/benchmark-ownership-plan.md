# Benchmark Ownership — Implementation Plan

**Date:** 2026-09-15
**Status:** Draft
**Tags:** auth, ownership, multi-tenant, security

---

## Problem Statement

The EvalBench backend currently has **no concept of benchmark ownership**. All
evaluation runs and jobs are stored and served globally — any authenticated
(or unauthenticated) user can list, view, and delete any run. The frontend has
implemented Better Auth for user sign-in/sign-up, but the backend does not
verify sessions or scope data to the authenticated user.

### Current State

| Layer           | Auth Status                                                       |
| :-------------- | :---------------------------------------------------------------- |
| **Frontend**    | ✅ Better Auth with PostgreSQL (email/password, cookie sessions)  |
| **Backend API** | ❌ No auth verification, no session checking, no ownership model  |
| **Database**    | ❌ `runs` and `test_case_results` tables have no `user_id` column |

---

## Design Decisions (Confirmed)

| Decision                     | Choice                                                              |
| :--------------------------- | :------------------------------------------------------------------ |
| **Ownership Model**          | Individual user — each run belongs to the user who created it       |
| **Admin Role**               | Yes — admins can see all runs across all users                      |
| **Backend Auth Mechanism**   | Read Better Auth `session` table directly from shared PostgreSQL DB |
| **Legacy Runs (no owner)**   | Keep as unowned, visible to everyone                                |
| **Jobs Scoped by Ownership** | Yes — `/api/v1/jobs` endpoints also scoped the same way             |

---

## Better Auth Schema (Shared PostgreSQL)

Better Auth creates the following core tables (relevant subset):

### `user` table

| Column       | Type        | Notes                             |
| :----------- | :---------- | :-------------------------------- |
| `id`         | `TEXT` (PK) | Unique user identifier            |
| `name`       | `TEXT`      | Display name                      |
| `email`      | `TEXT`      | Unique email                      |
| `role`       | `TEXT`      | `"user"` or `"admin"` (via Admin plugin or `additionalFields`) |
| `created_at` | `TIMESTAMP` |                                   |
| `updated_at` | `TIMESTAMP` |                                   |

### `session` table

| Column       | Type        | Notes                                           |
| :----------- | :---------- | :---------------------------------------------- |
| `id`         | `TEXT` (PK) | Session ID                                      |
| `token`      | `TEXT`      | Session token (matches `better-auth.session_token` cookie) |
| `user_id`    | `TEXT` (FK) | References `user.id`                            |
| `expires_at` | `TIMESTAMP` | Session expiry                                  |
| `ip_address` | `TEXT`      |                                                 |
| `user_agent` | `TEXT`      |                                                 |

> **Key insight:** The `better-auth.session_token` cookie sent by the
> frontend contains the session token. The backend can look up
> `session.token = <cookie_value>` to find the session row, then join to `user`
> to get the authenticated user's `id` and `role`.

---

## Proposed Changes

### Phase 1 — Add Role System via Better Auth Admin Plugin (Prerequisite)

> [!IMPORTANT]
> The `user` table currently has **no `role` column**. This phase must be
> completed first — all subsequent phases depend on the role being
> queryable from PostgreSQL.

#### [MODIFY] `frontend/src/lib/auth.ts`

Enable the Better Auth `admin` plugin and declare the `role` field as a
server-owned `additionalField`. This tells Better Auth to manage a `role`
column on the `user` table:

```typescript
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { Pool } from 'pg'
import { env } from '@/env'

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL,
  }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,

  emailAndPassword: {
    enabled: true,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  plugins: [admin()],

  user: {
    additionalFields: {
      role: {
        type: ['user', 'admin'],
        required: false,
        defaultValue: 'user',
        input: false, // server-owned, users cannot self-assign roles
      },
    },
  },
})
```

#### Run Better Auth migration

After updating `auth.ts`, run the CLI migration to add the `role` column
to the `user` table in PostgreSQL:

```bash
cd frontend
npx auth@latest migrate
```

This will detect the missing `role` column and prompt you to add it.
Existing users will get `NULL` for the role — the backend auth dependency
(Phase 2) will treat `NULL` the same as `'user'`.

#### Seed the first admin

Use the Better Auth CLI to promote an existing user or create a new admin:

```bash
npx auth@latest create-admin --email admin@example.com --name "Admin" --role admin
```

Or update an existing user directly in PostgreSQL:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

### Phase 2 — Backend Auth Dependency

#### [NEW] `evalbench/api/auth.py`

A new module containing the core auth dependency:

```python
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request

from evalbench.api.dependencies import get_postgres_store
from evalbench.storage.postgres_store import PostgresResultStore


class AuthenticatedUser:
    """Represents a verified Better Auth user for the current request."""

    def __init__(self, user_id: str, email: str, name: str, role: str) -> None:
        self.user_id = user_id
        self.email = email
        self.name = name
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"
```

The dependency function `get_current_user`:

1. Extracts the `better-auth.session_token` cookie from the incoming request.
2. Queries the shared PostgreSQL database:
   ```sql
   SELECT s.user_id, u.email, u.name, COALESCE(u.role, 'user') AS role
   FROM "session" s
   JOIN "user" u ON s.user_id = u.id
   WHERE s.token = $1
     AND s.expires_at > now()
   ```
   > `COALESCE(u.role, 'user')` ensures users who signed up before the
   > admin plugin migration (role = `NULL`) are treated as regular users.
3. Returns an `AuthenticatedUser` instance, or raises `HTTPException(401)`.

An optional `get_optional_user` variant returns `None` instead of 401-ing, for
endpoints where legacy unowned runs should remain publicly visible.

---

### Phase 3 — Database Schema Migration (Backend)

#### [MODIFY] `evalbench/storage/schema.sql`

Add `owner_id` directly to the `CREATE TABLE` statement (for fresh installs)
and an `ALTER TABLE` (for existing databases). Since `ensure_schema()` runs
this file on every startup, both cases are handled automatically:

```sql
CREATE TABLE IF NOT EXISTS runs (
    run_id           UUID PRIMARY KEY,
    dataset_name     TEXT NOT NULL,
    provider         TEXT NOT NULL,
    model            TEXT NOT NULL,
    total_test_cases INTEGER NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    metrics          JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_id         TEXT                -- NULL for legacy unowned runs
);

-- Backfill for existing databases where the column doesn't exist yet
ALTER TABLE runs ADD COLUMN IF NOT EXISTS owner_id TEXT;

CREATE INDEX IF NOT EXISTS idx_runs_owner_id ON runs(owner_id);
```

No separate migration file needed — `ensure_schema()` in
`PostgresResultStore` already executes `schema.sql` at startup.

---

### Phase 4 — Scoped Queries in PostgresResultStore

#### [MODIFY] `evalbench/storage/postgres_store.py`

**`asave()`** — Accept `owner_id` parameter, insert it alongside run data:

```sql
INSERT INTO runs (run_id, dataset_name, provider, model, total_test_cases, metrics, owner_id)
VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7)
```

**`list_runs()`** — Accept `owner_id` and `is_admin` parameters:
- If `is_admin=True`: return all runs (current behavior)
- If `owner_id` is provided: filter `WHERE owner_id = $1 OR owner_id IS NULL`
  (user's own runs + legacy unowned runs)

**`aget_run()`** — Accept `owner_id` and `is_admin` parameters:
- If `is_admin=True`: no ownership check
- Otherwise: verify `owner_id = $1 OR owner_id IS NULL`
- Return `403` (not `404`) if ownership doesn't match

**`adelete()`** — Accept `owner_id` and `is_admin` parameters:
- Only the owner (or an admin) can delete a run

---

### Phase 5 — Scoped API Endpoints

#### [MODIFY] `evalbench/api/routers/runs.py`

Add `get_current_user` dependency to all endpoints:

| Endpoint                       | Change                                                |
| :----------------------------- | :---------------------------------------------------- |
| `POST /runs`                   | Inject `user.user_id` as `owner_id` into `asave()`    |
| `GET /runs`                    | Pass `owner_id` + `is_admin` to `list_runs()`         |
| `GET /runs/{run_id}`           | Pass `owner_id` + `is_admin` to `aget_run()`          |
| `GET /runs/{run_id}/results`   | Ownership check before returning results              |
| `DELETE /runs/{run_id}`        | Pass `owner_id` + `is_admin` to `adelete()`           |

#### [MODIFY] `evalbench/api/routers/jobs.py`

Same pattern — inject `get_current_user` and scope by `owner_id`:

| Endpoint                          | Change                                            |
| :-------------------------------- | :------------------------------------------------ |
| `POST /jobs`                      | Store `owner_id` in the `EvalJob` dataclass       |
| `GET /jobs/{job_id}`              | Only owner or admin can check status               |
| `GET /jobs/{job_id}/results`      | Only owner or admin can fetch results             |

#### [MODIFY] `evalbench/storage/redis_queue.py`

Add `owner_id` field to the `EvalJob` dataclass so it persists through
the queue lifecycle.

---

### Phase 6 — Response Schema Updates

#### [MODIFY] `evalbench/api/schemas.py`

Add `owner_id` (optional) to response models so the frontend can display
who owns each run:

- `RunSummaryResponse` → add `owner_id: str | None = None`
- `RunListItem` → add `owner_id: str | None = None`
- `JobStatusResponse` → add `owner_id: str | None = None`

---

## Ownership Visibility Rules (Summary)

```
┌──────────────────────────────────────────────┐
│              Visibility Matrix               │
├────────────────┬──────────────┬──────────────┤
│ Run Owner      │ Regular User │ Admin        │
├────────────────┼──────────────┼──────────────┤
│ user_A         │ user_A only  │ ✅ visible   │
│ user_B         │ user_B only  │ ✅ visible   │
│ NULL (legacy)  │ ✅ visible   │ ✅ visible   │
└────────────────┴──────────────┴──────────────┘
```

---

## File Change Summary

| File                                         | Action   |
| :------------------------------------------- | :------- |
| `evalbench/api/auth.py`                      | **NEW**  |
| `evalbench/storage/schema.sql`               | MODIFY   |
| `evalbench/storage/postgres_store.py`        | MODIFY   |
| `evalbench/api/routers/runs.py`              | MODIFY   |
| `evalbench/api/routers/jobs.py`              | MODIFY   |
| `evalbench/api/schemas.py`                   | MODIFY   |
| `evalbench/storage/redis_queue.py`           | MODIFY   |
| `frontend/src/lib/auth.ts`                   | MODIFY   |

---

## Verification Plan

### Automated Tests

1. Unit tests for `get_current_user` dependency:
   - Valid session token → returns `AuthenticatedUser`
   - Expired session → raises 401
   - Missing cookie → raises 401
   - Admin role detection

2. Unit tests for scoped queries:
   - Regular user sees only their runs + legacy unowned runs
   - Admin sees all runs
   - Delete rejects non-owner, non-admin

3. Integration test:
   - Create a run as user_A → verify user_B cannot see or delete it
   - Create a run as user_A → verify admin can see and delete it

### Manual Verification

1. Run the migration against a dev database
2. Create runs through the frontend as two different users
3. Confirm user isolation in the dashboard
4. Confirm admin user sees all runs
5. Confirm legacy runs (NULL owner) remain visible to everyone

---

## Open Questions

None — all design decisions have been confirmed.

---

## References

- [ADR-002: Use Better Auth for Authentication](../frontend/docs/adr/002-use-better-auth-for-authentication.md)
- [Better Auth Database Schema Docs](https://better-auth.com/docs/concepts/database)
- [Better Auth Admin Plugin Docs](https://better-auth.com/docs/plugins/admin)
- [EvalBench Backend Architecture](../ARCHITECTURE.md)
