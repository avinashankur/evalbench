# EvalBench — AI Agent Evaluation & Regression Platform

**Status:** Draft  
**Document type:** Design Document  
**Scope:** Product / UX / Frontend / System Design  
**Source:** Supplied EvalBench HTML/CSS/JavaScript prototype  

> This document describes the design represented by the supplied EvalBench prototype and separates source-defined behavior from proposed production architecture. Backend, persistence, authentication, API contracts, and evaluation execution are not implemented in the source.

---

## 1. Summary

EvalBench is an AI-agent evaluation and regression-monitoring product. Its central workflow is to evaluate an agent version against a test suite, measure the resulting performance, and compare it with a baseline.

The prototype centers the product around three explicit dimensions:

1. **Accuracy**
2. **Cost**
3. **Latency**

The product's core interaction is a baseline-versus-candidate comparison. A user should be able to determine whether an agent change improved the score, introduced a regression, increased cost, or affected latency before shipping that version.

The supplied prototype contains two primary surfaces:

- A public landing page communicating the product proposition.
- An internal dashboard showing evaluation runs, aggregate statistics, a score trend, filters, and a run-detail drawer.

---

## 2. Background and Context

Agent behavior changes when prompts, models, retrieval systems, tools, or orchestration logic change. Looking only at a single aggregate score does not provide enough information to understand whether a new version is actually better.

The EvalBench interface therefore presents evaluation results comparatively.

The landing-page message is explicitly centered on measuring each agent change against the previous one. The dashboard extends that idea into a run history where each run contains a score, baseline delta, pass rate, cost, p95 latency, and status.

The source demonstrates this through examples such as:

- `support-agent v4.1` as a baseline
- `support-agent v4.2` as a candidate
- `+1.8 pts` score improvement
- a corresponding cost increase from `$0.038` to `$0.049`
- p95 latency changing from `1.1s` to `1.0s`

This makes tradeoffs visible rather than reducing evaluation to a single number.

---

## 3. Problem Statement

The system needs to answer a practical engineering question:

> **Did this new agent version actually get better than the version we were already using?**

The answer must be visible at multiple levels:

- aggregate score
- pass rate / accuracy
- cost
- tail latency
- baseline delta
- overall status
- test-case-level breakdown

A useful evaluation interface must therefore preserve both the absolute result and the change relative to a known baseline.

---

## 4. Goals

### 4.1 Primary Goals

The design should:

- Make baseline-versus-candidate comparison immediately understandable.
- Surface regressions prominently.
- Show accuracy, cost, and latency together.
- Provide a searchable operational surface for evaluation runs.
- Allow users to inspect an individual run without leaving the run list.
- Make run-level and test-case-level evaluation results conceptually accessible.
- Maintain a technical, data-first visual language.

### 4.2 UX Goals

The interface should allow a user to answer the following within seconds:

- What changed?
- Did the score improve or regress?
- How did cost change?
- How did latency change?
- Which run caused the regression?
- What happened at the test-case level?

---

## 5. Non-Goals

The supplied prototype does not define the following and this design does not treat them as already implemented:

- Authentication implementation.
- Authorization or role-based access control.
- Database implementation.
- Agent execution infrastructure.
- Model/provider integration.
- Evaluation scoring algorithms.
- Statistical significance calculations.
- Production deployment architecture.
- Billing implementation.
- Notification delivery.
- Full mobile behavior.
- Implementations for the `Agents`, `Suites`, `Traces`, and `Settings` dashboard views.

These may become future design documents.

---

## 6. Product Concepts

### 6.1 Agent

An AI system being evaluated.

Example:

```text
support-agent
```

### 6.2 Agent Version

A specific version of an agent.

Example:

```text
support-agent v4.2
```

### 6.3 Evaluation Suite

A named collection of test cases.

Examples shown by the prototype:

```text
core-suite
rag-suite
planning-suite
```

The prototype identifies the `core-suite` example as containing 128 test cases.

### 6.4 Evaluation Run

One execution of an agent version against an evaluation suite.

Example:

```text
run-8f21a3
```

### 6.5 Baseline

The reference run/version used for comparison.

### 6.6 Candidate

The newer agent version being compared against the baseline.

### 6.7 Test Case

An individual evaluation case within a suite.

