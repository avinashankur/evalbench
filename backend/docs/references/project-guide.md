# EvalBench — Comprehensive Project Guide

This document explains what EvalBench is, why it's built the way it is, the
standards the code follows, and how every piece fits together. It's meant
to be the reference you come back to, not something you read once.

---

## 1. What this project is

EvalBench is a **production-grade LLM evaluation framework**. Given a
dataset of questions, a model to test, and a set of evaluators, it:

1. Sends each question to the model
2. Scores each response with one or more evaluators (deterministic checks,
   LLM-as-judge, or RAG-quality checks)
3. Persists the full results
4. (Optionally) runs this as a background job through a queue/worker system

The design goal stated at the start of this project: **this is not a
prototype.** Every abstraction exists because it will matter at scale (1000+
test cases, multiple providers, long-running jobs) — not because it looked
nice on paper.

### Roadmap status

| Phase      | What                            | Status                                          |
| ---------- | ------------------------------- | ----------------------------------------------- |
| 1          | Dataset + test cases            | ✅ Done                                         |
| 2          | Evaluation engine               | ✅ Done                                         |
| 3          | Deterministic evaluators        | ✅ Done                                         |
| 4          | LLM-as-a-judge                  | ✅ Done                                         |
| 5          | RAG evaluation                  | ✅ Done                                         |
| 6 (config) | Evaluation configuration (YAML) | ✅ Done — folded into Phases 1-2                |
| 6          | FastAPI + Postgres + Redis      | ✅ Done (storage/worker layer; no HTTP API yet) |
| 7          | Async evaluation workers        | ✅ Done                                         |
| 8          | Dashboard                       | ❌ Not built                                    |
| 9          | Experiment tracking             | ❌ Not built                                    |
| 10         | Regression testing + CI/CD      | ❌ Not built                                    |

(Numbering here reflects the original planning doc's "recommended
development order," which splits config and backend slightly differently
than the phase numbers used in conversation — the status table above is
the accurate source of truth.)

---

## 2. Core design principles

These are the rules the whole codebase follows. If you're adding new code
and unsure how to structure it, check against this list first.

### 2.1 Every extensible thing is an abstract base class with a registry

There are four extension points in this project, and all four follow the
exact same pattern:

| Abstraction   | File                 | Interface method                                    | Registry                                   |
| ------------- | -------------------- | --------------------------------------------------- | ------------------------------------------ |
| `LLMProvider` | `providers/base.py`  | `_call(prompt, system) -> LLMResponse`              | `providers/registry.py`                    |
| `Evaluator`   | `evaluators/base.py` | `evaluate(test_case, response) -> EvalResult`       | `evaluators/registry.py`                   |
| `Retriever`   | `retrieval/base.py`  | `retrieve(query, top_k) -> list[RetrievedDocument]` | (built manually in `config.py`)            |
| `ResultStore` | `results.py`         | `save(summary)` / `load(run_id)`                    | (constructed directly, no string registry) |

