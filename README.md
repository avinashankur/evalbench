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

# Activate existing venv (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# Or create a fresh virtual environment:
# python -m venv .venv
```

### Run

```bash
python main.py
```

Output:
```text
Hello from evalbench!
```

---

## Project Structure

```text
evalbench/
├── main.py           # Application entry point
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
