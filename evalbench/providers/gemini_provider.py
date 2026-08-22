from evalbench.providers.base import LLMProvider
from eval_bench.schema import LLMResponse

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

        try:
            resp = await client.aio.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config={
                    "temperature": self.generation_kwargs.get("temperature", 0.0),
                    "max_output_tokens": self.generation_kwargs.get("max_tokens", 1024),
                },
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
