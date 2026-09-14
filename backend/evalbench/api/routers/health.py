from fastapi import APIRouter, Request

from evalbench.api.schemas import HealthResponse
from evalbench.evaluators import registry as evaluator_registry
from evalbench.providers import registry as provider_registry

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    postgres_status = "connected" if getattr(request.app.state, "postgres_store", None) else "disconnected"
    redis_status = "connected" if getattr(request.app.state, "redis_queue", None) else "disabled"
    
    return HealthResponse(
        status="ok",
        version="0.1.0",
        postgres=postgres_status,
        redis=redis_status
    )

@router.get("/providers")
async def list_providers():
    return {"providers": provider_registry.available_providers()}

@router.get("/evaluators")
async def list_evaluators():
    return {"evaluators": evaluator_registry.available_evaluators()}
