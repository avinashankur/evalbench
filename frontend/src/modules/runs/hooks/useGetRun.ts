import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getRun } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { RunStatusResponse, RunSummaryResponse } from '../types/run.types'

export function useGetRun(runId: string) {
  return useQuery<RunStatusResponse | RunSummaryResponse, ApiError>({
    queryKey: runKeys.detail(runId),
    queryFn: () => getRun(runId),
    enabled: !!runId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && 'status' in data && data.status === 'running') {
        return 3000
      }
      return false
    },
  })
}
