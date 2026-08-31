'use client'

import { useHealth, useProviders, useEvaluators } from '@/modules/discovery'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: health, isLoading: healthLoading } = useHealth()
  const { data: providersData, isLoading: providersLoading } = useProviders()
  const { data: evaluatorsData, isLoading: evaluatorsLoading } = useEvaluators()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings & Discovery</h1>
        <p className="text-muted-foreground">
          System health, available providers, and evaluators.
        </p>
      </div>

      {/* Health */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">System Health</h2>
        {healthLoading ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : health ? (
          <div className="space-y-3">
            <div className="flex items-center gap-6">
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
            <p className="text-sm text-muted-foreground">Version: {health.version}</p>
          </div>
        ) : (
          <p className="text-sm text-destructive">Could not fetch health status.</p>
        )}
      </section>

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
