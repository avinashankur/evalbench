# 003-ADR: Use Native Fetch over Axios for HTTP Client

**Date:** 2026-08-31  
**Status:** Accepted  
**Deciders:** EvalBench Core Engineering Team  
**Tags:** frontend, http, fetch, axios, performance, nextjs  

---

## Context

EvalBench Frontend communicates extensively with the EvalBench Python FastAPI backend (`/api/v1/*`) to create evaluation runs, retrieve paginated test results, poll running benchmarks, and fetch system health and provider metadata.

In traditional React SPA applications, **Axios** was the de facto HTTP library due to its built-in request/response interceptors, automatic JSON serialization/deserialization, and simple timeout configuration.

However, modern web development standards have evolved:
1. **Universal Native Fetch:** `fetch`, `AbortController`, `Headers`, and `FormData` are standard Web APIs supported natively across modern browsers, Node.js (v18+ / v20 LTS), and Next.js server/edge runtimes.
2. **Next.js Integration:** Next.js extends native `fetch` with built-in caching, request deduplication, and streaming capabilities.
3. **Bundle Size & Dependency Overhead:** Introducing third-party HTTP client libraries adds unnecessary JavaScript bundle weight and increases supply-chain maintenance.

We need to decide whether to adopt Axios or build a lightweight, typed wrapper over native `fetch`.

---

## Decision

We will use **native `fetch`** wrapped in a custom, lightweight, type-safe **`apiClient`** (`src/lib/api/client.ts`) across the entire frontend, rather than adding **Axios** or other third-party HTTP client dependencies.

The custom `apiClient` encapsulates:
- **Base URL prepending:** Resolving `NEXT_PUBLIC_API_BASE_URL` from type-safe environment variables.
- **Request timeouts:** Automated timeout management (15 seconds default) via `AbortController` and `setTimeout`.
- **Header & payload defaults:** Auto-setting `Accept: application/json` and `Content-Type: application/json` (unless payload is `FormData`), with `credentials: 'include'` for cookies.
- **FastAPI error normalization:** Parsing error structures (`detail`, `error`, `message`) into a standard `ApiError` interface (`src/lib/api/errors.ts`).
- **Generic TypeScript typing:** Clean `apiClient.get<T>()`, `apiClient.post<T>()`, `apiClient.put<T>()`, `apiClient.patch<T>()`, and `apiClient.delete<T>()` signatures.

---

## Alternatives Considered

### Option A: Axios (`axios`)

- **Description:** The industry-standard promise-based HTTP client for browser and Node.js.
- **Pros:** Mature ecosystem; built-in interceptors pipeline; automatic JSON stringification; wide familiarity among frontend developers.
- **Cons:**
  - Adds ~11–14 KB (gzipped) of external JavaScript bundle size.
  - Relies on older `XMLHttpRequest` abstractions in the browser and `http` module adapters in Node.js, introducing discrepancies across server/edge/browser execution.
  - Bypasses Next.js native `fetch` optimizations, instrumentation, and potential server-side deduplication.
  - Introduces an extra dependency requiring ongoing security audits and maintenance.
- **Why we didn't choose it:** Axios adds unnecessary complexity and bundle bloat without providing capabilities that cannot be achieved in ~60 lines of clean native `fetch` code.

### Option B: Third-Party Fetch Wrappers (Ky, ofetch, Wretch)

- **Description:** Modern, lightweight HTTP libraries built directly on native `fetch`.
- **Pros:** Smaller footprint than Axios; modern API surface; built-in retry and interceptor patterns.
- **Cons:**
  - Still introduces an external third-party dependency.
  - Imposes library-specific syntax and error objects that must be learned.
  - Still requires custom error parsing to support FastAPI's specific `detail` error structure.
- **Why we didn't choose it:** Our application requirements are straightforward (standard REST JSON calls + polling). Writing a dedicated in-house wrapper avoids external dependencies while giving us exact control over error formatting and request lifecycles.

### Option C (Chosen): Native `fetch` with Custom Typed `apiClient`

- **Description:** A minimal, zero-dependency wrapper around the global `fetch` API adhering to standard Web APIs.
- **Pros:**
  - **Zero Bundle Overhead:** 0 KB external library footprint.
  - **Universal Standard:** Works identically across browser client components, Next.js server components, Route Handlers, and Edge functions.
  - **Tailored Error Handling:** Direct support for parsing FastAPI `{ "detail": ... }` error responses.
  - **Strict Type Safety:** Native TypeScript generics (`Promise<T>`) without library abstraction layers.
- **Why this one:** It provides maximum performance, zero dependencies, and complete control over HTTP behavior tailored directly to our FastAPI backend.

---

## Consequences

### Positive

- Zero external HTTP dependencies in `package.json`.
- Reduced client bundle size and faster page loads.
- Native compatibility with Next.js App Router and future React server features.
- Unified error handling model tailored to FastAPI REST responses.

### Negative

- Features like request cancellation require explicit `AbortController` usage rather than Axios cancel tokens.
- Custom interceptors, retries, or upload progress tracking must be implemented directly in the wrapper if needed in the future.

### Neutral

- API functions in `src/modules/*/api/*.api.ts` import `apiClient` from `@/lib/api`.

---

## Follow-up Actions

- [x] Implement custom `apiClient` in `src/lib/api/client.ts`.
- [x] Implement FastAPI response error parser in `src/lib/api/errors.ts`.
- [x] Configure base API constant and environment schema in `src/lib/api/baseApi.ts` and `src/env.ts`.
- [ ] Add optional response retry interceptor for transient 502/503/504 errors if backend scaling requires it.

---

## References

- [MDN Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Next.js Fetching and Caching Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching)
- [FastAPI Error Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [ADR-001: Use Next.js for Frontend with Python FastAPI Backend](./001-use-nextjs-with-fastapi-backend.md)
- [EvalBench Architecture](../../ARCHITECTURE.md)
