import os
from typing import Optional

from eval_bench.providers.base import LLMProvider, ProviderError
from eval_bench.schema import LLMResponse

_PRICING_PER_1M = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4.1": (2.00, 8.00),
}


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, model: str, api_key: Optional[str] = None, **kwargs):
        super().__init__(model, api_key=api_key or os.environ.get("OPENAI_API_KEY"), **kwargs)
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import openai
            except ImportError as e:
                raise ProviderError(
                    "openai package not installed. Run: pip install openai"
                ) from e
            self._client = openai.AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        client = self._get_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            resp = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.generation_kwargs.get("temperature", 0.0),
                max_tokens=self.generation_kwargs.get("max_tokens", 1024),
            )
        except Exception as e:  # noqa: BLE001
            raise ProviderError(str(e)) from e

        text = resp.choices[0].message.content or ""
        prompt_toks = resp.usage.prompt_tokens if resp.usage else None
        completion_toks = resp.usage.completion_tokens if resp.usage else None
        cost = self._estimate_cost(prompt_toks, completion_toks)

        return LLMResponse(
            text=text,
            prompt_tokens=prompt_toks,
            completion_tokens=completion_toks,
            total_tokens=resp.usage.total_tokens if resp.usage else None,
            cost_usd=cost,
            model=self.model,
            provider=self.name,
            raw={"finish_reason": resp.choices[0].finish_reason},
        )

    def _estimate_cost(self, prompt_toks: Optional[int],
                       completion_toks: Optional[int]) -> Optional[float]:
        pricing = _PRICING_PER_1M.get(self.model)
        if not pricing or prompt_toks is None or completion_toks is None:
            return None
        in_price, out_price = pricing
        return (prompt_toks / 1_000_000) * in_price + (completion_toks / 1_000_000) * out_price
