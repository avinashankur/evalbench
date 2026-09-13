'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Server, Database, Zap, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { HealthResponse } from '@/modules/discovery'
import type { RunSummary } from '@/modules/runs'

interface WorkspaceSignalProps {
  health?: HealthResponse
  runs?: RunSummary[]
  providers?: string[]
  evaluators?: string[]
  className?: string
}

export function WorkspaceSignal({
  health,
  runs,
  providers = [],
  evaluators = [],
  className,
}: WorkspaceSignalProps) {
  const isHealthy = health?.status === 'ok'

  const totalTestCases = React.useMemo(() => {
    return runs?.reduce((acc, r) => acc + (r.total_test_cases || 0), 0) ?? 0
  }, [runs])

  return (
    <Card className={cn('flex flex-col h-full border-border/70', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">System Telemetry</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Backend infrastructure & available capabilities
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="inline-flex items-center gap-1.5 font-normal text-[11px]"
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              isHealthy ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            )}
          />
          {isHealthy ? 'Operational' : 'Degraded'}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-1">
        {/* Service status grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Server className="size-3.5" />
              <span className="text-[11px] font-medium">FastAPI</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
              {health?.status === 'ok' ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-3 text-amber-500" />
              )}
              <span>v{health?.version || '0.1.0'}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Database className="size-3.5" />
              <span className="text-[11px] font-medium">Postgres</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="capitalize">{health?.postgres || 'Connected'}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Zap className="size-3.5" />
              <span className="text-[11px] font-medium">Redis</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="capitalize">{health?.redis || 'Connected'}</span>
            </div>
          </div>
        </div>

        {/* Available LLM Providers */}
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" />
              Configured Providers
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {providers.length} available
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {providers.length > 0 ? (
              providers.map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="font-mono text-[11px] font-normal uppercase bg-background/50 border-border/70"
                >
                  {p}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Connecting to provider registry…
              </span>
            )}
          </div>
        </div>

        {/* Active Evaluators */}
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Active Evaluator Suites
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {evaluators.length} plugins
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {evaluators.length > 0 ? (
              evaluators.slice(0, 6).map((ev) => (
                <span
                  key={ev}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 text-foreground border border-border/40"
                >
                  {ev}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Scanning evaluators…
              </span>
            )}
            {evaluators.length > 6 && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                +{evaluators.length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* Execution Volume Footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span>Processed test cases:</span>
          <span className="font-mono font-medium text-foreground">{totalTestCases} items</span>
        </div>
      </CardContent>
    </Card>
  )
}
