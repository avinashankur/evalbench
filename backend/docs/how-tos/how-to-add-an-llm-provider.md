# How to Add a Custom LLM Provider

> **Audience:** Developers adding new model backends (e.g. Ollama, vLLM, Hugging Face, Cohere)  
> **Time required:** 5 minutes  
> **Last verified:** 2026-08-28  

This guide walks you through subclassing `LLMProvider`, implementing the inference call with token/cost tracking, and registering the new provider for use in benchmark configurations and API requests.

---

## Prerequisites

- Familiarity with the [`LLMResponse`](file:///e:/ai/evalbench/evalbench/schema.py) data shape (see [001 — The Evaluation Data Model](../concepts/001-data-model.md) and [003 — LLM Provider Abstraction](../concepts/003-provider-abstraction.md)).
- Target model SDK or HTTP client library installed.

---

## Steps

### 1. Create the Provider Subclass

Subclass `LLMProvider` and implement the `async _call(self, prompt: str, system: str | None = None) -> LLMResponse` method.

> [!NOTE]
> Do not handle retries, timeout tracking, or latency timing inside `_call()`. The base `LLMProvider.generate()` method automatically handles wall-clock latency measurement, exponential backoff, and error encapsulation.

Create `evalbench/providers/ollama_provider.py`:

```python
import httpx
from evalbench.providers.base import LLMProvider
from evalbench.schema import LLMResponse


class OllamaProvider(LLMProvider):
    """Local inference provider using Ollama HTTP API."""

    name: str = "ollama"

    def __init__(
        self,
        model: str,
        base_url: str = "http://localhost:11434",
        **generation_kwargs,
    ):
        super().__init__(model=model, **generation_kwargs)
        self.base_url = base_url

    async def _call(self, prompt: str, system: str | None = None) -> LLMResponse:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system or "",
            "stream": False,
            "options": self.generation_kwargs,
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()

        return LLMResponse(
            text=data.get("response", ""),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
            total_tokens=(data.get("prompt_eval_count", 0) + data.get("eval_count", 0)),
            model=self.model,
            provider=self.name,
            raw=data,
        )
```

---

### 2. Register the Provider in the Registry

Open `evalbench/providers/registry.py`:

1. Import your provider class:
   ```python
   from evalbench.providers.ollama_provider import OllamaProvider
   ```
2. Add it to the `_REGISTRY` dictionary:
   ```python
   _REGISTRY: dict[str, Type[LLMProvider]] = {
       "openai": OpenAIProvider,
       "anthropic": AnthropicProvider,
       "gemini": GeminiProvider,
       "mock": MockProvider,
       "ollama": OllamaProvider,
   }
   ```

---

### 3. Use in Benchmark YAML Configurations

Specify the new provider and model in your benchmark YAML files:

```yaml
dataset: "datasets/customer-support-v1.jsonl"
model:
  provider: "ollama"
  name: "llama3:8b"
  temperature: 0.0

evaluators:
  - exact_match
  - contains
```

---

## Verify It Worked

Run a test generation call using the provider registry:

```bash
uv run python -c "
import asyncio
from evalbench.providers.registry import get_provider

provider = get_provider('mock', model='mock-model')
response = asyncio.run(provider.generate('Hello world!'))

print('Provider:', response.provider)
print('Model:', response.model)
print('Status OK:', response.ok)
print('Latency:', round(response.latency_ms, 2), 'ms')
assert response.ok
print('Provider verification successful!')
"
```

**Expected output:**
```text
Provider: mock
Model: mock-model
Status OK: True
Latency: 0.1 ms
Provider verification successful!
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ValueError: Unknown provider 'ollama'` | Provider class was not added to `_REGISTRY` in `providers/registry.py` | Add the class mapping to `_REGISTRY` |
| `LLMResponse.ok` is `False` with `ReadTimeout` | Model inference exceeded `timeout_seconds` | Pass `timeout_seconds=120.0` when instantiating the provider |
| Missing token usage metrics | The underlying provider response didn't populate token counts | Check the raw response dictionary in `LLMResponse.raw` |

---

## Related

- [003 — LLM Provider Abstraction (Concept)](../concepts/003-provider-abstraction.md)
- [How to Start the Application](how-to-start-the-application.md)
- [How to Execute Evaluation Runs](how-to-execute-evaluation-runs.md)
