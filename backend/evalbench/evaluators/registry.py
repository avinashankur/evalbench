from __future__ import annotations

from typing import Type

from evalbench.evaluators.base import Evaluator
from evalbench.evaluators.contains import ContainsEvaluator
from evalbench.evaluators.exact_match import ExactMatchEvaluator
from evalbench.evaluators.json_validity import JSONValidityEvaluator
from evalbench.evaluators.latency import LatencyEvaluator
from evalbench.evaluators.llm_judge import LLMJudgeEvaluator
from evalbench.evaluators.rag import (
    AnswerRelevanceEvaluator,
    ContextPrecisionEvaluator,
    ContextRecallEvaluator,
    FaithfulnessEvaluator,
)
from evalbench.evaluators.token_usage import TokenUsageEvaluator

_REGISTRY: dict[str, Type[Evaluator]] = {
    "exact_match": ExactMatchEvaluator,
    "contains": ContainsEvaluator,
    "json_validity": JSONValidityEvaluator,
    "latency": LatencyEvaluator,
    "token_usage": TokenUsageEvaluator,
    "llm_judge": LLMJudgeEvaluator,
    "faithfulness": FaithfulnessEvaluator,
    "answer_relevance": AnswerRelevanceEvaluator,
    "context_precision": ContextPrecisionEvaluator,
    "context_recall": ContextRecallEvaluator,
}

NEEDS_CUSTOM_CONFIG_BUILD: set[str] = {
    "llm_judge",
    "faithfulness",
    "answer_relevance",
    "context_precision",
    "context_recall",
}


def register_evaluator(name: str, cls: Type[Evaluator]) -> None:
    _REGISTRY[name] = cls


def get_evaluator(name: str, **kwargs) -> Evaluator:
    if name not in _REGISTRY:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(f"Unknown evaluator '{name}'. Available: {available}")
    return _REGISTRY[name](**kwargs)


def available_evaluators() -> list[str]:
    return sorted(_REGISTRY)
