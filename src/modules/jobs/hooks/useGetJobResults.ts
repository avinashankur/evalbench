import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getJobResults } from '../api/jobs.api'
import { jobKeys } from './job.keys'
import type { RunSummaryResponse } from '@/modules/runs'

export function useGetJobResults(jobId: string, enabled = true) {
  return useQuery<RunSummaryResponse, ApiError>({
    queryKey: jobKeys.results(jobId),
    queryFn: () => getJobResults(jobId),
    enabled: !!jobId && enabled,
  })
}