Why this matters: adding a new LLM provider, a new evaluator, or a new
retrieval backend never requires touching the engine, the CLI, or any
other provider/evaluator. You write one new file implementing the
interface, register it (if it's provider/evaluator), and it works
everywhere the existing ones do — including in YAML configs.

**Rule:** if you're building something the user will want to swap out or
add more of later, it gets an ABC + a subclass, not an `if/elif` chain.

### 2.2 Normalize at the boundary, not throughout the codebase

Every provider returns the exact same `LLMResponse` shape (`schema.py`),
regardless of whether it called OpenAI, Anthropic, or Gemini under the
hood. The vendor-specific response parsing happens **once**, inside each
provider's `_call()` method. Nothing downstream — no evaluator, no engine
code — ever sees an OpenAI object or an Anthropic object.

Same principle for retrieval: `Retriever.retrieve()` always returns
`list[RetrievedDocument]`, regardless of whether the backend is an
in-memory index or a real vector database.

**Rule:** if you're integrating an external system, write one adapter
function/class that converts its output into this project's own types
immediately. Don't let vendor-specific shapes leak past that one point.

### 2.3 One test case failing must never stop the run

This is enforced in `engine.py`, `_run_one()`:

- A provider call that fails after all retries returns an `LLMResponse`
  with `.error` set — it does **not** raise.
- An evaluator that raises an exception gets caught, and an
  `EvalResult` with `status=ERROR` is recorded instead — the exception
  never propagates out of `_run_one()`.
- A judge model returning unparseable output is caught the same way in
  `llm_judge.py` and `rag.py` — `EvalStatus.ERROR`, not a crash.

**Rule:** anywhere the code deals with one test case out of many, wrap
risky operations (network calls, JSON parsing, third-party SDK calls) and
convert failures into typed error results. Never let one bad row take down
a 1000-row run.

### 2.4 Async by default, bounded concurrency always

Every provider call, evaluator call, and retriever call is `async`. The
engine runs test cases **concurrently**, not sequentially — but always
behind an `asyncio.Semaphore` (`RunConfig.concurrency`, default 10) so a
large dataset doesn't fire hundreds of simultaneous requests and get
rate-limited.

**Rule:** new I/O-bound code (API calls, DB queries) should be `async def`.
If it can run for many items in a batch, it needs a concurrency limit —
don't rely on the caller to throttle itself.

### 2.5 The `Evaluator` interface never changes shape, no matter how smart the evaluator is

`evaluate(test_case, response) -> EvalResult` is the signature for
**every** evaluator — `exact_match` (a string comparison), `llm_judge` (an
entire separate LLM call), and `faithfulness` (a RAG-aware LLM call that
reads `response.retrieved_context`). None of them needed the interface
itself to change.

This works because extra data an evaluator needs (retrieved context,
reference answers) is attached to the existing `TestCase` or `LLMResponse`
objects rather than added as new parameters to `evaluate()`. See
`LLMResponse.retrieved_context` and `TestCase.reference_contexts` in
`schema.py` — both were added for Phase 4/5 evaluators without touching
the `Evaluator` ABC at all.

**Rule:** when a new evaluator needs new input, ask "can this live on
`TestCase` or `LLMResponse` instead of a new method parameter?" first.

### 2.6 Config-driven, not code-driven, for running evaluations

A user should be able to describe an entire evaluation run — model,
dataset, evaluators, retriever — in a YAML file and never touch Python.
`config.py`'s `EvalRunConfig.build()` is the single place that turns YAML
into the actual runnable objects (`Dataset`, `LLMProvider`,
`list[Evaluator]`, `RunConfig`, optional `Retriever`).

**Rule:** any new evaluator/provider/retriever that takes constructor
arguments should be usable from YAML. If it needs something YAML can't
express directly (like a built object, e.g. a judge provider), follow the
existing pattern in `config.py` (`_build_judge_based`) — a small,
documented special case, not a workaround bolted onto the engine.

### 2.7 Every module explains _why_, not just _what_, at the top

Every non-trivial file in this project opens with a docstring explaining
the design reasoning, not just a one-line description. See the top of
`engine.py`, `providers/base.py`, or `evaluators/rag.py` for examples. This
is deliberate — six months from now, "why does this exist" is the question
that actually costs time to re-derive.

**Rule:** when adding a new file, write 3-5 sentences at the top explaining
the design decision it embodies, not just what the code does.

---

## 3. Directory structure and what belongs where

```
evalbench/                    ← project root
├── eval_bench/                ← the importable package (flat layout — see note below)
│   ├── schema.py                ← ALL shared data types live here, nowhere else
│   ├── engine.py                 ← the async run loop; owns concurrency + error isolation
│   ├── config.py                  ← YAML → runnable objects
│   ├── cli.py                      ← thin wrapper: config.py → engine.py → results.py
│   ├── results.py                   ← ResultStore ABC + JSONLResultStore
│   ├── providers/                    ← one file per LLM vendor + base.py + registry.py
│   ├── evaluators/                    ← one file per evaluator + base.py + registry.py
│   ├── retrieval/                      ← Retriever ABC + built-in implementations
│   └── storage/                         ← Postgres/Redis backend (Phase 6+)
├── tests/                      ← mirrors eval_bench/ structure, one test file per concern
├── configs/                    ← example YAML run configs (also used as fixtures in demos)
├── datasets/                   ← example JSONL datasets
├── pyproject.toml              ← dependencies, tool config, entry points
├── uv.lock                     ← locked dependency versions (committed to the repo)
└── README.md                   ← quickstart + architecture summary (shorter than this doc)
```

**A note on "flat layout" vs. "src layout":** this project deliberately
uses flat layout — `eval_bench/` sits directly at the project root, as a
sibling to `tests/`, rather than nested under a `src/` directory. This was
an explicit, considered choice (not an accident), made after reviewing the
tradeoffs of both conventions. If you're used to `src/`-layout projects,
that's the difference you're noticing — it's intentional here, not a gap.

### Rule for where new code goes

- A new **data type** used by more than one module → `schema.py`.
- A new **way to call an LLM** → new file in `providers/`.
- A new **way to score a response** → new file in `evaluators/`.
- A new **way to fetch documents** → new file in `retrieval/`.
- A new **way to persist/queue results** → new file in `storage/`.
- Anything that touches **how a run executes** (concurrency, retries, the
  core loop) → `engine.py`, and only `engine.py`.
- A **private helper reused by 2+ evaluators** → a `_underscore_prefixed.py`
  file in the relevant package (see `evaluators/_json_utils.py`) — signals
  "internal, not part of the public extension surface."

---

## 4. Coding standards

### 4.1 Typing

- Every function signature is fully typed — parameters and return type.
- Pydantic v2 `BaseModel` for anything that's data (crosses a boundary:
  gets saved, loaded, sent over YAML/JSON, or returned from a public
  method). Plain `@dataclass` only for internal, in-process-only
  structures (e.g. `RunConfig`, `RunSummary` in `engine.py` — never
  serialized directly, always converted to/from Pydantic models at the
  boundary).
