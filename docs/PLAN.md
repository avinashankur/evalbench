# EvalBench Frontend — Project Plan

> Generated: 2026-08-29  
> Status: **Phase 1–6 scaffolded, not yet compiled or verified**

---

## Overview

Next.js 16 + TypeScript frontend for the [EvalBench](../evalbench) AI evaluation benchmarking platform. Consumes the EvalBench FastAPI REST API (`/api/v1/*`) and adds frontend authentication via [Better Auth](https://better-auth.com).

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, `src/` dir) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4, `cn()` utility |
| UI Primitives | shadcn/ui (not yet initialized — see TODO) |
| State / Data | TanStack Query v5 |
| Forms | react-hook-form + zod |
| Auth | Better Auth (server-side in Next.js API routes) |
| HTTP Client | Custom Fetch-based `apiClient` with interceptor pipeline |
| Toasts | Sonner |
| Icons | Lucide React |
| Theming | next-themes (light/dark) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Component (Page)                                        │
│  Uses hooks. Renders loading/error/data states.          │
├──────────────────────────────────────────────────────────┤
│  TanStack Query Hook (Layer 2)                           │
│  useQuery / useMutation wrappers                         │
│  Owns: caching, loading state, retry, invalidation       │
├──────────────────────────────────────────────────────────┤
│  Module API Function (Layer 1)                           │
│  Pure async functions. Calls apiClient.                   │
│  The ONLY place apiClient is imported.                    │
├──────────────────────────────────────────────────────────┤
│  apiClient (lib/api) — Fetch + Interceptors               │
└─────────────┬────────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
 Better Auth        EvalBench FastAPI
 (Next.js API       :8000/api/v1/*
  routes)
```

---

## Current File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Centered card layout for auth
│   │   ├── login/page.tsx          # Email/password login
│   │   └── signup/page.tsx         # Email/password signup
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell (sidebar + header)
│   │   ├── dashboard/page.tsx      # Overview: health, recent runs, quick actions
│   │   ├── runs/
│   │   │   ├── page.tsx            # Runs list with filtering + delete
│   │   │   ├── [runId]/page.tsx    # Run detail: metrics, paginated results, polling
│   │   │   └── new/page.tsx        # New run form: model, dataset, evaluators
│   │   ├── jobs/page.tsx           # Submit + track distributed jobs
│   │   ├── compare/page.tsx        # Multi-run side-by-side comparison
│   │   └── settings/page.tsx       # Health, providers, evaluators discovery
│   ├── api/auth/[...all]/route.ts  # Better Auth catch-all handler
│   ├── layout.tsx                  # Root layout (AppProviders, fonts, metadata)
│   ├── page.tsx                    # Redirects to /dashboard
│   └── globals.css
├── components/
│   └── layout/
│       ├── sidebar.tsx             # Nav sidebar with route highlighting
│       ├── header.tsx              # Top bar with theme toggle + sign out
│       └── dashboard-layout.tsx    # Composes sidebar + header + main
├── config/
│   └── site.ts                     # App name, description, nav config
├── lib/
│   ├── api/
│   │   ├── client.ts               # Fetch wrapper with interceptors, timeout
│   │   ├── interceptors.ts         # Request/response interceptor registry
│   │   ├── auth.interceptor.ts     # 401 handler placeholder (dormant)
│   │   ├── errors.ts               # ApiError type + response parser
│   │   ├── baseApi.ts              # BASE = '/api/v1'
│   │   ├── queryClient.ts          # TanStack Query client factory
│   │   └── index.ts                # Barrel export
│   ├── auth.ts                     # Better Auth server instance
│   ├── auth-client.ts              # Better Auth React client
│   └── utils.ts                    # cn() class merge utility
├── middleware.ts                   # Route protection (session cookie check)
├── modules/
│   ├── runs/
│   │   ├── types/run.types.ts      # All run/test-case/metric types
│   │   ├── api/runs.api.ts         # listRuns, getRun, getRunResults, createRun, deleteRun
│   │   ├── hooks/
│   │   │   ├── run.keys.ts         # Query key factory
│   │   │   ├── useListRuns.ts
│   │   │   ├── useGetRun.ts        # Polls every 3s while status=running
│   │   │   ├── useGetRunResults.ts
│   │   │   ├── useCreateRun.ts
│   │   │   └── useDeleteRun.ts
│   │   └── index.ts
│   ├── jobs/
│   │   ├── types/job.types.ts
│   │   ├── api/jobs.api.ts
│   │   ├── hooks/
│   │   │   ├── job.keys.ts
│   │   │   ├── useCreateJob.ts
│   │   │   ├── useGetJob.ts        # Polls while queued/running
│   │   │   └── useGetJobResults.ts
│   │   └── index.ts
│   └── discovery/
│       ├── types/discovery.types.ts
│       ├── api/discovery.api.ts
│       ├── hooks/
│       │   ├── discovery.keys.ts
│       │   ├── useHealth.ts        # Auto-polls every 60s
│       │   ├── useProviders.ts
│       │   └── useEvaluators.ts
│       └── index.ts
├── providers/
│   └── AppProvider.tsx             # QueryClientProvider + ThemeProvider + Toaster
└── env.ts                          # Type-safe env validation (t3-env)
```

---

## What's Done (Phases 1–6 Scaffolded)

- [x] **Phase 1**: Project created via `create-next-app@16`, all deps installed
- [x] **Phase 2**: Full API client layer ported from Snipx (client, interceptors, errors, queryClient)
- [x] **Phase 3**: Better Auth server instance, client, catch-all route, middleware
- [x] **Phase 4**: Layout components (sidebar, header, dashboard-layout), AppProvider
- [x] **Phase 5**: All 3 feature modules (runs, jobs, discovery) — types, API, hooks, barrel exports
- [x] **Phase 6**: All pages — auth (login, signup), dashboard, runs (list, detail, new), jobs, compare, settings

---

## TODO — Before First Build

### Critical (must fix for `npm run build` to succeed)

- [ ] **Initialize shadcn/ui**: Run `npx shadcn@latest init` and add base components. Currently the project uses Tailwind utility classes directly (no shadcn components imported), so this is optional but recommended for future consistency.

- [ ] **Update `globals.css`**: The default `globals.css` from `create-next-app` needs Tailwind CSS theme variables (colors for `background`, `foreground`, `primary`, `muted`, `destructive`, `card`, `border`, etc.) that the layout and page components reference. Without these, the theme classes like `bg-card`, `text-muted-foreground` won't work.

- [ ] **Verify Better Auth database**: Better Auth needs its tables created. Run `npx @better-auth/cli migrate` after setting `DATABASE_URL` in `.env`. Requires a running PostgreSQL instance.

- [ ] **Generate `BETTER_AUTH_SECRET`**: The placeholder in `.env` must be replaced with a real 32+ char secret: `openssl rand -base64 32`.

- [ ] **Type-check and fix any TS errors**: Run `npm run type-check` and fix issues. Potential areas:
  - `LayoutProps` type from Next.js 16 (the default scaffold used it; we replaced it with `{ children: React.ReactNode }`)
  - Better Auth import paths may vary by version
  - `use(params)` pattern in `[runId]/page.tsx` — verify Next.js 16 supports async params unwrapping via `use()`

### Recommended (quality of life)

- [ ] **Landing page**: Current root `/` just redirects to `/dashboard`. Consider a proper landing page for unauthenticated users.

- [ ] **Error boundaries**: Add `error.tsx` and `loading.tsx` to route groups for graceful error/loading states.

- [ ] **Responsive sidebar**: Current sidebar is fixed 256px. Add mobile hamburger menu / collapsible behavior.

- [ ] **shadcn form components**: The auth pages and new run form use raw `<input>` and `<button>`. Consider migrating to shadcn `<Input>`, `<Button>`, `<Select>` for consistent styling.

- [ ] **ESLint config**: Review the auto-generated `eslint.config.mjs` and add any custom rules.

### Future Enhancements

- [ ] **Auth enforcement on FastAPI**: Add JWT verification middleware to the EvalBench backend that validates Better Auth session tokens. Currently all API calls are unauthenticated.

- [ ] **OAuth providers**: Add Google/GitHub social login via Better Auth plugins.

- [ ] **Real-time updates**: Replace polling with WebSocket/SSE when the backend adds support (deferred per ADR 004).

- [ ] **Run comparison charts**: Add charting library (Recharts, Chart.js) for visual metric comparison.

- [ ] **Dataset upload**: Allow uploading JSONL datasets from the browser instead of requiring server-side paths.

- [ ] **Run history analytics**: Aggregate metrics over time, trend charts.

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | EvalBench FastAPI backend URL |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | This frontend's URL |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string for Better Auth |
| `BETTER_AUTH_SECRET` | Yes | — | 32+ char secret for session encryption |

---

## Getting Started

```bash
# 1. Install dependencies (already done)
npm install

# 2. Set up environment
cp .env.example .env  # or edit .env directly
# Generate a secret: openssl rand -base64 32

# 3. Run Better Auth migration (creates user/session tables)
npx @better-auth/cli migrate

# 4. Start the EvalBench backend
cd ../evalbench && evalbench serve

# 5. Start the frontend
npm run dev
```

---

## Key Patterns

### 3-Layer API Pattern

```
Component → Hook → API Function → apiClient
```

- **Components** never import `apiClient` or API functions directly
- **Hooks** never import `apiClient` — they call API functions
- **API functions** are the only place `apiClient` is imported

### Query Key Factories

Each module has a `*.keys.ts` file with hierarchical keys for precise cache invalidation:

```ts
runKeys.all         → ['runs']           // invalidate everything
runKeys.list()      → ['runs', 'list']   // invalidate list only
runKeys.detail(id)  → ['runs', 'detail', id]  // invalidate one run
```

### Polling for In-Progress Work

`useGetRun` and `useGetJob` use TanStack Query's `refetchInterval` to auto-poll every 3 seconds while the status is `running`/`queued`, then stop when completed/failed.
