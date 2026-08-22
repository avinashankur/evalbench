from evalbench.evaluators.base import Evaluator
from evalbench.schema import TestCase, LLMResponse, EvalResult


class ExactMatchEvaluator(Evaluator):
    """Passes if response text exactly equals expected_answer (after normalization)."""

    name = "exact_match"

    def __init__(self, case_sensitive: bool = False, strip_whitespace: bool = False):
        self.case_sensitive = case_sensitive
        self.strip_whitespace = strip_whitespace

    def _normalize(self, s: str) -> str:
        if self.strip_whitespace:
            s = s.strip()
        if not self.case_sensitive:
            s = s.lower()

        return s

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        if test_case.expected_answer is None:
            return self._result(
                test_case,
                score=0.0,
                passed=False,
                reason="no expected_answer provided in test case",
            )

        match = self._normalize(response.text) == self._normalize(test_case.expected_answer)

        return self._result(
            test_case,
            score=1.0 if match else 0.0,
            passed=match,
            reason=None if match else "response text did not exactly match expected_answer",
        )
