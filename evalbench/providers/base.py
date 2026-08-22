import asyncio
import time
from abc import ABC
from evalbench.schema import LLMResponse
from typing import Optional


class ProviderError(Exception):
    """"""


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
    ):

        self.model = model
        self.api_key = api_key
        self.max_retries = max_retries
        self.base_backoff_seconds = base_backoff_seconds
        self.timeout_seconds = timeout_seconds
        self.generation_kwargs = generation_kwargs

    @abstractmethod
    async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        raise NotImplementedError

    async def generate(self, prompt: str, system: Optional[str] = None) -> LLMResponse:

        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            start = time.perf_counter()
            try:
                resp = await asyncio.wait_for(
                    self._call(prompt, system=system), timeout=self.timeout_seconds
                )
                resp.latency_ms = (time.perf_counter() - start) * 1000
                resp.model = resp.model or self.model
                resp.provider = resp.provider or self.name
                return resp
            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    backoff = self.base_backoff_seconds * (2**attempt)
                    await asyncio.sleep(backoff)
                    continue

        return LLMResponse(
            text="",
            latency_ms=0.0,
            model=self.model,
            provider=self.name,
            error=f"{type(last_error).__name__}: {last_error}",
        )
