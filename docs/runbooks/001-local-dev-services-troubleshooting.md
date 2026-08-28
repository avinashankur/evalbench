# 001-Runbook: Troubleshooting Local PostgreSQL, Redis, and Database Studio Services

**Service:** PostgreSQL (`evalbench-postgres`), Redis (`evalbench-redis`), pgweb (`evalbench-pgweb`), API Server  
**Severity:** P3 (Local Development) / P2 (Infrastructure Outage)  
**Owner:** evalbench engineering team  
**Last reviewed:** 2026-08-28  
**Estimated resolution time:** 5 minutes  

---

## Trigger

This runbook applies when:

- Running `uv run evalbench serve` fails with:
  `ConnectionRefusedError: [WinError 1225] The remote computer refused the network connection`
- OR: `GET /api/v1/health` reports `"postgres": "disconnected"` or `"redis": "disconnected"`
- OR: Docker CLI fails with `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`
- OR: Database Studio (`http://localhost:8081`) cannot connect to PostgreSQL

---

## Impact Assessment

Before acting, verify:

- [ ] Is this impacting local development or a deployed test environment?
- [ ] Are containers stopped, or are they running without published port mappings?
- [ ] Is database data in danger of loss? *(Do not wipe volumes if preserving test run history is needed).*

---

## 🛠 Local Development

> **Start here.** This section covers all standard local developer setups using Docker Desktop and `.env`.

### Quick Checklist

- [ ] Is Docker Desktop running?
- [ ] Are the containers running with host ports mapped? (`docker compose ps`)
- [ ] Is `.env` present in the project root with valid credentials?

---

### Diagnosis & Triage

Run these diagnostic checks in sequence:

#### 1. Check Container Health & Port Mappings

```bash
docker compose ps
```

**Expected output:**
```text
NAME                 IMAGE                   STATUS                   PORTS
evalbench-postgres   postgres:16-alpine      Up (healthy)             0.0.0.0:5432->5432/tcp
evalbench-redis      redis:7-alpine          Up (healthy)             0.0.0.0:6379->6379/tcp
evalbench-pgweb      sosedoff/pgweb:latest   Up                       0.0.0.0:8081->8081/tcp
```

**Anomalies to watch for:**
- **Container status is `Exit` or not running**: Container crashed on startup.
- **Port mapping missing (e.g. shows `5432/tcp` instead of `0.0.0.0:5432->5432/tcp`)**: Docker started an older container without port forwarding.

---

#### 2. Check Service Logs

```bash
# Check PostgreSQL logs
docker compose logs --tail=50 postgres

# Check Redis logs
docker compose logs --tail=50 redis
```

**Key errors:**
- `FATAL: password authentication failed for user "postgres"` → Password in `.env` doesn't match container volume password.
- `Address already in use` → Another local PostgreSQL or Redis instance is already occupying port `5432` or `6379`.

---

#### 3. Check Environment Variables

Verify your `.env` contains the required DSN:

```bash
# Verify .env contents
cat .env
```

Ensure the connection string points to localhost:
```ini
EVALBENCH_POSTGRES_DSN=postgresql://postgres:postgres@localhost:5432/evalbench
EVALBENCH_REDIS_URL=redis://localhost:6379/0
```

---

### Resolution Steps

#### Scenario A: Docker Daemon is Not Running (Windows / macOS)

**Symptom**: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

1. Open the **Docker Desktop** application from your OS Start Menu / Applications folder.
2. Wait until the Docker icon in the system tray shows "Engine running".
3. Rerun `docker compose up -d`.

---

#### Scenario B: Containers Running but Ports Not Forwarded

**Symptom**: `docker ps` shows `5432/tcp` instead of `0.0.0.0:5432->5432/tcp`.

Run a forced recreation of the containers:

```bash
docker compose up -d --force-recreate
```

---

#### Scenario C: Port 5432 or 6379 Already in Use by Host Service

**Symptom**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

If you have a native PostgreSQL Windows service or Redis service installed:

1. Either stop the local host service:
   - **PowerShell (Admin)**: `Stop-Service postgresql*`
2. OR map the container to an alternate port in `docker-compose.yml` (e.g. `"5433:5432"`) and update `.env`:
   ```ini
   EVALBENCH_POSTGRES_DSN=postgresql://postgres:postgres@localhost:5433/evalbench
   ```

---

#### Scenario D: Corrupted Local State or Authentication Mismatch

If PostgreSQL volume has corrupted state or passwords were changed:

```bash
# Stop containers and preserve volumes
docker compose down

# Start fresh
docker compose up -d
```

> [!CAUTION]
> If you need to completely erase the database and recreate all tables from scratch, run `docker compose down -v`. **This permanently deletes all local evaluation history.**

```bash
# Destructive complete reset:
docker compose down -v
docker compose up -d
```

---

### Verification (Local)

The issue is resolved when:

1. `docker compose ps` shows `evalbench-postgres`, `evalbench-redis`, and `evalbench-pgweb` as healthy.
2. Direct Python test connection succeeds:
   ```bash
   uv run python -c "import asyncio; from evalbench.storage.postgres_store import PostgresResultStore; s = PostgresResultStore('postgresql://postgres:postgres@localhost:5432/evalbench'); asyncio.run(s.connect()); print('DB Connected!'); asyncio.run(s.close())"
   ```
3. API server starts without startup errors:
   ```bash
   uv run evalbench serve --reload
   ```
4. Navigating to `http://localhost:8081` opens pgweb and displays the `runs` and `test_case_results` tables.

---

## 🚀 Production / Remote Deployments

> **Secondary section.** Adapt for managed databases (AWS RDS, Supabase, Neon, Cloud SQL) or Redis (ElastiCache, Upstash).

### Diagnosis

```bash
# Test network reachability and SSL
pg_isready -h <db-hostname> -p 5432 -U <db-user>

# Test Redis ping
redis-cli -u <redis-url> ping
```

### Resolution Steps

1. **Security Groups & Firewalls**: Verify that the API server IP/subnet is allowed in the PostgreSQL security group on port `5432`.
2. **Connection Pooling Limits**: Check RDS / Postgres `max_connections`. `PostgresResultStore` defaults to `min_pool_size=1, max_pool_size=10`. If multiple server replicas run, adjust pool sizes accordingly.
3. **SSL Mode**: In production, ensure `?sslmode=require` or `?sslmode=verify-full` is attached to `EVALBENCH_POSTGRES_DSN`.

---

## Related Documents

- [Docker Compose Configuration](../../docker-compose.yml)
- [How to Execute Evaluation Runs](../how-tos/how-to-execute-evaluation-runs.md)
- [ADR-004: Redis vs PostgreSQL Storage Separation](../adr/004-transient-redis-queue-and-postgres-result-separation.md)