- `from __future__ import annotations` at the top of every file, so type
  hints can use modern syntax (`list[str]`, `X | None`) regardless of
  exact Python 3.10+ patch version.

### 4.2 Error handling

- Library code (providers, evaluators, retrievers) **catches exceptions
  and converts them to typed error results** (`LLMResponse.error`,
  `EvalResult.status=ERROR`) rather than raising, _except_ during
  construction/configuration (e.g. `ValueError` for an unknown provider
  name in `registry.py` — that's a programmer error, not a runtime
  condition, and should fail loud and immediately).
- Never use a bare `except:` — always `except SpecificException` or
  `except Exception as e` with a `# noqa: BLE001` comment explaining why
  broad catching is intentional (see `engine.py`, `providers/base.py` for
  the pattern).
- Retries live in exactly one place per concern: `LLMProvider.generate()`
  for provider calls. Nothing else reimplements retry/backoff logic.

### 4.3 Async conventions

- `asyncio.Semaphore` for concurrency limits, always configurable
  (`RunConfig.concurrency`), never hardcoded.
- Async context managers (`__aenter__`/`__aexit__`) for anything holding a
  connection (`PostgresResultStore`, `RedisJobQueue`) so `async with` works
  and cleanup is guaranteed.
- Sync wrapper methods (e.g. `PostgresResultStore.save()` alongside
  `.asave()`) exist only where a synchronous interface (`ResultStore` ABC,
  used by the sync CLI) requires it — and they're documented with the
  event-loop caveat that comes with mixing sync/async in one process.

### 4.4 Naming

