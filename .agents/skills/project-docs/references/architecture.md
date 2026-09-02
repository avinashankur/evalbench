# Architecture Documentation Reference

## Purpose

Architecture documentation explains how the system is structured — the big picture that a new engineer needs before they touch code. Its job is to orient, not to exhaust. It answers: What components exist? How do they talk to each other? Why are they structured this way?

## File Placement Strategy

### 1. Root `ARCHITECTURE.md` (System-Wide Overview)

- Lives at the repository root (`ARCHITECTURE.md`)
- Describes the current state of the entire system — the big picture (C4 Level 1 & Level 2)
- A new engineer reads this first before touching any code
- Answers: What containers/services exist? How do they talk to each other? What is the overarching data flow?
- Always reflects current state, not aspirational future state
- Must be updated whenever system boundaries or dependencies change

### 2. `docs/architecture/` (Project-Specific Architectural Concepts & Subsystems)

- Lives in `docs/architecture/` (e.g., `docs/architecture/001-api-client-pipeline.md`, `docs/architecture/002-auth-session-flow.md`)
- Contains deep-dives into **project-specific** subsystems, component lifecycles, state pipelines, and internal mechanics
- Explains how this particular codebase and project work in detail (C4 Level 3 & Level 4)
- **Key distinction:** `docs/architecture/` is **project-specific** (tied directly to this repo's implementation), whereas `docs/concepts/` is for **universal, transferable concepts** (portable theory/math/algorithms).

### 3. Per-module `ARCHITECTURE.md` (Optional for Monorepos)

- Lives inside a specific package directory (e.g., `packages/auth/ARCHITECTURE.md`, `services/billing/ARCHITECTURE.md`)
- Describes that module's internal structure only — its layers, patterns, and boundaries
- Only create one when a module is complex enough (>3 internal layers or >10 files) that its internal structure is non-obvious
- Must cross-reference the root `ARCHITECTURE.md`

### When to use which

| Goal / Topic | Destination |
| :--- | :--- |
| System-wide overview, containers, external integrations | Root `ARCHITECTURE.md` |
| Project-specific subsystem deep-dive (e.g. auth lifecycle, polling engine) | `docs/architecture/00N-*.md` |
| Universal, portable concept (e.g. bloom filters, rate-limiting theory) | `docs/concepts/00N-*.md` |
| Isolated sub-package architecture in a monorepo | `packages/<pkg>/ARCHITECTURE.md` |

## Standard: The C4 Model

The industry standard for software architecture documentation is the **C4 Model** (https://c4model.com/). It defines four zoom levels:

| Level | Name           | Audience   | Shows                                        |
| ----- | -------------- | ---------- | -------------------------------------------- |
| 1     | System Context | Everyone   | Your system + external actors/systems        |
| 2     | Container      | Technical  | Apps, databases, services inside your system |
| 3     | Component      | Developers | Internal structure of a single container     |
| 4     | Code           | Developers | Classes, functions, modules (rarely needed)  |

Start at Level 1. Add lower levels only where the complexity warrants it.

## When to choose this doc type

- New engineers need an orientation before reading code
- The system has multiple services, databases, or external integrations
- The team is planning a large change and needs a shared mental model
- No architecture doc exists and the codebase is non-trivial

## Clarifying questions to ask

1. What is the primary purpose of the system? (1–2 sentences)
2. Who are the users / external actors?
3. What are the main technical components? (services, databases, queues, CDN, third-party APIs)
4. How do these components communicate? (REST, gRPC, message queue, shared DB)
5. What infrastructure does it run on? (cloud provider, Kubernetes, serverless, etc.)
6. Which C4 levels do you need? (Context + Container is usually the right starting point)
7. Is a Mermaid diagram sufficient, or do you need draw.io / Structurizr output?

## Document Template

---

# Architecture — [System Name]

> **Last updated:** YYYY-MM-DD
> **Authors:** [names]
> **Status:** Draft / Current / Outdated

## Overview

[2–4 sentences describing what the system does, who uses it, and what problem it solves.]

---

## Level 1 — System Context

[Describe the system boundary and its external actors/dependencies.]

`mermaid
C4Context
Person(user, "End User", "Uses the system via web browser")
System(system, "Your System", "Does the core thing")
System_Ext(ext1, "Payment Provider", "Processes payments")
System_Ext(ext2, "Email Service", "Sends transactional emails")

Rel(user, system, "Uses", "HTTPS")
Rel(system, ext1, "Charges cards", "REST/HTTPS")
Rel(system, ext2, "Sends emails", "REST/HTTPS")
`

**External dependencies:**

| System           | Purpose            | Owner  | SLA    |
| ---------------- | ------------------ | ------ | ------ |
| Payment Provider | Payment processing | Stripe | 99.99% |

---

## Level 2 — Containers

[Describe each deployable unit: web app, API server, worker, database, cache, etc.]

`mermaid
C4Container
Person(user, "User")
Container(webapp, "Web App", "React/Next.js", "Browser-based UI")
Container(api, "API Server", "Node.js/Express", "Business logic and data access")
ContainerDb(db, "Database", "PostgreSQL", "Stores all persistent data")
Container(worker, "Background Worker", "Node.js", "Async job processing")
Container(cache, "Cache", "Redis", "Session store and hot-path cache")

Rel(user, webapp, "Uses", "HTTPS")
Rel(webapp, api, "Calls", "REST/JSON")
Rel(api, db, "Reads/Writes", "SQL")
Rel(api, cache, "Reads/Writes", "Redis protocol")
Rel(api, worker, "Enqueues jobs", "BullMQ")
`

**Container inventory:**

| Container  | Technology           | Responsibility        | Scales                     |
| ---------- | -------------------- | --------------------- | -------------------------- |
| Web App    | React 18, Next.js 14 | UI rendering, routing | Horizontally               |
| API Server | Node.js 20, Express  | Business logic        | Horizontally               |
| Database   | PostgreSQL 15        | Persistent storage    | Vertically + read replicas |

---

## Level 3 — Components (optional, per container)

[Add one sub-section per container where internal structure matters.]

### API Server — Components

`mermaid
graph LR
  Router --> AuthMiddleware
  AuthMiddleware --> Controllers
  Controllers --> Services
  Services --> Repositories
  Repositories --> DB[(PostgreSQL)]
`

---

## Key Architectural Decisions

[Brief bullet list of the most important choices. For full reasoning, link to ADRs.]

- **Monorepo over poly-repo** — [link to ADR-001]
- **PostgreSQL over MongoDB** — chosen for strong relational consistency requirements
- **BullMQ for job queue** — Redis-backed, proven at scale, good DX

---

## Data Flow — Key Scenarios

[Show the flow for 2–3 important user journeys or operations.]

### User Authentication Flow

`Browser → POST /auth/login → Auth Service → validate credentials → issue JWT → Browser stores token`

---

## Infrastructure

| Environment | Platform       | Region    | Notes                |
| ----------- | -------------- | --------- | -------------------- |
| Production  | AWS ECS + RDS  | us-east-1 | Auto-scaling enabled |
| Staging     | AWS ECS + RDS  | us-east-1 | Single replica       |
| Local dev   | Docker Compose | local     | Uses seed data       |

---

## Non-Functional Characteristics

| Property             | Target  | Current               |
| -------------------- | ------- | --------------------- |
| Availability         | 99.9%   | 99.95% (last 90 days) |
| P99 API latency      | < 500ms | 320ms                 |
| Max concurrent users | 10,000  | untested above 3,000  |

---

## Related Documents

- [ADR Index](./docs/adr/)
- [Deployment Guide](./deployment.md)
- [Runbook](./runbook.md)

---

## Subsystem Architecture Template (`docs/architecture/00N-*.md`)

Use this template when writing a deep-dive on a project-specific module, engine, pipeline, or subsystem:

```markdown
# [NNN] — [Subsystem / Feature Architecture Name]

> **Scope:** [Project Module / Subsystem, e.g. "runs module", "apiClient interceptor pipeline", "Better Auth integration"]
> **Last updated:** YYYY-MM-DD
> **Status:** Current / Draft / Deprecated

## Overview

[2–3 sentences explaining what this subsystem does within this specific project, what components it interacts with, and its primary responsibilities.]

## Internal Component Design (C4 Level 3)

[Mermaid diagram and description of internal classes, hooks, services, repositories, or functions.]

`mermaid
graph TD
  ComponentA --> ComponentB
  ComponentB --> ComponentC
`

## Execution & State Lifecycle

[Step-by-step lifecycle flow, sequence diagram, or state machine explaining how data passes through this specific subsystem.]

## Project Invariants & Interfaces

- [Strict rules or TypeScript interfaces that this subsystem adheres to]
- [Exported contracts and consuming modules]

## Related Documents

- [Root System Architecture](../../ARCHITECTURE.md)
- [Project Context](../../CONTEXT.md)
- [Related ADRs](../adr/)
```

---

## Quality Checklist

Before finishing:

- [ ] Context diagram shows all external actors and systems (for root doc)
- [ ] Container diagram shows every deployable unit (for root doc)
- [ ] Subsystem docs in `docs/architecture/` explain project-specific mechanics in detail
- [ ] Communication protocols are labeled on all diagram edges
- [ ] Tech stack is listed (language, framework, version)
- [ ] Key architectural decisions link to ADRs or have brief rationale
- [ ] Infrastructure environments are documented
- [ ] Diagrams are generated with Mermaid or a tool that can be version-controlled
