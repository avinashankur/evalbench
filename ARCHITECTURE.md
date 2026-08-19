# Architecture — evalbench

> **Last updated:** 2026-08-19  
> **Authors:** evalbench team  
> **Status:** Draft  

## Overview

`evalbench` is a Python-based evaluation benchmark toolkit designed for AI models and workflows.

<!-- TODO: fill in detailed system description and specific benchmark scope -->

---

## Level 1 — System Context

`mermaid
C4Context
Person(developer, "Developer / AI Researcher", "Runs benchmark evaluations and inspects results")
System(evalbench, "evalbench", "Evaluation benchmarking engine and CLI tool")
System_Ext(target_model, "Target Model / API", "Model or system under evaluation")

Rel(developer, evalbench, "Configures and executes evaluations", "CLI / Python API")
Rel(evalbench, target_model, "Sends test prompts & retrieves responses", "HTTP / SDK")
`

**External dependencies:**

| System | Purpose | Owner | SLA |
| --- | --- | --- | --- |
| Target LLM APIs <!-- TODO: specify target APIs (e.g. OpenAI, Anthropic, Gemini) --> | Model inference execution | External Providers | Dependent on provider |

---

## Level 2 — Containers

`mermaid
C4Container
Person(developer, "Developer")
Container(cli, "CLI / Entry Point", "Python 3.13+", "Entry point for running benchmark evaluations (`main.py`)")
Container(engine, "Eval Core Engine", "Python 3.13+", "Core benchmarking logic, dataset loaders, metrics evaluation")
ContainerDb(results, "Results Storage", "Local Disk / JSON / Parquet", "Stores run outputs and evaluation metrics")

Rel(developer, cli, "Invokes", "CLI command")
Rel(cli, engine, "Triggers benchmark runs", "Python function calls")
Rel(engine, results, "Writes benchmark outputs", "File I/O")
`

**Container inventory:**

| Container | Technology | Responsibility | Scales |
| --- | --- | --- | --- |
| CLI / Entry Point | Python 3.13+ | Command-line parsing and entry point invocation | Local execution |
| Eval Core Engine <!-- TODO: flesh out submodules --> | Python 3.13+ | Benchmark execution, evaluation metrics | Multiprocessing / Concurrent workers |
| Results Storage | Filesystem | Metric results and trace output persistence | Local storage |

---

## Level 3 — Components

### evalbench — Components

`mermaid
graph LR
  CLI[main.py] --> Engine[Eval Engine <!-- TODO -->]
  Engine --> Datasets[Dataset Loader <!-- TODO -->]
  Engine --> Evaluators[Metrics & Evaluators <!-- TODO -->]
  Engine --> Persistence[Results Exporter <!-- TODO -->]
`

---

## Key Architectural Decisions

- **Python 3.13+ runtime** — Takes advantage of modern Python features and performance improvements.
- <!-- TODO: Add key decisions as architectural choices are locked -->

---

## Data Flow — Key Scenarios

### Benchmark Execution Flow

`Developer → main.py → Load Config/Datasets → Execute Model Invocations → Evaluate Metrics → Output Results`

---

## Infrastructure

| Environment | Platform | Region | Notes |
| --- | --- | --- | --- |
| Local dev | Python 3.13 venv | Local machine | Uses `.venv` |

---

## Non-Functional Characteristics

| Property | Target | Current |
| --- | --- | --- |
| Python Version | >= 3.13 | 3.13 |
| Execution Parallelism | Concurrent async/multiprocessing <!-- TODO: confirm --> | TBD |

---

## Related Documents

- [README](README.md)
- [CONTEXT](CONTEXT.md)
- [PRD](docs/prd.md)