- Classes: `PascalCase`, always ending in the role they play —
  `AnthropicProvider`, `ExactMatchEvaluator`, `InMemoryRetriever`,
  `PostgresResultStore`. You should be able to tell what interface a class
  implements from its name alone.
- Registry keys (YAML-facing strings): `snake_case`, matching the class's
  purpose in plain language — `"exact_match"`, `"llm_judge"`,
  `"context_precision"`.
- Private/internal modules: leading underscore in the filename
  (`_json_utils.py`) — a visual signal that it's not meant to be imported
  from outside the package.

### 4.5 Documentation

- Module-level docstring: **why** this file exists and what design
  decision it embodies (see 2.7).
- Class-level docstring: what it does, one or two sentences.
- Method-level docstring: only when behavior isn't obvious from the
  signature and name — don't restate the obvious (`__init__` setting
  `self.x = x` doesn't need a docstring; `_run_one`'s error-isolation
  behavior does).

---

## 5. Testing standards

### 5.1 Structure

`tests/` mirrors the package: one test file roughly per concern
(`test_schema.py`, `test_engine.py`, `test_evaluators.py`,
`test_llm_judge.py`, `test_rag.py`, `test_retrieval.py`,
`test_backend_integration.py`).

### 5.2 The mock provider is the backbone of the test suite

`providers/mock_provider.py` exists specifically so the engine, evaluators,
retry logic, and CLI can all be tested **without any API key or network
call**. `MockProvider(response_fn=...)` lets a test control exactly what
"the model" says, including simulating failures
(`MockProvider(failure_rate=...)` or a custom `_call()` override that
raises on a schedule).

**Rule:** new tests for engine/evaluator behavior should use `MockProvider`,
not a real provider — real providers are for manual/production use, not
CI.

### 5.3 What must be tested for any new evaluator or provider

- The "happy path" — correct input produces the expected score/status.
- At least one failure mode — malformed input, missing required field,
  underlying call failing — and confirm it produces `EvalStatus.ERROR` (or
  the provider equivalent), not an unhandled exception.
- If it depends on another component (e.g. an evaluator using a judge
  provider), a test using `MockProvider` as that dependency, so the test
  stays fast and hermetic.

### 5.4 Integration tests are separated and self-skipping

`tests/test_backend_integration.py` (Phase 6, Postgres/Redis) is the one
exception to "no real services in tests." These tests:

- Check service reachability first and call `pytest.skip(...)` if
  unavailable — so `uv run pytest` never fails just because Postgres/Redis
  aren't running.
- Clean up their own data (`DELETE FROM runs`, `flushdb()`) after each
  test via fixtures, so tests don't leak state into each other.
- Are the only tests allowed to depend on wall-clock-real infrastructure.

**Rule:** any future test touching a real external service follows this
exact pattern — reachability check, auto-skip, and its own cleanup.

### 5.5 Running tests

```bash
uv sync --extra all
uv run pytest tests/ -v
```

Current count: 52 tests (44 self-contained + 8 live-service integration
tests), all passing.

---

## 6. Dependency management standard

- **`uv`**, not `pip`, is the required tool. `pyproject.toml` +
  `uv.lock` fully describe the environment; `uv sync` recreates it.
- Core dependencies (`pydantic`, `pyyaml`, `click`) are the only things
  installed by default — anything vendor- or backend-specific is an
  **optional extra**:
  - `openai`, `anthropic`, `gemini` — one per provider SDK
  - `backend` — `asyncpg` + `redis`, for Phase 6
  - `all` — everything
- Dev tooling (`pytest`, `pytest-asyncio`) lives in a **PEP 735 dependency
  group** (`[dependency-groups] dev = [...]`), not an extra — extras are
  for things end users of the _installed package_ might want; dependency
  groups are for people developing _this_ repository. `uv sync` installs
  dev-group deps by default; `uv sync --no-default-groups` gives a
  lean/production install.

