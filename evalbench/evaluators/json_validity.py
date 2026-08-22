import json

from evalbench.evaluators.base import Evaluator
from evalbench.schema import LLMResponse, EvalResult, TestCase
from evalbench.evaluators._json_utils import extract_json

class JSONValdityEvaluator(Evaluator):
    """Passes if the response contains valid JSON (optionally unwrapping markdown code fences)."""

    name = "json_evaluator"

    def __init__(self, strip_code_fences: bool = True, require_schema: dict | None = None):
        self.strip_code_fences = strip_code_fences
        self.require_schema = require_schema

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        try:
            if self.strip_code_fences:
                parsed = extract_json(response.text)
            else:
                parsed = json.loads(response.text.strip())
        except json.JSONDecodeError as e:
            return self._result(test_case, score=0.0, passed=False, reason=f"invalid JSON: {e}")

        if self.require_schema:
            missing = [k for k in self.require_schema if not (isinstance(parsed, dict) and k in parsed)]
            if missing:
                return self._result(
                    test_case, score=0.5, passed=False,
                    reason=f"valid JSON but missing required keys: {missing}",
                )

        return self._result(test_case, score=1.0, passed=True)