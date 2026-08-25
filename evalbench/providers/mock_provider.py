import asyncio
import random
from typing import Callable, Optional

from evalbench.providers.base import LLMProvider
from evalbench.schema import LLMResponse


class MockProvider(LLMProvider):
    name = "mock"

    def __init__(
        self,
        model: str = "mock-model",
        response_fn: Optional[Callable[[str], str]] = None,
        simulated_latency_s: float = 0.05,
        failure_rate: float = 0.0,
        **kwargs,
    ):
        super().__init__(model, **kwargs)
        self.response_fn = response_fn or (lambda prompt: f"Mock response to: {prompt[:50]}")
        self.simulated_latency_s = simulated_latency_s
        self.failure_rate = failure_rate

    async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        await asyncio.sleep(self.simulated_latency_s)
        if random.random() < self.failure_rate:
            raise RuntimeError("simulated transient failure")
        text = self.response_fn(prompt)
        return LLMResponse(
            text=text,
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(text.split()),
            total_tokens=len(prompt.split()) + len(text.split()),
            cost_usd=0.0,
            model=self.model,
            provider=self.name,
        )
