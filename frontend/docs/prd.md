# Product Requirements Document — EvalBench Frontend

> **Product Context:** EvalBench Frontend  
> **Last updated:** 2026-08-31  
> **Status:** Phase 1–6 Scaffolded (MVP)

---

## What is EvalBench Frontend?

**EvalBench Frontend** is a modern, responsive web application designed for AI teams to manage, execute, and analyze evaluation benchmarks for Large Language Models (LLMs) and compound AI systems. It provides an intuitive interface for configuring evaluations across multiple model providers, monitoring execution progress in real time, diagnosing individual test case outputs, and performing side-by-side comparative benchmarking.

---

## Users

### Primary User

**Who:** AI Engineers, ML Researchers, and LLM Application Developers  
**Sophistication:** Highly technical; familiar with prompt engineering, Python, API integrations, and evaluation metrics (e.g., exact match, ROUGE, BERTScore, LLM-as-a-judge).  
**Core job:** Systematically evaluating new prompt iterations, model upgrades, fine-tunes, or retrieval pipelines to ensure quality and prevent regression before deploying to production.  
**Current pain:** Relying on ad-hoc Jupyter notebooks, fragmented scripts, and manual CSV comparisons, leading to unversioned results, slow feedback loops, and lack of visibility across the team.  
**What they get:** A centralized platform to launch benchmarks against any provider, watch progress live, inspect test cases with rich diffs, and export verified benchmark reports.

### Secondary Users

| User Type | Their Role | What They Need From This Product |
| :--- | :--- | :--- |
| **QA / Evaluation Leads** | Defines quality standards and validates accuracy thresholds | Easy-to-read metric dashboards, pass/fail status breakdown, and exportable evaluation runs. |
| **Engineering Managers / Tech Leads** | Oversees model cost, latency, and performance trade-offs | Comparative charts between proprietary (OpenAI, Anthropic, Gemini) and open-source models to make informed model-selection decisions. |

---

## Problem Statement

When deploying LLM-powered features, teams struggle with evaluation consistency. Benchmarking across multiple models and dataset permutations requires orchestrating asynchronous jobs, aggregating high-cardinality scoring metrics, and inspecting specific edge-case failures. Without a dedicated visual UI:
1. Developers spend excessive time writing custom visualization scripts instead of improving models.
2. Comparing two model checkpoints or prompt versions requires tedious manual spreadsheet alignment.
3. Test failure diagnostics (e.g. why an evaluator failed a particular prompt output) remain opaque in terminal logs.

EvalBench Frontend bridges this gap by providing an interactive, structured interface that connects directly to the high-performance EvalBench backend engine.

---

## Value Proposition

**Core Value:** Rapid, visual, and systematic AI model benchmarking with zero configuration overhead.

EvalBench Frontend provides a purpose-built workspace where engineers can launch runs in seconds, observe live execution updates, drill into test-case level failures, and compare model metrics side-by-side with clear visual indicators.

---

## What This Product Does NOT Do

To maintain focus and high performance, the following items are explicitly out of scope for the frontend:

- **Does NOT execute LLM inference directly in the browser**: All model generation and evaluator execution happen on the EvalBench backend / worker infrastructure.
- **Does NOT act as a prompt IDE / Playground replacement**: The frontend is optimized for systematic batch evaluation rather than single-prompt exploratory drafting.
- **Does NOT store dataset files on client local disk**: Datasets are referenced by path on the backend or served via structured storage.
- **Does NOT replace general-purpose APM or observability platforms**: It is tailored specifically for evaluation runs and benchmark comparisons, not production request tracing.

---

## Success Metrics

### North Star Metric

**Benchmark-to-Insight Time (BIT):** Median time (in seconds) from completing an evaluation run to identifying the top failure modes and score regressions in the UI.

### Key Metrics

