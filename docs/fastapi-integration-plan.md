# FastAPI API Layer Integration Plan — evalbench

> **Created:** 2026-08-26
> **Updated:** 2026-08-26
> **Status:** Approved — ready for implementation

---

## Goal

Add a REST API layer to `evalbench` using FastAPI, exposing the existing CLI capabilities (run evaluations, enqueue jobs, check status, browse results) as HTTP endpoints. This enables programmatic access, dashboard frontends, and CI/CD integration without requiring the CLI.

---

## Background & Motivation

Today, evalbench is accessible only through the `click` CLI (`evalbench run`, `enqueue`, `status`, `worker`). This works well for local developer workflows but creates friction for:
- **Web dashboards** — A frontend needs a JSON API to display run results, metrics, and comparisons.
- **CI/CD pipelines** — HTTP endpoints are more natural than shelling out to CLI commands.
- **Multi-user access** — A centralized API server allows multiple users to share one evaluation infrastructure.
- **Programmatic SDK clients** — A REST API naturally generates OpenAPI specs that client libraries can consume.

---

## Resolved Design Decisions

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| Q1 | Authentication | **No auth** | Internal-only service for now. Auth can be layered in later via middleware without changing route logic. |
| Q2 | `POST /runs` execution model | **Always async** | `POST /runs` returns `202 Accepted` immediately with a `run_id`. Evaluation runs in a background task. Clients poll `GET /runs/{run_id}` for status and results. |
| Q3 | Config input format | **JSON body (primary) + server file path (fallback)** | JSON body mirrors the YAML config structure. An optional `config_path` field accepts a file path on the server for backward compatibility. |
| Q4 | Results storage backend | **Always PostgreSQL** | The API server is inherently centralized. All runs (both in-process and distributed) persist to Postgres. No JSONL fallback for the API. |
| Q5 | WebSocket/SSE streaming | **Deferred** | Skip real-time progress streaming for now. Clients poll via `GET /runs/{run_id}`. Can be added in a future phase without breaking changes. |

---

## Proposed Architecture

### Where the API Fits (Level 2 Update)

```mermaid
C4Container
  Person(developer, "Developer / Client")
  Container(cli, "CLI", "Python 3.13+", "evalbench CLI commands")
  Container(api, "API Server", "FastAPI", "REST API for evaluations")
  Container(worker, "Background Worker", "Python 3.13+", "Job execution daemon")
  Container(engine, "Eval Engine", "Python 3.13+", "Core benchmarking logic")
  ContainerDb(redis, "Job Queue", "Redis", "Queues evaluation jobs")
  ContainerDb(postgres, "Results DB", "PostgreSQL", "Stores run outputs and metrics")

  Rel(developer, cli, "Invokes", "Shell")
  Rel(developer, api, "Calls", "HTTP / JSON")
  Rel(cli, engine, "Runs locally", "Python")
  Rel(api, engine, "Runs in-process", "Python / BackgroundTasks")
  Rel(api, redis, "Enqueues jobs", "Redis Protocol")
  Rel(api, postgres, "Reads/writes results", "AsyncPG")
  Rel(worker, redis, "Polls jobs", "Redis Protocol")
  Rel(worker, engine, "Executes jobs", "Python")
  Rel(engine, postgres, "Writes outputs", "AsyncPG")
```

The API server is a **peer** to the CLI — both delegate to the same `EvalEngine`, `PostgresResultStore`, and queue infrastructure. No new domain logic is introduced.

### Design Principles

1. **No domain logic in the API layer** — Routes are thin wrappers that call existing `EvalEngine`, `PostgresResultStore`, and queue infrastructure.
2. **Reuse existing Pydantic models** — `schema.py` models (`TestCase`, `EvalResult`, `TestCaseResult`, etc.) are already serializable and suitable for JSON responses.
3. **Optional dependency** — FastAPI and uvicorn are added as `[api]` optional extras so CLI-only users are unaffected.
4. **Config-driven** — Server settings come from environment variables via Pydantic `BaseSettings`.
5. **Always Postgres** — The API always requires a PostgreSQL connection. No JSONL fallback.
6. **No auth** — No authentication middleware. Can be added later without modifying route handlers.

---

## API Endpoint Design

### Evaluation Runs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/runs` | Submit an evaluation (async background task, returns 202) |
| `GET` | `/api/v1/runs` | List past runs from Postgres |
| `GET` | `/api/v1/runs/{run_id}` | Get full run summary with metrics |
| `GET` | `/api/v1/runs/{run_id}/results` | Get individual test case results (paginated) |
| `DELETE` | `/api/v1/runs/{run_id}` | Delete a run and its results |

