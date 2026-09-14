# How to Queue and Track Distributed Evaluation Jobs

This guide describes how to submit evaluation jobs to the Redis worker queue and track their progress via the `/api/v1/jobs` REST API.

---

## 1. Overview

Distributed evaluation jobs are processed asynchronously by background worker daemons using Redis for FIFO dispatch and PostgreSQL for results storage.

- **Prerequisites**: Redis must be running and enabled on the API server (`EVALBENCH_REDIS_ENABLED=true`).
- **Workflow**:
  1. Client calls `POST /api/v1/jobs` to push a job to Redis.
  2. Worker daemon (`evalbench worker`) pops and executes the job.
  3. Worker writes completed results to PostgreSQL and marks job status as `completed`.
  4. Client fetches status from `GET /api/v1/jobs/{job_id}` or results from `GET /api/v1/jobs/{job_id}/results`.

---

## 2. Endpoints Reference

| Method | Endpoint | Description | Response Status |
|---|---|---|---|
| `POST` | `/api/v1/jobs` | Enqueue a distributed job | `202 Accepted` |
| `GET` | `/api/v1/jobs/{job_id}` | Get current job status (`queued`, `running`, `completed`, `failed`) | `200 OK` |
| `GET` | `/api/v1/jobs/{job_id}/results` | Fetch completed evaluation summary from PostgreSQL | `200 OK` |

---

## 3. Enqueuing a Distributed Job

### Option A: Inline Configuration Dict
Pass the evaluation configuration directly in the request body:

```http
POST /api/v1/jobs
Content-Type: application/json

{
  "config": {
    "dataset": "datasets/customer-support-v1.jsonl",
    "model": {
      "provider": "mock",
      "name": "mock-model"
    },
    "evaluators": ["exact_match", "contains"]
  }
}
```

### Option B: Server Config File Path
Point to a configuration file located on the server:

```http
POST /api/v1/jobs
Content-Type: application/json

{
  "config_path": "configs/mock-example.yaml"
}
```

**Response (`202 Accepted`):**
```json
{
  "job_id": "f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae",
  "status": "queued",
  "message": "Job enqueued. Track with GET /api/v1/jobs/f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae"
}
```

---

## 4. Polling Job Status

Poll the status of the enqueued job using the returned `job_id`:

```http
GET /api/v1/jobs/f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae
```

**Response while queued / running (`200 OK`):**
```json
{
  "job_id": "f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae",
  "status": "running",
  "run_id": null,
  "error": null,
  "config_path": null
}
```

**Response when completed (`200 OK`):**
```json
{
  "job_id": "f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae",
  "status": "completed",
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "error": null,
  "config_path": null
}
```

---

## 5. Fetching Completed Results

Once the job is completed and has a `run_id`, fetch the full summary from the database:

```http
GET /api/v1/jobs/f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae/results
```

**Response (`200 OK`):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "completed",
  "dataset_name": "customer-support-v1",
  "provider": "mock",
  "model": "mock-model",
  "total": 20,
  "created_at": "2026-08-28T10:00:00Z",
  "metrics": {
    "pass_rates": {
      "exact_match": 0.9,
      "contains": 0.95
    },
    "mean_scores": {
      "exact_match": 0.9,
      "contains": 0.95
    },
    "mean_latency_ms": 110.2,
    "total_cost_usd": 0.0012
  }
}
```

---

## 6. Related Documentation

- [How to Execute Evaluation Runs (In-Process)](how-to-execute-evaluation-runs.md)
- [ADR-004: Redis Queue vs PostgreSQL Result Storage](../adr/004-transient-redis-queue-and-postgres-result-separation.md)
- [System Architecture (C4 Overview)](../../ARCHITECTURE.md)
