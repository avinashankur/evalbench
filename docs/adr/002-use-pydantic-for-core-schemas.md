---

# 002-ADR: Use Pydantic for Core Data Schemas

**Date:** 2026-08-20
**Status:** Accepted
**Deciders:** evalbench team
**Tags:** data, schema, validation

---

## Context

We are building an evaluation benchmarking toolkit that processes complex and nested data structures such as `TestCase`, `Dataset`, and `LLMResponse`. The toolkit relies on strictly structured data for reliable validation, LLM response tracking, and evaluation metrics. We need a robust mechanism to validate incoming data, ensure correct types, and easily serialize and deserialize complex nested objects like test cases with lists of references and metadata dictionaries.

## Decision

We will use Pydantic (v2) as the primary data validation and schema definition library for all core models.

## Alternatives Considered

We evaluated built-in tools versus third-party validation libraries to handle our complex validation needs.

### Option A: Standard Python `dataclasses`

Standard Python dataclasses are built-in and lightweight. Pros: they have no external dependencies and fast instantiation. Cons: they lack out-of-the-box runtime type validation, nested serialization, and complex validation hooks without writing substantial boilerplate code. Why we didn't choose it: we need strict runtime guarantees and automatic type coercion that Pydantic offers natively.

### Option B: TypedDict / Raw dicts

TypedDict and raw dictionaries are very flexible basic Python structures. Pros: they offer maximum flexibility and the lowest overhead. Cons: they are error-prone, requiring manual type checking and transformation at every boundary layer, which doesn't scale well for an evaluation pipeline where strict schemas are critical. Why we didn't choose it: this approach is too brittle for core domain models.

### Option C (chosen): Pydantic

Pydantic is a robust data validation library for Python. We chose it because it provides robust runtime validation, deep nested model support, easy JSON serialization (`model_dump_json`), and allows for declarative rules via `@field_validator`. It ensures our evaluation pipeline receives exactly the data shapes it expects.

## Consequences

### Positive

- Guaranteed data consistency and type safety at runtime
- Declarative validation rules (e.g., enforcing that a question is not empty)
- Clean, concise model definitions with simple serialization to JSON

### Negative

- Adds a third-party dependency to the project
- Minor performance overhead during initialization compared to native Python dictionaries or dataclasses

### Neutral

- Requires developers to learn Pydantic semantics if they are only familiar with standard `dataclasses`

## Follow-up Actions

- [x] Ensure `pydantic` is added to `pyproject.toml` dependencies — added 2026-08-22 via `uv add pydantic` (v2.13.4); was previously missing despite being marked complete

## References

- [Pydantic Documentation](https://docs.pydantic.dev/latest/)
