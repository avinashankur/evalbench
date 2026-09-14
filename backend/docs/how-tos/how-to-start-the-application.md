# How to Start the evalbench Application and Services

> **Audience:** Any developer running evalbench locally  
> **Time required:** 3 minutes  
> **Last verified:** 2026-08-28  

This guide walks you through starting the `evalbench` ecosystem: Docker infrastructure (PostgreSQL, Redis, pgweb Studio), the FastAPI REST server, and the background worker daemon.

---

## Prerequisites

- **Python**: `>= 3.13` with `uv` package manager installed.
- **Docker Desktop**: Installed and running on your machine.
- **Git repository**: Cloned locally.

---

## Steps

### 1. Configure the Environment

Copy the sample environment file to create `.env`:

```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS / Bash:
cp .env.example .env
```

Open `.env` and verify the connection strings:
```ini
EVALBENCH_HOST=0.0.0.0
EVALBENCH_PORT=8000
EVALBENCH_POSTGRES_DSN=postgresql://postgres:postgres@localhost:5432/evalbench
EVALBENCH_REDIS_URL=redis://localhost:6379/0
EVALBENCH_REDIS_ENABLED=true
```

---

### 2. Start the Docker Infrastructure

Start PostgreSQL, Redis, and pgweb Database Studio in the background:

```bash
docker compose up -d
```

**Expected result:**
```text
✔ Container evalbench-postgres Running
✔ Container evalbench-redis    Running
✔ Container evalbench-pgweb    Running
```

---

### 3. Install Dependencies

Sync virtual environment dependencies including optional API extras:

```bash
uv sync --all-extras
```

**Expected result:** Packages installed and environment ready.

---

### 4. Start the FastAPI API Server

Start the API server with auto-reload enabled:

```bash
uv run evalbench serve --reload
```

**Expected result:**
```text
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

---

### 5. Start the Background Worker (For Distributed Jobs)

In a separate terminal tab, start the worker daemon to process queued jobs:

```bash
uv run evalbench worker
```

**Expected result:**
```text
Starting worker → Redis=redis://localhost:6379/0  Postgres=postgresql://postgres:postgres@localhost/evalbench
INFO:evalbench.worker:worker started, polling for jobs
```

---

## Verify It Worked

Open your browser and verify the services are responding:

1. **Interactive API Documentation (Swagger UI)**:
   Navigate to 👉 `http://localhost:8000/docs`
2. **API Health Check**:
   Navigate to 👉 `http://localhost:8000/api/v1/health`
   **Expected JSON output:**
   ```json
   {
     "status": "ok",
     "version": "0.1.0",
     "postgres": "connected",
     "redis": "connected"
   }
   ```
3. **Database Studio (pgweb)**:
   Navigate to 👉 `http://localhost:8081`  
   Confirm you can view the `runs` and `test_case_results` tables.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ConnectionRefusedError: [WinError 1225]` | PostgreSQL container is stopped or port 5432 is unmapped | Run `docker compose up -d --force-recreate` |
| `docker API pipe not found` | Docker Desktop is not started | Launch Docker Desktop and wait for the engine to initialize |
| `"redis": "disabled"` in health check | `EVALBENCH_REDIS_ENABLED` is set to `false` in `.env` | Set `EVALBENCH_REDIS_ENABLED=true` in `.env` and restart server |

---

## Related

- [001-Runbook: Local Dev Services Troubleshooting](../runbooks/001-local-dev-services-troubleshooting.md)
- [How to Execute Evaluation Runs](how-to-execute-evaluation-runs.md)
- [How to Queue Distributed Jobs](how-to-queue-distributed-jobs.md)
