import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api'
import { createRun } from '../api/runs.api'
import { runKeys } from './run.keys'
import type { RunCreate, RunStatusResponse } from '../types/run.types'

export function useCreateRun() {
  const queryClient = useQueryClient()

  return useMutation<RunStatusResponse, ApiError, RunCreate>({
    mutationFn: createRun,

    onSuccess(data) {
      toast.success('Evaluation started', {
        description: `Run ${data.run_id.slice(0, 8)}… is now running.`,
      })
      queryClient.invalidateQueries({ queryKey: runKeys.all })
    },

    onError(error) {
      toast.error('Failed to start evaluation', { description: error.message })
    },
  })
}
