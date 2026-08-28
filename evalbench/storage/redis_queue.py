import json
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Self


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class EvalJob:
    config_path: str = ""
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    config_dict: dict | None = None
    status: JobStatus = JobStatus.QUEUED
    run_id: str | None = None
    error: str | None = None

    def to_json(self) -> str:
        d = asdict(self)
        d["status"] = self.status.value  # because Enum is not JSON serializable
        return json.dumps(d)

    @classmethod
    def from_json(cls, raw: str) -> "EvalJob":
        d = json.loads(raw)
        d["status"] = JobStatus(d["status"])
        return cls(**d)


class RedisJobQueue:
    QUEUE_KEY = "evalbench:jobs:queue"
    STATUS_KEY_PREFIX = "evalbench:jobs:status:"

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self._client = None

    async def connect(self) -> None:
        if self._client is not None:
            return
        try:
            import redis.asyncio as aredis
        except ImportError as e:
            raise ImportError('redis not installed. Run: uv add "evalbench[backend]"') from e

        self._client = aredis.from_url(self.redis_url, decode_responses=True)
        await self._client.ping()

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> Self:
        await self.connect()
        return self

    async def __aexit__(self, *exc) -> None:
        await self.close()

    def _status_key(self, job_id: str) -> str:
        return f"{self.STATUS_KEY_PREFIX}{job_id}"

    async def enqueue(self, job: EvalJob) -> str:
        assert self._client is not None, "call connect() first"
        await self._client.set(self._status_key(job.job_id), job.to_json())
        await self._client.rpush(self.QUEUE_KEY, job.job_id)

        return job.job_id

    async def dequeue(self, timeout: int = 5) -> EvalJob | None:
        assert self._client is not None, "call connect() first"
        result = await self._client.blpop(self.QUEUE_KEY, timeout=timeout)

        if result is None:
            return None
        _, job_id = result

        if isinstance(job_id, bytes):
            job_id = job_id.decode()

        raw = await self._client.get(self._status_key(job_id))
        if raw is None:
            return None

        if isinstance(raw, bytes):
            raw = raw.decode()

        return EvalJob.from_json(raw)

    async def update_status(
        self,
        job_id: str,
        status: JobStatus,
        run_id: str | None = None,
        error: str | None = None,
    ) -> None:
        assert self._client is not None, "call connect() first"
        raw = await self._client.get(self._status_key(job_id))

        if raw is None:
            return

        if isinstance(raw, bytes):
            raw = raw.decode()

        job = EvalJob.from_json(raw)
        job.status = status

        if run_id is not None:
            job.run_id = run_id
        if error is not None:
            job.error = error

        await self._client.set(self._status_key(job_id), job.to_json())

    async def get_status(self, job_id: str) -> EvalJob | None:
        assert self._client is not None, "call connect() first"
        raw = await self._client.get(self._status_key(job_id))

        if isinstance(raw, bytes):
            raw = raw.decode()

        return EvalJob.from_json(raw) if raw else None

    async def queue_depth(self) -> int:
        assert self._client is not None, "call connect() first"
        return await self._client.llen(self.QUEUE_KEY)
