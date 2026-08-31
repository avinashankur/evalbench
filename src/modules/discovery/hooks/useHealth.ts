import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getHealth } from '../api/discovery.api'
import { discoveryKeys } from './discovery.keys'
import type { HealthResponse } from '../types/discovery.types'

export function useHealth() {
  return useQuery<HealthResponse, ApiError>({
    queryKey: discoveryKeys.health,
    queryFn: getHealth,
    refetchInterval: 60 * 1000,
  })
}
