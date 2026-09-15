export interface ModelConfig {
  provider: string
  name: string
  temperature?: number
  max_tokens?: number
}

export interface EvaluatorConfig {
  name: string
  judge_model?: ModelConfig
  pass_threshold?: number
}

export interface RetrieverConfig {
  type: string
  documents?: string[]
  top_k?: number
}

export interface DatasetItem {
  question: string
  context?: string
  expected_answer?: string
  reference_contexts?: string[]
  metadata?: Record<string, unknown>
}

export interface RunCreate {
  dataset: string | DatasetItem[]
  config_path?: string
  model?: ModelConfig
  prompt_template?: string
  system_prompt?: string
  concurrency?: number
  evaluators?: (string | EvaluatorConfig)[]
  retriever?: RetrieverConfig
}

export interface RunMetrics {
  pass_rates: Record<string, number>
  mean_scores: Record<string, number>
  mean_latency_ms: number
  total_cost_usd: number
}

export interface RunSummary {
  run_id: string
  dataset_name: string
  provider: string
  model: string
  total_test_cases: number
  created_at: string
  metrics: RunMetrics
  owner_id?: string | null
}

export interface RunListResponse {
  runs: RunSummary[]
}

export interface RunStatusResponse {
  run_id: string
  status: 'running' | 'completed' | 'failed'
  message: string | null
  error: string | null
}

export interface RunSummaryResponse extends RunStatusResponse {
  dataset_name: string
  provider: string
  model: string
  total: number
  created_at: string
  metrics: RunMetrics
  owner_id?: string | null
}

export interface TestCase {
  id: string
  question: string
  context: string | null
  expected_answer: string | null
  reference_contexts: string[] | null
  metadata: Record<string, unknown>
}

export interface ModelResponse {
  text: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  cost_usd: number | null
  model: string
  provider: string
  raw: unknown
  error: string | null
  retrieved_context: string | null
}

export interface EvalResult {
  evaluator_name: string
  test_case_id: string
  score: number
  status: 'passed' | 'failed'
  reason: string | null
  metadata: Record<string, unknown>
}

export interface TestCaseResult {
  run_id: string
  test_case: TestCase
  response: ModelResponse
  eval_results: EvalResult[]
  timestamp: number
}

export interface PaginatedResults {
  run_id: string
  total: number
  offset: number
  limit: number
  results: TestCaseResult[]
}

export interface ListRunsParams {
  dataset_name?: string
  limit?: number
}

export interface RunResultsParams {
  offset?: number
  limit?: number
}
