from functools import lru_cache

from fastapi import HTTPException, Request

from evalbench.api.settings import Settings
from evalbench.storage.postgres_store import PostgresResultStore
from evalbench.storage.redis_queue import RedisJobQueue


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_postgres_store(request: Request) -> PostgresResultStore:
    store = getattr(request.app.state, "postgres_store", None)
    if not store:
        raise HTTPException(status_code=503, detail="Database not connected")
    return store


def get_redis_queue(request: Request) -> RedisJobQueue:
    queue = getattr(request.app.state, "redis_queue", None)
    if not queue:
        raise HTTPException(
            status_code=503,
            detail="Redis queue not enabled. Enable it with EVALBENCH_REDIS_ENABLED=true",
        )
    return queue
