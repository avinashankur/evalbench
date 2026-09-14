import os
from typing import Optional

from evalbench.providers.base import LLMProvider, ProviderError
from evalbench.schema import LLMResponse

_PRICING_PER_1M = {
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-pro": (1.25, 10.00),
}


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, model: str, api_key: Optional[str] = None, **kwargs):
        super().__init__(model, api_key=api_key or os.environ.get("GEMINI_API_KEY"), **kwargs)
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from google import genai
            except ImportError as e:
                raise ProviderError(
                    "google-genai package not installed. Run: uv add google-genai"
                ) from e
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        client = self._get_client()
        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        config = dict(self.generation_kwargs)
        if "temperature" not in config:
            config["temperature"] = 0.0
        if "max_output_tokens" not in config:
            config["max_output_tokens"] = config.pop("max_tokens", 1024)
        else:
            config.pop("max_tokens", None)

        from google.genai import types

        try:
            resp = await client.aio.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config=types.GenerateContentConfig(**config),
            )
        except Exception as e:
            raise ProviderError(str(e)) from e

        text = resp.text or ""
        usage = getattr(resp, "usage_metadata", None)
        prompt_toks = getattr(usage, "prompt_token_count", None) if usage else None
        completion_toks = getattr(usage, "candidates_token_count", None) if usage else None
        cost = self._estimate_cost(prompt_toks, completion_toks)

        return LLMResponse(
            text=text,
            prompt_tokens=prompt_toks,
            completion_tokens=completion_toks,
            total_tokens=(prompt_toks or 0) + (completion_toks or 0) if usage else None,
            cost_usd=cost,
            model=self.model,
            provider=self.name,
        )

    def _estimate_cost(self, prompt_toks: Optional[int],
                       completion_toks: Optional[int]) -> Optional[float]:
        pricing = _PRICING_PER_1M.get(self.model)
        if not pricing or prompt_toks is None or completion_toks is None:
            return None
        in_price, out_price = pricing
        return (prompt_toks / 1_000_000) * in_price + (completion_toks / 1_000_000) * out_price
