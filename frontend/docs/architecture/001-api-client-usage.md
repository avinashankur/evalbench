# 001 — API Client & Data Layer Architecture

> **Scope:** `src/lib/api/`, `src/modules/*/api/`, `src/modules/*/hooks/`  
> **Last updated:** 2026-08-31  
> **Status:** Current  

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [How a Request Travels Through the System](#how-a-request-travels-through-the-system)
4. [The Transport Layer Files (`src/lib/api`)](#the-transport-layer-files-srclibapi)
   - [client.ts](#clientts)
   - [errors.ts](#errorsts)
   - [baseApi.ts](#baseapits)
   - [queryClient.ts](#queryclientts)
   - [index.ts](#indexts)
5. [The Three-Layer Architecture](#the-three-layer-architecture)
6. [Layer 1 — Module API Functions](#layer-1--module-api-functions)
   - [HTTP Methods](#http-methods)
   - [Query Parameters](#query-parameters)
   - [Custom Headers & File Uploads](#custom-headers--file-uploads)
7. [Layer 2 — TanStack Query Hooks](#layer-2--tanstack-query-hooks)
   - [Query Keys & Factory Pattern](#query-keys--factory-pattern)
   - [Writing a Query Hook](#writing-a-query-hook)
   - [Polling for In-Progress Runs / Jobs](#polling-for-in-progress-runs--jobs)
   - [Writing a Mutation Hook](#writing-a-mutation-hook)
8. [Layer 3 — Components](#layer-3--components)
   - [Using a Query in a Component](#using-a-query-in-a-component)
   - [Using a Mutation in a Component](#using-a-mutation-in-a-component)
9. [Error Normalization & Handling](#error-normalization--handling)
10. [What Not to Do](#what-not-to-do)

---

## Overview

All client-to-backend communication in EvalBench Frontend connects directly to the EvalBench Python FastAPI backend (`/api/v1/*`). 

The HTTP transport is powered by native **`fetch`** wrapped in a zero-dependency, type-safe **`apiClient`** (`src/lib/api/client.ts`). Authentication session cookies are transmitted automatically via `credentials: 'include'`.

---

## File Structure

```
src/
└── lib/
    └── api/
        ├── client.ts       # Core fetch wrapper with timeout & error handling
        ├── errors.ts       # ApiError interface and FastAPI error response parser
        ├── baseApi.ts      # BASE constant ('/api/v1')
        ├── queryClient.ts  # TanStack QueryClient instantiation factory
        └── index.ts        # Public barrel export
```

**Rule:** Always import from `@/lib/api`, never from individual subfiles.

```ts
// ✅ Correct
import { apiClient, BASE, type ApiError } from '@/lib/api'

// ❌ Wrong — internal file import
import { apiClient } from '@/lib/api/client'
```

---

## How a Request Travels Through the System

```
apiClient.get('/api/v1/runs')
     │
     ▼
client.ts — request()
     │  Prepends NEXT_PUBLIC_API_BASE_URL
     │  Sets default headers: Accept: application/json, Content-Type: application/json
     │  Attaches AbortController timeout signal (15s default)
     │  Includes session cookies (credentials: 'include')
     │
     ▼
fetch(url, init)
     │  Native browser / Node.js fetch call
     │
     ▼
Response Processing
     │  Response !ok? → parseApiError(response) → throw ApiError
     │  Status 204?   → return undefined
     │
     ▼
response.json()
     │  Unwraps response payload
     │
     ▼
Typed result T returned to caller
```

---

## The Transport Layer Files (`src/lib/api`)

### `client.ts`

The core HTTP transport layer. It provides a typed `request<T>()` function and exposes methods for all standard HTTP verbs:

```ts
export const apiClient = {
  get<T>(path: string, init?: RequestInit): Promise<T>
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  delete<T>(path: string, init?: RequestInit): Promise<T>
}
```

**Key Behaviors:**
1. **Base URL Resolution:** Reads `NEXT_PUBLIC_API_BASE_URL` from type-safe environment schema (`src/env.ts`).
2. **Timeout Handling:** Automatically cancels hung requests after 15 seconds using `AbortController`, normalizing the error to `{ message: 'Request timed out.', statusCode: 408 }`.
3. **Session Cookie Propagation:** Default `credentials: 'include'` sends session cookies to the server on every request.
4. **Content-Type Detection:** Sets `Content-Type: application/json` automatically, but skips it when body is `FormData` so the browser can attach the boundary string.
5. **204 No Content:** Returns `undefined as T` without failing on empty responses.

---

### `errors.ts`

Defines the normalized error structure used throughout the application and provides `parseApiError()` to parse error responses from the FastAPI backend.

```ts
export interface ApiError {
  message: string
  statusCode: number
}
```

`parseApiError()` handles standard FastAPI error payloads (`{ "detail": "..." }`, `{ "error": "..." }`, or `{ "message": "..." }`) and converts network disconnects into `statusCode: 0`.

---

### `baseApi.ts`

Declares the base API prefix for all evaluation endpoints:

```ts
export const BASE = '/api/v1'
```

---

### `queryClient.ts`

Provides a factory to instantiate the TanStack Query `QueryClient` with standard defaults (queries stale time, garbage collection, and retry policies):

```ts
import { QueryClient } from '@tanstack/react-query'

export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}
```

---

### `index.ts`

The single public entry point for the API transport layer:

```ts
export * from './client'
export * from './errors'
export { BASE } from './baseApi'
export { getQueryClient } from './queryClient'
```

---

## The Three-Layer Architecture

Data flows strictly top-down across three distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3 — UI Component (Page / Form / Card)            │
│  e.g. RunsPage, RunDetailPage, CompareView              │
│  Consumes custom hooks. Renders loading/error/data UI.  │
│  Never imports apiClient. Never imports API functions.  │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — TanStack Query Hook                          │
│  e.g. useListRuns, useGetRun, useCreateRun              │
│  Wraps API functions in useQuery / useMutation.         │
│  Owns: caching, background polling, cache invalidation. │
│  Never imports apiClient directly.                      │
├─────────────────────────────────────────────────────────┤
│  Layer 1 — Module API Function                          │
│  e.g. runs.api.ts, jobs.api.ts, discovery.api.ts        │
│  Pure async functions calling apiClient.                │
│  No UI state. No hooks. The ONLY place apiClient runs.  │
├─────────────────────────────────────────────────────────┤
│  Foundation — apiClient (lib/api)                       │
│  Native fetch wrapper, error normalization, timeouts.   │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Module API Functions

Module API functions live in `src/modules/<feature>/api/<feature>.api.ts`. They are pure async functions whose sole responsibility is to translate typed function arguments into HTTP requests.

```ts
// src/modules/runs/api/runs.api.ts
import { apiClient, BASE } from '@/lib/api'
import type {
  ListRunsParams,
  RunCreate,
  RunListResponse,
  RunStatusResponse,
} from '../types/run.types'

export function listRuns(params?: ListRunsParams): Promise<RunListResponse> {
  const query = new URLSearchParams()
  if (params?.dataset_name) query.set('dataset_name', params.dataset_name)
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiClient.get<RunListResponse>(`${BASE}/runs${qs ? `?${qs}` : ''}`)
}

export function getRun(runId: string): Promise<RunStatusResponse> {
  return apiClient.get<RunStatusResponse>(`${BASE}/runs/${runId}`)
}

export function createRun(body: RunCreate): Promise<RunStatusResponse> {
  return apiClient.post<RunStatusResponse>(`${BASE}/runs`, body)
}

export function deleteRun(runId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/runs/${runId}`)
}
```

---

## Layer 2 — TanStack Query Hooks

Hooks live in `src/modules/<feature>/hooks/`. They wrap API functions in `useQuery` or `useMutation`, managing lifecycle states, caching, and polling.

### Query Keys & Factory Pattern

Every module defines a `*.keys.ts` file with hierarchical query keys:

```ts
// src/modules/runs/hooks/run.keys.ts
import type { ListRunsParams, RunResultsParams } from '../types/run.types'

export const runKeys = {
  all: ['runs'] as const,
  lists: () => [...runKeys.all, 'list'] as const,
  list: (params?: ListRunsParams) => [...runKeys.lists(), params] as const,
  details: () => [...runKeys.all, 'detail'] as const,
  detail: (id: string) => [...runKeys.details(), id] as const,
  results: (id: string, params?: RunResultsParams) =>
    [...runKeys.detail(id), 'results', params] as const,
} as const
```

### Writing a Query Hook

```ts
// src/modules/runs/hooks/useListRuns.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { listRuns } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { ListRunsParams, RunListResponse } from '../types/run.types'
import type { ApiError } from '@/lib/api'

export function useListRuns(params?: ListRunsParams) {
  return useQuery<RunListResponse, ApiError>({
    queryKey: runKeys.list(params),
    queryFn: () => listRuns(params),
  })
}
```

### Polling for In-Progress Runs / Jobs

For long-running evaluation benchmarks, hooks use `refetchInterval` to poll the backend every 3 seconds while active, stopping automatically when reaching a terminal status:

```ts
// src/modules/runs/hooks/useGetRun.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { getRun } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { RunStatusResponse, RunSummaryResponse } from '../types/run.types'
import type { ApiError } from '@/lib/api'

export function useGetRun(runId: string) {
  return useQuery<RunStatusResponse | RunSummaryResponse, ApiError>({
    queryKey: runKeys.detail(runId),
    queryFn: () => getRun(runId),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      // Poll every 3 seconds while running or queued
      return data.status === 'running' || data.status === 'queued' ? 3000 : false
    },
  })
}
```

### Writing a Mutation Hook

```ts
// src/modules/runs/hooks/useCreateRun.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRun } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { RunCreate, RunStatusResponse } from '../types/run.types'
import type { ApiError } from '@/lib/api'

export function useCreateRun() {
  const queryClient = useQueryClient()

  return useMutation<RunStatusResponse, ApiError, RunCreate>({
    mutationFn: createRun,
    onSuccess: (data) => {
      toast.success(`Evaluation run started: ${data.run_id}`)
      queryClient.invalidateQueries({ queryKey: runKeys.lists() })
    },
    onError: (error) => {
      toast.error('Failed to create run', { description: error.message })
    },
  })
}
```

---

## Layer 3 — Components

Components handle the UI rendering, consuming custom hooks and branching on `isLoading`, `isError`, and `data`.

### Using a Query in a Component

```tsx
// src/app/(dashboard)/runs/page.tsx
'use client'

import { useListRuns } from '@/modules/runs'

export default function RunsPage() {
  const { data, isLoading, isError, error, refetch } = useListRuns({ limit: 50 })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading runs...</div>
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive font-medium">{error.message}</p>
        <button onClick={() => refetch()} className="mt-4 rounded bg-primary px-4 py-2 text-white">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Evaluation Runs</h1>
      <div className="rounded-md border">
        {data?.runs.map((run) => (
          <div key={run.run_id} className="flex justify-between p-4 border-b">
            <span>{run.run_id}</span>
            <span className="capitalize">{run.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Using a Mutation in a Component

```tsx
// src/app/(dashboard)/runs/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useCreateRun } from '@/modules/runs'

export default function NewRunPage() {
  const router = useRouter()
  const { mutate, isPending } = useCreateRun()

  function handleStartRun() {
    mutate(
      {
        dataset_name: 'gsm8k',
        model_name: 'gpt-4o',
        evaluator_names: ['exact_match'],
      },
      {
        onSuccess: (res) => {
          router.push(`/runs/${res.run_id}`)
        },
      }
    )
  }

  return (
    <button
      onClick={handleStartRun}
      disabled={isPending}
      className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
    >
      {isPending ? 'Starting benchmark...' : 'Launch Evaluation'}
    </button>
  )
}
```

---

## Error Normalization & Handling

Every thrown error from `apiClient` conforms to the `ApiError` interface:

| Status Code | Meaning | Cause |
| :--- | :--- | :--- |
| `0` | Network Error | Backend unreachable, CORS failure, offline |
| `400` | Bad Request | Invalid parameter payload |
| `401` | Unauthorized | Missing or expired Better Auth session |
| `404` | Not Found | Run or resource ID does not exist |
| `408` | Timeout | Request took longer than 15 seconds |
| `422` | Validation Error | FastAPI Pydantic request schema validation failed |
| `500` | Server Error | Internal backend exception |

---

## What Not to Do

- **❌ Never call `fetch()` or `apiClient` inside a component:** Always wrap calls in custom hooks (`useListRuns`, `useCreateRun`).
- **❌ Never import `apiClient` inside a hook:** Hooks call pure module API functions (`listRuns`, `createRun`).
- **❌ Never use raw string query keys:** Always use the module's `*.keys.ts` factory for cache invalidation.
- **❌ Never ignore TypeScript types:** Always provide explicit generic parameters (`apiClient.get<RunResponse>()`).
- **❌ Never hardcode API endpoints:** Always prefix endpoint paths with `${BASE}` (`/api/v1`).