# CONTEXT.md

> This file provides essential context for AI coding assistants and new contributors. It is intentionally dense — read fully before making changes.  
> **Last updated:** 2026-08-31

---

## What this is

EvalBench Frontend is the web interface for the EvalBench AI evaluation and benchmarking platform. It allows AI engineers and developers to configure and trigger model evaluation runs, monitor background execution in real time, inspect per-test-case metrics and outputs, submit distributed benchmark jobs, and compare results across models. It is built as a Next.js 16 App Router application consuming the EvalBench FastAPI REST backend (`/api/v1/*`) with user authentication managed via Better Auth.

---

## Tech Stack

| Layer | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | 5.x | Strict mode enforced |
| **Framework** | Next.js (App Router) | 16.3.3 | Uses `src/` directory, server actions, route groups |
| **Runtime** | Node.js | 20 LTS | ES modules |
| **Styling** | Tailwind CSS | 4.x | PostCSS, `@tailwindcss/postcss`, `cn()` utility |
| **Icons & UI** | Lucide React | 1.35.0 | Consistent iconography |
| **State / Cache** | TanStack Query | 5.102.8 | Caching, polling, mutations, Devtools enabled |
| **Auth** | Better Auth | 1.7.2 | Server route handler at `/api/auth/[...all]`, React client |
| **Database** | PostgreSQL (`pg`) | 8.23.0 | Better Auth storage adapter |
| **Validation** | Zod / `@t3-oss/env-nextjs` | 4.5.2 / 0.13.11 | Runtime schema validation for env and payloads |
| **Toasts & Theming** | Sonner / `next-themes` | 2.0.8 / 0.4.6 | Toast notifications and dark/light mode provider |

---

## Codebase Map

```
src/
├── app/
│   ├── (auth)/                     - Unauthenticated auth pages (card layout)
│   │   ├── layout.tsx              - Centered auth card layout
│   │   ├── login/page.tsx          - Email & password sign-in
│   │   └── signup/page.tsx         - New user registration
│   ├── (dashboard)/                - Authenticated dashboard application
│   │   ├── layout.tsx              - App shell (Sidebar + Header + Main container)
│   │   ├── dashboard/page.tsx      - Overview: health, recent runs, quick launch
│   │   ├── runs/                   - Evaluation run management
│   │   │   ├── page.tsx            - Runs table with search & deletion
│   │   │   ├── [runId]/page.tsx    - Run detail: metric cards, results, auto-polling
│   │   │   └── new/page.tsx        - Form to configure & trigger new evaluation
│   │   ├── jobs/page.tsx           - Distributed jobs monitoring & submission
│   │   ├── compare/page.tsx        - Side-by-side run metric comparisons
│   │   └── settings/page.tsx       - System health, provider & evaluator discovery
│   ├── api/auth/[...all]/route.ts  - Better Auth catch-all API handler
│   ├── layout.tsx                  - Root HTML layout (AppProvider, fonts, metadata)
│   ├── page.tsx                    - Root redirect (`/` -> `/dashboard`)
│   └── globals.css                 - Global styles and Tailwind configuration
├── components/
│   └── layout/                     - Shell layout components
│       ├── sidebar.tsx             - Nav links, current route highlight, collapse
│       ├── header.tsx              - Top bar with theme toggle & user profile/logout
│       └── dashboard-layout.tsx    - Composed layout wrapper
├── config/
│   └── site.ts                     - App metadata, navigation links, branding
├── env.ts                          - Type-safe environment variable schema (t3-env)
├── lib/
│   ├── api/                        - Central HTTP transport & QueryClient
│   │   ├── client.ts               - Custom fetch client with timeout & error handling
│   │   ├── errors.ts               - ApiError class and FastAPI error payload parsers
│   │   ├── baseApi.ts              - Base URL constants (`/api/v1`)
│   │   ├── queryClient.ts          - TanStack QueryClient instantiation factory
│   │   └── index.ts                - Barrel export
│   ├── auth.ts                     - Better Auth server configuration with PG pool
│   ├── auth-client.ts              - Better Auth client helper for React components
│   └── utils.ts                    - `cn()` helper (clsx + tailwind-merge)
├── middleware.ts                   - Next.js route guard inspecting session cookies
├── modules/                        - Domain feature modules (3-layer architecture)
│   ├── runs/                       - Runs domain (types, API functions, hooks)
│   ├── jobs/                       - Distributed jobs domain
│   └── discovery/                  - Evaluator, provider, and health discovery
└── providers/
    └── AppProvider.tsx             - Context provider wrapping QueryClient, Theme, Sonner
docs/
├── architecture/                   - Project-specific architecture docs & subsystem deep-dives
├── adr/                            - Architecture Decision Records
├── concepts/                       - Universally true, portable concepts and math
├── runbooks/                       - Operational and developer troubleshooting runbooks
└── prd.md                          - Product requirements document
```

