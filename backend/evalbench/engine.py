import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Callable, Optional

from evalbench.evaluators.base import Evaluator
from evalbench.providers.base import LLMProvider
from evalbench.retrieval.base import Retriever
from evalbench.schema import Dataset, EvalResult, EvalStatus, TestCase, TestCaseResult

ProgressCallback = Callable[[int, int], None]

@dataclass
class RunConfig:
    concurrency: int = 10
    prompt_template: str = "{question}"
    system_prompt: Optional[str] = None
    # RAG-only settings (ignored unless EvalEngine is constructed with a retriever)
    retrieval_top_k: int = 5
    context_separator: str = "\n\n"


@dataclass
class RunSummary:
    run_id: str
    total: int
    results: list[TestCaseResult] = field(default_factory=list)

    def evaluator_pass_rate(self, evaluator_name: str) -> float:
        relevant = [
            r for tcr in self.results
            for r in tcr.eval_results if r.evaluator_name == evaluator_name
        ]

        if not relevant:
            return 0.0

        passed = sum(1 for r in relevant if r.status == EvalStatus.PASSED)
        return passed / len(relevant)

    def mean_score(self, evaluator_name: str) -> float:
        relevant = [
            r.score for tcr in self.results
            for r in tcr.eval_results if r.evaluator_name == evaluator_name
        ]

        return sum(relevant) / len(relevant) if relevant else 0.0

    def mean_latency_ms(self) -> float:
        vals = [tcr.response.latency_ms for tcr in self.results if tcr.response.ok]
        return sum(vals) / len(vals) if vals else 0.0

    def total_cost_usd(self) -> float:
        return sum(tcr.response.cost_usd or 0.0 for tcr in self.results)

    def failures(self, evaluator_name: Optional[str] = None) -> list[TestCaseResult]:
        out = []
        for tcr in self.results:
            relevant = tcr.eval_results if evaluator_name is None else [
                r for r in tcr.eval_results if r.evaluator_name == evaluator_name
            ]
            if any(r.status != EvalStatus.PASSED for r in relevant):
                out.append(tcr)

        return out


def _render_prompt(
    template: str, test_case: TestCase, overrides: Optional[dict] = None
) -> str:
    fields = test_case.model_dump()
    fields.update(test_case.metadata)

    if overrides:
        fields.update(overrides)

    try:
        return template.format(**fields)
    except KeyError as e:
        raise ValueError(
            f"prompt_template references missing field {e}; available fields: {sorted(fields)}"
        ) from e


class EvalEngine:
    def __init__(
        self,
        provider: LLMProvider,
        evaluators: list[Evaluator],
        config: Optional[RunConfig] = None,
        retriever: Optional[Retriever] = None
    ):
        self.provider = provider
        self.evaluators = evaluators
        self.config = config or RunConfig()
        self.retriever = retriever

    async def _run_one(self, test_case: TestCase, run_id: str) -> TestCaseResult:
        retrieved_texts: Optional[list[str]] = None
        prompt_overrides = None

        if self.retriever is not None:
            retrieved_docs = await self.retriever.retrieve(
                test_case.question, top_k=self.config.retrieval_top_k
            )
            retrieved_texts = [d.content for d in retrieved_docs]
            prompt_overrides = {"context": self.config.context_separator.join(retrieved_texts)}

        prompt = _render_prompt(self.config.prompt_template, test_case, overrides=prompt_overrides)
        response = await self.provider.generate(prompt, system=self.config.system_prompt)

        if retrieved_texts is not None:
            response.retrieved_context = retrieved_texts

        eval_results: list[EvalResult] = []

        for evaluator in self.evaluators:
            if not response.ok:
                eval_results.append(
                    EvalResult(
                        evaluator_name=evaluator.name,
                        test_case_id=test_case.id,
                        score=0.0,
                        status=EvalStatus.ERROR,
                        reason=f"skipped: provider error — {response.error}",
                    )
                )
                continue
            try:
                result = await evaluator.evaluate(test_case, response)
            except Exception as e:  # noqa: BLE001 - one bad evaluator must not kill the run
                result = EvalResult(
                    evaluator_name=evaluator.name,
                    test_case_id=test_case.id,
                    score=0.0,
                    status=EvalStatus.ERROR,
                    reason=f"evaluator raised: {type(e).__name__}: {e}",
                )
            eval_results.append(result)

        return TestCaseResult(
            run_id=run_id, test_case=test_case, response=response, eval_results=eval_results
        )

    async def run(self, dataset: Dataset, on_progress: Optional[ProgressCallback] = None) -> RunSummary:
        run_id = str(uuid.uuid4())
        semaphore = asyncio.Semaphore(self.config.concurrency)
        completed = 0
        total = len(dataset)
        lock = asyncio.Lock()

        async def _bounded(tc: TestCase) -> TestCaseResult:
            nonlocal completed
            async with semaphore:
                result = await self._run_one(tc, run_id)
            if on_progress:
                async with lock:
                    completed += 1
                    on_progress(completed, total)
            return result

        results = await asyncio.gather(*(_bounded(tc) for tc in dataset.test_cases))
        return RunSummary(run_id=run_id, total=total, results=list(results))