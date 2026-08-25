# Architecture — evalbench

> **Last updated:** 2026-08-25  
> **Authors:** evalbench team  
> **Status:** Draft  

## Overview

`evalbench` is a Python-based evaluation benchmark toolkit designed for AI models and workflows. It supports async distributed execution using a background worker architecture.

---

## Level 1 — System Context

```mermaid
C4Context
Person(developer, "Developer / AI Researcher", "Runs benchmark evaluations and inspects results")
System(evalbench, "evalbench", "Evaluation benchmarking engine and CLI tool")
System_Ext(target_model, "Target Model / API", "Model or system under evaluation")

Rel(developer, evalbench, "Configures and executes evaluations", "CLI / Python API")
Rel(evalbench, target_model, "Sends test prompts & retrieves responses", "HTTP / SDK")
```

**External dependencies:**

| System | Purpose | Owner | SLA |
| --- | --- | --- | --- |
| Target LLM APIs | Model inference execution (OpenAI, Anthropic, Gemini, etc.) | External Providers | Dependent on provider |
| PostgreSQL Database | Results and evaluation metrics storage | Local/Infrastructure | High |
| Redis Server | Job queue broker | Local/Infrastructure | High |

---

## Level 2 — Containers

```mermaid
C4Container
Person(developer, "Developer")
Container(cli, "CLI / Entry Point", "Python 3.13+", "Entry point for running benchmark evaluations (`evalbench run`)")
Container(worker, "Background Worker", "Python 3.13+", "Daemon process executing evaluation jobs")
Container(engine, "Eval Core Engine", "Python 3.13+", "Core benchmarking logic, dataset loaders, metrics evaluation")
ContainerDb(redis, "Job Queue", "Redis", "Queues evaluation jobs")
ContainerDb(postgres, "Results Storage", "PostgreSQL", "Stores run outputs and evaluation metrics")

Rel(developer, cli, "Invokes", "CLI command")
Rel(cli, engine, "Runs locally (`run`)", "Python function calls")
Rel(cli, redis, "Enqueues & checks status (`enqueue`, `status`)", "Redis Protocol")
Rel(cli, postgres, "Fetches results (`status`)", "AsyncPG / TCP")
Rel(worker, redis, "Polls for jobs", "Redis Protocol")
Rel(worker, engine, "Executes jobs", "Python function calls")
Rel(engine, postgres, "Writes benchmark outputs", "AsyncPG / TCP")
```

**Container inventory:**

| Container | Technology | Responsibility | Scales |
| --- | --- | --- | --- |
| CLI / Entry Point | Python 3.13+ | Runs local evaluations, enqueues jobs, checks status, and runs worker daemon | Local execution |
| Background Worker | Python 3.13+ | Pulls jobs from queue and executes | Horizontal (Multi-process) |
| Eval Core Engine | Python 3.13+ | Benchmark execution, providers, evaluators | Within worker |
| Job Queue | Redis | Buffering and distributing jobs | Redis cluster |
| Results Storage | PostgreSQL | Metric results and trace output persistence | Postgres cluster |

---

## Level 3 — Components

### evalbench — Components

```mermaid
graph LR
  subgraph CLI Layer
    CLI[cli.py]
  end

  subgraph Worker Layer
    Worker[storage/worker.py]
    Engine[engine.py]
    Evaluators[evaluators/]
    Providers[providers/]
    Retrieval[retrieval/]
  end

  subgraph Storage Layer
    RedisQueue[storage/redis_queue.py]
    PostgresStore[storage/postgres_store.py]
    LocalStore[results.py]
  end

  CLI --> Engine
  CLI --> LocalStore
  CLI --> RedisQueue
  CLI --> PostgresStore
  Worker --> RedisQueue
  Worker --> Engine
  Engine --> Evaluators
  Engine --> Providers
  Engine --> Retrieval
  Worker --> PostgresStore
```

---

## Key Architectural Decisions

- **Python 3.13+ runtime** — Takes advantage of modern Python features and performance improvements.
- **Async Execution** — Heavy use of `asyncio` for scalable LLM API calls via `asyncpg`.
- **Local CLI Execution** — CLI evaluations run locally via asyncio and output to JSONL, allowing quick iteration without infrastructure.
- **Redis + Worker Queue** — For distributed, large-scale dataset evaluations, jobs are executed via Redis queues and Postgres storage.

---

## Data Flow — Key Scenarios

### Local Benchmark Execution (CLI)

`Developer → evalbench run → EvalEngine → Target LLM API → JSONLResultStore (Local)`

### Distributed Benchmark Execution (Worker)

`Developer → evalbench enqueue → RedisQueue (Enqueue) → Worker (Dequeue) → EvalEngine → Target LLM API → PostgresStore (Store Results)`
`Developer → evalbench status → RedisQueue + PostgresStore (Read)`

---

## Infrastructure

| Environment | Platform | Region | Notes |
| --- | --- | --- | --- |
| Local dev | Python 3.13 venv | Local machine | Uses `.venv` |
| Local services | Redis + PostgreSQL | Local machine | Requires external daemon processes |

---

## Non-Functional Characteristics

| Property | Target | Current |
| --- | --- | --- |
| Python Version | >= 3.13 | 3.13 |
| Execution Parallelism | Distributed queue / Async workers | Redis-backed workers |

---

## Related Documents

- [README](README.md)
- [CONTEXT](CONTEXT.md)
- [PRD](docs/prd.md)
