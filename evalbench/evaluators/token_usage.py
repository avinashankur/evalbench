from evalbench.evaluators.base import Evaluator
from evalbench.schema import EvalResult, LLMResponse, TestCase

class TokenUsageEvaluator(Evaluator):
    """Records token usage and cost; optionally flags responses over a token budget."""

    name = "token_usage"

    def __init__(self, max_total_tokens: int | None = None):
        self.max_total_tokens = max_total_tokens

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        total = response.total_tokens or 0
        over = self.max_total_tokens is not None and total > self.max_total_tokens

        return self._result(
            test_case,
            score=0.0 if over else 1.0,
            passed=not over,
            reason=f"used {total} tokens, over budget of {self.max_total_tokens}" if over else None,
            prompt_tokens=response.prompt_tokens,
            completion_tokens=response.completion_tokens,
            total_tokens=total,
            cost_usd=response.cost_usd,
        )