### Distributed Jobs (Redis Queue)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/jobs` | Enqueue a job to the Redis worker queue |
| `GET` | `/api/v1/jobs/{job_id}` | Get job status (queued/running/completed/failed) |
| `GET` | `/api/v1/jobs/{job_id}/results` | Get results once completed |

### Introspection

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/providers` | List available LLM providers |
| `GET` | `/api/v1/evaluators` | List available evaluators |
| `GET` | `/api/v1/health` | Health check (readiness probe) |

### Request / Response Examples

#### `POST /api/v1/runs` — Submit Evaluation

**Request (JSON body — primary):**
```json
{
  "dataset": "datasets/customer-support-v1.jsonl",
  "model": {
    "provider": "mock",
    "name": "mock-model",
    "temperature": 0.0,
    "max_tokens": 1024
  },
  "prompt_template": "Context: {context}\n\nQuestion: {question}\n\nAnswer concisely.",
  "system_prompt": "You are a helpful assistant.",
  "concurrency": 5,
  "evaluators": [
    "contains",
    "json_validity",
    {"name": "latency", "max_latency_ms": 2000}
  ],
  "retriever": null
}
```

**Request (server file path — fallback):**
```json
{
  "config_path": "configs/mock-example.yaml"
}
```

> [!NOTE]
> Exactly one of the JSON config body fields or `config_path` must be provided. If `config_path` is set, the server loads and validates the YAML file from the server filesystem (same as `evalbench run`).

**Response (202 Accepted):**
```json
{
  "run_id": "a1b2c3d4-...",
  "status": "running",
  "message": "Evaluation started. Poll GET /api/v1/runs/a1b2c3d4-... for results."
}
```

#### `GET /api/v1/runs/{run_id}` — Run Summary

**Response (200 OK — completed):**
```json
{
  "run_id": "a1b2c3d4-...",
  "status": "completed",
  "dataset_name": "customer-support-v1",
  "provider": "mock",
  "model": "mock-model",
  "total": 20,
  "created_at": "2026-08-26T10:00:00Z",
  "metrics": {
    "pass_rates": {"contains": 0.85, "json_validity": 1.0},
    "mean_scores": {"contains": 0.85, "json_validity": 1.0},
    "mean_latency_ms": 142.5,
    "total_cost_usd": 0.0032
  }
}
```

**Response (200 OK — still running):**
```json
{
  "run_id": "a1b2c3d4-...",
  "status": "running",
  "message": "Evaluation in progress."
}
```

#### `GET /api/v1/runs` — List Runs

**Query params:** `?dataset_name=...&limit=50`

**Response (200 OK):**
```json
{
  "runs": [
    {
      "run_id": "a1b2c3d4-...",
      "dataset_name": "customer-support-v1",
      "provider": "mock",
      "model": "mock-model",
      "total_test_cases": 20,
      "created_at": "2026-08-26T10:00:00Z",
      "metrics": { "..." }
    }
  ]
}
```

#### `GET /api/v1/runs/{run_id}/results` — Paginated Test Case Results

**Query params:** `?offset=0&limit=20`

**Response (200 OK):**
```json
{
  "run_id": "a1b2c3d4-...",
  "total": 20,
  "offset": 0,
  "limit": 20,
  "results": [
    {
      "test_case": { "id": "...", "question": "...", "..." },
      "response": { "text": "...", "latency_ms": 120.5, "..." },
      "eval_results": [
        { "evaluator_name": "contains", "score": 1.0, "status": "passed" }
      ]
    }
  ]
}
```

#### `POST /api/v1/jobs` — Enqueue Distributed Job

**Request:**
```json
{
  "config": {
    "dataset": "datasets/customer-support-v1.jsonl",
    "model": {"provider": "openai", "name": "gpt-4o"},
    "evaluators": ["exact_match", "contains"]
  }
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "e5f6a7b8-...",
  "status": "queued",
  "message": "Job enqueued. Track with GET /api/v1/jobs/e5f6a7b8-..."
}
```

#### `GET /api/v1/health` — Health Check

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "postgres": "connected",
  "redis": "connected"
}
```

---

## Proposed File Changes

### New Package: `evalbench/api/`

> This is a new sub-package under the existing `evalbench` package.

---

#### [NEW] `evalbench/api/__init__.py`
Empty init file to make `api` a proper Python package.

---

