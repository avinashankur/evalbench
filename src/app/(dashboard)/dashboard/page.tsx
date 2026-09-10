'use client'

import Link from 'next/link'
import { Play, Layers, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useListRuns } from '@/modules/runs'
import { useHealth } from '@/modules/discovery'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: runsData, isLoading: runsLoading } = useListRuns({ limit: 5 })
  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    error: healthErrorDetails,
    refetch: refetchHealth,
  } = useHealth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your evaluation runs and system health.</p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/runs/new"
          className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <Play className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">New Run</p>
            <p className="text-sm text-muted-foreground">Start an evaluation</p>
          </div>
        </Link>

        <Link
          href="/jobs"
          className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <Layers className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Jobs</p>
            <p className="text-sm text-muted-foreground">Distributed queue</p>
          </div>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">System Health</p>
            <p className="text-sm text-muted-foreground">
              {healthLoading
                ? 'Checking…'
                : health?.status === 'ok'
                  ? 'All systems go'
                  : 'Issues detected'}
            </p>
          </div>
        </Link>
      </div>

      {/* Health status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">System Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchHealth()}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Recheck
          </Button>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <p className="text-sm text-muted-foreground">Checking backend health...</p>
          ) : healthError || !health ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>Backend service unreachable ({healthErrorDetails?.message || 'Connection refused'})</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetchHealth()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <StatusChip label="API" status={health.status === 'ok' ? 'ok' : 'error'} />
              <StatusChip
                label="PostgreSQL"
                status={health.postgres === 'connected' ? 'ok' : 'error'}
              />
              <StatusChip
                label="Redis"
                status={
                  health.redis === 'connected'
                    ? 'ok'
                    : health.redis === 'disabled'
                      ? 'disabled'
                      : 'error'
                }
              />
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                v{health.version}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent runs */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Recent Runs</h2>
          <Link href="/runs" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="p-4">
          {runsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !runsData?.runs.length ? (
            <p className="text-sm text-muted-foreground">No runs yet. Start your first evaluation!</p>
          ) : (
            <div className="space-y-3">
              {runsData.runs.map((run) => (
                <Link
                  key={run.run_id}
                  href={`/runs/${run.run_id}`}
                  className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{run.dataset_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {run.provider}/{run.model} · {run.total_test_cases} cases
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {Object.entries(run.metrics.pass_rates)
                        .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
                        .join(', ') || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusChip({ label, status }: { label: string; status: 'ok' | 'error' | 'disabled' }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {status === 'ok' ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : status === 'error' ? (
        <XCircle className="h-4 w-4 text-red-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-yellow-500" />
      )}
      <span>{label}</span>
    </div>
  )
}