The prototype exposes a test-case breakdown inside the run-detail drawer, although the detailed test-case schema is not defined.

### 6.8 Regression

A run that performs worse relative to the selected baseline.

The prototype demonstrates this using a negative baseline delta and warning styling.

---

# 7. Proposed User Experience

## 7.1 High-Level Flow

```text
Agent Version
      |
      v
Evaluation Suite
      |
      v
Evaluation Run
      |
      +---- Score
      +---- Accuracy / Pass Rate
      +---- Cost
      +---- p95 Latency
      |
      v
Compare With Baseline
      |
      +---- Improvement
      +---- Baseline
      +---- Regression
      |
      v
Inspect Run
      |
      v
Test-Case Breakdown
```

The execution pipeline above is a system-level interpretation of the product behavior described in the prototype. The supplied HTML does not implement the actual evaluation engine.

---

# 8. Detailed Design

## 8.1 Landing Page

The landing page is responsible for product communication and demonstration.

### Navigation

The header contains:

```text
EvalBench       Product  Docs  Changelog  Pricing       Sign in  Get started
```

Navigation destinations are placeholders in the supplied source.

### Hero

The hero contains:

- a live evaluation status indicator
- a primary headline
- explanatory product copy
- a primary CTA
- a documentation CTA
- a baseline/candidate scoreboard

The headline is:

```text
Every agent change, measured against the last one.
```

### Scoreboard

The scoreboard is the principal product visualization.

Structure:

```text
core-suite · 128 test cases

support-agent v4.1              support-agent v4.2
baseline                         candidate

92.4                             94.2
baseline run                     ▲ +1.8 pts

accuracy  92%                    accuracy  94%
cost/run  $.038                  cost/run  $.049
p95       1.1s                   p95       1.0s
```

The design deliberately shows that improvement is multidimensional. The candidate improves score and latency but has a higher cost.

### Tracked Metrics

The landing page explains three axes:

#### Accuracy

The prototype describes accuracy as pass rate against the evaluation suite, with breakdown by test case and failure category.

#### Cost

Cost is represented per run. The prototype's explanatory copy also references token usage and dollars.

#### Latency

Latency is represented using p95, emphasizing the tail rather than only an average.

### Comparison Table

The landing page includes a smaller recent-runs table with:

```text
Run
Agent
Suite
Score
Δ baseline
Status
```

This is a marketing/demo representation of the operational dashboard.

### CTA

The final CTA is:

```text
Ship the version that actually scored better.
```

with:

```text
Get started free
```

---

## 8.2 Dashboard

The dashboard is the operational product surface.

### Layout

```text
+--------------------+--------------------------------------------+
| Sidebar            | Top bar                                    |
|                    |                                            |
| EvalBench          | Runs [production]      Search      Avatar |
|                    |                                            |
| Runs               | Stats                                      |
| Agents             |                                            |
| Suites             | Trend                                      |
| Traces             |                                            |
| Settings           | Runs table                                 |
|                    |                                            |
| v0.9.2             |                                            |
+--------------------+--------------------------------------------+
```

The sidebar width in the prototype is 220px.

### Sidebar Navigation

```text
Runs
Agents
Suites
Traces
Settings
```

Only `Runs` is implemented as a real dashboard view.

### Top Bar

The top bar contains:

- page title: `Runs`
- environment pill: `production`
- search field
- user avatar

The search field is visually present but disabled in the supplied implementation.

---

# 9. Dashboard Data Model

## 9.1 Evaluation Run

The UI implies the following conceptual model:

```text
EvaluationRun
├── runId
├── agent
│   ├── name
│   └── version
├── suite
│   ├── name
│   └── testCaseCount
├── score
├── deltaFromBaseline
├── passRate
├── cost
├── p95Latency
└── status
```

This is an inferred domain model from the UI, not an existing database schema.

## 9.2 Test Case Result

The drawer implies a model resembling:

```text
TestCaseResult
├── testCase
├── result
└── metrics
```

The source does not define the exact fields.

---

# 10. Metrics and Scoring

## 10.1 Score

The prototype shows a numeric aggregate score such as:

```text
94.2
92.4
81.6
87.9
76.0
```

The scoring formula is not defined.

## 10.2 Pass Rate

Example values:

```text
96%
94%
78%
89%
71%
```

