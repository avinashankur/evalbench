import json
from typing import Optional
from abc import abstractmethod

from evalbench.evaluators.base import Evaluator, EvalStatus
from evalbench.providers.base import LLMProvider
from evalbench.schema import EvalResult, LLMResponse, TestCase
from evalbench.evaluators._json_utils import extract_json


class _RAGJudgeEvaluator(Evaluator):
    """Shared plumbing for judge based RAG evaluators: call judge, parse JSON, normalize."""

    name = "rag_judge"

    def __init__(
        self,
        judge_provider: LLMProvider,
        pass_threshold: float = 0.5,
        system_prompt: Optional[
            str
        ] = "You are a strict, impartial evaluator. Always respond with valid JSON only."
    ):
        self.judge_provider = judge_provider
        self.pass_threshold = pass_threshold
        self.system_prompt = system_prompt

    @abstractmethod
    def _build_prompt(self, test_case: TestCase, response: LLMResponse) -> Optional[str]:
        raise NotImplementedError

    def _parse_score(self, parsed: dict) -> tuple[float, Optional[str]]:
        score = float(parsed["score"])
        return max(0.0, min(1.0, score)), parsed.get("reason")

    def _missing_input_reason(self) -> str:
        return "required input missing"

    async def evaluate(self, test_case: TestCase, response: LLMResponse) -> EvalResult:
        prompt = self._build_prompt(test_case, response)

        if prompt is None:
            return EvalResult(
                evaluator_name=self.name,
                test_case_id=test_case.id,
                score=0.0,
                status=EvalStatus.ERROR,
                reason=self._missing_input_reason(),
            )

        judge_response = await self.judge_provider.generate(prompt, system=self.system_prompt)

        if not judge_response.ok:
            return EvalResult(
                evaluator_name=self.name,
                test_case_id=test_case.id,
                score=0.0,
                status=EvalStatus.ERROR,
                reason=f"judge provider call failed: {judge_response.error}"
            )

        try:
            parsed = extract_json(judge_response.text)
            if not isinstance(parsed, dict):
                raise TypeError(f"expected JSON object, got {type(parsed).__name__}")
            score, reason = self._parse_score(parsed)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            return EvalResult(
                evaluator_name=self.name,
                test_case_id=test_case.id,
                score=0.0,
                status=EvalStatus.ERROR,
                reason=f"could not parse judge output: {type(e).__name__}: {e}",
                metadata={"raw_judge_output": judge_response.text},
            )

        return EvalResult(
            evaluator_name=self.name,
            test_case_id=test_case.id,
            score=score,
            status=EvalStatus.PASSED if score >= self.pass_threshold else EvalStatus.FAILED,
            reason=reason,
            metadata={
                "judge_model": judge_response.model,
                "judge_provider": judge_response.provider,
                "judge_cost_usd": judge_response.cost_usd,
            },
        )


class FaithfulnessEvaluator(_RAGJudgeEvaluator):
    """Catches hallucination: the answer might be plausible and even correct,
    but if it's not grounded in what was actually retrieved, that's a
    faithfulness failure in a RAG system."""

    name = "faithfulness"

    def _build_prompt(self, test_case: TestCase, response: LLMResponse) -> Optional[str]:
        if not response.retrieved_context:
            return None

        context = "\n\n".join(response.retrieved_context)

        return f"""You are checking whether an AI assistant's answer is faithful to its retrieved source material — i.e. every claim in the answer is actually supported by the context, with no fabricated or unsupported claims.

        Retrieved context:
        {context}

        Question:
        {test_case.question}

        Assistant's answer:
        {response.text}

        Score faithfulness from 0.0 (answer contains claims with no support in the context, i.e. hallucinated) to 1.0 (every claim in the answer is directly supported by the context).

        Respond with ONLY a JSON object, nothing else:
        {{"score": <float 0.0-1.0>, "reason": "<one sentence identifying any unsupported claims, or confirming full support>"}}"""

    def _missing_input_reason(self) -> str:
        return "no retrieved_context on response - faithfulness requires a RAG run (EvalEngine constructed with a retriever)"


class AnswerRelevanceEvaluator(_RAGJudgeEvaluator):
    name = "answer_relevance"

    def _build_prompt(self, test_case: TestCase, response: LLMResponse) -> Optional[str]:
        return f"""You are checking whether an AI assistant's answer is relevant to the question asked — i.e. it actually addresses what was asked, regardless of whether the answer is factually correct.

        Question:
        {test_case.question}

        Assistant's answer:
        {response.text}

        Score relevance from 0.0 (answer does not address the question at all) to 1.0 (answer directly and completely addresses the question).

        Respond with ONLY a JSON object, nothing else:
        {{"score": <float 0.0-1.0>, "reason": "<one sentence>"}}"""


class ContextPrecisionEvaluator(_RAGJudgeEvaluator):
    name = "context_precision"

    def _build_prompt(self, test_case: TestCase, response: LLMResponse) -> Optional[str]:
        if not response.retrieved_context:
            return None

        numbered = "\n\n".join(
            f"[{i}] {doc}" for i, doc in enumerate(response.retrieved_context)
        )

        return f"""You are grading the precision of a document retrieval system. For each numbered document below, decide whether it is relevant to answering the question.

        Question:
        {test_case.question}

        Retrieved documents:
        {numbered}

        Respond with ONLY a JSON object mapping each document's index (as a string) to true (relevant) or false (not relevant), nothing else. Example: {{"0": true, "1": false, "2": true}}"""

    def _parse_score(self, parsed: dict) -> tuple[float, Optional[str]]:
        if not parsed:
            return 0.0, "retriever returned no documents"
        
        values = list(parsed.values())
        relevant_count = sum(1 for v in values if v is True)
        precision = relevant_count / len(values)

        return precision, f"{relevant_count}/{len(values)} retrieved documents judged relevant"

    def _missing_input_reason(self) -> str:
        return "no retrieved_context on response — context_precision requires a RAG run (EvalEngine constructed with a retriever)"

class ContextRecallEvaluator(_RAGJudgeEvaluator):

    name = "context_recall"

    def _build_prompt(self, test_case: TestCase, response: LLMResponse) ->Optional[str]:
        if not response.retrieved_context or not test_case.reference_contexts:
            return None

        retrieved = "\n\n".join(response.retrieved_context)
        reference = "\n\n".join(test_case.reference_contexts)

        return f"""You are grading a document retrieval system's recall: whether the RETRIEVED documents collectively cover the information found in the REFERENCE documents (the known-correct source material for this question).

        Question:
        {test_case.question}

        Reference (ground-truth relevant) documents:
        {reference}

        Retrieved documents:
        {retrieved}

        Score recall from 0.0 (retrieved documents miss all the key information in the reference documents) to 1.0 (retrieved documents fully cover the reference documents' information).

        Respond with ONLY a JSON object, nothing else:
        {{"score": <float 0.0-1.0>, "reason": "<one sentence on what was covered or missed>"}}"""