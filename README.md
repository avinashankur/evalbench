# evalbench

> Evaluation benchmark toolkit for AI models and LLM workflows.

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)

---

## What is this?

`evalbench` is an extensible evaluation benchmarking platform for assessing AI models, agents, and LLM applications. It provides tools for running evaluation pipelines, scoring model outputs, and analyzing performance metrics.

---

## Features

- **Python 3.13+ native** — Designed for modern Python standards.
- **Provider-agnostic** — Swap between OpenAI, Anthropic, Gemini, or a mock provider via config.
- **Built-in evaluators** — Exact match, contains, JSON validity, latency, token usage, and LLM-as-judge.
- **RAG evaluation** — Faithfulness, answer relevance, context precision, and context recall metrics.
- **REST API** — FastAPI-based endpoints for integration and remote execution.
- **Local or distributed** — Run evaluations in the foreground, or scale out with Redis queues and PostgreSQL storage.
- **YAML-driven configs** — Define dataset, model, evaluators, and retriever in a single config file.

---

## Quick Start

### Prerequisites

- **Python**: `>= 3.13`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/evalbench.git
cd evalbench

# Sync dependencies and install the project using uv
uv sync

# (Optional) Sync with all provider SDKs
uv sync --all-extras
```

### Run

Execute evaluations from a config file using the `evalbench` CLI. By default, results are saved locally as JSONL files.

```bash
uv run evalbench run path/to/config.yaml
```

Output:
```text
Dataset: MMLU-subset (100 test cases)
Model:   openai/gpt-4o
Evaluators: exact_match
...
Saved to results/<run_id>.jsonl
```

### Distributed Execution

For large-scale evaluations, `evalbench` supports distributed execution using Redis and PostgreSQL.

```bash
# Start a background worker daemon
uv run evalbench worker

# Queue an evaluation job
uv run evalbench enqueue path/to/config.yaml

# Check job status and fetch results
uv run evalbench status <job_id>
```

### REST API

You can start the FastAPI web server to interact with evalbench programmatically or via Swagger UI at `http://localhost:8000/docs`:

```bash
# Start the API server on port 8000
uv run evalbench serve

# Key endpoints:
# POST /api/v1/jobs        - Enqueue evaluation job to Redis
# GET  /api/v1/jobs/{id}   - Check async job status
# POST /api/v1/runs        - Trigger direct evaluation run
# GET  /api/v1/runs/{id}   - Fetch run results from PostgreSQL
```

---

## Project Structure

```text
evalbench/
├── configs/          # Example evaluation configs (YAML)
├── evalbench/        # Core package (engine, CLI, API, storage, evaluators)
├── pyproject.toml    # Python project definition & dependencies
├── ARCHITECTURE.md   # System architecture documentation (C4 model)
├── CONTEXT.md        # AI assistant context & developer primer
└── docs/             # Technical docs, PRD, ADRs, runbooks, concepts, how-tos
```

---

## Documentation

- [Architecture Guide](ARCHITECTURE.md)
- [Context Primer](CONTEXT.md)
- [Product Requirements (PRD)](docs/prd.md)
- [Architecture Decision Records (ADRs)](docs/adr/)
- [Concept Deep-Dives](docs/concepts/)
- [Developer How-To Guides](docs/how-tos/)
- [Operational Runbooks](docs/runbooks/)

---

## License

MIT