The prototype uses pass rate as the operational representation of accuracy.

## 10.3 Cost

Example values:

```text
$0.042
$0.038
$0.061
$0.055
$0.029
```

The prototype's marketing copy connects this metric to token/dollar tracking.

## 10.4 p95 Latency

Example values:

```text
1.2s
1.1s
2.4s
1.9s
0.9s
```

The use of p95 makes the tail visible.

## 10.5 Baseline Delta

The UI uses:

```text
positive delta → accent / improvement
negative delta → warning / regression
baseline        → neutral reference
```

The exact regression threshold is not defined.

---

# 11. Dashboard Statistics

The dashboard exposes four top-level values:

| Metric | Prototype value |
|---|---:|
| Total runs today | 214 |
| Avg score | 88.4 |
| Regressions flagged | 3 |
| Avg cost / run | $0.043 |

The first two values are animated from zero to the displayed targets using a 900ms count-up animation.

The latter two are static in the supplied source.

---

# 12. Trend Visualization

The dashboard contains a score trend card for:

```text
support-agent · score trend, last 14 runs
```

Current displayed result:

```text
94.2 ▲ +1.8
```

The chart is implemented as inline SVG.

The source contains:

- line path
- filled area
- final point
- gradient definition

The path coordinates are hard-coded, so this is demonstration data rather than a dynamically generated chart.

---

# 13. Runs Table Design

The dashboard's primary table contains nine columns:

```text
Run
Agent
Suite
Score
Δ baseline
Pass rate
Cost
p95
Status
```

Example data from the prototype:

| Run | Agent | Suite | Score | Δ | Pass Rate | Cost | p95 | Status |
|---|---|---|---:|---:|---:|---:|---:|---|
| run-8f21a3 | support-agent v4.2 | core-suite | 94.2 | +1.8 | 96% | $0.042 | 1.2s | pass |
| run-7c19b0 | support-agent v4.1 | core-suite | 92.4 | baseline | 94% | $0.038 | 1.1s | pass |
| run-6ab445 | retrieval-agent v2.0 | rag-suite | 81.6 | -6.3 | 78% | $0.061 | 2.4s | regression |
| run-5f0e21 | retrieval-agent v1.9 | rag-suite | 87.9 | baseline | 89% | $0.055 | 1.9s | pass |
| run-4d3c10 | planner-agent v1.3 | planning-suite | 76.0 | -2.1 | 71% | $0.029 | 0.9s | pass |

Rows are styled as interactive, and the prototype includes a `data-run` index for the sample records.

---

# 14. Run Filtering

The UI exposes:

```text
All
Regressions
Baselines
```

`All` is initially selected.

The source implements the visual state styling but does not implement the filtering behavior itself.

A production implementation should define:

```text
activeFilter
query
page
pageSize
sort
```

and use these values consistently for table rendering and data retrieval.

---

# 15. Run Detail Drawer

Selecting a run is intended to open a right-side drawer.

### Drawer structure

```text
run-8f21a3
support-agent v4.2                           x

Score                 Δ baseline
94.2                  +1.8

BREAKDOWN BY TEST CASE

[test-case rows]
```

The drawer is 400px wide in the prototype.

### Animation

Opening:

```css
transform: translateX(0)
```

Closed:

```css
transform: translateX(100%)
```

A backdrop becomes visible while the drawer is open.

### Test Case Breakdown

The source creates an empty `drawerCases` container.

The intended content is a breakdown by test case, but the prototype does not define the data-loading or rendering implementation.

---

# 16. Frontend State

A production UI can formalize the state currently implicit in the prototype as:

```text
AppState
├── currentView
├── selectedRunId
├── drawerOpen
├── activeFilter
├── searchQuery
└── dashboardStats
```

Suggested values:

```text
currentView:
  landing | dashboard

selectedRunId:
  string | null

drawerOpen:
  boolean

activeFilter:
  all | regressions | baselines
```

---

# 17. System Architecture

The supplied artifact is a static frontend prototype. The following architecture is the recommended boundary for turning that prototype into a functioning product.