#### [NEW] `evalbench/api/app.py`
The FastAPI application factory.

- Creates the `FastAPI` app instance with metadata (title, version, description).
- Registers all routers (`runs`, `jobs`, `health`) under the `/api/v1` prefix.
- Configures CORS middleware (permissive by default since there's no auth).
- Manages `lifespan` async context manager for startup/shutdown:
  - **On startup**: connect to the PostgreSQL pool and Redis.
  - **On shutdown**: close both connections gracefully.
- Stores shared resources in `app.state`:
  - `app.state.postgres_store: PostgresResultStore` — always connected.
  - `app.state.redis_queue: RedisJobQueue` — connected if Redis is configured.

---

#### [NEW] `evalbench/api/settings.py`
Pydantic `BaseSettings` for API server configuration, loaded from environment variables.

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EVALBENCH_")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # PostgreSQL (required)
    postgres_dsn: str = "postgresql://postgres:postgres@localhost/evalbench"

    # Redis (required for /jobs endpoints, optional otherwise)
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = False

    # CORS
    cors_origins: list[str] = ["*"]
```

---

#### [NEW] `evalbench/api/dependencies.py`
FastAPI dependency functions using `Depends`.

- `get_settings()` — cached singleton `Settings` instance via `@lru_cache`.
- `get_postgres_store(request: Request) -> PostgresResultStore` — returns `request.app.state.postgres_store`.
- `get_redis_queue(request: Request) -> RedisJobQueue` — returns `request.app.state.redis_queue`. Raises `HTTPException(503)` if Redis is not enabled.

---

#### [NEW] `evalbench/api/schemas.py`
API-specific Pydantic request/response models.

| Model | Purpose |
|-------|---------|
| `RunCreate` | Request body for `POST /runs`. Mirrors `EvalRunConfig` fields (`dataset`, `model`, `evaluators`, etc.) plus optional `config_path` fallback. Includes a `to_eval_run_config()` method for conversion. |
| `RunStatusResponse` | Returned by `POST /runs` and `GET /runs/{run_id}` when still running. Fields: `run_id`, `status`, `message`. |
| `RunSummaryResponse` | Returned by `GET /runs/{run_id}` when completed. Fields: `run_id`, `status`, `dataset_name`, `provider`, `model`, `total`, `created_at`, `metrics`. |
| `RunListResponse` | Returned by `GET /runs`. Wraps a list of `RunListItem`. |
| `RunListItem` | Lightweight run metadata: `run_id`, `dataset_name`, `provider`, `model`, `total_test_cases`, `created_at`, `metrics`. |
| `PaginatedResults` | Returned by `GET /runs/{run_id}/results`. Fields: `run_id`, `total`, `offset`, `limit`, `results: list[TestCaseResult]`. |
| `JobCreate` | Request body for `POST /jobs`. Wraps a config dict. |
| `JobStatusResponse` | Returned by `GET /jobs/{job_id}`. Fields: `job_id`, `status`, `run_id`, `error`, `config_path`. |
| `HealthResponse` | Returned by `GET /health`. Fields: `status`, `version`, `postgres`, `redis`. |

Existing domain models (`TestCase`, `EvalResult`, `TestCaseResult`, `LLMResponse`) from `schema.py` are reused directly in responses — no duplication.

---

#### [NEW] `evalbench/api/routers/__init__.py`
Empty init.

---

#### [NEW] `evalbench/api/routers/runs.py`
Router for `/api/v1/runs` endpoints.

**`POST /runs`** — Async background execution:
```python
# In-memory tracking dict for in-flight runs
_active_runs: dict[str, dict] = {}

@router.post("/runs", status_code=202, response_model=RunStatusResponse)
async def create_run(
    config: RunCreate,
    background_tasks: BackgroundTasks,
    store: PostgresResultStore = Depends(get_postgres_store),
):
    run_id = str(uuid.uuid4())
    _active_runs[run_id] = {"status": "running"}
    background_tasks.add_task(_execute_run, run_id, config, store)
    return RunStatusResponse(
        run_id=run_id, status="running",
        message=f"Evaluation started. Poll GET /api/v1/runs/{run_id} for results.",
    )

async def _execute_run(run_id: str, config: RunCreate, store: PostgresResultStore):
    try:
        eval_config = config.to_eval_run_config()
        dataset, provider, evaluators, run_config, retriever = eval_config.build()
        engine = EvalEngine(provider, evaluators, run_config, retriever=retriever)
        summary = await engine.run(dataset)
        await store.asave(
            summary,
            dataset_name=dataset.name,
            provider=eval_config.model.provider,
            model=eval_config.model.name,
        )
        _active_runs[run_id] = {"status": "completed", "run_id": summary.run_id}
    except Exception as e:
        _active_runs[run_id] = {"status": "failed", "error": str(e)}
```

**`GET /runs/{run_id}`** — Checks `_active_runs` first (for in-flight), then falls back to Postgres.

**`GET /runs`** — Delegates to `PostgresResultStore.list_runs()`.

**`GET /runs/{run_id}/results`** — Loads full `RunSummary` from Postgres, slices `results` by `offset`/`limit`.

**`DELETE /runs/{run_id}`** — Calls new `PostgresResultStore.adelete()` method.

---

#### [NEW] `evalbench/api/routers/jobs.py`
Router for `/api/v1/jobs` endpoints (distributed mode via Redis).

- `POST /jobs` — Accepts config JSON, creates `EvalJob` with `config_dict` field (not file path), enqueues to Redis via `RedisJobQueue`. Returns 202 with `job_id`.
- `GET /jobs/{job_id}` — Returns job status from Redis via `RedisJobQueue.get_status()`.
- `GET /jobs/{job_id}/results` — If completed and `run_id` is set, fetches results from Postgres via `PostgresResultStore.aload()` and returns the summary.

---

#### [NEW] `evalbench/api/routers/health.py`
Router for health check and introspection endpoints.

- `GET /health` — Pings Postgres (and Redis if enabled). Returns connectivity status.
- `GET /providers` — Calls `available_providers()` from `evalbench.providers.registry`.
- `GET /evaluators` — Calls `available_evaluators()` from `evalbench.evaluators.registry`.

---

### Modifications to Existing Files

---

#### [MODIFY] `evalbench/cli.py`
Add a new `serve` CLI command to start the API server:

```python
@cli.command()
@click.option("--host", default="0.0.0.0", help="Bind address.")
@click.option("--port", default=8000, type=int, help="Port number.")
@click.option("--reload", is_flag=True, help="Enable auto-reload for development.")
def serve(host: str, port: int, reload: bool):
    """Start the FastAPI API server."""
    import uvicorn
    uvicorn.run("evalbench.api.app:app", host=host, port=port, reload=reload)
```

---

#### [MODIFY] `evalbench/config.py`
Extend `EvalRunConfig` to support inline dataset definition for the API use case:

- Change `dataset` field type from `str` to `str | list[dict]`:
  - If `str` → load from file path (existing behavior via `Dataset.from_jsonl()`).
  - If `list[dict]` → construct `Dataset` directly from inline `TestCase` dicts.

```python
class EvalRunConfig(BaseModel):
    dataset: str | list[dict]  # file path OR inline test cases
    ...

    def build(self) -> tuple[Dataset, LLMProvider, list[Evaluator], RunConfig, Optional[Retriever]]:
        if isinstance(self.dataset, list):
            ds = Dataset(
                name="inline",
                test_cases=[TestCase(**tc) for tc in self.dataset],
            )
        else:
            ds = Dataset.from_jsonl(self.dataset)
        # ... rest unchanged
```

---

#### [MODIFY] `evalbench/storage/postgres_store.py`
Add a new `adelete()` method for the `DELETE /runs/{run_id}` endpoint:

```python
async def adelete(self, run_id: str) -> bool:
    """Delete a run and all its test case results. Returns True if the run existed."""
    assert self._pool is not None, "call connect() first"
    async with self._pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM runs WHERE run_id = $1::uuid", run_id
        )
        # CASCADE will handle test_case_results
        return result == "DELETE 1"
