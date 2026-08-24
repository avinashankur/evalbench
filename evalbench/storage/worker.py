import asyncio
import logging
import signal
from evalbench.engine import EvalEngine
from evalbench.config import load_config
from evalbench.storage.redis_queue import RedisJobQueue
from evalbench.storage.postgres_store import PostgresResultStore
from evalbench.storage.redis_queue import EvalJob, JobStatus

logger = logging.getLogger("evalbench.worker")


class Worker:
    def __init__(
        self, queue: RedisJobQueue, store: PostgresResultStore, poll_timeout: int = 5
    ):
        self.queue = queue
        self.store = store
        self.poll_timeout = poll_timeout
        self._stop = False

    def stop(self) -> None:
        self._stop = True

    async def process_one(self, job: EvalJob) -> None:
        logger.info("processing job %s", job.job_id)
        await self.queue.update_status(job.job_id, JobStatus.RUNNING)

        try:
            if job.config_dict is not None:
                from evalbench.config import EvalRunConfig

                cfg = EvalRunConfig(**job.config_dict)
            else:
                cfg = load_config(job.config_path)

            dataset, provider, evaluators, run_config, retriever = cfg.build()
            engine = EvalEngine(provider, evaluators, run_config, retriever=retriever)
            summary = await engine.run(dataset)

            await self.store.asave(
                summary,
                dataset_name=dataset.name,
                provider=cfg.model.provider,
                model=cfg.model.name,
            )
            await self.queue.update_status(
                job.job_id, JobStatus.COMPLETED, run_id=summary.run_id
            )

            logger.info("job %s completed as run %s", job.job_id, summary.run_id)
        except Exception as e:  # noqa: BLE001 - a bad job must not kill the worker loop
            logger.exception("job %s failed", job.job_id)
            await self.queue.update_status(
                job.job_id, JobStatus.FAILED, error=f"{type(e).__name__}: {e}"
            )

    async def run_forever(self) -> None:
        logger.info("worker started, polling for jobs")
        while not self._stop:
            job = await self.queue.dequeue(timeout=self.poll_timeout)
            if job is not None:
                await self.process_one(job)
        logger.info("worker stopped")


async def _main(redis_url: str, postgres_dsn: str) -> None:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s"
    )

    queue = RedisJobQueue(redis_url)
    store = PostgresResultStore(postgres_dsn)
    await queue.connect()
    await store.connect()
    await store.ensure_schema()

    worker = Worker(queue, store)

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, worker.stop)
        except NotImplementedError:
            pass  # signal handlers unsupported on some platforms (e.g. Windows)

    try:
        await worker.run_forever()
    finally:
        await queue.close()
        await store.close()


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="EvalBench evaluation worker")
    parser.add_argument("--redis-url", default="redis://localhost:6379/0")
    parser.add_argument(
        "--postgres-dsn", default="postgresql://postgres:postgres@localhost/evalbench"
    )
    args = parser.parse_args()
    asyncio.run(_main(args.redis_url, args.postgres_dsn))


if __name__ == "__main__":
    main()
