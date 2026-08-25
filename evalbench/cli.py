import asyncio
import click

from evalbench.config import load_config
from evalbench.results import JSONLResultStore

_DEFAULT_REDIS_URL = "redis://localhost:6379/0"
_DEFAULT_POSTGRES_DSN = "postgresql://postgres:postgres@localhost/evalbench"


def _progress_bar(completed: int, total: int) -> None:
    width = 30
    filled = int(width * completed / total)
    bar = "█" * filled + "░" * (width - filled)
    print(f"\r[{bar}] {completed}/{total}", end="", flush=True)

    if completed == total:
        print()


@click.group()
def cli():
    """EvalBench: provider-agnostic LLM evaluation."""


@cli.command()
@click.argument("config_path")
@click.option("--results-dir", default="results", help="Directory to write results JSONL.")
def run(config_path: str, results_dir: str):
    """Run an evaluation locally (foreground, no Redis/Postgres required)."""
    cfg = load_config(config_path)
    dataset, provider, evaluators, run_config, retriever = cfg.build()

    click.echo(f"Dataset: {dataset.name} ({len(dataset)} test cases)")
    click.echo(f"Model:   {cfg.model.provider}/{cfg.model.name}")

    if retriever is not None:
        click.echo(f"Retriever: {retriever.name} (top_k={run_config.retrieval_top_k})")

    click.echo(f"Evaluators: {', '.join(e.name for e in evaluators)}")
    click.echo("")

    from evalbench.engine import EvalEngine

    engine = EvalEngine(provider, evaluators, run_config, retriever=retriever)
    summary = asyncio.run(engine.run(dataset, on_progress=_progress_bar))

    store = JSONLResultStore(base_dir=results_dir)
    store.save(summary)

    click.echo("")
    click.echo(f"Run ID: {summary.run_id}")

    for evaluator in evaluators:
        rate = summary.evaluator_pass_rate(evaluator.name)
        click.echo(f"  {evaluator.name:<15} pass rate: {rate:.1%}")

    click.echo(f"  {'avg latency':<15} {summary.mean_latency_ms():.0f}ms")
    click.echo(f"  {'total cost':<15} ${summary.total_cost_usd():.4f}")
    click.echo(f"\nSaved to {results_dir}/{summary.run_id}.jsonl")


# Distributed commands (require Redis + Postgres)
@cli.command()
@click.option("--redis-url", default=_DEFAULT_REDIS_URL, help="Redis connection string.")
@click.option("--postgres-dsn", default=_DEFAULT_POSTGRES_DSN, help="PostgreSQL DSN.")
def worker(redis_url: str, postgres_dsn: str):
    """Start a background worker that polls for evaluation jobs."""
    from evalbench.storage.worker import _main

    click.echo(f"Starting worker → Redis={redis_url}  Postgres={postgres_dsn}")
    asyncio.run(_main(redis_url, postgres_dsn))


@cli.command()
@click.argument("config_path")
@click.option("--redis-url", default=_DEFAULT_REDIS_URL, help="Redis connection string.")
def enqueue(config_path: str, redis_url: str):
    """Submit an evaluation job to the background queue."""
    from pathlib import Path

    path = Path(config_path)
    if not path.exists():
        raise click.BadParameter(
            f"config file not found: {config_path}", param_hint="CONFIG_PATH"
        )

    # Validate the config parses before enqueuing. Fail fast on typos
    load_config(config_path)

    from evalbench.storage.redis_queue import RedisJobQueue, EvalJob

    async def _enqueue() -> str:
        async with RedisJobQueue(redis_url) as queue:
            job = EvalJob(config_path=str(path.resolve()))
            return await queue.enqueue(job)

    job_id = asyncio.run(_enqueue())
    click.echo(f"Enqueued job {job_id}")
    click.echo(f"Track with: evalbench status {job_id}")


@cli.command()
@click.argument("job_id")
@click.option("--redis-url", default=_DEFAULT_REDIS_URL, help="Redis connection string.")
@click.option(
    "--postgres-dsn",
    default=_DEFAULT_POSTGRES_DSN,
    help="PostgreSQL DSN (used to fetch results when job is completed)."
)
def status(job_id: str, redis_url: str, postgres_dsn: str):
    """Check the status of a queued evaluation job."""
    from evalbench.storage.redis_queue import RedisJobQueue, JobStatus
    from evalbench.storage.postgres_store import PostgresResultStore

    async def _status():
        async with RedisJobQueue(redis_url) as queue:
            job = await queue.get_status(job_id)

        if job is None:
            click.echo(f"No job found with ID {job_id}")
            raise SystemExit(1)

        click.echo(f"Job:    {job.job_id}")
        click.echo(f"Status: {job.status.value}")
        click.echo(f"Config: {job.config_path}")

        if job.error:
            click.echo(f"Error:  {job.error}")

        if job.status != JobStatus.COMPLETED or job.run_id is None:
            return

        click.echo(f"Run ID: {job.run_id}")

        async with PostgresResultStore(postgres_dsn) as store:
            summary = await store.aload(job.run_id)

        evaluator_names = sorted(
            {r.evaluator_name
             for tcr in summary.results
             for r in tcr.eval_results}
        )

        click.echo("")
        for name in evaluator_names:
            rate = summary.evaluator_pass_rate(name)
            click.echo(f"  {name:<15} pass rate: {rate:.1%}")

        click.echo(f"  {'avg latency':<15} {summary.mean_latency_ms():.0f}ms")
        click.echo(f"  {'total cost':<15} ${summary.total_cost_usd():.4f}")

    asyncio.run(_status())


if __name__ == "__main__":
    cli()
