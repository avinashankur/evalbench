import { apiClient, BASE } from '@/lib/api'
import type {
  ListRunsParams,
  PaginatedResults,
  RunCreate,
  RunListResponse,
  RunResultsParams,
  RunStatusResponse,
  RunSummaryResponse,
} from '../types/run.types'

export function listRuns(params?: ListRunsParams): Promise<RunListResponse> {
  const query = new URLSearchParams()
  if (params?.dataset_name) query.set('dataset_name', params.dataset_name)
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiClient.get<RunListResponse>(`${BASE}/runs${qs ? `?${qs}` : ''}`)
}

export function getRun(runId: string): Promise<RunStatusResponse | RunSummaryResponse> {
  return apiClient.get<RunStatusResponse | RunSummaryResponse>(`${BASE}/runs/${runId}`)
}

export function getRunResults(
  runId: string,
  params?: RunResultsParams,
): Promise<PaginatedResults> {
  const query = new URLSearchParams()
  if (params?.offset != null) query.set('offset', String(params.offset))
  if (params?.limit != null) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiClient.get<PaginatedResults>(`${BASE}/runs/${runId}/results${qs ? `?${qs}` : ''}`)
}

export function createRun(body: RunCreate): Promise<RunStatusResponse> {
  return apiClient.post<RunStatusResponse>(`${BASE}/runs`, body)
}

export function deleteRun(runId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/runs/${runId}`)
}
