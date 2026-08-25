import asyncio
import click

from evalbench.config import load_config
from evalbench.results import JSONLResultStore


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


if __name__ == "__main__":
    cli()