```text
                 +-----------------------+
                 |       Web Client      |
                 | Landing / Dashboard   |
                 +-----------+-----------+
                             |
                             v
                 +-----------------------+
                 |    Application API    |
                 | Runs / Agents / Suites|
                 +-----+------------+----+
                       |            |
              +--------+            +---------+
              v                                v
    +---------------------+        +---------------------+
    | Evaluation Service  |        | Persistent Storage  |
    | suite execution     |        | runs / cases / data |
    +----------+----------+        +---------------------+
               |
               v
      +---------------------+
      | Model / Agent       |
      | Providers & Tools   |
      +---------------------+
```

This architecture is proposed and is not present in the source.

---

# 18. Evaluation Execution Pipeline

A complete EvalBench system would need an execution path equivalent to:

```text
Select agent version
       |
       v
Select evaluation suite
       |
       v
Load test cases
       |
       v
Execute agent against cases
       |
       +---- capture output
       +---- capture latency
       +---- capture token usage
       |
       v
Score test cases
       |
       v
Aggregate run metrics
       |
       v
Compare with baseline
       |
       v
Classify result
       |
       v
Persist run
       |
       v
Expose to dashboard
```

The actual scoring and orchestration algorithms are not defined by the supplied source.

---

# 19. API Design

The source does not contain API endpoints. The following are proposed interfaces corresponding to the UI.

## 19.1 List Runs

```http
GET /api/runs
```

Possible query parameters:

```text
filter
search
page
pageSize
agent
suite
status
```

## 19.2 Get Run

```http
GET /api/runs/{runId}
```

Potential response:

```json
{
  "runId": "run-8f21a3",
  "agent": {
    "name": "support-agent",
    "version": "v4.2"
  },
  "suite": {
    "name": "core-suite",
    "testCaseCount": 128
  },
  "score": 94.2,
  "deltaFromBaseline": 1.8,
  "passRate": 96,
  "cost": 0.042,
  "p95LatencyMs": 1200,
  "status": "pass",
  "cases": []
}
```

The schema is illustrative, not source-defined.

---

# 20. Persistence Model

The UI implies persistence for:

```text
Agent
AgentVersion
EvaluationSuite
TestCase
EvaluationRun
TestCaseResult
BaselineAssignment
RunMetrics
```

Conceptual relationship:

```text
Agent
  |
  +-- AgentVersion
          |
          +-- EvaluationRun
                  |
                  +-- EvaluationSuite
                  |       |
                  |       +-- TestCase
                  |
                  +-- TestCaseResult
```

The source does not specify a database product or physical schema.

---

# 21. Visual Design System

## 21.1 Colors

The source defines these tokens:

```css
--bg: #F6F7F5;
--surface: #FFFFFF;
--ink: #1C1F26;
--muted: #6B7078;
--faint: #9A9FA6;
--line: #DCDFE2;
--line-strong: #C4C8CC;
--accent: #3450FF;
--accent-dim: #EEF0FF;
--warn: #D65C34;
--warn-dim: #FBEEE9;
```

## 21.2 Typography

| Usage | Typeface |
|---|---|
| Body | Inter |
| Headings | Space Grotesk |
| Display values | Fraunces |
| Technical metadata | JetBrains Mono |

## 21.3 Shape

The interface uses very small radii:

```css
--r-sm: 3px;
--r-md: 6px;
```

The resulting visual language is compact, technical, and data-oriented.

## 21.4 Decorative System

The prototype uses:

- subtle grid textures
- repeated tick dividers
- live pulse indicators
- restrained shadows
- blue accent states
- orange regression states

These patterns are used consistently across the landing and dashboard surfaces.

---

# 22. Accessibility

The source already uses semantic structural elements such as:

- `<nav>`
- `<header>`
- `<main>`
- `<aside>`
- `<section>`
- `<table>`
- `<footer>`

However, several production accessibility requirements remain unspecified.

Recommended additions:

- visible keyboard focus states
- accessible names for controls
- keyboard interaction for the drawer
- Escape-key drawer close
- focus trapping for modal/drawer state
- `aria-expanded` and `aria-controls` where applicable
- accessible chart descriptions
- status announcements where appropriate
- semantic button elements instead of non-interactive navigation placeholders

---

# 23. Responsive Design

The supplied CSS supports flexible desktop widths but does not provide complete mobile breakpoints.

Responsive behavior still needs to be specified for:

