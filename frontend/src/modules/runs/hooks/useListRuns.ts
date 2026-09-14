import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { listRuns } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { ListRunsParams, RunListResponse } from '../types/run.types'

export function useListRuns(params?: ListRunsParams) {
  return useQuery<RunListResponse, ApiError>({
    queryKey: runKeys.list(params),
    queryFn: () => listRuns(params),
  })
}
