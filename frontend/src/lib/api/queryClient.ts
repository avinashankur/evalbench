import { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          const apiError = error as ApiError
          if (apiError.statusCode >= 400 && apiError.statusCode < 500) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: (failureCount, error) => {
          const apiError = error as ApiError
          if (apiError.statusCode >= 400 && apiError.statusCode < 500) return false
          return failureCount < 1
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }

  return browserQueryClient
}
