from evalbench.evaluators.base import Evaluator
from evalbench.schema import EvalResult, LLMResponse, TestCase


class ContainsEvaluator(Evaluator):
    """Passes if expected_answer appears as a substring of the response (case insensitive)"""

    name = "contains"

    def __init__(self, case_sensitive: bool = False):
        self.case_sensitive = case_sensitive

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        if test_case.expected_answer is None:
            return self._result(
                test_case,
                score=0.0,
                passed=False,
                reason="no expected_answer provided in test case",
            )

        haystack, needle = response.text, test_case.expected_answer

        if not self.case_sensitive:
            haystack, needle = haystack.lower(), needle.lower()

        found = needle in haystack

        return self._result(
            test_case,
            score=1.0 if found else 0.0,
            passed=found,
            reason=None if found else "expected_answer substring not found in response",
        )