- sidebar collapse
- horizontal table scrolling
- filter controls
- top navigation
- hero stacking
- scoreboard stacking
- drawer width
- three-column metric section

This should be addressed before treating the prototype as production-ready.

---

# 24. Error States

The source does not define error UI.

Production states should include at least:

```text
No runs
Loading runs
Run failed
Run partially completed
Baseline unavailable
Run detail unavailable
Suite unavailable
Evaluation timeout
Metric unavailable
API error
```

For each state, the UI should distinguish between:

- recoverable errors
- evaluation failures
- data-loading failures
- configuration errors

---

# 25. Security and Authorization

Authentication is represented only by a `Sign in` action in the landing page.

A production system must separately define:

- authentication
- sessions
- organization/workspace isolation
- authorization
- API authorization
- secret management
- agent credential protection
- evaluation-data access
- auditability

None of these are implemented in the provided artifact.

---

# 26. Performance Considerations

The current prototype is intentionally lightweight:

- plain HTML
- CSS
- vanilla JavaScript
- inline SVG
- no network requests
- small animations

A production run history can become large. The dashboard should therefore consider:

- server-side pagination
- filtering at the API level
- sorting at the API level
- lazy loading run details
- virtualized rendering for very large result sets
- caching relatively static agent and suite metadata
- precomputed aggregate metrics where appropriate

---

# 27. Testing Strategy

## 27.1 Unit Tests

Recommended unit-test targets:

- score formatting
- delta formatting
- regression classification
- metric formatting
- filter logic
- state transitions

## 27.2 Component Tests

Test:

- scoreboard
- stat cards
- trend chart
- runs table
- status badges
- filter controls
- run-detail drawer

## 27.3 Integration Tests

Test the primary flow:

```text
load dashboard
    |
    v
retrieve runs
    |
    v
apply filter
    |
    v
select run
    |
    v
open detail drawer
    |
    v
retrieve test-case results
```

## 27.4 End-to-End

The highest-value end-to-end flow is:

```text
Landing
  |
  v
Get started
  |
  v
Dashboard
  |
  v
Runs
  |
  v
Inspect regression
  |
  v
Review test cases
```

---

# 28. Alternatives Considered

## 28.1 Score-Only Dashboard

**Alternative:** Show only the overall evaluation score.

**Rejected because:** The product explicitly treats accuracy, cost, and latency as separate dimensions. The prototype demonstrates that a higher score can coexist with higher cost.

## 28.2 Chart-First Dashboard

**Alternative:** Make time-series charts the primary interaction.

**Rejected for the current design:** The prototype prioritizes the run table because individual version comparisons and regressions are the central workflow.

## 28.3 Modal Instead of Drawer

**Alternative:** Open run details in a centered modal.

**Rejected for the prototype's interaction model:** A side drawer preserves the context of the run table and allows the user to inspect one result without abandoning the list.

## 28.4 Generic SaaS Visual Style

**Alternative:** Use rounded cards, gradients, and highly decorative visuals.

**Rejected because:** The supplied visual system intentionally uses compact borders, technical typography, grid texture, tick marks, and restrained color to communicate an engineering/evaluation product.

---

# 29. Risks and Open Design Questions

The following questions are not answered by the supplied source and should be resolved before backend implementation.

### Baseline selection

- Is the baseline explicitly selected by the user?
- Is there one baseline per agent?
- One baseline per suite?
- One baseline per environment?
- Can a baseline be pinned to a release?

### Regression policy

- Is a negative delta automatically a regression?
- Are cost and latency capable of independently triggering regressions?
- Are thresholds configurable?
- Are small changes ignored?
- Is statistical significance required?

### Scoring

- How is the aggregate score calculated?
- Are test cases equally weighted?
- Can test cases have different weights?
- How are evaluator failures scored?

### Evaluation execution

- How are agent versions invoked?
- How are tool calls captured?
- How are traces stored?
- How is cost calculated across different model providers?

### Data retention

- How long are raw evaluation results stored?
- Are full model outputs retained?
- Are traces retained indefinitely?
- Which metrics are precomputed?

---

# 30. Rollout Plan

A production implementation can be staged independently of the visual prototype.

## Phase 1 — UI Foundations

Implement:

- landing page
- dashboard layout
- runs table
- metric display components
- run-detail drawer
- loading/error/empty states

