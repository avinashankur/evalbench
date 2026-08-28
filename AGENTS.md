## 1. Python Standards & Type Annotations

- **Modern Union Syntax (`PEP 604`)**:
  - Always use `X | None` for nullable types instead of `Optional[X]`.
  - Use `A | B` for union types instead of `Union[A, B]`.
- **Explicit Typing**:
  - Provide explicit type annotations for all function signatures, return types, and class attributes.
  - Use `typing.Annotated` for dependency injection and framework metadata (e.g., FastAPI `Depends`).

---

## 2. Import Conventions

- **Organized & Grouped Ordering**:
  - Group imports in standard sections separated by a single blank line:
    1. Standard library imports (e.g., `asyncio`, `json`, `pathlib`, `uuid`)
    2. Third-party package imports (e.g., `fastapi`, `pydantic`, `redis`)
    3. First-party application imports (e.g., `evalbench.api.*`, `evalbench.storage.*`)
  - Keep imports within each section sorted in alphabetical order.
- **Module-Level Imports**:
  - Keep imports at the top of the file unless deferred loading is explicitly needed to avoid circular dependencies.

---

## 3. Linting & Modification Scope

- **Targeted Linting (`ruff`)**:
  - Run `ruff check` only on files created or modified in the current session.
  - Do not alter, reformat, or refactor untouched legacy files across the repository.
- **Clean Diff Principle**:
  - Keep diffs focused, minimal, and directly tied to the task objectives.

---
