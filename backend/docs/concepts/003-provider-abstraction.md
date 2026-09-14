# 003 — The Provider Abstraction and Retry Model

> **Relates to:** `evalbench/providers/` — the layer that wraps LLM APIs and delivers `LLMResponse` objects to the benchmark engine
> **Prerequisites:** [001 — The Evaluation Data Model](001-data-model.md) — specifically `LLMResponse` and its `ok` property and `error` field.
> **Canonical reference:** [Python `asyncio` — `wait_for`](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for), [Exponential backoff (Wikipedia)](https://en.wikipedia.org/wiki/Exponential_backoff)

---

## What this is

A provider is an adapter between the benchmark engine and a specific LLM API (OpenAI, Anthropic, Gemini, etc.). The provider layer solves three problems simultaneously:

1. **Abstraction** — the benchmark engine works with any model without knowing which API it is talking to
2. **Resilience** — transient failures (rate limits, network blips, timeouts) are retried automatically with exponential backoff
3. **Silent failure** — a failed request after all retries never crashes the pipeline; it returns a structured error result that downstream code can inspect

The result is that every call to `generate()` returns an `LLMResponse`. Always. The caller never needs to `try/except`.

---

## The `LLMProvider` contract

```python
class LLMProvider(ABC):
    name: str = "base"

    def __init__(
        self,
        model: str,
        api_key: str,
        max_retries: int = 3,
        base_backoff_seconds: float = 1.0,
        timeout_seconds: float = 60.0,
        **generation_kwargs
    ): ...

    @abstractmethod
    async def _call(self, prompt: str, system: str | None = None) -> LLMResponse:
        raise NotImplementedError

    async def generate(self, prompt: str, system: str | None = None) -> LLMResponse:
        ...  # retry + timeout logic — see below
```

Two methods, two responsibilities:

### `_call()` — what you implement

`_call()` is the raw API call. It receives a prompt and an optional system message, calls the provider SDK, maps the SDK response to an `LLMResponse`, and returns it. It is allowed to raise — the `generate()` wrapper catches any exception.

Implement `_call()`. Do not call it directly. Do not put retry logic in it.

### `generate()` — what the engine calls

`generate()` is the public surface. It handles retries, timeouts, and failure packaging. Never override it.

---

## The retry and timeout model

```python
async def generate(self, prompt: str, system: str | None = None) -> LLMResponse:
    last_error: Exception | None = None

    for attempt in range(self.max_retries + 1):        # attempts: 0, 1, 2, ..., max_retries
        start = time.perf_counter()
        try:
            resp = await asyncio.wait_for(
                self._call(prompt, system=system),
                timeout=self.timeout_seconds
            )
            resp.latency_ms = (time.perf_counter() - start) * 1000
            resp.model    = resp.model    or self.model
            resp.provider = resp.provider or self.name
            return resp                                # success — return immediately

        except Exception as e:
            last_error = e
            if attempt < self.max_retries:
                backoff = self.base_backoff_seconds * (2 ** attempt)
                await asyncio.sleep(backoff)
                continue                              # retry

    # all attempts exhausted
    return LLMResponse(
        text="",
        latency_ms=0.0,
        model=self.model,
        provider=self.name,
        error=f"{type(last_error).__name__}: {last_error}",
    )
```

### Attempt count

With `max_retries=3` (the default), `generate()` makes **up to 4 calls** total: the original attempt (index 0) plus 3 retries (indices 1, 2, 3). The loop runs `max_retries + 1` times.

```
attempt=0  → call  → fail → sleep 1.0s
attempt=1  → call  → fail → sleep 2.0s
attempt=2  → call  → fail → sleep 4.0s
attempt=3  → call  → fail → no sleep (last attempt)
→ return LLMResponse(error=...)
```

### Exponential backoff

The sleep between attempts is:

$$\text{backoff} = \text{base\_backoff} \times 2^{\text{attempt}}$$

With defaults (`base_backoff_seconds=1.0`):

| After attempt | Sleep before next |
|---|---|
| 0 | 1.0 s |
| 1 | 2.0 s |
| 2 | 4.0 s |
| 3 | (no sleep — last attempt) |

Exponential backoff is the standard strategy for rate-limited APIs. Doubling the wait between attempts reduces the chance of hammering a provider that is already under load. The base is configurable so callers can tune aggressiveness.

**Note:** there is no jitter. In a concurrent benchmark run with many workers all hitting the same provider at the same time, jitter (adding a small random offset to each sleep) would help avoid a "thundering herd" when all workers retry simultaneously. This is a known gap.

### Timeout

Each individual `_call()` is wrapped in `asyncio.wait_for(coro, timeout=self.timeout_seconds)`. If the call does not complete within `timeout_seconds` (default: 60s), `asyncio.TimeoutError` is raised and caught by the `except Exception` handler — it is treated as any other failure and triggers a retry.

The timeout is per-attempt, not per-`generate()` call. With `max_retries=3` and `timeout_seconds=60`, a single `generate()` call could take up to:

$$60 \times 4 + 1 + 2 + 4 = 247 \text{ seconds}$$

in the absolute worst case (all calls time out, all retries sleep). Keep this in mind when setting timeouts for large parallel benchmark runs.

### Latency measurement

`latency_ms` is measured by `generate()` using `time.perf_counter()`, not by `_call()`. This means it is the end-to-end wall time including SDK overhead but excluding retry wait time (only the successful or final attempt's duration is recorded). If all attempts fail, `latency_ms=0.0` is set on the error response.

### Post-success enrichment

On a successful call, `generate()` fills in `model` and `provider` on the response if the `_call()` implementation left them blank:

```python
resp.model    = resp.model    or self.model      # fall back to config
resp.provider = resp.provider or self.name       # fall back to class name
```

This means `_call()` implementations may optionally set these (e.g., if the API response includes the exact model version used), or leave them blank and let `generate()` fill them from the constructor arguments.

---

## The silent failure contract

When all attempts are exhausted, `generate()` returns — it does not raise:

```python
return LLMResponse(
    text="",
    latency_ms=0.0,
    model=self.model,
    provider=self.name,
    error=f"{type(last_error).__name__}: {last_error}",
)
```

The caller checks `response.ok` (which is `error is None`) to determine success:

```python
response = await provider.generate(prompt)

if not response.ok:
    # handle failure — log it, mark the test case as errored, skip scoring
    ...
```

**Why silent failure?** A benchmark run over hundreds of test cases should not crash because one API call fails. The error is recorded as a structured `LLMResponse` and flows into `TestCaseResult` like any other result. The analysis layer can then report failure rates, retry patterns, and error messages as first-class data.

---

## The provider registry

```python
# providers/registry.py

_REGISTRY: dict[str, Type[LLMProvider]] = {
    "openai":     OpenAIProvider,
    "anthropic":  AnthropicProvider,
    "gemini":     GeminiProvider,
    "mock":       MockProvider,
}

def get_provider(name: str, model: str, **kwargs) -> LLMProvider:
    if name not in _REGISTRY:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(f"Unknown provider '{name}'. Available: {available}")
    return _REGISTRY[name](model=model, **kwargs)

def register_provider(name: str, cls: Type[LLMProvider]) -> None:
    _REGISTRY[name] = cls

def available_providers() -> list[str]:
    return sorted(_REGISTRY)
```

The registry is a plain dict keyed by provider name string. `get_provider()` is the factory — it constructs and returns an `LLMProvider` subclass instance by name, forwarding `model` and any extra kwargs (including `api_key`, `max_retries`, etc.) to the constructor.

### Registering a custom provider

```python
from evalbench.providers.registry import register_provider
from evalbench.providers.base import LLMProvider
from evalbench.schema import LLMResponse

class MyCustomProvider(LLMProvider):
    name = "my_provider"

    async def _call(self, prompt: str, system: str | None = None) -> LLMResponse:
        # call your API here
        result_text = call_my_api(prompt)
        return LLMResponse(text=result_text)

register_provider("my_provider", MyCustomProvider)

# now usable via the registry
provider = get_provider("my_provider", model="my-model-v1", api_key="...")
```

Registration mutates `_REGISTRY` in place. It is not thread-safe. Register all providers at startup, before any concurrent benchmark runs begin.

---

## The four built-in providers

| Provider | `name` | SDK |
|---|---|---|
| `OpenAIProvider` | `"openai"` | `openai` Python SDK |
| `AnthropicProvider` | `"anthropic"` | `anthropic` Python SDK |
| `GeminiProvider` | `"gemini"` | `google-generativeai` SDK |
| `MockProvider` | `"mock"` | No external calls |

`MockProvider` returns a fixed or configurable response without making any network call. It is the standard choice for unit tests and CI runs where real API calls would be slow, costly, or flaky.

---

## Writing a new provider

Subclass `LLMProvider`, set `name`, implement `_call()`:

```python
from evalbench.providers.base import LLMProvider
from evalbench.schema import LLMResponse

class MyProvider(LLMProvider):
    name = "my_provider"

    async def _call(self, prompt: str, system: str | None = None) -> LLMResponse:
        # 1. Build the request
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # 2. Call the SDK — allowed to raise, generate() will catch it
        raw = await my_sdk_client.chat(
            model=self.model,
            messages=messages,
            **self.generation_kwargs,
        )

        # 3. Map to LLMResponse
        return LLMResponse(
            text=raw.choices[0].message.content,
            prompt_tokens=raw.usage.prompt_tokens,
            completion_tokens=raw.usage.completion_tokens,
            total_tokens=raw.usage.total_tokens,
            model=raw.model,          # optional — generate() will fill from config if blank
            provider=self.name,       # optional — generate() will fill from self.name if blank
            raw=raw.model_dump(),     # optional — store full response for debugging
        )
```

**Checklist for new providers:**

- [ ] `name` is a class attribute, unique across providers
- [ ] Only `_call()` is implemented — never override `generate()`
- [ ] `_call()` is allowed to raise; do not catch exceptions inside it
- [ ] The SDK client is constructed using `self.api_key`, `self.model`, and `self.generation_kwargs`
- [ ] `LLMResponse.text` is always set (even if empty string)
- [ ] `raw` is set for debuggability
- [ ] The provider is registered with `register_provider()` before use

---

## Trade-offs

**No jitter in backoff**

The backoff is deterministic: `base * 2^attempt`. In a concurrent run with many coroutines all retrying at the same time (e.g., a rate-limit burst), they all wake up after the same delay and hit the API again simultaneously — the "thundering herd" problem. Adding random jitter (`backoff + random.uniform(0, backoff)`) would spread retries out. This is a known gap, straightforward to add.

**All exceptions trigger retry**

The `except Exception` clause catches everything: rate limits, auth errors, malformed responses, network timeouts, programming errors in `_call()`. An auth error (`401 Unauthorized`) will never succeed on retry, but the provider retries it `max_retries` times anyway before giving up — wasting time. A production-quality retry strategy would distinguish retryable errors (429, 503, timeout) from non-retryable ones (401, 400) and fail fast on the latter.

**`ProviderError` is defined but unused**

`base.py` defines `class ProviderError(Exception): ...` but none of the built-in providers raise it, and `generate()` catches `Exception` rather than `ProviderError`. It exists as a hook for future use — custom providers that want to signal a non-retryable error could raise `ProviderError` and the retry logic could be updated to not retry on it.

**Registry mutation is not thread-safe**

`register_provider()` does a plain dict assignment. If two threads call `register_provider()` simultaneously (unlikely in practice, since registration happens at import time), behavior is undefined. Not a current concern, but worth knowing.

**`timeout_seconds` applies per attempt, not per `generate()` call**

Callers who want a hard deadline across all retries need to wrap `generate()` in their own `asyncio.wait_for()`. There is no built-in total-call-time limit.

---

## Further reading

- [Exponential backoff — Wikipedia](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Python `asyncio.wait_for`](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for)
- [AWS Architecture Blog — Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [001 — The Evaluation Data Model](001-data-model.md) ← `LLMResponse` and `response.ok`
- [002 — How Evaluators Work](002-evaluator-model.md) ← what happens to the `LLMResponse` next
