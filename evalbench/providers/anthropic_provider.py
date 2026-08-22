from eval_bench.providers.base import LLMProvider, ProviderError
from eval_bench.schema import LLMResponse

_PRICING_PER_1M = {
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-opus-4-8": (15.00, 75.00),
    "claude-haiku-4-5-20251001": (0.80, 4.00),
}


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, model: str, api_key: Optional[str] = None, **kwargs):
        super().__init__(
            model, api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"), **kwargs
        )
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import anthropic
            except ImportError as e:
                raise ProviderError(
                    "anthropic package not installed. Run: pip install anthropic"
                ) from e
            self._client = anthropic.AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        client = self._get_client()
        try:
            resp = await client.messages.create(
                model=self.model,
                max_tokens=self.generation_kwargs.get("max_tokens", 1024),
                temperature=self.generation_kwargs.get("temperature", 0.0),
                system=system or self.generation_kwargs.get("system", ""),
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
            )
        except Exception as e:  # noqa: BLE001
            raise ProviderError(str(e)) from e

        text = "".join(
            block.text for block in resp.content if getattr(block, "type", "") == "text"
        )
        prompt_toks = resp.usage.input_tokens
        completion_toks = resp.usage.output_tokens
        cost = self._estimate_cost(prompt_toks, completion_toks)

        return LLMResponse(
            text=text,
            prompt_tokens=prompt_toks,
            completion_tokens=completion_toks,
            total_tokens=prompt_toks + completion_toks,
            cost_usd=cost,
            model=self.model,
            provider=self.name,
            raw={"stop_reason": resp.stop_reason},
        )

    def _estimate_cost(self, prompt_toks: int, completion_toks: int) -> Optional[float]:
        pricing = _PRICING_PER_1M.get(self.model)
        if not pricing:
            return None
        in_price, out_price = pricing
        return (prompt_toks / 1_000_000) * in_price + (completion_toks / 1_000_000) * out_price
