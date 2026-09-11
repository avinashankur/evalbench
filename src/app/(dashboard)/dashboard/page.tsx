'use client'

import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { useListRuns } from '@/modules/runs'
import { useHealth, useProviders, useEvaluators } from '@/modules/discovery'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { ModelLeaderboard } from '@/components/dashboard/model-leaderboard'
import { RecentEvaluationsTable } from '@/components/dashboard/recent-evaluations-table'
import { WorkspaceSignal } from '@/components/dashboard/workspace-signal'

export default function DashboardPage() {
  const {
    data: runsData,
    isLoading: runsLoading,
    refetch: refetchRuns,
    isRefetching: runsRefetching,
  } = useListRuns({ limit: 50 })

  const {
    data: health,
    refetch: refetchHealth,
    isRefetching: healthRefetching,
  } = useHealth()

  const {
    data: providersData,
    refetch: refetchProviders,
    isRefetching: providersRefetching,
  } = useProviders()

  const {
    data: evaluatorsData,
    refetch: refetchEvaluators,
    isRefetching: evaluatorsRefetching,
  } = useEvaluators()

  const [activeBenchmarkFilter, setActiveBenchmarkFilter] = React.useState<string>('All')

  // Derive real datasets from available runs
  const availableDatasets = React.useMemo(() => {
    if (!runsData?.runs || runsData.runs.length === 0) return ['All']
    const unique = Array.from(new Set(runsData.runs.map((r) => r.dataset_name)))
    return ['All', ...unique]
  }, [runsData])

  // Filter runs by the selected dataset
  const filteredRuns = React.useMemo(() => {
    if (!runsData?.runs) return []
    if (activeBenchmarkFilter === 'All') return runsData.runs
    return runsData.runs.filter((r) => r.dataset_name === activeBenchmarkFilter)
  }, [runsData, activeBenchmarkFilter])

  // Compute 100% real KPIs from runs data
  const kpis = React.useMemo(() => {
    const runs = filteredRuns
    if (runs.length === 0) {
      return {
        totalRuns: '0',
        avgScore: '—',
        meanLatency: '—',
        totalCost: '$0.00',
      }
    }

    const totalRuns = String(runs.length)
    const allScores: number[] = []
    let totalLatency = 0
    let totalCost = 0

    for (const r of runs) {
      const scores = Object.values(r.metrics.mean_scores)
      if (scores.length > 0) {
        allScores.push(...scores.map((s) => (s <= 1 ? s * 100 : s)))
      } else {
        const passVals = Object.values(r.metrics.pass_rates)
        if (passVals.length > 0) {
          allScores.push(...passVals.map((p) => p * 100))
        }
      }
      totalLatency += r.metrics.mean_latency_ms || 0
      totalCost += r.metrics.total_cost_usd || 0
    }

    const avgScore = allScores.length
      ? `${(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)}%`
      : '—'

    const avgLatencyMs = totalLatency / runs.length
    const meanLatency =
      avgLatencyMs >= 1000
        ? `${(avgLatencyMs / 1000).toFixed(2)}s`
        : `${Math.round(avgLatencyMs)}ms`

    const totalCostFormatted = `$${totalCost.toFixed(2)}`

    return {
      totalRuns,
      avgScore,
      meanLatency,
      totalCost: totalCostFormatted,
    }
  }, [filteredRuns])

  // Real workspace activity statistics
  const activityStats = React.useMemo(() => {
    const runs = runsData?.runs || []
    const totalItems = runs.reduce((acc, r) => acc + (r.total_test_cases || 0), 0)
    const uniqueDatasets = new Set(runs.map((r) => r.dataset_name)).size
    const uniqueModels = new Set(runs.map((r) => `${r.provider}/${r.model}`)).size

    return {
      totalItems,
      datasets: uniqueDatasets,
      models: uniqueModels,
    }
  }, [runsData])

  function handleRefresh() {
    refetchRuns()
    refetchHealth()
    refetchProviders()
    refetchEvaluators()
  }

  const isRefreshing =
    runsRefetching || healthRefetching || providersRefetching || evaluatorsRefetching

  return (
    <div className="space-y-5">
      {/* Scope & Dataset Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-medium pr-1">Benchmark Dataset:</span>
          {availableDatasets.map((dataset) => (
            <button
              key={dataset}
              type="button"
              onClick={() => setActiveBenchmarkFilter(dataset)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                activeBenchmarkFilter === dataset
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              {dataset}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
            <span
              className={cn(
                'size-2 rounded-full',
                health?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              )}
            />
            <span>FastAPI v{health?.version || '0.1.0'} · Live telemetry</span>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw
              className={cn('size-3', isRefreshing && 'animate-spin')}
              data-icon="inline-start"
            />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Real Metric KPI Strip (4 Stat Cards) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/70">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Evaluations run</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {kpis.totalRuns}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {filteredRuns.length === 1 ? '1 run logged' : `${filteredRuns.length} runs logged`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Average score</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {kpis.avgScore}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mean score across runs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Mean latency</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {kpis.meanLatency}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Average inference response
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Evaluation cost</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {kpis.totalCost}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total token expenditure
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Real Performance Chart & Model Leaderboard */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        <PerformanceChart
          runs={filteredRuns}
          className="lg:col-span-8"
        />
        <ModelLeaderboard
          runs={filteredRuns}
          className="lg:col-span-4"
        />
      </div>

      {/* Row 2: Real Evaluations Table & System Telemetry */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        <RecentEvaluationsTable
          runs={filteredRuns}
          isLoading={runsLoading}
          className="lg:col-span-7"
        />
        <WorkspaceSignal
          health={health}
          runs={filteredRuns}
          providers={providersData?.providers}
          evaluators={evaluatorsData?.evaluators}
          className="lg:col-span-5"
        />
      </div>

      {/* Row 3: Real Workspace Activity Summary Strip */}
      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-5 border-b border-border/60">
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight">Workspace Activity</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Aggregated statistics across all recorded evaluation executions
            </CardDescription>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            Live database sync
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <div className="p-5 flex flex-col justify-center">
              <span className="font-mono text-2xl font-bold text-foreground">
                {activityStats.datasets}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                active benchmark datasets
              </span>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <span className="font-mono text-2xl font-bold text-foreground">
                {activityStats.models}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                models evaluated
              </span>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <span className="font-mono text-2xl font-bold text-foreground">
                {activityStats.totalItems}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                evaluation test cases processed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