## Phase 2 — Data Layer

Implement:

- agents
- versions
- suites
- runs
- test-case results
- baseline relationships

## Phase 3 — Evaluation Engine

Implement:

- suite execution
- scoring
- cost tracking
- latency collection
- baseline comparison
- regression classification

## Phase 4 — Operational Features

Implement:

- search
- run filtering
- pagination
- traces
- agent management
- suite management
- settings
- authentication and authorization

## Phase 5 — Hardening

Add:

- accessibility
- mobile behavior
- performance optimization
- observability
- audit logging
- production security controls

---

# 31. Success Criteria

The design succeeds when an engineer evaluating an agent version can move from a newly completed run to an informed ship/no-ship decision using the dashboard.

At minimum, the interface should make these facts unambiguous:

```text
Current version
Baseline version
Score
Score delta
Pass rate
Cost
p95 latency
Overall status
Test-case-level failures
```

The critical product outcome is not simply "display an evaluation score"; it is to make **change from baseline** understandable and actionable.

---

# 32. Source-to-Design Traceability

The following implementation areas are directly represented in the supplied source:

| Design area | Source evidence |
|---|---|
| Landing page | `#landing` page |
| Dashboard | `#dashboard` page |
| Three metrics | Accuracy / Cost / Latency sections |
| Baseline/candidate comparison | Scoreboard |
| Recent runs | Landing comparison table |
| Dashboard stats | Statistics strip |
| Trend | Inline SVG trend card |
| Run filters | All / Regressions / Baselines |
| Run drawer | `drawer` and `drawerCases` |
| Typography | Imported four font families |
| Visual tokens | CSS `:root` variables |
| Live indicator | `.pulse` |
| Tick divider | `.ticks` and generated spans |

The source also makes clear which parts are incomplete as functional product behavior. In particular, the prototype does not implement backend data retrieval, persistence, filtering logic, search, evaluation execution, or full dashboard routing.

---

# 33. Appendix A — Prototype Data

The prototype currently demonstrates these sample runs:

```text
run-8f21a3
support-agent v4.2
core-suite
score 94.2
delta +1.8
pass rate 96%
cost $0.042
p95 1.2s
status pass

run-7c19b0
support-agent v4.1
core-suite
score 92.4
baseline
pass rate 94%
cost $0.038
p95 1.1s
status pass

run-6ab445
retrieval-agent v2.0
rag-suite
score 81.6
delta -6.3
pass rate 78%
cost $0.061
p95 2.4s
status regression

run-5f0e21
retrieval-agent v1.9
rag-suite
score 87.9
baseline
pass rate 89%
cost $0.055
p95 1.9s
status pass

run-4d3c10
planner-agent v1.3
planning-suite
score 76.0
delta -2.1
pass rate 71%
cost $0.029
p95 0.9s
status pass
```

---

# 34. Appendix B — Current Prototype Behavior vs. Production Target

| Capability | Prototype | Production target |
|---|---|---|
| Landing page | Implemented | Retain |
| Dashboard runs page | Implemented | Retain and connect to API |
| Animated metrics | Implemented | Retain where useful |
| Score trend | Static SVG | Data-driven chart |
| Search | Disabled | Functional |
| Filters | Visual only | Functional |
| Drawer | UI structure | Data-driven |
| Test-case breakdown | Placeholder | Functional |
| Agent management | Placeholder navigation | Full feature |
| Suite management | Placeholder navigation | Full feature |
| Traces | Placeholder navigation | Full feature |
| Settings | Placeholder navigation | Full feature |
| Evaluation execution | Not present | Required |
| Persistence | Not present | Required |
| Authentication | Not present | Required |
| Authorization | Not present | Required |
| Error states | Not defined | Required |
| Accessibility hardening | Partial | Required |
| Mobile behavior | Incomplete | Required |

---

# 35. Final Recommendation

Treat the supplied EvalBench artifact as the **reference UX and interaction prototype**, not as the complete system specification.

The implementation should preserve the prototype's strongest design decision: every evaluation result is interpreted relative to a baseline and across multiple dimensions rather than as an isolated score.

The next engineering step should be to formalize the evaluation-run data contract and baseline/regression semantics before building the backend, because those decisions determine the correctness of the dashboard's core comparisons.
