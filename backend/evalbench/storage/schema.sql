
CREATE TABLE IF NOT EXISTS runs (
    run_id           UUID PRIMARY KEY,
    dataset_name     TEXT NOT NULL,
    provider         TEXT NOT NULL,
    model            TEXT NOT NULL,
    total_test_cases INTEGER NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    metrics          JSONB NOT NULL DEFAULT '{}'::jsonb  -- pass rates, mean scores, cost, latency per evaluator
);

CREATE TABLE IF NOT EXISTS test_case_results (
    id             BIGSERIAL PRIMARY KEY,
    run_id         UUID NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    test_case_id   TEXT NOT NULL,
    payload        JSONB NOT NULL, 
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_case_results_run_id ON test_case_results(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_dataset_name ON runs(dataset_name);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runs_metrics_gin ON runs USING gin (metrics);
