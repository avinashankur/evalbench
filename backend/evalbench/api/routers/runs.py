import uuid
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from evalbench.api.auth import AuthenticatedUser, get_current_user
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
_active_runs: dict[str, dict[str, Any]] = {}


async def _execute_run(
    run_id: str,
    config: RunCreate,
    store: PostgresResultStore,
    owner_id: str | None = None,
) -> None:
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
            owner_id=owner_id,
        )

        _active_runs[run_id] = {
            "status": "completed",
            "run_id": summary.run_id,
            "owner_id": owner_id,
        }
    except Exception as e:  # noqa: BLE001
        _active_runs[run_id] = {
            "status": "failed",
            "error": str(e),
            "owner_id": owner_id,
        }


@router.post("/runs", status_code=status.HTTP_202_ACCEPTED, response_model=RunStatusResponse)
async def create_run(
    config: RunCreate,
    background_tasks: BackgroundTasks,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> RunStatusResponse:
    run_id = str(uuid.uuid4())
    _active_runs[run_id] = {"status": "running", "owner_id": current_user.user_id}
    background_tasks.add_task(
        _execute_run, run_id, config, store, owner_id=current_user.user_id
    )

    return RunStatusResponse(
        run_id=run_id,
        status="running",
        message=f"Evaluation started. Poll GET /api/v1/runs/{run_id} for results.",
    )


@router.get("/runs", response_model=RunListResponse)
async def list_runs(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    dataset_name: str | None = None,
    limit: int = 50,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)] = None,
) -> RunListResponse:
    runs_data = await store.list_runs(
        dataset_name=dataset_name,
        limit=limit,
        owner_id=current_user.user_id,
        is_admin=current_user.is_admin,
    )
    items = [
        RunListItem(
            run_id=str(r["run_id"]),
            dataset_name=r["dataset_name"],
            provider=r["provider"],
            model=r["model"],
            total_test_cases=r["total_test_cases"],
            created_at=r["created_at"],
            metrics=r.get("metrics", {}),
            owner_id=r.get("owner_id"),
        )
        for r in runs_data
    ]

    return RunListResponse(runs=items)


@router.get("/runs/{run_id}", response_model=RunSummaryResponse | RunStatusResponse)
async def get_run(
    run_id: str,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> RunSummaryResponse | RunStatusResponse:
    # Check if run is still in-flight
    if run_id in _active_runs:
        active_status = _active_runs[run_id]
        active_owner = active_status.get("owner_id")
        if (
            not current_user.is_admin
            and active_owner is not None
            and active_owner != current_user.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for run {run_id}",
            )

        if active_status["status"] == "running":
            return RunStatusResponse(
                run_id=run_id, status="running", message="Evaluation in progress."
            )
        elif active_status["status"] == "failed":
            return RunStatusResponse(
                run_id=run_id, status="failed", error=active_status.get("error")
            )

        # If completed, we should use the actual run_id assigned by the engine
        actual_run_id = active_status.get("run_id", run_id)
        run_id = str(actual_run_id)

    # Fetch from Postgres
    try:
        r = await store.aget_run(
            run_id,
            owner_id=current_user.user_id,
            is_admin=current_user.is_admin,
        )
        return RunSummaryResponse(
            run_id=str(r["run_id"]),
            status="completed",
            dataset_name=r["dataset_name"],
            provider=r["provider"],
            model=r["model"],
            total=r["total_test_cases"],
            created_at=r["created_at"],
            metrics=r.get("metrics", {}),
            owner_id=r.get("owner_id"),
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for run {run_id}",
        )
    except FileNotFoundError:
        if run_id in _active_runs:
            return RunStatusResponse(
                run_id=run_id, status="running", message="Evaluation finalizing..."
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )


@router.get("/runs/{run_id}/results", response_model=PaginatedResults)
async def get_run_results(
    run_id: str,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResults:
    try:
        summary = await store.aload(
            run_id,
            owner_id=current_user.user_id,
            is_admin=current_user.is_admin,
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for run {run_id}",
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    paginated_results = summary.results[offset : offset + limit]

    return PaginatedResults(
        run_id=run_id,
        total=summary.total,
        offset=offset,
        limit=limit,
        results=paginated_results,
    )


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_run(
    run_id: str,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> None:
    if run_id in _active_runs:
        active_owner = _active_runs[run_id].get("owner_id")
        if (
            not current_user.is_admin
            and active_owner is not None
            and active_owner != current_user.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for deleting run {run_id}",
            )

    try:
        deleted = await store.adelete(
            run_id,
            owner_id=current_user.user_id,
            is_admin=current_user.is_admin,
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for deleting run {run_id}",
        )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    _active_runs.pop(run_id, None)
