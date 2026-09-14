import { apiClient, BASE } from '@/lib/api'
import type {
  EvaluatorsResponse,
  HealthResponse,
  ProvidersResponse,
} from '../types/discovery.types'

export function getHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>(`${BASE}/health`)
}

export function getProviders(): Promise<ProvidersResponse> {
  return apiClient.get<ProvidersResponse>(`${BASE}/providers`)
}

export function getEvaluators(): Promise<EvaluatorsResponse> {
  return apiClient.get<EvaluatorsResponse>(`${BASE}/evaluators`)
}