---

## Key Patterns

### 1. 3-Layer API Architecture
All API communication must strictly follow the 3-layer pattern:
```
UI Component (Page/Form)
       ↓ (calls)
TanStack Query Hook (`modules/*/hooks/use*.ts`)
       ↓ (calls)
Module API Function (`modules/*/api/*.api.ts`)
       ↓ (calls)
apiClient (`lib/api/client.ts`)
       ↓ (HTTP)
EvalBench FastAPI Backend
```
- **Components** never import `apiClient` or make raw `fetch` calls.
- **Hooks** encapsulate query keys, cache invalidation, and polling logic.
- **API functions** are pure async functions and the single point of entry for `apiClient`.

### 2. Query Key Factories
Every module maintains a `*.keys.ts` file defining hierarchical query keys:
```typescript
export const runKeys = {
  all: ['runs'] as const,
  lists: () => [...runKeys.all, 'list'] as const,
  list: (filters: RunFilterParams) => [...runKeys.lists(), filters] as const,
  details: () => [...runKeys.all, 'detail'] as const,
  detail: (id: string) => [...runKeys.details(), id] as const,
  results: (id: string, params?: ResultsParams) => [...runKeys.detail(id), 'results', params] as const,
}
```

### 3. Conditional Background Polling
For asynchronous runs and distributed jobs, hooks use `refetchInterval` to poll every 3000ms while active:
```typescript
refetchInterval: (query) => {
  const status = query.state.data?.status
  return status === 'running' || status === 'queued' ? 3000 : false
}
```

### 4. Auth & Route Protection
- Client authentication state is accessed via `authClient.useSession()`.
- Unauthenticated requests to `(dashboard)` routes are redirected by `middleware.ts` based on session cookies.
- Server-side Better Auth handles password hashing, verification, and session token generation via PostgreSQL.

---

## Key Invariants

- **Zero Direct Fetch in UI**: Never use `fetch()` or `apiClient` inside UI components or pages. Always go through the module's custom hooks.
- **Strict Typing**: No `any` types. All API payloads, parameters, and responses must have explicit TypeScript types defined in `modules/*/types/*.types.ts`.
- **Environment Validation**: All environment variables must be declared in `src/env.ts` with Zod validation. Never access `process.env` directly in application logic.
- **CSS Class Merging**: Always use the `cn(...)` utility (`src/lib/utils.ts`) when merging conditional Tailwind classes.

---

## What NOT to do

- **Do NOT bypass the hook layer**: Never call `runsApi.createRun(...)` directly from a React component; use `useCreateRun()`.
- **Do NOT mutate state without cache invalidation**: Always invalidate or update the relevant TanStack Query keys on mutation success.
- **Do NOT execute backend inference on the client**: The frontend is strictly a management and visualization UI; all computation happens in FastAPI.
- **Do NOT store plain text passwords or secrets**: Better Auth handles auth credentials; API secrets must stay in server environment variables.
- **Do NOT hardcode API URLs**: Use the `NEXT_PUBLIC_API_BASE_URL` env variable via `lib/api/baseApi.ts`.

---

## Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Run Better Auth schema migration (requires DATABASE_URL)
npx @better-auth/cli migrate

# 3. Start Next.js development server
npm run dev

# 4. Lint codebase
npm run lint

# 5. Build for production
npm run build

# 6. Start production build
npm run start
```

---

## Gotchas

- **Next.js 16 Dynamic Parameters**: In Next.js 16, route `params` are asynchronous. In Client Components, use `React.use(params)` to unwrap `params.runId`.
- **Better Auth DB Connection**: Better Auth connects directly to PostgreSQL. Ensure the database specified by `DATABASE_URL` is accessible during server startup.
- **Backend CORS / Proxy**: When running locally, ensure the EvalBench FastAPI backend allows origins from `http://localhost:3000` or configure Next.js rewrites.
- **Tailwind CSS v4 Import**: Tailwind v4 uses `@theme` directives and modern PostCSS integration instead of a legacy `tailwind.config.js`.
