import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'
import { getProviders } from '../api/discovery.api'
import { discoveryKeys } from './discovery.keys'
import type { ProvidersResponse } from '../types/discovery.types'

export function useProviders() {
  return useQuery<ProvidersResponse, ApiError>({
    queryKey: discoveryKeys.providers,
    queryFn: getProviders,
    staleTime: 5 * 60 * 1000,
  })
}
