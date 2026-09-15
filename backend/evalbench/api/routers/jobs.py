from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from evalbench.api.auth import AuthenticatedUser, get_current_user
from evalbench.api.dependencies import get_postgres_store, get_redis_queue
from evalbench.api.schemas import JobCreate, JobStatusResponse, RunSummaryResponse
from evalbench.storage.postgres_store import PostgresResultStore
from evalbench.storage.redis_queue import EvalJob, JobStatus, RedisJobQueue

# Usage guide - docs/how-tos/how-to-queue-distributed-jobs.md

router = APIRouter()


@router.post("/jobs", status_code=status.HTTP_202_ACCEPTED, response_model=JobStatusResponse)
async def create_job(
    job_req: JobCreate,
    queue: Annotated[RedisJobQueue, Depends(get_redis_queue)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> JobStatusResponse:
    if not job_req.config and not job_req.config_path:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide either 'config' (object) or 'config_path' (string).",
        )

    if job_req.config_path:
        job = EvalJob(config_path=job_req.config_path, owner_id=current_user.user_id)
    else:
        job = EvalJob(
            config_dict=job_req.config,
            config_path="",
            owner_id=current_user.user_id,
        )

    job_id = await queue.enqueue(job)
    return JobStatusResponse(
        job_id=job_id,
        status="queued",
        config_path=job.config_path or None,
        message=f"Job enqueued. Track with GET /api/v1/jobs/{job_id}",
        owner_id=current_user.user_id,
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    queue: Annotated[RedisJobQueue, Depends(get_redis_queue)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> JobStatusResponse:
    job = await queue.get_status(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found"
        )

    if (
        not current_user.is_admin
        and job.owner_id is not None
        and job.owner_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for job {job_id}",
        )

    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status.value,
        run_id=job.run_id,
        error=job.error,
        config_path=job.config_path or None,
        owner_id=job.owner_id,
    )


@router.get("/jobs/{job_id}/results", response_model=RunSummaryResponse)
async def get_job_results(
    job_id: str,
    queue: Annotated[RedisJobQueue, Depends(get_redis_queue)],
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> RunSummaryResponse:
    job = await queue.get_status(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found"
        )

    if (
        not current_user.is_admin
        and job.owner_id is not None
        and job.owner_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for job {job_id}",
        )

    if job.status != JobStatus.COMPLETED or not job.run_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not completed yet (status: {job.status.value})",
        )

    try:
        r = await store.aget_run(
            job.run_id,
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
            detail=f"Access denied for run {job.run_id}",
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Results for run {job.run_id} not found in database",
        )
