# 001-ADR: Use Next.js for Frontend with Python FastAPI Backend

**Date:** 2026-08-31  
**Status:** Accepted  
**Deciders:** EvalBench Core Engineering Team  
**Tags:** frontend, architecture, fastapi, nextjs, react, python  

---

## Context

EvalBench is an AI evaluation and benchmarking platform designed to run datasets through multiple Large Language Model (LLM) providers, score outputs against automated evaluators, and present comparative metrics to engineers and researchers.

The core evaluation engine and worker system are implemented in **Python (FastAPI)** to leverage the rich Python AI/ML ecosystem (LiteLLM, Hugging Face, NumPy, PyTorch, semantic scoring evaluators, and async execution engines). 

However, the user interface requires:
1. An interactive, responsive, and aesthetic dashboard capable of displaying complex multi-run comparisons, granular per-test-case diffs, and live execution progress.
2. Robust client-side state caching, background polling, and responsive data tables.
3. Integrated authentication, user session management, and route guarding.
4. Fast developer velocity and access to modern UI component libraries.

We need to decide on the frontend architecture and technology stack to pair with the Python FastAPI backend.

---

## Decision

We will build the **EvalBench Frontend as a dedicated Next.js 16 (React 19 + TypeScript) application** using the App Router, communicating with the EvalBench Python FastAPI backend over a REST API (`/api/v1/*`).

Authentication, session cookies, and route guards will be managed within Next.js using **Better Auth** and PostgreSQL, while all benchmark execution, evaluator logic, and AI model orchestration remain strictly within the **FastAPI** backend.

---

## Alternatives Considered

### Option A: Pure Python UI Frameworks (Streamlit, Gradio, NiceGUI, Reflex)

- **Description:** Build the frontend entirely in Python using data-app frameworks like Streamlit or Gradio, keeping the entire repository in a single language.
- **Pros:** Single-language stack (Python only); rapid initial prototyping; zero TypeScript/JavaScript tooling overhead.
- **Cons:** Rigid component layouts; severe state management and reactivity limitations; poor support for complex custom UI widgets (like side-by-side comparison matrices with synchronized scrolling); high server memory overhead for active sessions; difficult to implement standard enterprise authentication and cookie-based route protection.
- **Why we didn't choose it:** Streamlit and Gradio are excellent for exploratory demos, but they quickly hit maintainability and UX ceilings when scaling into a production-grade benchmarking platform.

### Option B: FastAPI Server-Rendered HTML (Jinja2 Templates + HTMX / Alpine.js)

- **Description:** Render HTML directly on the FastAPI server using Jinja2 templates augmented with HTMX for dynamic partial swaps and Alpine.js for lightweight client behavior.
- **Pros:** Single codebase and runtime; low client bundle size; simple deployment with no separate Node.js build pipeline.
- **Cons:** Primitive component reusability; lack of type safety across UI and API payloads; cumbersome to build complex client-side state interactions (e.g. multi-filter run comparisons, hierarchical query caching with automatic polling); misses out on the modern React/Tailwind ecosystem.
- **Why we didn't choose it:** Building rich, interactive benchmark analysis tables and live-updating telemetry with Jinja2/HTMX creates significant template sprawl and lacks the developer velocity of typed React components.

### Option C: Client-Only SPA (Vite + React / TypeScript)

- **Description:** Build a standalone Single Page Application (SPA) using Vite and React, serving static assets via Nginx or CDN and communicating directly with FastAPI.
- **Pros:** Simple static hosting; full access to the React and Tailwind ecosystem; clean separation of concerns.
- **Cons:** Requires either hosting authentication directly on FastAPI or managing complex client-side token storage in `localStorage` (security risks); lacks a server layer for executing server actions, secure cookie session verification, and Next.js middleware route protection.
- **Why we didn't choose it:** Lacks the built-in server environment needed to seamlessly run Better Auth API handlers, edge middleware for protected routes, and potential server-rendered dashboard meta tags.

### Option D (Chosen): Next.js 16 App Router + Python FastAPI Backend

- **Description:** A decoupled architecture where Next.js handles presentation, client-side data orchestration (via TanStack Query), and auth session management (via Better Auth), while FastAPI handles computation-heavy benchmark execution and evaluation scoring.
- **Pros:** 
  - **Best of Both Worlds:** Leverage Python's unmatched AI/ML ecosystem for backend evaluation compute and the TypeScript/React ecosystem for modern, interactive UI.
  - **Independent Scaling & Deployment:** UI servers (Vercel / Node.js containers) can scale independently from compute-intensive FastAPI benchmark workers.
  - **Rich Ecosystem & DX:** Tailwind CSS v4, Lucide icons, Sonner toasts, and TanStack Query caching provide a fast, polished user experience.
  - **Self-Contained Auth Layer:** Better Auth runs seamlessly within Next.js API routes (`/api/auth/[...all]`), isolating user/session management from backend inference logic.
- **Why this one:** It provides the optimal balance of UI flexibility, security, and computational power, allowing frontend and backend to evolve cleanly against stable REST API contracts.

---

## Consequences

### Positive

- Clean architectural separation: Frontend focuses solely on user experience and visualization; backend focuses solely on evaluation mechanics and provider integrations.
- Superior user experience: High-performance data grids, instantaneous navigation, theme transitions, and live status polling.
- Type safety: TypeScript interfaces on the frontend guarantee robust handling of complex evaluation schemas and test-case results.
- Modular maintainability: Teams can work on UI enhancements and backend evaluators in parallel without stepping on dependencies.

### Negative

- Dual runtime stack: Requires managing both Node.js (v20+) and Python (3.11+) runtimes in development and deployment pipelines.
- API Schema Synchronization: API payload types must be maintained across Python Pydantic models and TypeScript type definitions.
- CORS & Networking Configuration: Local development requires running two development servers (`:3000` and `:8000`) with properly configured CORS headers or reverse proxying.

### Neutral

- API-first design: All backend capabilities must be exposed via well-documented REST endpoints rather than internal direct Python imports.

---

## Follow-up Actions

- [x] Create standardized 3-layer API client architecture in `src/lib/api/` and `src/modules/`.
- [x] Implement type-safe environment configuration (`NEXT_PUBLIC_API_BASE_URL`).
- [ ] Add OpenAPI-to-TypeScript type generator (e.g. `openapi-typescript`) to automate syncing FastAPI Pydantic schemas with frontend TypeScript types.
- [ ] Configure local reverse proxy or CORS settings in the FastAPI backend to ensure seamless communication during development.

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [EvalBench Frontend Architecture](../../ARCHITECTURE.md)
- [EvalBench Context & Invariants](../../CONTEXT.md)
