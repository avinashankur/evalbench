export interface JobCreate {
  config?: Record<string, unknown>
  config_path?: string
}

export interface JobStatusResponse {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  run_id: string | null
  error: string | null
  config_path: string | null
  message: string | null
}
