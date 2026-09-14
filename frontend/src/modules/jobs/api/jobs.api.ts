import { apiClient, BASE } from '@/lib/api'
import type { JobCreate, JobStatusResponse } from '../types/job.types'
import type { RunSummaryResponse } from '@/modules/runs'

export function createJob(body: JobCreate): Promise<JobStatusResponse> {
  return apiClient.post<JobStatusResponse>(`${BASE}/jobs`, body)
}

export function getJob(jobId: string): Promise<JobStatusResponse> {
  return apiClient.get<JobStatusResponse>(`${BASE}/jobs/${jobId}`)
}

export function getJobResults(jobId: string): Promise<RunSummaryResponse> {
  return apiClient.get<RunSummaryResponse>(`${BASE}/jobs/${jobId}/results`)
}
