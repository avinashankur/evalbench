import type { ListRunsParams, RunResultsParams } from '../types/run.types'

export const runKeys = {
  all: ['runs'] as const,
  list: (params?: ListRunsParams) => ['runs', 'list', params] as const,
  detail: (runId: string) => ['runs', 'detail', runId] as const,
  results: (runId: string, params?: RunResultsParams) =>
    ['runs', 'results', runId, params] as const,
} as const
