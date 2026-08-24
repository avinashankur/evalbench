# Architecture — evalbench

> **Last updated:** 2026-08-24  
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
Container(cli, "CLI / Entry Point", "Python 3.13+", "Entry point for running benchmark evaluations (`main.py`)")
Container(worker, "Background Worker", "Python 3.13+", "Daemon process executing evaluation jobs")
Container(engine, "Eval Core Engine", "Python 3.13+", "Core benchmarking logic, dataset loaders, metrics evaluation")
ContainerDb(redis, "Job Queue", "Redis", "Queues evaluation jobs")
ContainerDb(postgres, "Results Storage", "PostgreSQL", "Stores run outputs and evaluation metrics")

Rel(developer, cli, "Invokes", "CLI command")
Rel(cli, redis, "Enqueues evaluation jobs", "Redis Protocol")
Rel(worker, redis, "Polls for jobs", "Redis Protocol")
Rel(worker, engine, "Executes jobs", "Python function calls")
Rel(engine, postgres, "Writes benchmark outputs", "AsyncPG / TCP")
```

**Container inventory:**

| Container | Technology | Responsibility | Scales |
| --- | --- | --- | --- |
| CLI / Entry Point | Python 3.13+ | Command-line parsing and enqueueing jobs | Local execution |
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
    CLI[main.py]
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
  end

  CLI --> RedisQueue
  Worker --> RedisQueue
  Worker --> Engine
  Engine --> Evaluators
  Engine --> Providers
  Engine --> Retrieval
  Engine --> PostgresStore
```

---

## Key Architectural Decisions

- **Python 3.13+ runtime** — Takes advantage of modern Python features and performance improvements.
- **Async Execution** — Heavy use of `asyncio` for scalable LLM API calls via `asyncpg`.
- **Redis + Worker Queue** — Migrated from synchronous execution to a distributed queue to support large-scale dataset evaluations.
- **PostgreSQL Storage** — Selected for robust relational metric storage and querying over flat files.

---

## Data Flow — Key Scenarios

### Benchmark Execution Flow

`Developer → main.py (Enqueue) → Redis (Queue) → Worker (Dequeue) → EvalEngine → Target LLM API → Postgres (Store Results)`

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
