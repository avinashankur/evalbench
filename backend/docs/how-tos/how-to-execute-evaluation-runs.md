# How to Execute and Manage Evaluation Runs via API

This guide describes how to submit, track, paginate, and delete evaluation runs using the `/api/v1/runs` REST API.

---

## 1. Overview

The `/api/v1/runs` endpoints provide direct in-process evaluation execution and PostgreSQL-backed historical querying.

- **Execution**: Runs in background tasks on the API server.
- **Persistence**: Results, test case outputs, and summary metrics are written to PostgreSQL.
- **Polling**: Submitters receive a `run_id` immediately and poll `GET /api/v1/runs/{run_id}` until completion.

---

## 2. Endpoints Reference

| Method | Endpoint | Description | Response Status |
|---|---|---|---|
| `POST` | `/api/v1/runs` | Submit evaluation run | `202 Accepted` |
| `GET` | `/api/v1/runs` | List past runs from database | `200 OK` |
| `GET` | `/api/v1/runs/{run_id}` | Get run summary, metrics, or active status | `200 OK` |
| `GET` | `/api/v1/runs/{run_id}/results` | Get paginated test case results | `200 OK` |
| `DELETE` | `/api/v1/runs/{run_id}` | Delete run and all related results | `204 No Content` |

---

## 3. Submitting an Evaluation

### Option A: Inline Test Cases
Submit test cases directly in the JSON payload without referencing a server dataset file:

```http
POST /api/v1/runs
Content-Type: application/json

{
  "dataset": [
    {
      "id": "tc-1",
      "question": "What is 2 + 2?",
      "expected_answer": "4"
    }
  ],
  "model": {
    "provider": "mock",
    "name": "mock-model"
  },
  "evaluators": ["exact_match"],
  "concurrency": 2
}
```

### Option B: Server Config File
Point to an existing YAML configuration file located on the server:

```http
POST /api/v1/runs
Content-Type: application/json

{
  "config_path": "configs/mock-example.yaml"
}
```

**Response (`202 Accepted`):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "running",
  "message": "Evaluation started. Poll GET /api/v1/runs/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d for results."
}
```

---

## 4. Polling for Completion & Inspecting Metrics

Poll the summary endpoint using the returned `run_id`:

```http
GET /api/v1/runs/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d
```

**Response while running (`200 OK`):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "running",
  "message": "Evaluation in progress."
}
```

**Response when completed (`200 OK`):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "completed",
  "dataset_name": "inline",
  "provider": "mock",
  "model": "mock-model",
  "total": 1,
  "created_at": "2026-08-28T10:00:00Z",
  "metrics": {
    "pass_rates": {
      "exact_match": 1.0
    },
    "mean_scores": {
      "exact_match": 1.0
    },
    "mean_latency_ms": 42.5,
    "total_cost_usd": 0.0
  }
}
```

---

## 5. Fetching Paginated Test Case Results

Retrieve individual prompt/response evaluations with pagination controls:

```http
GET /api/v1/runs/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/results?offset=0&limit=10
```

**Response (`200 OK`):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "total": 1,
  "offset": 0,
  "limit": 10,
  "results": [
    {
      "test_case": {
        "id": "tc-1",
        "question": "What is 2 + 2?",
        "expected_answer": "4"
      },
      "response": {
        "text": "4",
        "latency_ms": 42.5,
        "provider": "mock",
        "model": "mock-model"
      },
      "eval_results": [
        {
          "evaluator_name": "exact_match",
          "score": 1.0,
          "status": "passed"
        }
      ]
    }
  ]
}
```

---

## 6. Listing and Deleting Runs

### List Past Runs
```http
GET /api/v1/runs?limit=20
```

### Delete a Run
Deletes the run record and cascades to remove all associated `test_case_results`:

```http
DELETE /api/v1/runs/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d
```
**Response (`204 No Content`)**
