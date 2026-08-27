from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from evalbench.api.routers import health
from evalbench.api.settings import Settings

# Assuming these exist or will be created
from evalbench.storage.postgres_store import PostgresResultStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()

    # Initialize Postgres
    postgres_store = PostgresResultStore(settings.postgres_dsn)
    await postgres_store.connect()
    app.state.postgres_store = postgres_store

    # Initialize Redis
    if settings.redis_enabled:
        from evalbench.storage.redis_queue import RedisJobQueue
        redis_queue = RedisJobQueue(settings.redis_url)
        await redis_queue.connect()
        app.state.redis_queue = redis_queue
    else:
        app.state.redis_queue = None

    yield

    # Shutdown
    await postgres_store.close()
    if app.state.redis_queue:
        await app.state.redis_queue.close()


app = FastAPI(
    title="evalbench API",
    version="0.1.0",
    description="REST API for evalbench evaluations",
    lifespan=lifespan,
)

settings = Settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