```

---

#### [MODIFY] `pyproject.toml`
Add FastAPI dependencies as optional extras:

```toml
[project.optional-dependencies]
api = ["fastapi>=0.115", "uvicorn[standard]>=0.30"]
all = [
    "openai>=1.0", "anthropic>=0.40", "google-genai>=0.3",
    "asyncpg>=0.31.0", "redis>=8.1.0",
    "fastapi>=0.115", "uvicorn[standard]>=0.30",
]
```

---

#### [MODIFY] `ARCHITECTURE.md`
- Update Level 2 container diagram to include the API Server container.
- Add a new data flow scenario: `Developer → API Server → EvalEngine → PostgresStore`.

---

#### [MODIFY] `CONTEXT.md`
- Update the Codebase Map to include `evalbench/api/` package.
- Add FastAPI and Uvicorn to the Tech Stack table.
- Add `evalbench serve` to the Development Workflow section.

---

## File Tree After Changes

```
evalbench/
├── __init__.py
├── cli.py                  ← + serve command
├── config.py               ← + inline dataset support (str | list[dict])
├── engine.py
├── schema.py
├── results.py
├── api/                    ← NEW
│   ├── __init__.py
│   ├── app.py              ← FastAPI app factory + lifespan (Postgres + Redis)
│   ├── settings.py         ← Pydantic BaseSettings (env vars)
│   ├── dependencies.py     ← DI providers (Postgres store, Redis queue)
│   ├── schemas.py          ← Request/response DTOs
│   └── routers/
│       ├── __init__.py
│       ├── runs.py         ← /api/v1/runs (async background execution)
│       ├── jobs.py         ← /api/v1/jobs (Redis distributed queue)
│       └── health.py       ← /health + introspection
├── evaluators/
├── providers/
├── retrieval/
└── storage/
    ├── postgres_store.py   ← + adelete() method
    ├── redis_queue.py
    ├── schema.sql
    └── worker.py
