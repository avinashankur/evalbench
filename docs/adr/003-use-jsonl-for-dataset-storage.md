---

# 003-ADR: Use JSONL as the Primary Dataset Format

**Date:** 2026-08-20
**Status:** Accepted
**Deciders:** evalbench team
**Tags:** storage, dataset, io

---

## Context

`evalbench` needs a standardized storage format for handling evaluation datasets, which consist of lists of `TestCase` objects. The data storage format needs to be human-readable, easily appendable, and scalable for datasets that may eventually grow too large to load entirely into memory at once. It also needs to successfully serialize complex objects including metadata dictionaries and nested text references.

## Decision

We will use JSONL (JSON Lines) as the primary storage format for serializing and deserializing datasets.

## Alternatives Considered

We considered several standard serialization formats for datasets.

### Option A: Standard JSON

A single JSON array containing all objects. Pros: it is extremely common, fully supported by all standard libraries, and easy to read for small files. Cons: it requires parsing the entire file into memory at once; adding a single new record to a large JSON file requires reading and rewriting the whole array structure. Why we didn't choose it: it has poor scaling characteristics for large datasets and streaming use-cases.

### Option B: CSV / TSV

Comma or Tab Separated Values. Pros: great for flat data, highly portable, and integrates directly with spreadsheet tools and pandas. Cons: struggles heavily with nested structures like `reference_contexts` (lists) or `metadata` (nested dictionaries), requiring complex custom encoding and decoding logic. Why we didn't choose it: our dataset schema is inherently nested, not flat.

### Option C: Parquet

A columnar binary storage format. Pros: excellent for large-scale analytics, highly compressed, and fast. Cons: it is a binary format that is difficult to inspect manually or easily version-control using git for small datasets and text-heavy evaluation cases. Why we didn't choose it: the overhead is too high for simple local dataset viewing and version tracking.

### Option D (chosen): JSONL

JSON Lines, where each line is a valid JSON object. We chose it because it handles nested, structured data effortlessly (since each line is valid JSON). It supports lazy streaming (reading line-by-line) which minimizes memory usage for large evaluation runs, and allows for simple append-only log writing. It also works very well with Pydantic's per-record `.model_dump_json()` method.

## Consequences

### Positive

- Human-readable and relatively git-friendly for single-line changes
- Natively supports arbitrarily complex nested objects
- Memory-efficient lazy loading and stream processing
- Trivially appendable

### Negative

- Slightly more verbose than binary formats
- Lacks cross-row structural guarantees (each line could technically have a different schema, so we rely purely on application-layer validation via Pydantic)

### Neutral

- Non-standard tooling compared to raw JSON or CSV (requires specific JSONL parsers or manual line-by-line reading)

## Follow-up Actions

- [x] Implemented `from_jsonl` and `to_jsonl` in the `Dataset` class (`schema.py`)

## References

- [JSON Lines Documentation](https://jsonlines.org/)
