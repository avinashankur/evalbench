# Architecture — EvalBench Frontend

> **Last updated:** 2026-09-02  
> **Authors:** EvalBench Engineering Team  
> **Status:** Current

---

## Overview

EvalBench Frontend is a Next.js 16 web application that provides a comprehensive public landing page and an intuitive graphical dashboard for the EvalBench AI evaluation and benchmarking platform. It enables AI engineers and developers to configure evaluation runs across diverse LLM providers, monitor asynchronous execution in real time, inspect granular test case outputs and metrics, and compare model benchmarks side-by-side. The frontend interacts directly with the EvalBench FastAPI backend (`/api/v1/*`) and implements user session management via Better Auth.

---

## Level 1 — System Context

The EvalBench Frontend serves as the user-facing entry point for managing and visualizing AI benchmarks, coordinating between end users, the EvalBench execution backend, and authentication storage.

```mermaid
C4Context
  title System Context — EvalBench Frontend

  Person(user, "AI Engineer / Developer", "Configures, triggers, and analyzes AI evaluation benchmarks")
  System(frontend, "EvalBench Frontend", "Next.js 16 web app providing UI for runs, jobs, comparison, and discovery")
  System_Ext(backend, "EvalBench FastAPI Backend", "Core evaluation engine executing benchmarks and scoring")
  SystemDb_Ext(postgres, "PostgreSQL Database", "Stores Better Auth users, sessions, and credentials")

  Rel(user, frontend, "Interacts with UI", "HTTPS / Browser")
  Rel(frontend, backend, "Dispatches runs & queries results", "REST / JSON (HTTP)")
  Rel(frontend, postgres, "Manages sessions and user auth", "PostgreSQL Wire Protocol")
```

### External Dependencies

| System | Purpose | Communication | SLA / Availability |
| :--- | :--- | :--- | :--- |
| **EvalBench FastAPI Backend** | Benchmark orchestration, model inference execution, evaluators scoring, and metric aggregation | REST / JSON via Fetch API (`/api/v1/*`) | Co-located or self-hosted service |
| **PostgreSQL Database** | Persistent storage for Better Auth user accounts, verification tokens, and sessions | Direct SQL connection via `pg` pool in Node.js server routes | Managed DB (e.g. Neon / RDS) |

---

## Level 2 — Containers

The frontend deployable container consists of the Next.js runtime (App Router server and client bundles) communicating with the database and the backend API.

```mermaid
C4Container
  title Container Diagram — EvalBench Frontend & Dependencies

  Person(user, "User (Browser)")
  
  Container_Boundary(c1, "EvalBench Frontend (Next.js)") {
    Container(ui, "Client UI / Pages", "React 19, Tailwind CSS v4, shadcn/ui, Lucide", "Renders landing page, dashboard, runs table, forms, and metric views")
    Container(query, "TanStack Query Layer", "TanStack React Query v5", "Client state, caching, background polling, mutations")
    Container(auth_server, "Better Auth Server Handlers", "Better Auth, Next.js API Routes", "Handles /api/auth/* endpoints, token validation, session cookies")
    Container(middleware, "Next.js Middleware", "Edge / Node.js Middleware", "Guards (dashboard) routes by inspecting session cookies")
  }

  Container_Ext(api, "EvalBench Backend", "FastAPI / Python", "Executes benchmark pipelines and aggregates scores")
  ContainerDb_Ext(db, "Auth Database", "PostgreSQL", "Stores user identities and active sessions")

  Rel(user, ui, "Interacts with", "HTTPS")
  Rel(ui, query, "Calls hooks & mutations", "React Context")
  Rel(query, api, "Fetches / submits runs & jobs", "REST / JSON (apiClient)")
  Rel(user, middleware, "Passes session cookie", "HTTPS")
  Rel(ui, auth_server, "Signs in / out", "REST / JSON (/api/auth/*)")
  Rel(auth_server, db, "Reads & writes auth records", "SQL (pg)")
```

### Container Inventory

