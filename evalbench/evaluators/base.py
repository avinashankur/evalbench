from abc import ABC, abstractmethod

from evalbench.schema import LLMResponse, TestCase, EvalResult, EvalStatus

class Evaluator(ABC):
    name: str = "base"

    @abstractmethod
    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        raise NotImplementedError

    def _result(
        self,
        test_case: TestCase,
        score: float,
        passed: bool,
        reason: str | None = None,
        **metadata
    ) -> EvalResult:
        return EvalResult(
            evaluator_name=self.name,
            test_case_id=test_case.id,
            score=score,
            status=EvalStatus.PASSED if passed else EvalStatus.FAILED,
            reason=reason,
            metadata=metadata,
        )
