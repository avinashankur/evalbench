# Concept Deep-Dive Reference

## Purpose

A concept doc explains a non-obvious idea, algorithm, mathematical foundation, or theoretical design pattern. It is the textbook page behind the implementation — written for engineers who need to understand the underlying theory at a deeper level than code comments can convey.

Concept docs must be **universally true and portable**:
- They describe concepts that may or may not be directly tied to this project, but are transferable across systems.
- They should not contain project-specific configuration, file paths, private feature names, or business logic.
- If the underlying concept is studied in another repo or tech stack, the concept doc should apply unchanged.

> 💡 **Project-Specific vs. Universal Distinction:**
> - If the concept explains **how this specific project works** (e.g. its component pipelines, auth lifecycle, module interactions), write it in **`docs/architecture/`** instead.
> - If the concept is **universally true and transferable** (e.g. bloom filter math, rate limiting algorithms, vector similarity distance metrics), write it in **`docs/concepts/`**.

## When to write one

Write a concept doc in `docs/concepts/` when:

- An algorithm or data structure in the codebase is non-trivial (bloom filters, consistent hashing, rate limiting strategies, custom encoding schemes)
- The math behind a feature needs explanation (scoring functions, statistical models, optimization problems)
- A mathematical or theoretical design pattern is used that warrants conceptual explanation
- A new engineer would need to read a paper, blog post, or textbook chapter before modifying the related code

Do NOT write a concept doc for:

- Project-specific architecture or subsystem mechanics (use `docs/architecture/` instead)
- Project-specific business logic (use an ADR, `docs/architecture/`, or inline docs instead)
- Trivially Googleable concepts (don't write a concept doc for "what is a hash map")
- Explanations short enough for a code comment or README section
- Decisions (use `docs/adr/`) or procedures (use `docs/how-tos/` or `docs/runbooks/`)

## File naming convention

Same as ADRs — numbered, kebab-case:

- `001-bloom-filter-sizing.md`
- `002-consistent-hashing.md`
- `003-jwt-token-rotation-strategy.md`
- `004-short-code-generation.md`

Numbers are sequential and reflect dependency order. If concept 005 depends on understanding concept 002, they should be numbered so that reading in order builds knowledge progressively. If the agent detects numbering that breaks this logical dependency order, it should suggest renumbering to the user.

## Clarifying questions to ask

1. What concept are you documenting? (algorithm, pattern, math, design)
2. What part of the codebase uses this concept?
3. What prerequisite knowledge does the reader need?
4. Is there a canonical reference (paper, blog post, textbook)?
5. Can this doc be understood without knowing anything about this specific project?
6. Are there related concept docs that should be read first?

## Concept Template

---

# [NNN] — [Concept Name]

> **Relates to:** [module or area of codebase — generic, not project-specific — e.g., "search indexing", "rate limiting", "encoding layer"]
> **Prerequisites:** [What the reader should understand first — link to other concept docs if applicable]
> **Canonical reference:** [Link to paper, article, or textbook]

## What this is

[2–4 sentences. What is this concept? Why does it matter? What problem does it solve in general (not project-specific)?]

## How it works

[The core explanation. Use diagrams (Mermaid), math (LaTeX if needed), pseudocode, and examples. Go deep enough that the reader could re-implement it.]

### [Sub-section if needed]

[Break complex explanations into sub-sections. Each sub-section should cover one distinct aspect — e.g., the data structure, the lookup algorithm, the resize strategy.]

## Trade-offs

[What are the known limitations, failure modes, or edge cases? What alternatives exist and why might someone choose differently? Be honest — not just "this is great".]

## Further reading

- [Link to paper/article]
- [Link to related concept docs in this repo]

---

## Hierarchy and Ordering

Concept docs should be numbered so that reading them in order builds knowledge progressively:

- Foundational concepts (data structures, basic algorithms) get lower numbers
- Applied concepts (how foundational concepts are combined) get higher numbers
- If concept B depends on concept A, then A.number < B.number

When reviewing existing concept docs, check for:

- **Numbering gaps** — are there missing numbers in the sequence? Warn but don't auto-fix; they may be intentional (deleted or superseded concepts).
- **Dependency violations** — does concept 005 reference concept 008? Suggest reordering.
- **Scope creep** — does a concept doc contain project-specific details that should be in an ADR or how-to? Flag it.

## Portability Check

Before finishing a concept doc, verify:

- [ ] No project-specific feature names, config values, or business terms
- [ ] Project-specific examples are replaced with generic equivalents
- [ ] The doc makes sense if you imagine it in a completely different repo that uses the same algorithm/pattern
- [ ] No file paths or import statements from this specific project

## Quality Checklist

Before finishing:

- [ ] Concept is explained from first principles (don't assume the reader knows it)
- [ ] At least one diagram or visual aid for non-trivial concepts
- [ ] Trade-offs section is honest (not just "this is great")
- [ ] Canonical reference is linked
- [ ] Prerequisites are listed and linked if they're other concept docs
- [ ] The doc is portable — no project-specific coupling
- [ ] Numbering follows the dependency order
