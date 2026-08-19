# CONTEXT.md

> This file provides essential context for AI coding assistants and new contributors. It is intentionally dense — read fully before making changes.  
> Last updated: 2026-08-19

---

## What this is

`evalbench` is an evaluation benchmark toolkit built in Python (>=3.13) for testing and scoring AI models, agents, and LLM workflows.

<!-- TODO: Add details on specific evaluation domain and benchmark target types -->

---

## Tech Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | Python | >= 3.13 | Standard type hinting encouraged |
| Package Manager | uv / pip | standard pyproject.toml | Managed via `pyproject.toml` |
| Core Runtime | Python 3.13 | 3.13+ | Virtual environment at `.venv` |
| Testing | pytest | TBD | <!-- TODO: specify test framework --> |
| CI | GitHub Actions | TBD | <!-- TODO: specify CI configuration --> |

---

## Codebase Map

```
.
├── main.py           - Primary CLI / entry point execution
├── pyproject.toml    - Project dependencies and metadata configuration
├── README.md         - Root project orientation documentation
├── ARCHITECTURE.md   - High-level architecture map (C4 model)
├── CONTEXT.md        - AI/agent context primer
└── docs/             - Extended documentation (PRD, ADRs, runbooks, concepts)
    ├── adr/          - Architecture Decision Records
    ├── assets/       - Documentation diagrams and media assets
    ├── concepts/     - Deep dives and algorithm documentation
    ├── runbooks/     - Operational & development playbooks
    └── prd.md        - Product requirements document
```

---

## Key Patterns

**Project entry point:**
- `main.py` serves as the entry point function (`def main()`).

**Dependencies:**
- Configured via `pyproject.toml`.
- Virtual environment is located in `.venv`.

<!-- TODO: Add patterns as new modules and interfaces are designed -->

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

<!-- TODO: Document known traps or specific API edge cases as development proceeds -->

---

## Glossary

| Term | Definition |
| --- | --- |
| Benchmark | A standardized suite of tests/prompts for evaluating AI performance. |
| Evaluator | A module or function that scores model outputs against expected outcomes. <!-- TODO: refine definition --> |
