# 002 — How Evaluators Work

> **Relates to:** `evalbench/evaluators/` — the evaluation layer that scores model outputs
> **Prerequisites:** [001 — The Evaluation Data Model](001-data-model.md) — you need to understand `TestCase`, `LLMResponse`, and `EvalResult` before this doc makes sense.
> **Canonical reference:** [Python `abc` module](https://docs.python.org/3/library/abc.html)

---

## What this is

An evaluator is a single, composable scoring unit. It takes one `(TestCase, LLMResponse)` pair, applies a specific criterion, and returns an `EvalResult` with a score in `[0.0, 1.0]` and a pass/fail status. Multiple evaluators can be applied to the same pair independently — the results are collected in `TestCaseResult.eval_results`.

The evaluator model answers a specific question: **given what we asked and what the model said, how does it score on one particular dimension?** Each evaluator measures exactly one dimension. Combining evaluators is how you build a multi-criteria benchmark.

---

## The `Evaluator` contract

Every evaluator inherits from the `Evaluator` abstract base class:

```python
class Evaluator(ABC):
    name: str = "base"

    @abstractmethod
    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        raise NotImplementedError

    def _result(
        self,
        test_case: TestCase,
        score: float,
        passed: bool,
        reason: str | None = None,
        **metadata
    ) -> EvalResult:
        return EvalResult(
            evaluator_name=self.name,
            test_case_id=test_case.id,
            score=score,
            status=EvalStatus.PASSED if passed else EvalStatus.FAILED,
            reason=reason,
            metadata=metadata,
        )
```

Two things to understand here:

### `name` — the evaluator's identity

`name` is a class attribute, not an instance attribute. It is the string written into every `EvalResult.evaluator_name` this evaluator produces. It must be unique across evaluators — it is the key used to look up scores in `TestCaseResult.summary()`.

```python
class ExactMatchEvaluator(Evaluator):
    name = "exact_match"   # appears in every EvalResult this class produces
```

### `evaluate()` — the one method you must implement

`evaluate()` is `async`. It receives the full `TestCase` and `LLMResponse`, and must return an `EvalResult`. It should never raise — on any error or unexpected condition, return a result with `score=0.0` and an informative `reason`.

### `_result()` — the helper you should always use

`_result()` constructs the `EvalResult` for you. It:
- Sets `evaluator_name` to `self.name` automatically
- Sets `test_case_id` to `test_case.id` automatically
- Derives `status` from the `passed` bool (`True` → `PASSED`, `False` → `FAILED`)
- Accepts `**metadata` as extra key-value pairs written into `EvalResult.metadata`

Always use `_result()`. Never construct `EvalResult` directly inside an evaluator — it ensures consistency.

---

## `passed` vs `score` — they are not the same thing

This is the most important subtlety in the evaluator model.

- **`passed`** is a `bool`. It drives `EvalStatus`. It answers: did this response meet the criterion?
- **`score`** is a `float` in `[0.0, 1.0]`. It is the numeric signal. For binary evaluators, `score=1.0` when `passed=True` and `score=0.0` when `passed=False`.

They are kept separate because some evaluators are not purely pass/fail:

```
json_validity with require_schema:
  valid JSON, all required keys present  → passed=True,  score=1.0
  valid JSON, some required keys missing → passed=False, score=0.5  ← partial score
  invalid JSON                           → passed=False, score=0.0
```

The `score` carries more information than `passed`. Reporting and analysis layers can use `score` for graded ranking; a simple pass-rate metric uses `passed`. Both are always present.

**Rule:** never set `passed=True` with `score < 1.0`, or `passed=False` with `score=1.0`. That combination is semantically incoherent.

---

## The five built-in evaluators

### `ExactMatchEvaluator` — `name = "exact_match"`

Passes if `response.text` equals `test_case.expected_answer` after normalization.

```python
ExactMatchEvaluator(case_sensitive=False, strip_whitespace=False)
```

| Option | Default | Effect |
|---|---|---|
| `case_sensitive` | `False` | If `False`, both sides are lowercased before comparison |
| `strip_whitespace` | `False` | If `True`, leading/trailing whitespace is stripped before comparison |

Requires `expected_answer` to be set. Returns `score=0.0, passed=False` with a reason if it is `None`.

**When to use:** closed-ended questions with a single correct string answer (e.g., multiple choice, fill-in-the-blank, code generation with a known exact output).

**When not to use:** open-ended generation — even a correct paraphrase fails exact match.

---

### `ContainsEvaluator` — `name = "contains"`

Passes if `test_case.expected_answer` appears as a substring of `response.text`.

```python
ContainsEvaluator(case_sensitive=False)
```

Requires `expected_answer`. Case-insensitive by default.

**When to use:** when the answer must appear somewhere in the response but the surrounding text is unconstrained (e.g., "response must mention the word 'Paris'").

**When not to use:** when position or exclusivity matters — `contains` does not care where in the text the answer appears, or whether other incorrect content surrounds it.

---

### `JSONValidityEvaluator` — `name = "json_evaluator"`

Passes if the response contains parseable JSON, optionally with required top-level keys.

```python
JSONValidityEvaluator(strip_code_fences=True, require_schema={"name": ..., "age": ...})
```

| Option | Default | Effect |
|---|---|---|
| `strip_code_fences` | `True` | Strips markdown code fences (` ```json ... ``` `) before parsing via `extract_json()` |
| `require_schema` | `None` | Dict of required top-level keys. Values are ignored — only key presence is checked |

**Scoring:**

| Condition | `passed` | `score` |
|---|---|---|
| Valid JSON, all required keys present (or no schema) | `True` | `1.0` |
| Valid JSON, at least one required key missing | `False` | `0.5` |
| Invalid JSON | `False` | `0.0` |

**When to use:** when the model is prompted to return structured JSON output and you need to verify the output is parseable and has the right shape.

---

### `LatencyEvaluator` — `name = "latency"`

Records `response.latency_ms` and optionally flags responses that exceeded a threshold.

```python
LatencyEvaluator(max_latency_ms=2000.0)  # fail if > 2 seconds
LatencyEvaluator()                        # no threshold — always passes, just records
```

Without `max_latency_ms`, this evaluator always returns `passed=True, score=1.0`. Its value in that mode is purely observational — the actual `latency_ms` is stored in `EvalResult.metadata`.

**When to use:** when latency is a first-class quality signal. Run alongside correctness evaluators to get a combined picture of quality + speed. Also useful as a pure observer when you want latency in every result record without enforcing a threshold.

---

### `TokenUsageEvaluator` — `name = "token_usage"`

Records token counts and cost, optionally failing if `total_tokens` exceeds a budget.

```python
TokenUsageEvaluator(max_total_tokens=4096)  # fail if over budget
TokenUsageEvaluator()                        # no limit — observational only
```

Stores `prompt_tokens`, `completion_tokens`, `total_tokens`, and `cost_usd` in `EvalResult.metadata`. Falls back to `total=0` if `response.total_tokens` is `None`.

**When to use:** when token efficiency matters (cost control, context-window constraints). Like `LatencyEvaluator`, it is useful in pure observer mode to record usage data even without enforcing a budget.

---

## How to write a new evaluator

Implement `Evaluator`, set `name`, implement `evaluate()`, always use `_result()`.

```python
from evalbench.evaluators.base import Evaluator
from evalbench.schema import EvalResult, LLMResponse, TestCase


class WordCountEvaluator(Evaluator):
    """Passes if the response is within a word count range."""

    name = "word_count"

    def __init__(self, min_words: int = 0, max_words: int | None = None):
        self.min_words = min_words
        self.max_words = max_words

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        count = len(response.text.split())
        too_short = count < self.min_words
        too_long = self.max_words is not None and count > self.max_words
        passed = not too_short and not too_long

        reason = None
        if too_short:
            reason = f"response has {count} words, minimum is {self.min_words}"
        elif too_long:
            reason = f"response has {count} words, maximum is {self.max_words}"

        return self._result(
            test_case,
            score=1.0 if passed else 0.0,
            passed=passed,
            reason=reason,
            word_count=count,          # stored in EvalResult.metadata
        )
```

**Checklist for new evaluators:**

- [ ] `name` is a class attribute, not set in `__init__`
- [ ] `name` is unique across all evaluators in the project
- [ ] `evaluate()` is `async`
- [ ] `evaluate()` never raises — all error paths return a result with `reason` set
- [ ] `_result()` is used to construct the return value
- [ ] If `expected_answer` is needed, return a failing result if it is `None` — never crash
- [ ] Extra diagnostic data (counts, values, thresholds) goes in `**metadata` kwargs to `_result()`

---

## Composition pattern

Evaluators are independent — running multiple against the same pair is idiomatic:

```python
evaluators = [
    ExactMatchEvaluator(),
    LatencyEvaluator(max_latency_ms=3000),
    TokenUsageEvaluator(max_total_tokens=1000),
]

eval_results = [await ev.evaluate(test_case, response) for ev in evaluators]
```

Each returns its own `EvalResult`. They are all collected in `TestCaseResult.eval_results`. No evaluator knows about or depends on another.

---

## Trade-offs

**`evaluate()` is async even for purely synchronous evaluators**

`ExactMatchEvaluator` and `ContainsEvaluator` do no I/O — they are pure string comparisons. They are still declared `async` for interface uniformity. This means they must be called with `await`, adding marginal overhead. The benefit is that the benchmark runner can `asyncio.gather()` all evaluators for a test case without a special case for sync vs. async evaluators, and future evaluators that do call async APIs (e.g., an LLM-as-judge evaluator) fit the same interface with no runner changes.

**`ERROR` status is not yet produced by the built-in evaluators**

`EvalStatus.ERROR` exists in the schema for cases where the evaluator itself could not run (e.g., the `LLMResponse.error` is set). None of the current built-in evaluators check `response.ok` before scoring. An errored response with `text=""` will be scored against `expected_answer` normally — `exact_match` will fail it, `latency` will still record `0.0ms`. This is a known gap: evaluators should check `response.ok` first and return `EvalStatus.ERROR` if the response itself is an error. New evaluators should do this.

**No evaluator registry**

Unlike providers, evaluators have no registry or factory. They are instantiated directly. If you need to configure evaluators from a config file (e.g., YAML), you will need to build a lookup mechanism yourself.

---

## Further reading

- [Python ABC documentation](https://docs.python.org/3/library/abc.html)
- [001 — The Evaluation Data Model](001-data-model.md) ← foundational types
- [003 — The Provider Abstraction and Retry Model](003-provider-abstraction.md) ← how responses are produced
