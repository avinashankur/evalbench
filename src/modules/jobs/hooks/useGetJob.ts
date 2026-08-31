import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getJob } from '../api/jobs.api'
import { jobKeys } from './job.keys'
import type { JobStatusResponse } from '../types/job.types'

export function useGetJob(jobId: string) {
  return useQuery<JobStatusResponse, ApiError>({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && (data.status === 'queued' || data.status === 'running')) {
        return 3000
      }
      return false
    },
  })
}
