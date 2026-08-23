import json
from typing import Optional

from evalbench.schema import LLMResponse, TestCase, EvalResult, EvalStatus
from evalbench.evaluators.base import Evaluator
from evalbench.providers.base import LLMProvider
from evalbench.evaluators._json_utils import extract_json

DEFAULT_RUBRIC = """You are an impartial evaluator grading an AI assistant's response.

Question:
{question}

{reference_block}
Assistant's response: {response}

Grade the response on a scale of 1-5, where:
1 = completely incorrect or irrelevant
2 = mostly incorrect, addresses the wrong thing
3 = partially correct but missing important details
4 = correct with minor issues
5 = fully correct and complete

Respond with ONLY a JSON object in this exact format, nothing else:
{{"score": <integer 1-5>, "reason": "<one sentence explanation>"}}"""


class LLMJudgeEvaluator(Evaluator):
    """Scores a response using a second LLM as the judge, per a rubric prompt."""

    name = "llm_judge"

    def __init__(
        self,
        judge_provider: LLMProvider,
        rubric_prompt: str = DEFAULT_RUBRIC,
        pass_threshold: float = 3.0,
        max_score: float = 5.0,
        system_prompt: Optional[
            str
        ] = "You are a strict, impartial evaluator. Always respond with valid JSON only.",
    ):
        self.judge_provider = judge_provider
        self.rubric_prompt = rubric_prompt
        self.pass_threshold = pass_threshold
        self.max_score = max_score
        self.system_prompt = system_prompt

    def _render_prompt(self, test_case: TestCase, response: LLMResponse) -> str:
        reference_block = (
            f"Reference answer:\n{test_case.expected_answer}\n\n"
            if test_case.expected_answer else ""
        )

        return self.rubric_prompt.format(
            question=test_case.question,
            context=test_case.context or "",
            reference_block=reference_block,
            response=response.text,
        )

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        judge_prompt = self._render_prompt(test_case, response)
        judge_response = await self.judge_provider.generate(
            judge_prompt, system=self.system_prompt
        )

        if not judge_response.ok:
            return EvalResult(
                evaluator_name=self.name,
                test_case_id=test_case.id,
                score=0.0,
                status=EvalStatus.ERROR,
                reason=f"judge provider call failed: {judge_response.error}",
            )

        try:
            parsed = extract_json(judge_response.text)
            if not isinstance(parsed, dict):
                raise TypeError("judge output must be a JSON object")
            raw_score = float(parsed["score"])
            reason = parsed.get("reason")
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            return EvalResult(
                evaluator_name=self.name,
                test_case_id=test_case.id,
                score=0.0,
                status=EvalStatus.ERROR,
                reason=f"could not parse judge output: {type(e).__name__}: {e}",
                metadata={"raw_judge_output": judge_response.text},
            )

        normalized = max(0.0, min(1.0, raw_score / self.max_score))
        passed = normalized >= self.pass_threshold

        return EvalResult(
            evaluator_name=self.name,
            test_case_id=test_case.id,
            score=normalized,
            status=EvalStatus.PASSED if passed else EvalStatus.FAILED,
            reason=reason,
            metadata={
                "raw_score": raw_score,
                "max_score": self.max_score,
                "judge_model": judge_response.model,
                "judge_provider": judge_response.provider,
                "judge_cost_usd": judge_response.cost_usd,
                "judge_latency_ms": judge_response.latency_ms,
            },
        )
