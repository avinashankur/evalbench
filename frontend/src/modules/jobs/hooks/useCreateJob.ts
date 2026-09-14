import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api'
import { createJob } from '../api/jobs.api'
import { jobKeys } from './job.keys'
import type { JobCreate, JobStatusResponse } from '../types/job.types'

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation<JobStatusResponse, ApiError, JobCreate>({
    mutationFn: createJob,

    onSuccess(data) {
      toast.success('Job submitted', {
        description: `Job ${data.job_id.slice(0, 8)}… is queued.`,
      })
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },

    onError(error) {
      toast.error('Failed to submit job', { description: error.message })
    },
  })
}