```

---

## Dependencies

| Package | Version | Purpose | Extra Group |
|---------|---------|---------|-------------|
| `fastapi` | >= 0.115 | Web framework, automatic OpenAPI/Swagger docs | `[api]` |
| `uvicorn[standard]` | >= 0.30 | ASGI server | `[api]` |

Both are added as optional `[api]` extras so existing CLI-only users aren't affected.

**Runtime requirements for the API server:**
- PostgreSQL instance (always required)
- Redis instance (required only if `/api/v1/jobs` endpoints are used; controlled by `EVALBENCH_REDIS_ENABLED`)

---

## Verification Plan

### Automated Tests

Tests will live in a new `tests/api/` directory:

| Test File | Coverage |
|-----------|----------|
| `test_health.py` | `GET /health`, `GET /providers`, `GET /evaluators` |
| `test_runs.py` | Full `POST /runs` → poll `GET /runs/{run_id}` → verify metrics flow using mock provider. Pagination on `/results`. `DELETE` cleanup. |
| `test_jobs.py` | `POST /jobs` → verify enqueue (mock Redis). `GET /jobs/{job_id}` status checks. |
| `test_schemas.py` | Validation: submit invalid config payloads, verify 422 responses with Pydantic error details. |

All tests use FastAPI's `TestClient` (synchronous, no real server needed) with mock Postgres/Redis backends.

```bash
uv pip install "evalbench[api]"
uv run pytest tests/api/ -v
```

### Manual Verification

1. Start server: `uv run evalbench serve --reload`
2. Visit `http://localhost:8000/docs` for auto-generated Swagger UI
3. Submit a mock evaluation via Swagger and poll for results
4. Verify OpenAPI spec at `http://localhost:8000/openapi.json`
5. Verify `GET /health` shows Postgres connected

---

## Implementation Order

| Phase | Scope | Files |
|-------|-------|-------|
| **1** | Core API skeleton + health | `api/__init__.py`, `api/app.py`, `api/settings.py`, `api/routers/__init__.py`, `api/routers/health.py`, `cli.py` (+serve cmd), `pyproject.toml` |
| **2** | Runs endpoints + supporting changes | `api/schemas.py`, `api/dependencies.py`, `api/routers/runs.py`, `config.py` (inline datasets), `storage/postgres_store.py` (+adelete) |
| **3** | Jobs endpoints | `api/routers/jobs.py` |
| **4** | Docs & tests | `ARCHITECTURE.md`, `CONTEXT.md`, `tests/api/` |

---

## Future Enhancements (Out of Scope)

These are explicitly deferred and can be added later without breaking changes:

- **Authentication & Authorization** — API key middleware or OAuth2 integration.
- **WebSocket/SSE progress streaming** — Real-time progress updates for running evaluations.
- **Rate limiting** — Request throttling per client.
- **Run comparison endpoints** — `GET /api/v1/compare?run_ids=a,b` for side-by-side metrics.
- **Dataset management endpoints** — CRUD for datasets stored server-side.

---

## Related Documents

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System design & C4 model
- [CONTEXT.md](../CONTEXT.md) — AI/Developer context primer
- [PRD](prd.md) — Product requirements document
- [ADR-001: Directory Structure](adr/001-directory-structure.md)
- [ADR-002: Pydantic Schemas](adr/002-use-pydantic-for-core-schemas.md)
- [ADR-003: JSONL Storage](adr/003-use-jsonl-for-dataset-storage.md)