**Rule:** before adding a new dependency, decide: is this needed by
everyone (→ core `dependencies`), needed only for a specific integration
(→ a named `optional-dependencies` extra), or needed only to develop the
repo itself (→ `dependency-groups`)? Never add something heavy to core
dependencies "just in case."

---

## 7. The request lifecycle, in full detail

This is the complete path from `evalbench run config.yaml` to a saved
result, referencing exact files and functions.

```
1. eval_bench/cli.py :: run()
   ↓
2. eval_bench/config.py :: load_config() → EvalRunConfig.build()
   → eval_bench/schema.py :: Dataset.from_jsonl()
   → eval_bench/providers/registry.py :: get_provider()
   → eval_bench/evaluators/registry.py :: get_evaluator()  (per evaluator)
   → eval_bench/retrieval/in_memory.py :: InMemoryRetriever()  (if retriever: configured)
   ↓
3. eval_bench/engine.py :: EvalEngine.run()
   → for each TestCase, concurrently (bounded by asyncio.Semaphore):
   ↓
4. eval_bench/engine.py :: EvalEngine._run_one()
   a. IF a retriever is configured:
      → eval_bench/retrieval/base.py :: Retriever.retrieve()
      → retrieved text joined into the {context} prompt variable
   b. eval_bench/engine.py :: _render_prompt()
      → fills {question}, {context}, etc. into RunConfig.prompt_template
   c. eval_bench/providers/base.py :: LLMProvider.generate()
      → retry/backoff loop around:
      → eval_bench/providers/<name>_provider.py :: _call()
      → returns eval_bench/schema.py :: LLMResponse
      → IF retrieval happened: response.retrieved_context is set here
   d. for each Evaluator in the list:
      → eval_bench/evaluators/<name>.py :: evaluate(test_case, response)
      → (llm_judge.py / rag.py evaluators make their OWN call back to
         step (c)'s generate() method, against a separate judge provider)
      → wrapped in try/except — failures become EvalResult(status=ERROR)
   e. all EvalResults collected into eval_bench/schema.py :: TestCaseResult
   ↓
5. eval_bench/engine.py :: EvalEngine.run()
   → all TestCaseResults collected into eval_bench/engine.py :: RunSummary
   ↓
6. eval_bench/cli.py :: run()
   → eval_bench/results.py :: JSONLResultStore.save(summary)
   → writes results/<run_id>.jsonl
```

### The Phase 6 background-job variant

```
1. (future) HTTP request  →  eval_bench/storage/redis_queue.py :: RedisJobQueue.enqueue()
                              → job sits in Redis, request returns immediately
   ↓
2. eval_bench/storage/worker.py :: Worker.run_forever()
   → RedisJobQueue.dequeue()  (blocking pop, with timeout)
   ↓
3. eval_bench/storage/worker.py :: Worker.process_one()
   → runs steps 2-5 from the lifecycle above, unchanged
   → eval_bench/storage/postgres_store.py :: PostgresResultStore.asave()
     instead of JSONLResultStore.save()
   → RedisJobQueue.update_status() → COMPLETED or FAILED
```

The worker does not duplicate any evaluation logic — it calls the exact
same `EvalEngine` the CLI calls. Only the trigger (queue vs. command line)
and the destination (Postgres vs. JSONL) differ.

---

## 8. Data model reference (`schema.py`)

| Type             | Purpose                                 | Key fields                                                                                           |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `TestCase`       | One question to evaluate                | `question`, `context`, `expected_answer`, `reference_contexts`, `metadata`                           |
| `Dataset`        | Named collection of `TestCase`s         | `name`, `version`, `test_cases`                                                                      |
| `LLMResponse`    | Normalized output from ANY provider     | `text`, `prompt_tokens`, `completion_tokens`, `cost_usd`, `latency_ms`, `error`, `retrieved_context` |
| `EvalResult`     | One evaluator's verdict on one response | `evaluator_name`, `score` (0.0-1.0), `status` (`PASSED`/`FAILED`/`ERROR`), `reason`, `metadata`      |
| `TestCaseResult` | Everything produced for one test case   | `test_case`, `response`, `eval_results` (list of `EvalResult`)                                       |

