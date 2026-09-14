# 002-ADR: Use Better Auth for Authentication and Session Management

**Date:** 2026-08-31  
**Status:** Accepted  
**Deciders:** EvalBench Core Engineering Team  
**Tags:** auth, security, postgresql, nextjs, sessions  

---

## Context

EvalBench Frontend requires a secure, self-hostable authentication and session management system to:
1. Support multi-user accounts for AI engineers, researchers, and team leads.
2. Provide secure user registration, email/password login, and session persistence.
3. Protect dashboard routes (`/dashboard`, `/runs/*`, `/jobs/*`, `/settings`) from unauthenticated access.
4. Keep user credentials and session data private and self-contained within the team's infrastructure (e.g. self-hosted PostgreSQL or managed database), rather than locking into external identity SaaS platforms.

Because the frontend is built on **Next.js 16 (App Router)** and communicates with a Python FastAPI backend, we need an authentication solution that integrates natively with Next.js server handlers and client components without adding unnecessary complexity to the evaluation backend.

---

## Decision

We will use **[Better Auth](https://better-auth.com)** (`better-auth` v1.7) backed by a **PostgreSQL** database connection pool (`pg`) for authentication and session management in the EvalBench Frontend.

The authentication infrastructure is configured as follows:
- **Server Instance:** Configured in `src/lib/auth.ts` using `betterAuth` with a PostgreSQL connection pool (`env.DATABASE_URL`), session cookie caching (5-minute TTL), and email/password authentication.
- **Route Handler:** Mounted at `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler(auth)` to handle all auth endpoints.
- **React Client:** Configured in `src/lib/auth-client.ts` via `createAuthClient` for type-safe sign-in, sign-up, sign-out, and reactive `useSession()` hooks in UI components.
- **Route Protection:** Session cookies are checked by Next.js middleware and client redirect guards.

---

## Alternatives Considered

### Option A: NextAuth.js / Auth.js (v5)

- **Description:** The incumbent authentication framework for Next.js applications.
- **Pros:** Established ecosystem; large library of OAuth providers; widespread documentation.
- **Cons:** Ongoing instability during the Auth.js v5 beta transition; heavy configuration boilerplate; complex ORM adapter setup (requires full Prisma/Drizzle schema wiring for basic credentials); awkward handling of custom email/password credentials without OAuth.
- **Why we didn't choose it:** Better Auth offers a cleaner, modern API with first-class TypeScript inference, zero-boilerplate direct PostgreSQL adapter support, and superior developer ergonomics for credentials authentication.

### Option B: Managed Identity SaaS (Clerk, Auth0, Supabase Auth)

- **Description:** Delegate user management, authentication UI, and session tokens to a hosted identity provider.
- **Pros:** Turnkey pre-built UI components; hosted user management dashboard; zero database schema management.
- **Cons:** Third-party vendor lock-in; recurring per-user monthly subscription costs; data privacy and compliance risks for enterprise on-premise AI evaluation deployments; network dependency on external auth services for every session check.
- **Why we didn't choose it:** EvalBench is designed to be self-hostable and privacy-conscious for proprietary AI workflows. Keeping user data in the team's own PostgreSQL database is a critical requirement.

### Option C: Custom FastAPI Backend JWT Authentication

- **Description:** Implement custom user registration, bcrypt password hashing, and JWT token issuance on the Python FastAPI backend, storing tokens in the browser.
- **Pros:** Centralizes all logic in the Python backend.
- **Cons:** Shifts significant auth engineering burden (CSRF handling, secure HTTP-only cookie setting across domains, token refresh rotations, rate limiting) onto the evaluation backend; complicates Next.js App Router server component session hydration and middleware route guards.
- **Why we didn't choose it:** Building and auditing a custom auth system introduces security liabilities. Better Auth provides battle-tested session management natively within Next.js, allowing the FastAPI backend to stay focused on benchmark execution.

### Option D (Chosen): Better Auth with Direct PostgreSQL Adapter

- **Description:** A modern, TypeScript-first authentication framework running directly inside Next.js server routes with direct database connectivity.
- **Pros:**
  - **Self-Hosted & Private:** Complete control over user data and database schemas in PostgreSQL.
  - **First-Class Next.js 16 Support:** Native integration with App Router, server handlers, and React 19 client components.
  - **Extensible:** Supports built-in CLI migrations (`@better-auth/cli`), two-factor authentication (2FA), organization plugins, and future OAuth providers (GitHub, Google) with minimal configuration.
  - **High Performance:** Built-in cookie caching reduces redundant database lookups on high-frequency route transitions.
- **Why this one:** It satisfies all data privacy requirements, eliminates third-party subscription costs, and provides a polished developer experience.

---

## Consequences

### Positive

- Zero third-party auth service dependencies or recurring licensing costs.
- User and session data remain securely stored in the application's PostgreSQL database.
- Clean client-side React hooks (`authClient.useSession()`, `authClient.signIn.email()`, `authClient.signOut()`).
- Automated schema migrations via `npx @better-auth/cli migrate`.
- Future-proof support for enterprise SSO and social login plugins.

### Negative

- Requires a provisioned PostgreSQL instance for the frontend server at all times.
- Database migrations must be run whenever Better Auth schema plugins are added or updated.

### Neutral

- Session state is persisted via HTTP-only cookies rather than bearer tokens in local storage.

---

## Follow-up Actions

- [x] Configure Better Auth server instance in `src/lib/auth.ts`.
- [x] Implement React client helper in `src/lib/auth-client.ts`.
- [x] Build Login (`/login`) and Signup (`/signup`) pages.
- [ ] Run `npx @better-auth/cli migrate` against the PostgreSQL database in staging and production.
- [ ] Implement backend session verification in FastAPI to validate Better Auth session cookies/tokens on protected evaluation endpoints.
- [ ] Add social OAuth providers (GitHub, Google) via Better Auth configuration when requested.

---

## References

- [Better Auth Documentation](https://better-auth.com/docs)
- [ADR-001: Use Next.js for Frontend with Python FastAPI Backend](./001-use-nextjs-with-fastapi-backend.md)
- [EvalBench Architecture](../../ARCHITECTURE.md)
- [EvalBench Context & Invariants](../../CONTEXT.md)