| Metric | Target (MVP / V1) | Description |
| :--- | :--- | :--- |
| **Active Run Monitoring Latency** | < 3000ms | Real-time polling responsiveness for running and queued jobs |
| **Run Inspection Page Load Time** | < 500ms (P95) | Fast rendering of metric summaries and paginated test-case tables |
| **Comparative Run Alignment** | 100% metric consistency | Accurate side-by-side delta visualization across runs |
| **User Sign-in & Onboarding Time** | < 60s | Seamless Better Auth registration and project access |

---

## Current Stage and Priorities

**Current Stage:** MVP Scaffold Complete — Core modules (runs, jobs, discovery, auth, layout) built and connected to API definitions.

### Top Priorities for Next Phase:

1. **Production Build & Type Verification:**
   - Resolve any Next.js 16 type discrepancies and run full `npm run build` validation.
2. **Visual Metric Visualizations:**
   - Integrate chart components (e.g. bar/radar charts) on `/compare` and `/runs/[runId]` for quick visual score comparison.
3. **Interactive Dataset Preview & Upload:**
   - Provide client-side validation and preview for JSONL evaluation datasets prior to launching runs.

---

## Competitive Landscape

| Competitor / Alternative | Their Strength | EvalBench Advantage | Who They Win With |
| :--- | :--- | :--- | :--- |
| **Ad-hoc Python Scripts / Notebooks** | Highly customizable, zero setup | Unified team UI, persistent run history, automated polling, side-by-side diffing | Solo individual researchers |
| **Heavyweight Enterprise Platforms (e.g. Scale GenAI Platform, Weights & Biases)** | Broad enterprise tooling | Lightweight, developer-first, native FastAPI integration, fast self-hosting with Next.js | Enterprise organizations with dedicated ops |
| **Raw CLI Tools** | Fast terminal workflow | Visual comparison across multiple evaluators and test case drill-downs | Headless CI/CD runners |

---

## Product Principles

1. **Actionable Insights Over Raw Numbers**: Present metric scores alongside failure reasons, latency percentiles, and token consumption so users immediately understand *why* a model succeeded or failed.
2. **Instant Feedback & Live Visibility**: Provide real-time status indicators, live progress bars, and reactive polling so users never have to wonder if a job is running or hung.
3. **Strict Separation of Concerns**: Maintain clean modular boundaries between presentation, data hooks, and API transport to ensure stability as new backend evaluators are added.
4. **Developer-Grade Aesthetics & Speed**: Deliver a clean, dark-mode-first aesthetic with fast page transitions and responsive tables capable of handling hundreds of test case results.

---

## Key Decisions Made

- **Decoupled Next.js Frontend with Python FastAPI Backend ([ADR-001](adr/001-use-nextjs-with-fastapi-backend.md))**: Leveraged Python for compute-intensive AI evaluation pipelines while using Next.js 16 (React 19) for responsive, rich interactive dashboards and session auth.
- **Better Auth Integration ([ADR-002](adr/002-use-better-auth-for-authentication.md))**: Adopted Better Auth with PostgreSQL session storage to provide immediate, self-contained auth without external vendor lock-in.
- **3-Layer Architectural Boundary & Native Fetch ([ADR-003](adr/003-use-fetch-over-axios.md))**: Standardized all frontend modules (`runs`, `jobs`, `discovery`) around `types` → `api` → `hooks` → `components` with a lightweight, zero-dependency native fetch client.
- **TanStack Query Polling**: Chose client-side polling with configurable intervals over initial WebSocket infrastructure to deliver reliable live updates with minimal backend complexity.

---

## Related Documents

- [README.md](../README.md) — Technical setup and quick start guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture, C4 diagrams, and container boundaries
- [CONTEXT.md](../CONTEXT.md) — Developer context primer, invariants, and codebase map
- [Architecture Decisions (ADRs)](./adr/) — Log of architectural decisions
- [Runbooks](./runbooks/) — Incident response and operational troubleshooting
