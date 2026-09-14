# How to Add a Custom Evaluator

> **Audience:** Developers extending evalbench with new scoring logic  
> **Time required:** 5 minutes  
> **Last verified:** 2026-08-28  

This guide walks you through implementing a custom `Evaluator`, registering it in the dynamic evaluator registry, and configuring it in YAML benchmarks and the REST API.

---

## Prerequisites

- Understanding of [`TestCase`](file:///e:/ai/evalbench/evalbench/schema.py), [`LLMResponse`](file:///e:/ai/evalbench/evalbench/schema.py), and [`EvalResult`](file:///e:/ai/evalbench/evalbench/schema.py) schemas (see [001 — The Evaluation Data Model](../concepts/001-data-model.md)).
- Development virtual environment activated (`uv sync`).

---

## Steps

### 1. Create the Evaluator Class

Subclass `Evaluator` and implement the `async evaluate()` method.

Create `evalbench/evaluators/word_count.py`:

```python
from evalbench.evaluators.base import Evaluator
from evalbench.schema import EvalResult, LLMResponse, TestCase


class WordCountEvaluator(Evaluator):
    """Evaluates whether the completion stays within a word count budget."""

    name: str = "word_count"

    def __init__(self, max_words: int = 100):
        self.max_words = max_words

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        if not response.ok:
            return self._result(
                test_case,
                score=0.0,
                passed=False,
                reason=f"Response error: {response.error}",
            )

        words = response.text.strip().split()
        count = len(words)
        passed = count <= self.max_words

        return self._result(
            test_case,
            score=1.0 if passed else 0.0,
            passed=passed,
            reason=None if passed else f"Word count {count} exceeded max {self.max_words}",
            word_count=count,
            max_words=self.max_words,
        )
```

---

### 2. Register the Evaluator in the Registry

Open `evalbench/evaluators/registry.py`:

1. Import your class:
   ```python
   from evalbench.evaluators.word_count import WordCountEvaluator
   ```
2. Add it to the `_REGISTRY` dictionary:
   ```python
   _REGISTRY: dict[str, Type[Evaluator]] = {
       # ...
       "word_count": WordCountEvaluator,
   }
   ```

*(Alternatively, register it dynamically in Python using `register_evaluator("word_count", WordCountEvaluator)`).*

---

### 3. Use in Benchmark YAML Configurations

Add the evaluator by name (and optional keyword arguments) in your YAML config file:

```yaml
dataset: "datasets/example.jsonl"
model:
  provider: "mock"
  name: "mock-model"

evaluators:
  - exact_match
  - name: word_count
    max_words: 50
```

---

## Verify It Worked

Run an evaluation test with your new evaluator:

```bash
uv run python -c "
import asyncio
from evalbench.evaluators.registry import get_evaluator
from evalbench.schema import TestCase, LLMResponse

ev = get_evaluator('word_count', max_words=5)
tc = TestCase(id='t1', question='test')
resp = LLMResponse(text='this is a short response')

res = asyncio.run(ev.evaluate(tc, resp))
print('Score:', res.score, 'Status:', res.status.value, 'Metadata:', res.metadata)
assert res.score == 1.0
print('Verification successful!')
"
```

**Expected output:**
```text
Score: 1.0 Status: passed Metadata: {'word_count': 5, 'max_words': 5}
Verification successful!
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ValueError: Unknown evaluator 'word_count'` | Evaluator class was not added to `_REGISTRY` in `evaluators/registry.py` | Add the class mapping to `_REGISTRY` |
| `TypeError: unexpected keyword argument` | Arguments in YAML don't match `__init__` parameters of the evaluator | Ensure `__init__` signature accepts the YAML arguments |
| Errored responses marked as failed answers | Evaluator didn't check `response.ok` before evaluating | Add `if not response.ok:` check returning `passed=False` |

---

## Related

- [002 — How Evaluators Work (Concept)](../concepts/002-evaluator-model.md)
- [How to Execute Evaluation Runs](how-to-execute-evaluation-runs.md)
