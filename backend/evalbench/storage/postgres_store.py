import asyncio
import json
from pathlib import Path
from typing import Any, Self

from evalbench.engine import RunSummary
from evalbench.results import ResultStore
from evalbench.schema import TestCaseResult

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


class PostgresResultStore(ResultStore):
    dsn: str
    min_pool_size: int
    max_pool_size: int
    _pool: Any | None

    def __init__(self, dsn: str, min_pool_size: int = 1, max_pool_size: int = 10) -> None:
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

    async def __aenter__(self) -> Self:
        await self.connect()
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.close()

    async def ensure_schema(self) -> None:
        assert self._pool is not None, "call connect() first"
        sql = _SCHEMA_PATH.read_text(encoding="utf-8")
        async with self._pool.acquire() as conn:
            await conn.execute(sql)

    def _compute_metrics(self, summary: RunSummary) -> dict[str, Any]:
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
        model: str = "",
        owner_id: str | None = None,
    ) -> None:
        assert self._pool is not None, "call connect() first"
        if not dataset_name and summary.results:
            dataset_name = summary.results[0].test_case.metadata.get("_dataset_name", "")
        if not provider and summary.results:
            provider = summary.results[0].response.provider
        if not model and summary.results:
            model = summary.results[0].response.model

        metrics = self._compute_metrics(summary)

        async with self._pool.acquire() as conn, conn.transaction():
            await conn.execute(
                """
                INSERT INTO runs (run_id, dataset_name, provider, model, total_test_cases, metrics, owner_id)
                VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7)
                ON CONFLICT (run_id) DO UPDATE SET
                    metrics = EXCLUDED.metrics,
                    owner_id = COALESCE(EXCLUDED.owner_id, runs.owner_id)
                """,
                summary.run_id,
                dataset_name,
                provider,
                model,
                summary.total,
                json.dumps(metrics),
                owner_id,
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

    def save(
        self,
        summary: RunSummary,
        dataset_name: str = "",
        provider: str = "",
        model: str = "",
        owner_id: str | None = None,
    ) -> None:
        asyncio.run(
            self.asave(
                summary,
                dataset_name=dataset_name,
                provider=provider,
                model=model,
                owner_id=owner_id,
            )
        )

    async def aload(
        self,
        run_id: str,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> RunSummary:
        assert self._pool is not None, "call connect() first"
        # Verify access through aget_run first
        await self.aget_run(run_id, owner_id=owner_id, is_admin=is_admin)

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT payload FROM test_case_results WHERE run_id = $1::uuid ORDER BY id",
                run_id,
            )

        if not rows:
            raise FileNotFoundError(f"no results found for run_id={run_id}")

        results = [TestCaseResult.model_validate_json(r["payload"]) for r in rows]

        return RunSummary(run_id=run_id, total=len(results), results=results)

    def load(
        self,
        run_id: str,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> RunSummary:
        return asyncio.run(self.aload(run_id, owner_id=owner_id, is_admin=is_admin))

    async def aget_run(
        self,
        run_id: str,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> dict[str, Any]:
        assert self._pool is not None, "call connect() first"
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT run_id, dataset_name, provider, model, total_test_cases, created_at, metrics, owner_id
                FROM runs WHERE run_id = $1::uuid
                """,
                run_id,
            )
        if not row:
            raise FileNotFoundError(f"no run found for run_id={run_id}")

        if not is_admin and owner_id is not None:
            run_owner = row["owner_id"]
            if run_owner is not None and run_owner != owner_id:
                raise PermissionError(f"Access denied for run_id={run_id}")

        d = dict(row)
        if isinstance(d.get("metrics"), str):
            d["metrics"] = json.loads(d["metrics"])
        return d

    async def list_runs(
        self,
        dataset_name: str | None = None,
        limit: int = 50,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> list[dict[str, Any]]:
        assert self._pool is not None, "call connect() first"
        conditions: list[str] = []
        params: list[Any] = []

        if dataset_name:
            params.append(dataset_name)
            conditions.append(f"dataset_name = ${len(params)}")

        if not is_admin and owner_id is not None:
            params.append(owner_id)
            conditions.append(f"(owner_id = ${len(params)} OR owner_id IS NULL)")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)
        limit_clause = f"LIMIT ${len(params)}"

        query = f"""
            SELECT run_id, dataset_name, provider, model, total_test_cases, created_at, metrics, owner_id
            FROM runs
            {where_clause}
            ORDER BY created_at DESC
            {limit_clause}
        """

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(query, *params)

        out: list[dict[str, Any]] = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get("metrics"), str):
                d["metrics"] = json.loads(d["metrics"])
            out.append(d)

        return out

    async def adelete(
        self,
        run_id: str,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> bool:
        """Delete a run and all its test case results. Returns True if the run existed."""
        assert self._pool is not None, "call connect() first"
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT owner_id FROM runs WHERE run_id = $1::uuid", run_id
            )
            if not row:
                return False

            if not is_admin and owner_id is not None:
                run_owner = row["owner_id"]
                if run_owner is not None and run_owner != owner_id:
                    raise PermissionError(f"Access denied for deleting run_id={run_id}")

            result = await conn.execute(
                "DELETE FROM runs WHERE run_id = $1::uuid", run_id
            )
            # CASCADE will handle test_case_results
            return result == "DELETE 1"

