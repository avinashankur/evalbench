from evalbench.evaluators.base import Evaluator
from evalbench.schema import EvalResult, LLMResponse, TestCase


class LatencyEvaluator(Evaluator):
    """
    Not pass/fail in the usual sense - records latency and optionally flags
    responses that exceeded a threshold. score = 1.0 if under threshold
    (or no threshold set), 0.0 if over.
    """

    name = "latency"

    def __init__(self, max_latency_ms: float | None = None):
        self.max_latency_ms = max_latency_ms

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        over = self.max_latency_ms is not None and response.latency_ms > self.max_latency_ms
        
        return self._result(
            test_case,
            score=0.0 if over else 1.0,
            passed=not over,
            reason=f"latency {response.latency_ms:.0f}ms exceeded {self.max_latency_ms}ms" if over else None,
            latency_ms=response.latency_ms,
        )
