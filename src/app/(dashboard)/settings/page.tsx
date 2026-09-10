'use client'

import { useHealth, useProviders, useEvaluators } from '@/modules/discovery'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    error: healthErrorDetails,
    refetch: refetchHealth,
  } = useHealth()
  const { data: providersData, isLoading: providersLoading, refetch: refetchProviders } = useProviders()
  const { data: evaluatorsData, isLoading: evaluatorsLoading, refetch: refetchEvaluators } = useEvaluators()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings & Discovery</h1>
        <p className="text-muted-foreground">
          System health, available providers, and evaluators.
        </p>
      </div>

      {/* Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">System Health</CardTitle>
            <CardDescription>Backend API services and database connectivity status</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
            className="h-8 text-xs"
          >
            Recheck Health
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          {healthLoading ? (
            <p className="text-sm text-muted-foreground">Checking health status...</p>
          ) : healthError || !health ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>Could not fetch health status: {healthErrorDetails?.message || 'Backend unreachable'}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetchHealth()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <HealthItem label="API" status={health.status === 'ok' ? 'ok' : 'error'} />
                <HealthItem
                  label="PostgreSQL"
                  status={health.postgres === 'connected' ? 'ok' : 'error'}
                />
                <HealthItem
                  label="Redis"
                  status={
                    health.redis === 'connected'
                      ? 'ok'
                      : health.redis === 'disabled'
                        ? 'disabled'
                        : 'error'
                  }
                />
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>FastAPI Backend Version: <strong className="text-foreground font-mono">{health.version}</strong></span>
                <span className="font-mono text-[11px]">Endpoint: /api/v1/health</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Providers */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">LLM Providers</h2>
        {providersLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : providersData ? (
          <div className="flex flex-wrap gap-2">
            {providersData.providers.map((p) => (
              <span
                key={p}
                className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No providers available.</p>
        )}
      </section>

      {/* Evaluators */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Evaluators</h2>
        {evaluatorsLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : evaluatorsData ? (
          <div className="flex flex-wrap gap-2">
            {evaluatorsData.evaluators.map((e) => (
              <span
                key={e}
                className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm font-medium"
              >
                {e}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No evaluators available.</p>
        )}
      </section>
    </div>
  )
}

function HealthItem({ label, status }: { label: string; status: 'ok' | 'error' | 'disabled' }) {
  return (
    <div className="flex items-center gap-2">
      {status === 'ok' ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : status === 'error' ? (
        <XCircle className="h-5 w-5 text-red-500" />
      ) : (
        <AlertCircle className="h-5 w-5 text-yellow-500" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
