export interface HealthResponse {
  status: string
  version: string
  postgres: 'connected' | 'disconnected'
  redis: 'connected' | 'disconnected' | 'disabled'
}

export interface ProvidersResponse {
  providers: string[]
}

export interface EvaluatorsResponse {
  evaluators: string[]
}
