export interface JobHistoryItem {
  job_id: string
  config_path?: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  run_id?: string | null
  created_at?: number
}
