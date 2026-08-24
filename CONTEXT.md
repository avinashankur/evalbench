# CONTEXT.md

> This file provides essential context for AI coding assistants and new contributors. It is intentionally dense — read fully before making changes.  
> Last updated: 2026-08-24

---

## What this is

`evalbench` is an evaluation benchmark toolkit built in Python (>=3.13) for testing and scoring AI models, agents, and LLM workflows. It supports both direct generation tasks and Retrieval-Augmented Generation (RAG) tasks.

---

## Tech Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | Python | >= 3.13 | Standard type hinting encouraged |
| Package Manager | uv / pip | standard pyproject.toml | Managed via `pyproject.toml` |
| Core Runtime | Python 3.13 | 3.13+ | Virtual environment at `.venv` |
| Data Validation | pydantic | >= 2.13.4 | Enforces strict schemas (e.g., `TestCase`, `EvalResult`) |
| Results Database | PostgreSQL (asyncpg) | >= 0.31.0 | Persistent metrics and trace storage |
| Job Broker | Redis | >= 8.1.0 | Asynchronous job queue for evaluation tasks |
| Testing | pytest | TBD | <!-- TODO: specify test framework --> |

---

## Codebase Map

```
.
├── evalbench/          - Core application package
│   ├── config.py       - Configuration management
│   ├── engine.py       - Core evaluation execution logic
│   ├── schema.py       - Pydantic models (TestCase, EvalResult, etc.)
│   ├── results.py      - Result handling and formatting
│   ├── evaluators/     - Scoring metrics (exact match, latency, LLM judges, RAG metrics)
│   ├── providers/      - LLM API wrappers (OpenAI, Anthropic, Gemini, Mock)
│   ├── retrieval/      - Document retrieval (in-memory TF/cosine sim)
│   └── storage/        - Persistence & distributed processing
│       ├── postgres_store.py  - PostgreSQL async operations
│       ├── redis_queue.py     - Job queue management
│       └── worker.py          - Background worker daemon
├── main.py             - Primary CLI / entry point execution
├── pyproject.toml      - Project dependencies and metadata configuration
├── README.md           - Root project orientation documentation
├── ARCHITECTURE.md     - High-level architecture map (C4 model)
├── CONTEXT.md          - AI/agent context primer
└── docs/               - Extended documentation (PRD, ADRs, runbooks, concepts)
    ├── adr/            - Architecture Decision Records
    ├── assets/         - Documentation diagrams and media assets
    ├── concepts/       - Deep dives and algorithm documentation
    ├── runbooks/       - Operational & development playbooks
    └── prd.md          - Product requirements document
```

---

## Key Patterns

**Project entry point:**
- `main.py` serves as the entry point function (`def main()`).

**Dependencies:**
- Configured via `pyproject.toml`.
- Virtual environment is located in `.venv`.

**Module Registry:**
- Evaluators and Providers use a registry pattern (`registry.py`) to map string names to classes.

---

## Key Invariants

- Modern Python (>=3.13) support required.
- Configuration and dependency specifications stay synchronized in `pyproject.toml`.
- Documentation standards strictly maintain root architectural and context alignment.

---

## What NOT to do

- Do not introduce legacy Python compatibility hacks (< 3.13).
- Do not place architectural design records outside `docs/adr/`.
- Do not commit virtual environment artifacts (`.venv`) or cached files (`__pycache__`).

---

## Development Workflow

```bash
# Activate virtual environment
source .venv/bin/activate  # on Unix / bash
# or on Windows PowerShell:
# .\.venv\Scripts\Activate.ps1

# Run main script
python main.py
```

Before committing:
Ensure code compiles and runs cleanly on Python 3.13+.

---

## Gotchas

- Virtual environment `.venv` relies on Python 3.13 runtime.
- Background evaluation workers require running Redis and PostgreSQL instances.

---

## Glossary

| Term | Definition |
| --- | --- |
| Benchmark | A standardized suite of tests/prompts for evaluating AI performance. |
| Evaluator | A module that scores model outputs against expected outcomes. Can be exact-match, latency-based, or LLM-judged. |
| Provider | A standardized API wrapper for invoking inference on target LLMs (e.g., OpenAI, Anthropic). |
| Retriever | A module used in RAG contexts to retrieve relevant documents for a given query. |
| Job / Worker | Asynchronous evaluation task processing powered by Redis (queue) and background worker daemons. |