`EvalStatus` is a 3-value enum, not a boolean, deliberately: `PASSED`,
`FAILED`, and `ERROR` are semantically different. `FAILED` means "the
evaluator ran and the answer didn't meet the bar." `ERROR` means "the
evaluator couldn't produce a verdict at all" (bad input, provider down,
unparseable judge output). Collapsing these into pass/fail would hide
infrastructure problems inside quality metrics — a spike in `ERROR` status
means something broke; a spike in `FAILED` status means the model got
worse. Different signals, different response needed.

---

## 9. Extension playbook

### Adding a new LLM provider

1. New file in `providers/`, subclass `LLMProvider`, implement `_call()`.
2. Register it: `providers/registry.py`, add to `_REGISTRY` dict.
3. Add its SDK as an optional extra in `pyproject.toml` if it needs one.
4. Test using the same patterns as `test_engine.py`'s provider tests
   (retry-then-succeed, give-up-after-max-retries) — subclass `MockProvider`
   to simulate the new provider's failure modes rather than hitting the
   real API in tests.

### Adding a new evaluator

1. New file in `evaluators/`, subclass `Evaluator`, implement `evaluate()`.
2. Register it: `evaluators/registry.py`, add to `_REGISTRY`.
3. If it needs a judge provider (LLM-based scoring), add its name to
   `_JUDGE_BASED_EVALUATORS` in `config.py` so YAML's `judge_model:` block
   works for it automatically.
4. Test: happy path + at least one ERROR-producing failure mode, using
   `MockProvider` as any dependency.

### Adding a new retriever (e.g. a real vector DB)

1. New file in `retrieval/`, subclass `Retriever`, implement `retrieve()`.
2. No registry entry needed for basic use — build it directly in Python
   and pass to `EvalEngine(..., retriever=my_retriever)`. Only add YAML
   support (a new `type:` in `config.py::_build_retriever()`) if you want
   it configurable without touching Python.

### Adding a new result store

1. New file (in `storage/` if it needs an external service, or top-level
   if simple), subclass `ResultStore`, implement `save()`/`load()`.
2. No registry — constructed directly by whoever wants to use it (CLI,
   worker, or user code).

---

## 10. What's explicitly out of scope right now

- **No dashboard.** Deliberately not built yet, per the roadmap's own
  advice ("don't start with the dashboard, build the intelligence
  first"). `PostgresResultStore.list_runs()` and `.aload()` already
  provide the exact data shape a dashboard backend would query — this is
  a pure frontend build whenever it starts.
- **No experiment-comparison layer.** The `metrics` JSONB column on the
  `runs` table (indexed via GIN) is designed for this, but no
  comparison logic or UI exists yet.
- **No CI/regression-testing integration.** No baseline-comparison logic,
  no GitHub Actions workflow, no `evalbench run` exit-code contract for
  pass/fail CI gating yet.
- **No HTTP API.** The worker/queue system (Phase 6) is designed to sit
  behind a future `POST /evaluations` endpoint, but no web framework
  (FastAPI or otherwise) has been added yet — jobs are enqueued directly
  via `RedisJobQueue.enqueue()` in Python today.

---

## 11. Quick reference: commands

```bash
# Setup
uv sync --extra all

# Run an evaluation
uv run evalbench run configs/mock-example.yaml
uv run evalbench run configs/llm-judge-example.yaml
uv run evalbench run configs/rag-example.yaml

# Tests
uv run pytest tests/ -v

# Background worker (Phase 6, needs Postgres + Redis running)
uv run python -m eval_bench.storage.worker \
  --redis-url redis://localhost:6379/0 \
  --postgres-dsn postgresql://postgres:postgres@localhost/evalbench
```
