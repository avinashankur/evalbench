import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api'
import { deleteRun } from '../api/runs.api'
import { runKeys } from './run.keys'

export function useDeleteRun() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteRun,

    onSuccess() {
      toast.success('Run deleted')
      queryClient.invalidateQueries({ queryKey: runKeys.all })
    },

    onError(error) {
      toast.error('Failed to delete run', { description: error.message })
    },
  })
}
