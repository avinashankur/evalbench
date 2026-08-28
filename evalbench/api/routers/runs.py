import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from evalbench.api.dependencies import get_postgres_store
from evalbench.api.schemas import (
    PaginatedResults,
    RunCreate,
    RunListItem,
    RunListResponse,
    RunStatusResponse,
    RunSummaryResponse,
)
from evalbench.engine import EvalEngine
from evalbench.storage.postgres_store import PostgresResultStore

router = APIRouter()

# In-memory tracking dict for in-flight runs
_active_runs: dict[str, dict] = {}

async def _execute_run(run_id: str, config: RunCreate, store: PostgresResultStore):
    try:
        eval_config = config.to_eval_run_config()
        dataset, provider, evaluators, run_config, retriever = eval_config.build()
        engine = EvalEngine(provider, evaluators, run_config, retriever=retriever)
        summary = await engine.run(dataset)

        await store.asave(
            summary,
            dataset_name=dataset.name,
            provider=eval_config.model.provider,
            model=eval_config.model.name,
        )
        
        _active_runs[run_id] = {"status": "completed", "run_id": summary.run_id}
    except Exception as e:
        _active_runs[run_id] = {"status": "failed", "error": str(e)}

@router.post("/runs", status_code=202, response_model=RunStatusResponse)
async def create_run(
    config: RunCreate,
    background_tasks: BackgroundTasks,
    store: PostgresResultStore = Depends(get_postgres_store),
):
    run_id = str(uuid.uuid4())
    _active_runs[run_id] = {"status": "running"}
    background_tasks.add_task(_execute_run, run_id, config, store)

    return RunStatusResponse(
        run_id=run_id,
        status="running",
        message=f"Evaluation started. Poll GET /api/v1/runs/{run_id} for results.",
    )

@router.get("/runs", response_model=RunListResponse)
async def list_runs(
    dataset_name: str | None = None,
    limit: int = 50,
    store: PostgresResultStore = Depends(get_postgres_store)
):
    runs_data = await store.list_runs(dataset_name=dataset_name, limit=limit)
    items = []
    for r in runs_data:
        items.append(
            RunListItem(
                run_id=str(r["run_id"]),
                dataset_name=r["dataset_name"],
                provider=r["provider"],
                model=r["model"],
                total_test_cases=r["total_test_cases"],
                created_at=r["created_at"],
                metrics=r.get("metrics", {})
            )
        )

    return RunListResponse(runs=items)

@router.get("/runs/{run_id}", response_model=RunSummaryResponse | RunStatusResponse)
async def get_run(run_id: str, store: PostgresResultStore = Depends(get_postgres_store)):
    # Check if run is still in-flight
    if run_id in _active_runs:
        active_status = _active_runs[run_id]
        if active_status["status"] == "running":
            return RunStatusResponse(run_id=run_id, status="running", message="Evaluation in progress.")
        elif active_status["status"] == "failed":
            return RunStatusResponse(run_id=run_id, status="failed", error=active_status.get("error"))

        # If completed, we should use the actual run_id assigned by the engine
        actual_run_id = active_status.get("run_id", run_id)
        run_id = str(actual_run_id)

    # Fetch from Postgres
    try:
        r = await store.aget_run(run_id)
        return RunSummaryResponse(
            run_id=str(r["run_id"]),
            status="completed",
            dataset_name=r["dataset_name"],
            provider=r["provider"],
            model=r["model"],
            total=r["total_test_cases"],
            created_at=r["created_at"],
            metrics=r.get("metrics", {})
        )
    except FileNotFoundError:
        if run_id in _active_runs: # Wait, maybe it's not committed yet
            return RunStatusResponse(run_id=run_id, status="running", message="Evaluation finalizing...")
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

@router.get("/runs/{run_id}/results", response_model=PaginatedResults)
async def get_run_results(
    run_id: str,
    offset: int = 0,
    limit: int = 20,
    store: PostgresResultStore = Depends(get_postgres_store)
):
    try:
        summary = await store.aload(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    paginated_results = summary.results[offset:offset + limit]

    return PaginatedResults(
        run_id=run_id,
        total=summary.total,
        offset=offset,
        limit=limit,
        results=paginated_results
    )

@router.delete("/runs/{run_id}", status_code=204)
async def delete_run(run_id: str, store: PostgresResultStore = Depends(get_postgres_store)):
    deleted = await store.adelete(run_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    # Also clean up from memory if it's there
    _active_runs.pop(run_id, None)
