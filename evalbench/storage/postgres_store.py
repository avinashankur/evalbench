import json
import asyncio
from typing import Optional
from pathlib import Path
from evalbench.results import ResultStore
from evalbench.engine import RunSummary
from evalbench.schema import TestCaseResult

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


class PostgresResultStore(ResultStore):
    def __init__(self, dsn: str, min_pool_size: int = 1, max_pool_size: int = 10):
        self.dsn = dsn
        self.min_pool_size = min_pool_size
        self.max_pool_size = max_pool_size
        self._pool = None

    async def connect(self) -> None:
        if self._pool is not None:
            return

        try:
            import asyncpg
        except ImportError as e:
            raise ImportError(
                'asyncpg not installed. Run: uv add "evalbench[backend]"'
            ) from e

        self._pool = await asyncpg.create_pool(
            self.dsn, min_size=self.min_pool_size, max_size=self.max_pool_size
        )

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    async def __aenter__(self) -> "PostgresResultStore":
        await self.connect()
        return self

    async def __aexit__(self, *exc) -> None:
        await self.close()

    async def ensure_schema(self) -> None:
        assert self._pool is not None, "call connect() first"
        sql = _SCHEMA_PATH.read_text(encoding="utf-8")
        async with self._pool.acquire() as conn:
            await conn.execute(sql)

    def _compute_metrics(self, summary: RunSummary) -> dict:
        evaluator_names = {
            r.evaluator_name
            for tcr in summary.results
            for r in tcr.eval_results
        }

        return {
            "pass_rates": {
                name: summary.evaluator_pass_rate(name)
                for name in evaluator_names
            },
            "mean_scores": {
                name: summary.mean_score(name)
                for name in evaluator_names
            },
            "mean_latency_ms": summary.mean_latency_ms(),
            "total_cost_usd": summary.total_cost_usd(),
        }

    async def asave(
        self,
        summary: RunSummary,
        dataset_name: str = "",
        provider: str = "",
        model: str = ""
    ) -> None:
        assert self._pool is not None, "call connect() first"
        if not dataset_name and summary.results:
            dataset_name = summary.results[0].test_case.metadata.get("_dataset_name", "")
        if not provider and summary.results:
            provider = summary.results[0].response.provider
        if not model and summary.results:
            model = summary.results[0].response.model

        metrics = self._compute_metrics(summary)

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """
                    INSERT INTO runs (run_id, dataset_name, provider, model, total_test_cases, metrics)
                    VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)
                    ON CONFLICT (run_id) DO UPDATE SET metrics = EXCLUDED.metrics
                    """,
                    summary.run_id,
                    dataset_name,
                    provider,
                    model,
                    summary.total,
                    json.dumps(metrics),
                )
                rows = [
                    (summary.run_id, tcr.test_case.id, tcr.model_dump_json())
                    for tcr in summary.results
                ]
                await conn.executemany(
                    """
                    INSERT INTO test_case_results (run_id, test_case_id, payload)
                    VALUES ($1::uuid, $2, $3::jsonb)
                    """,
                    rows,
                )

    def save(self, summary: RunSummary) -> None:
        asyncio.run(self.asave(summary))

    async def aload(self, run_id: str) -> RunSummary:
        assert self._pool is not None, "call connect() first"
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT payload FROM test_case_results WHERE run_id = $1::uuid ORDER BY id",
                run_id,
            )

        if not rows:
            raise FileNotFoundError(f"no results found for run_id={run_id}")

        results = [TestCaseResult.model_validate_json(r["payload"]) for r in rows]

        return RunSummary(run_id=run_id, total=len(results), results=results)

    def load(self, run_id: str) -> RunSummary:
        return asyncio.run(self.aload(run_id))

    async def list_runs(self,
                        dataset_name: Optional[str] = None,
                        limit: int = 50) -> list[dict]:
        assert self._pool is not None, "call connect() first"
        async with self._pool.acquire() as conn:
            if dataset_name:
                rows = await conn.fetch(
                    """SELECT run_id, dataset_name, provider, model, total_test_cases, created_at, metrics
                       FROM runs WHERE dataset_name = $1 ORDER BY created_at DESC LIMIT $2""",
                    dataset_name,
                    limit,
                )
            else:
                rows = await conn.fetch(
                    """SELECT run_id, dataset_name, provider, model, total_test_cases, created_at, metrics
                       FROM runs ORDER BY created_at DESC LIMIT $1""",
                    limit,
                )

        out = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get("metrics"), str):
                d["metrics"] = json.loads(d["metrics"])
            out.append(d)

        return out
