# CONTEXT.md

> This file provides essential context for AI coding assistants and new contributors. It is intentionally dense — read fully before making changes.  
> Last updated: 2026-08-28

---

## What this is

`evalbench` is an evaluation benchmark toolkit built in Python (>=3.13) for testing and scoring AI models, agents, and LLM workflows. It supports both direct generation tasks and Retrieval-Augmented Generation (RAG) tasks, executable via CLI, REST API, or distributed workers.

---

## Tech Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | Python | >= 3.13 | Strict type hinting with PEP 604 modern union syntax |
| Package Manager | uv / pip | standard pyproject.toml | Managed via `pyproject.toml` |
| CLI Framework | click | >= 8.4.2 | Used for the `evalbench` CLI entry point |
| Configuration | pyyaml | >= 6.0.3 | Parses YAML run configurations |
| Core Runtime | Python 3.13 | 3.13+ | Virtual environment at `.venv` |
| Data Validation | pydantic / pydantic-settings | >= 2.13.4 / >= 2.7.0 | Enforces strict schemas (`TestCase`, `RunCreate`, `JobCreate`) |
| Results Database | PostgreSQL (asyncpg) | >= 0.31.0 | Persistent metrics and evaluation trace storage |
| Job Broker | Redis | >= 8.1.0 | Asynchronous job queue and status tracking |
| REST API | FastAPI / Uvicorn | >= 0.115 / >= 0.30 | Web API for managing runs, jobs, and health |
| Stemming / Search | snowballstemmer | >= 3.1.1 | In-memory tokenization & retrieval ranking |
| Testing | pytest | >= 8.0 | Test suite execution |

---

## Codebase Map

```
.
├── evalbench/          - Core application package
│   ├── api/            - REST API application and routing (FastAPI)
│   │   ├── routers/    - Route modules (health.py, jobs.py, runs.py)
│   │   ├── app.py      - FastAPI application factory and lifespan setup
│   │   ├── dependencies.py - Dependency injection (RedisQueue, PostgresStore)
│   │   ├── schemas.py  - API request and response Pydantic models
│   │   └── settings.py - API configuration settings
│   ├── cli.py          - CLI commands and execution via click
│   ├── config.py       - Configuration management and schema validation
│   ├── engine.py       - Core evaluation execution and concurrency logic
│   ├── schema.py       - Pydantic domain models (TestCase, EvalResult, Dataset)
│   ├── results.py      - Result handling, aggregations, and local JSONL storage
│   ├── evaluators/     - Scoring metrics (exact match, latency, LLM judges, RAG metrics)
│   ├── providers/      - LLM API wrappers (OpenAI, Anthropic, Gemini, Mock)
│   ├── retrieval/      - Document retrieval (in-memory TF/cosine sim & BM25)
│   └── storage/        - Persistence & distributed processing
│       ├── postgres_store.py  - PostgreSQL async persistence (asyncpg)
│       ├── redis_queue.py     - Redis job queue management and lifecycle state
│       ├── worker.py          - Background evaluation worker daemon
│       └── schema.sql         - PostgreSQL database DDL schema
├── pyproject.toml      - Project dependencies and metadata configuration
├── README.md           - Root project orientation documentation
├── ARCHITECTURE.md     - High-level architecture map (C4 model)
├── CONTEXT.md          - AI/agent context primer
└── docs/               - Extended documentation (PRD, ADRs, runbooks, concepts, how-tos)
    ├── adr/            - Architecture Decision Records (001–005)
    ├── assets/         - Documentation diagrams and media assets
    ├── concepts/       - Deep dives and algorithm documentation (001–005)
    ├── how-tos/        - Step-by-step developer guides
    ├── runbooks/       - Operational & development playbooks (001–002)
    └── prd.md          - Product requirements document
```

---

## Key Patterns

**Project entry point:**
- `evalbench/cli.py` serves as the CLI entry point (`def cli()`), exposed via the `evalbench` console script.

**API Architecture:**
- `evalbench/api/app.py` defines the FastAPI application with routers mounted under `/api/v1` (`/health`, `/runs`, `/jobs`).
- Dependency injection via `evalbench/api/dependencies.py` provides shared connections to `PostgresResultStore` and `RedisJobQueue`.

**Module Registry:**
- Evaluators and Providers use a registry pattern (`registry.py`) to map string identifiers to classes.

**Modern Python Standards:**
- All type annotations follow PEP 604 (`X | None` instead of `Optional[X]`, `A | B` instead of `Union[A, B]`).

---

## Key Invariants

- Modern Python (>=3.13) support required.
- Configuration and dependency specifications stay synchronized in `pyproject.toml`.
- Documentation standards strictly maintain root architectural and context alignment.
- All database operations in PostgreSQL store must use async connection pooling via `asyncpg`.

---

## What NOT to do

- Do not introduce legacy Python compatibility hacks (< 3.13).
- Do not place architectural design records outside `docs/adr/`.
- Do not store long-term evaluation result payloads in Redis (Redis is strictly for transient job queues and job statuses).
- Do not commit virtual environment artifacts (`.venv`) or cached files (`__pycache__`).

---

## Development Workflow

```bash
# Sync dependencies
uv sync

# Run evaluation locally
uv run evalbench run path/to/config.yaml

# Start the REST API server locally
uv run evalbench serve

# Or use distributed mode:
uv run evalbench worker                 # Start background daemon
uv run evalbench enqueue path/to/config.yaml  # Queue job
uv run evalbench status <job_id>        # Check progress and results
```

---

## Gotchas

- Virtual environment `.venv` relies on Python 3.13 runtime.
- Background evaluation workers and API endpoints require running Redis and PostgreSQL instances.
- Ensure API dependencies (`fastapi`, `uvicorn`, `pydantic-settings`) are installed (e.g. `uv sync --all-extras`).

---

## Glossary

| Term | Definition |
| --- | --- |
| Benchmark | A standardized suite of tests/prompts for evaluating AI performance. |
| Dataset | A collection of test cases containing inputs and expected ground truths. |
| Evaluator | A module that scores model outputs against expected criteria (e.g. exact match, latency, LLM judge, RAG metrics). |
| Provider | A standardized API wrapper for invoking inference on target LLMs (OpenAI, Anthropic, Gemini, Mock). |
| Retriever | A module used in RAG contexts to retrieve relevant document chunks for a given query. |
| Run / RunSummary | The execution instance and persisted outcome of an evaluation suite stored in PostgreSQL or JSONL. |
| Job | An asynchronous evaluation task enqueued in Redis and processed by a background worker daemon. |
| Worker | A standalone daemon process consuming jobs from Redis, executing the evaluation pipeline, and writing results to PostgreSQL. |
