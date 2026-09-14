export const jobKeys = {
  all: ['jobs'] as const,
  detail: (jobId: string) => ['jobs', 'detail', jobId] as const,
  results: (jobId: string) => ['jobs', 'results', jobId] as const,
} as const
