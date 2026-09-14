import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getRunResults } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { PaginatedResults, RunResultsParams } from '../types/run.types'

export function useGetRunResults(runId: string, params?: RunResultsParams) {
  return useQuery<PaginatedResults, ApiError>({
    queryKey: runKeys.results(runId, params),
    queryFn: () => getRunResults(runId, params),
    enabled: !!runId,
  })
}
