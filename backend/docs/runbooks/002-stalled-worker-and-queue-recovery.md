# 002-Runbook: Diagnosing Stalled Workers and Redis Queue Recovery

**Service:** Background Worker (`evalbench worker`), Redis Job Queue, `/api/v1/jobs`  
**Severity:** P2 (Jobs Not Processing) / P3 (Local Dev Stalled)  
**Owner:** evalbench engineering team  
**Last reviewed:** 2026-08-28  
**Estimated resolution time:** 5–10 minutes  

---

## Trigger

This runbook applies when:

- Jobs submitted via `POST /api/v1/jobs` remain in `"status": "queued"` and never transition to `"running"` or `"completed"`
- OR: A job is permanently stuck in `"status": "running"` because a worker process crashed midway
- OR: `evalbench worker` crashes with an unhandled exception
- OR: Redis queue backlog (`queue_depth`) continues to grow while workers are running

---

## Impact Assessment

Before acting, verify:

- [ ] Are any worker daemons currently running and polling?
- [ ] Is Redis connectivity healthy?
- [ ] Are jobs failing due to a single bad dataset/config (poison pill) or is the entire worker fleet down?

---

## 🛠 Local Development

> **Start here.** Follow these diagnostic and recovery steps for local worker debugging.

### Quick Checklist

- [ ] Is the worker daemon process running in a terminal? (`uv run evalbench worker`)
- [ ] Is Redis running and reachable? (`docker compose ps`)
- [ ] Are the required LLM API keys exported in your shell (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)?

---

### Diagnosis & Triage

#### 1. Check Queue Backlog Depth

Inspect how many jobs are waiting in the Redis queue:

```bash
docker exec -it evalbench-redis redis-cli LLEN evalbench:jobs:queue
```

**Expected output:**
- `0`: Queue is empty (no pending jobs).
- `> 0`: Jobs are queued but waiting for an available worker daemon.

---

#### 2. Inspect the Stalled Job's Status & Error

Query the specific job ID to inspect its current recorded state:

```bash
# Via cURL:
curl -s http://localhost:8000/api/v1/jobs/<job_id>
```

Or query the raw JSON status directly from Redis:
```bash
docker exec -it evalbench-redis redis-cli GET evalbench:jobs:status:<job_id>
```

**Common error causes:**
- `"error": "KeyError: 'OPENAI_API_KEY'"` → Worker was started in an environment missing the necessary provider API key.
- `"error": "FileNotFoundError: 'datasets/missing.jsonl'"` → Worker could not resolve the relative dataset path from its working directory.
- `"error": "ConnectionRefusedError"` → Worker could not reach PostgreSQL to persist the completed `RunSummary`.

---

#### 3. Verify Worker Process State

If no terminal is running `evalbench worker`, jobs will sit in the queue indefinitely.

Start or restart a worker process in verbose mode:

```bash
uv run evalbench worker
```

**Expected terminal output on startup:**
```text
Starting worker → Redis=redis://localhost:6379/0  Postgres=postgresql://postgres:postgres@localhost/evalbench
INFO:evalbench.worker:worker started, polling for jobs
```

When a job is picked up:
```text
INFO:evalbench.worker:processing job f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae
INFO:evalbench.worker:job f3dcbb77-e382-4f7e-a18e-f8b76e4e0bae completed as run 3b882732-357c-46bb-9d18-0cd92f1eaf56
```

---

### Resolution Steps

#### Scenario A: Worker Daemon Was Not Started

If jobs are accumulating in the queue because no worker daemon is active:

1. Open a dedicated terminal tab.
2. Ensure your `.env` is loaded or API keys are set.
3. Start the worker:
   ```bash
   uv run evalbench worker
   ```
4. The worker will automatically pop all pending jobs from `evalbench:jobs:queue` in FIFO order.

---

#### Scenario B: Poison-Pill Job Crashing Worker Execution

If a job contains malformed test cases, missing providers, or invalid parameters:

1. Identify the failing `job_id` from the worker logs.
2. Inspect the error using `GET /api/v1/jobs/{job_id}`.
3. Note: The `Worker.process_one()` handler catches general exceptions and marks the job as `JobStatus.FAILED` without terminating the polling loop.
4. If a severe segfault or crash occurred, restart the worker process:
   ```bash
   uv run evalbench worker
   ```

---

#### Scenario C: Purging / Draining the Queue (Clean Reset)

If you have test jobs in the queue that you want to discard:

```bash
# Delete the entire pending job queue in Redis:
docker exec -it evalbench-redis redis-cli DEL evalbench:jobs:queue
```

> [!NOTE]
> This only removes waiting jobs from the queue. It does not delete historical run data already committed to PostgreSQL.

---

### Verification (Local)

The issue is resolved when:

1. Starting the worker shows active polling logs: `worker started, polling for jobs`.
2. Submitting a test job via `POST /api/v1/jobs` is processed immediately.
3. Checking `GET /api/v1/jobs/{job_id}` transitions from `queued` → `running` → `completed`.
4. Queue depth returns to `0`:
   ```bash
   docker exec -it evalbench-redis redis-cli LLEN evalbench:jobs:queue
   ```

---

## 🚀 Production / Multi-Worker Fleet

### Diagnosis & Scaling

```bash
# Check queue depth across the cluster
redis-cli -u $REDIS_URL LLEN evalbench:jobs:queue

# Check active worker instances (Kubernetes example)
kubectl get pods -l app=evalbench-worker -n production
```

### Resolution Steps

1. **Horizontal Scaling**: If queue depth is consistently increasing, scale up the worker replica count:
   ```bash
   kubectl scale deployment/evalbench-worker --replicas=5 -n production
   ```
2. **Provider Rate Limits**: If workers are slow due to LLM provider 429 rate limit throttling, decrease `concurrency` in individual `EvalRunConfig` payloads or add rate-limiting delays in provider clients.
3. **Database Connection Limits**: When scaling worker replicas, ensure PostgreSQL `max_connections` can accommodate `workers_count * pool_size`.

---

## Related Documents

- [001-Runbook: Local Services Troubleshooting](001-local-dev-services-troubleshooting.md)
- [How to Queue Distributed Jobs](../how-tos/how-to-queue-distributed-jobs.md)
- [ADR-004: Redis Queue vs PostgreSQL Result Storage](../adr/004-transient-redis-queue-and-postgres-result-separation.md)
