import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getEvaluators } from '../api/discovery.api'
import { discoveryKeys } from './discovery.keys'
import type { EvaluatorsResponse } from '../types/discovery.types'

export function useEvaluators() {
  return useQuery<EvaluatorsResponse, ApiError>({
    queryKey: discoveryKeys.evaluators,
    queryFn: getEvaluators,
    staleTime: 5 * 60 * 1000,
  })
}
