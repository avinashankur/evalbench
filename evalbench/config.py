import yaml  # noqa: I001
from pathlib import Path
from typing import Optional, Any
from pydantic import BaseModel, Field

from evalbench.schema import Dataset, TestCase
from evalbench.engine import RunConfig
from evalbench.providers.registry import get_provider
from evalbench.providers.base import LLMProvider
from evalbench.evaluators.base import Evaluator
from evalbench.retrieval.base import Retriever
from evalbench.evaluators.registry import get_evaluator, NEEDS_CUSTOM_CONFIG_BUILD

_JUDGE_BASED_EVALUATORS = {
    "llm_judge", "faithfulness", "answer_relevance", "context_precision", "context_recall"
}

class ModelConfig(BaseModel):
    provider: str
    name: str
    temperature: float = 0.0
    max_tokens: int = 1024


class RetrieverConfig(BaseModel):
    type: str = "in_memory"
    documents: list[str] = Field(default_factory=list)
    top_k: int = 5


class EvalRunConfig(BaseModel):
    dataset: str | list[dict]
    model: ModelConfig
    prompt_template: str = "{question}"
    system_prompt: str | None = None
    concurrency: int = 10
    evaluators: list[Any] = Field(default_factory=list)
    retriever: Optional[RetrieverConfig] = None

    def build(
        self
    ) -> tuple[Dataset, LLMProvider, list[Evaluator], RunConfig, Optional[Retriever]]:
        if isinstance(self.dataset, list):
            ds = Dataset(
                name="inline",
                test_cases=[TestCase(**tc) for tc in self.dataset],
            )
        else:
            ds = Dataset.from_jsonl(self.dataset)
        provider = get_provider(
            self.model.provider,
            model=self.model.name,
            temperature=self.model.temperature,
            max_tokens=self.model.max_tokens,
        )

        evaluators = []
        for e in self.evaluators:
            if isinstance(e, str):
                if e in NEEDS_CUSTOM_CONFIG_BUILD:
                    raise ValueError(
                        f"evaluator '{e}' requires a 'judge_model:' block — "
                        f"use the `- name: {e}\\n  judge_model: {{...}}` form, not a bare string"
                    )
                evaluators.append(get_evaluator(e))
            elif isinstance(e, dict):
                e = dict(e)
                ev_name = e.pop("name")
                if ev_name in _JUDGE_BASED_EVALUATORS:
                    evaluators.append(self._build_judge_based(ev_name, e))
                else:
                    evaluators.append(get_evaluator(ev_name, **e))
            else:
                raise TypeError(f"invalid evaluator entry: {e!r}")

        run_config = RunConfig(
            concurrency=self.concurrency,
            prompt_template=self.prompt_template,
            system_prompt=self.system_prompt,
            retrieval_top_k=self.retriever.top_k if self.retriever else 5,
        )

        retriever = self._build_retriever() if self.retriever else None
        return ds, provider, evaluators, run_config, retriever

    def _build_judge_based(self, ev_name: str, kwargs: dict) -> Evaluator:
        kwargs = dict(kwargs)
        judge_model_cfg = kwargs.pop("judge_model", None)

        if judge_model_cfg is None:
            raise ValueError(
                f"'{ev_name}' evaluator requires a 'judge_model:' block with provider + name"
            )
        judge_model = ModelConfig(**judge_model_cfg)
        judge_provider = get_provider(
            judge_model.provider,
            model=judge_model.name,
            temperature=judge_model.temperature,
            max_tokens=judge_model.max_tokens,
        )

        return get_evaluator(ev_name, judge_provider=judge_provider, **kwargs)

    def _build_retriever(self) -> Retriever:
        assert self.retriever is not None
        if self.retriever.type == "in_memory":
            from evalbench.retrieval.in_memory import InMemoryRetriever

            return InMemoryRetriever(documents=self.retriever.documents)
        raise ValueError(
            f"unknown retriever type '{self.retriever.type}'. "
            "Built-in: 'in_memory'. Register a custom Retriever and build it "
            "yourself in Python for anything else (e.g. a real vector DB)."
        )

def load_config(path: str) -> EvalRunConfig:
    p = Path(path)
    raw = yaml.safe_load(p.read_text(encoding="utf-8"))
    return EvalRunConfig(**raw)