| Container / Module | Technology | Responsibility | Scaling Strategy |
| :--- | :--- | :--- | :--- |
| **Next.js Web App** | Next.js 16.3, React 19, TypeScript 5, shadcn/ui | Server rendering, marketing landing, dashboard, route middleware, API routes | Horizontally scalable (Vercel / Node.js / Docker) |
| **TanStack Query Layer** | `@tanstack/react-query` v5 | Data fetching, client caching, polling for active runs/jobs, error retry | Client-side memory |
| **Better Auth Server** | `better-auth` v1.7, `pg` | Authentication endpoints (`/api/auth/[...all]`), session verification | Scaled with Next.js server instance |
| **EvalBench API Backend** | FastAPI, Python 3.11+ | Running benchmark pipelines against LLM providers & evaluator suites | Independent worker/backend scaling |
| **Auth Database** | PostgreSQL | Persisting user profiles and session tokens | Managed PostgreSQL instance |

---

## Level 3 — Components (Frontend Architecture)

The frontend codebase is structured around a strict 3-Layer Architecture ensuring clear boundaries between UI components, caching hooks, API consumers, and HTTP transport.

```mermaid
graph TD
  subgraph Presentation Layer
    Pages["Next.js Pages (app/...)"]
    Landing["Landing Components (components/landing/*)"]
    UiPrimitives["shadcn UI Primitives (components/ui/*)"]
    Layouts["Layout Components (Sidebar, Header, Shell)"]
    Forms["Forms & Views (Runs, Jobs, Compare, Settings)"]
  end

  subgraph State & Data Layer
    Hooks["TanStack Query Custom Hooks (modules/*/hooks)"]
    QueryKeys["Query Key Factories (*.keys.ts)"]
    QueryClient["QueryClient Provider & Cache"]
  end

  subgraph Module API Layer
    ModuleApi["Module API Functions (modules/*/api/*.api.ts)"]
    Types["TypeScript Interfaces & Schemas (modules/*/types)"]
  end

  subgraph Transport & Infrastructure
    ApiClient["Custom apiClient (lib/api/client.ts)"]
    ErrorHandling["ApiError Parser (lib/api/errors.ts)"]
    AuthModule["Better Auth Client & Server (lib/auth.ts, auth-client.ts)"]
  end

  subgraph External Systems
    FastApi["EvalBench Backend (/api/v1)"]
    PostgresDB["PostgreSQL (Auth DB)"]
  end

  Pages --> Hooks
  Forms --> Hooks
  Layouts --> Hooks
  Layouts --> AuthModule

  Hooks --> QueryKeys
  Hooks --> QueryClient
  Hooks --> ModuleApi

  ModuleApi --> Types
  ModuleApi --> ApiClient

  ApiClient --> ErrorHandling
  ApiClient --> FastApi

  AuthModule --> PostgresDB
```

---

## Key Architectural Decisions

