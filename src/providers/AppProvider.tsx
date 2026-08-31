'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { getQueryClient } from '@/lib/api'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}

        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            classNames: {
              toast: 'bg-background border border-border text-foreground font-sans text-sm rounded-lg shadow-lg',
              title: 'text-foreground font-medium',
              description: 'text-muted-foreground',
            },
          }}
        />

        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
