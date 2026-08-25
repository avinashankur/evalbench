import os
from typing import Optional

from evalbench.providers.base import LLMProvider, ProviderError
from evalbench.schema import LLMResponse

_PRICING_PER_1M = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4-turbo": (10.00, 30.00),
    "o1-preview": (15.00, 60.00),
    "o1-mini": (3.00, 12.00),
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
        
        is_o1 = self.model.startswith("o1-")
        
        if system:
            if is_o1:
                # o1 models do not support the system role, append as user
                messages.append({"role": "user", "content": f"System Instruction:\n{system}"})
            else:
                messages.append({"role": "system", "content": system})
                
        messages.append({"role": "user", "content": prompt})

        kwargs = dict(self.generation_kwargs)
        
        if is_o1:
            # o1 models use max_completion_tokens and do not support temperature
            if "max_tokens" in kwargs:
                kwargs["max_completion_tokens"] = kwargs.pop("max_tokens")
            elif "max_completion_tokens" not in kwargs:
                kwargs["max_completion_tokens"] = 1024
            kwargs.pop("temperature", None)
        else:
            if "max_tokens" not in kwargs:
                kwargs["max_tokens"] = 1024
            if "temperature" not in kwargs:
                kwargs["temperature"] = 0.0

        try:
            resp = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                **kwargs,
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
