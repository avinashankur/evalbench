---

# 001-ADR: Adopt a Flat Package Layout with a Dedicated Docs Hierarchy

**Date:** 2026-08-22
**Status:** Accepted
**Deciders:** evalbench team
**Tags:** structure, layout, documentation, packaging

---

## Context

At project inception, we needed to decide how to lay out the Python source code and the documentation tree. Two forces pulled in different directions. On the code side, the project is a single installable Python package — not a monorepo, not a namespace package — so the source layout should be simple and unambiguous to Python tooling (`pyproject.toml`, `uv`, `pip`). On the docs side, we anticipated multiple distinct document types (ADRs, concept deep-dives, runbooks, a PRD) that would grow independently and benefit from explicit folder separation rather than a single flat `docs/` directory of markdown files.

We also expected AI coding assistants to work heavily in this codebase. The documentation layout needed to be predictable enough that an agent could infer the correct destination for any new document without being told explicitly.

## Decision

We will use a **flat `src`-less package layout** for Python source — one top-level directory named `evalbench/` containing all modules — and a **typed subdirectory hierarchy** under `docs/` for all documentation. Three root-level markdown files (`README.md`, `ARCHITECTURE.md`, `CONTEXT.md`) live at the repo root and are never moved into `docs/`.

```
evalbench/                  # installable Python package — all source here
│   schema.py
│   evaluators/
│   providers/
│
docs/
│   adr/                    # Architecture Decision Records
│   assets/                 # Images, diagrams, screenshots
│   concepts/               # Deep-dives on algorithms and patterns used by the project
│   references/             # Portable language/tool reference material (non-project-specific)
│   runbooks/               # Incident and local-dev troubleshooting playbooks
│   prd.md                  # Product requirements document
│
ARCHITECTURE.md             # Repo root — C4 architecture overview
CONTEXT.md                  # Repo root — AI/agent context primer and glossary
README.md                   # Repo root — front door, setup instructions
main.py                     # Repo root — CLI entry point
pyproject.toml              # Repo root — package metadata and dependencies
```

## Alternatives Considered

### Option A: `src/` layout (`src/evalbench/`)

The `src/` layout places the package inside a `src/` directory, so imports during development require the package to be installed (via `pip install -e .` or `uv sync`). Pros: it prevents accidental imports of the raw source tree instead of the installed package, which catches packaging mistakes early; it is recommended by PyPA for library projects. Cons: it adds one directory level of indirection with no practical benefit for a project of this size that is not distributed to PyPI; the toolchain (`uv`, `pyproject.toml`) handles the distinction cleanly regardless. Why we didn't choose it: the added friction for contributors outweighs the packaging correctness benefit at this stage.

### Option B: Flat layout with no docs hierarchy (`docs/*.md` all at one level)

Put all markdown files directly in `docs/` with no subdirectories. Pros: simpler, fewer decisions about where a new file goes. Cons: as the project grows, a flat docs folder becomes unscannable — ADRs, runbooks, concepts, and reference material all interleave; there is no structural signal about what kind of document you are looking at; agents and tooling cannot infer document type from path alone. Why we didn't choose it: predictable structure is load-bearing for AI-assisted development.

### Option C (chosen): Flat `evalbench/` package + typed `docs/` subdirectory hierarchy

A single `evalbench/` package directory keeps the Python layout as simple as possible while the typed `docs/` hierarchy imposes just enough structure to make document purpose discoverable from the path. `docs/adr/001-*.md` is unambiguously an ADR; `docs/concepts/001-*.md` is unambiguously a concept deep-dive. Root-level files (`README.md`, `ARCHITECTURE.md`, `CONTEXT.md`) stay at the root because they are the first files a contributor or agent reads — burying them in `docs/` would reduce their discoverability.

## Consequences

### Positive

- Python tooling (`uv`, `pip install -e .`, `pyproject.toml`) works without configuration beyond `packages = ["evalbench"]`
- Document type is derivable from file path — no ambiguity about whether a given markdown file is an ADR, a runbook, or a concept doc
- `ARCHITECTURE.md` and `CONTEXT.md` at the repo root are the first files encountered when cloning — maximally discoverable for both humans and AI assistants
- Adding a new document type requires only creating a new subdirectory under `docs/` — no restructuring needed

### Negative

- `docs/references/` is a non-standard subdirectory name not covered by typical documentation tooling conventions — contributors may not know what belongs there without reading the ADR
- Root-level `ARCHITECTURE.md` and `CONTEXT.md` add two extra files to the repo root, which some teams prefer to keep minimal

### Neutral

- Numbered file prefixes (`001-`, `002-`) in `docs/adr/` and `docs/concepts/` imply a canonical reading order. This is a convention, not enforced by tooling. Contributors must manually maintain correct numbering when inserting new documents.

## Follow-up Actions

- [x] Create `docs/adr/`, `docs/assets/`, `docs/concepts/`, `docs/runbooks/` directories
- [x] Place `ARCHITECTURE.md`, `CONTEXT.md`, `README.md` at repo root
- [x] Place `docs/prd.md` under `docs/`
- [ ] Document the `docs/references/` subdirectory convention in `CONTEXT.md` codebase map

## References

- [PyPA — src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/)
- [ADR-002](002-use-pydantic-for-core-schemas.md) — core schema decision (uses the package layout established here)
- [ADR-003](003-use-jsonl-for-dataset-storage.md) — dataset storage decision (uses the `docs/` hierarchy for this ADR)