- **Next.js Frontend with Python FastAPI Backend** — [ADR-001](docs/adr/001-use-nextjs-with-fastapi-backend.md): Chosen to leverage the Python AI/ML ecosystem for evaluation orchestration while using Next.js 16 / React 19 for rich interactive dashboards and Better Auth session handling.
- **3-Layer API Communication with Native Fetch** — [ADR-003](docs/adr/003-use-fetch-over-axios.md): UI components never invoke `fetch` or `apiClient` directly. Instead, UI components consume custom TanStack Query hooks, which call dedicated module API functions, which in turn use the zero-dependency, fetch-based `apiClient`.
- **Next.js 16 App Router & Route Groups**: Routes are organized into `(auth)` (unauthenticated card layouts for login/signup) and `(dashboard)` (authenticated layout with sidebar, header, and route-protection middleware).
- **Client-Side Polling for Execution State**: Since benchmark runs and distributed jobs are long-running asynchronous tasks, the frontend utilizes TanStack Query's `refetchInterval` to poll backend endpoints every 3 seconds while status is `running` or `queued`, pausing when terminal status (`completed`, `failed`, `cancelled`) is reached.
- **Better Auth with PostgreSQL Integration** — [ADR-002](docs/adr/002-use-better-auth-for-authentication.md): Authentication is self-contained within the Next.js application using Better Auth and direct PostgreSQL storage for user records, providing email/password authentication and extensible session tokens.
- **Type-Safe Configuration with `@t3-oss/env-nextjs`**: All environment variables (`NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.) are validated at runtime/build-time using Zod.

---

## Data Flow — Key Scenarios

### 1. User Authentication Flow

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant LoginPage as Login Page (/login)
  participant AuthClient as Better Auth Client (auth-client.ts)
  participant AuthRoute as Next.js API (/api/auth/*)
  participant Postgres as PostgreSQL DB
  participant Middleware as Next.js Middleware

  User->>LoginPage: Enters email and password
  LoginPage->>AuthClient: signIn.email({ email, password })
  AuthClient->>AuthRoute: POST /api/auth/sign-in/email
  AuthRoute->>Postgres: Verify credentials & create session
  Postgres-->>AuthRoute: Session created
  AuthRoute-->>AuthClient: Set session cookie (HTTP-only) & return user
  AuthClient-->>LoginPage: Success redirect to /dashboard
  User->>Middleware: Request /dashboard with session cookie
  Middleware->>Middleware: Validate session cookie presence
  Middleware-->>User: Allow access to /dashboard
```

### 2. Evaluation Run Creation & Polling

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant NewRunPage as New Run Page (/runs/new)
  participant useCreateRun as useCreateRun Hook
  participant runsApi as runs.api.ts
  participant apiClient as apiClient (lib/api)
  participant FastApi as EvalBench FastAPI Backend
  participant RunDetailPage as Run Detail Page (/runs/[runId])
  participant useGetRun as useGetRun (Polling Hook)

  User->>NewRunPage: Submits run configuration (model, dataset, evaluators)
  NewRunPage->>useCreateRun: mutate(runConfig)
  useCreateRun->>runsApi: createRun(runConfig)
  runsApi->>apiClient: post('/api/v1/runs', runConfig)
  apiClient->>FastApi: POST /api/v1/runs
  FastApi-->>apiClient: 201 Created { run_id: "run-123", status: "running" }
  apiClient-->>runsApi: RunResponse
  runsApi-->>useCreateRun: RunResponse
  useCreateRun-->>NewRunPage: OnSuccess redirect to /runs/run-123

  NewRunPage->>RunDetailPage: Navigate to /runs/run-123
  RunDetailPage->>useGetRun: useGetRun("run-123")
  loop Every 3 seconds while status == "running"
    useGetRun->>runsApi: getRun("run-123")
    runsApi->>apiClient: get('/api/v1/runs/run-123')
    apiClient->>FastApi: GET /api/v1/runs/run-123
    FastApi-->>apiClient: { status: "running", progress: 45% }
    apiClient-->>useGetRun: Updated Run Object
    useGetRun-->>RunDetailPage: Re-render progress & partial results
  end
  FastApi-->>apiClient: { status: "completed", summary_metrics: { accuracy: 0.94 } }
  useGetRun-->>RunDetailPage: Terminal state reached — Stop polling & render final scores
```

---

## Infrastructure & Environments

| Environment | Platform | Hosting / Runtime | Notes |
| :--- | :--- | :--- | :--- |
| **Local Development** | Node.js 20+ (Windows / Linux / macOS) | Next.js dev server (`:3000`), FastAPI (`:8000`), PostgreSQL (`:5432`) | Local development workflow with hot module replacement |
| **Staging** | Cloud Container / Vercel Preview | Next.js runtime, Staging PostgreSQL instance | Integration testing against staging FastAPI cluster |
| **Production** | Vercel / Docker Container | Edge / Node.js 20 container | Connected to production PostgreSQL DB and production EvalBench backend |

---

## Non-Functional Characteristics

| Characteristic | Target / Specification | Current Mechanism |
| :--- | :--- | :--- |
| **Active Run Polling** | 3-second interval during execution | Managed via TanStack Query `refetchInterval` conditional check |
| **System Health Polling** | 60-second background heartbeat | Managed via `useHealth` hook in discovery module |
| **Type Safety** | 100% strict TypeScript typing | Strict mode enabled, zero `any` policy, Zod runtime env parsing |
| **Theme & Responsiveness** | Dark / Light theme support, fluid responsive UI | Implemented via `next-themes` and Tailwind CSS v4 design tokens |

---

## Related Documents

- [CONTEXT.md](./CONTEXT.md) — AI context primer, codebase map, invariants, and guidelines
- [README.md](./README.md) — Quick start and developer setup
- [DESIGN.md](./DESIGN.md) — Product & UX design specifications and platform metrics
- [Subsystem Architecture Deep-Dives](./docs/architecture/) — Project-specific subsystem designs and flows
- [Product Requirements](./docs/prd.md) — Product requirements and user personas
- [Architecture Decision Records](./docs/adr/) — Historical log of significant architecture choices
- [Concepts](./docs/concepts/) — Universal algorithms, scoring theory, and math models
- [How-To Guides](./docs/how-tos/) — Step-by-step developer implementation recipes
- [Troubleshooting Runbooks](./docs/runbooks/) — Dev and production incident procedures
