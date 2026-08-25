# evalbench

> Evaluation benchmark toolkit for AI models and LLM workflows.

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)

---

## What is this?

`evalbench` is an extensible evaluation benchmarking platform for assessing AI models, agents, and LLM applications. It provides tools for running evaluation pipelines, scoring model outputs, and analyzing performance metrics.

---

## Features

- **Python 3.13+ native** — Designed for modern Python standards.
- **Evaluation Pipelines** — Run standardized benchmarks against target models. <!-- TODO: update features list as features are built -->
- **Metric Analytics** — Track performance across multiple evaluation criteria. <!-- TODO -->

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

---

## Project Structure

```text
evalbench/
├── evalbench/        # Core package (engine, CLI, storage, etc.)
├── pyproject.toml    # Python project definition & dependencies
├── ARCHITECTURE.md   # System architecture documentation
├── CONTEXT.md        # AI assistant context & developer guide
└── docs/             # Technical docs, PRD, ADRs, runbooks
```

---

## Documentation

- [Architecture Guide](ARCHITECTURE.md)
- [Context Primer](CONTEXT.md)
- [Product Requirements](docs/prd.md)

---

## License

MIT <!-- TODO: confirm license -->
