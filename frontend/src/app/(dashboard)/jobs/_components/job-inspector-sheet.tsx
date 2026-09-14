'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Cpu,
  FileCode,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Database,
  BarChart3,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { JobStatusBadge } from './job-status-badge'
import { useGetJobResults, type JobStatusResponse } from '@/modules/jobs'

interface JobInspectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobStatusResponse | undefined
  jobId: string
  isTracking: boolean
}

export function JobInspectorSheet({
  open,
  onOpenChange,
  job,
  jobId,
  isTracking,
}: JobInspectorSheetProps) {
  const [copiedId, setCopiedId] = React.useState(false)
  const [copiedConfig, setCopiedConfig] = React.useState(false)

  const activeId = job?.job_id || jobId
  const isCompleted = job?.status === 'completed'
  const isRunning = job?.status === 'running'
  const isQueued = job?.status === 'queued'
  const isFailed = job?.status === 'failed'

  // Fetch full results if completed
  const { data: results, isLoading: isLoadingResults } = useGetJobResults(
    activeId,
    isCompleted
  )

  function handleCopyId() {
    if (activeId) {
      navigator.clipboard.writeText(activeId)
      setCopiedId(true)
      toast.success('Job UUID copied to clipboard')
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  function handleCopyConfig() {
    const text = job?.config_path || JSON.stringify(job, null, 2)
    navigator.clipboard.writeText(text)
    setCopiedConfig(true)
    toast.success('Configuration copied to clipboard')
    setTimeout(() => setCopiedConfig(false), 2000)
  }

  // Calculate overall benchmark score
  const overallScore = React.useMemo(() => {
    if (!results?.metrics) return null
    const scores = Object.values(results.metrics.mean_scores || {})
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return avg <= 1 ? avg * 100 : avg
    }
    const pass = Object.values(results.metrics.pass_rates || {})
    if (pass.length > 0) {
      return (pass.reduce((a, b) => a + b, 0) / pass.length) * 100
    }
    return null
  }, [results])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col justify-between overflow-hidden bg-card border-l border-border shadow-2xl"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SheetHeader className="p-5 pb-3 border-b border-border/70 bg-card flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <BarChart3 className="size-4" />
                </span>
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-sm font-semibold">
                    Evaluation Inspector
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Live worker execution telemetry & results.
                  </SheetDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {job && <JobStatusBadge status={job.status} />}
              </div>
            </div>

            {/* UUID Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-muted-foreground font-mono">UUID:</span>
                <code className="font-mono text-xs font-semibold text-foreground truncate max-w-60 sm:max-w-70">
                  {activeId || '—'}
                </code>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopyId}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                <span>{copiedId ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </SheetHeader>

          {/* Tabbed Workspace */}
          <Tabs defaultValue="scorecard" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-2.5 pb-2 border-b border-border/50 bg-muted/10">
              <TabsList className="grid grid-cols-3 w-full h-8 p-0.5 bg-muted">
                <TabsTrigger value="scorecard" className="text-xs gap-1.5 font-medium cursor-pointer">
                  <Activity className="size-3.5" />
                  <span>Scorecard</span>
                </TabsTrigger>
                <TabsTrigger value="diagnostics" className="text-xs gap-1.5 font-medium cursor-pointer">
                  <Cpu className="size-3.5" />
                  <span>Diagnostics</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="text-xs gap-1.5 font-medium cursor-pointer">
                  <FileCode className="size-3.5" />
                  <span>Config</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Scorecard */}
            <TabsContent value="scorecard" className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 m-0">
              {isLoadingResults ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ) : isCompleted && results ? (
                <div className="flex flex-col gap-4">
                  {/* Hero Score Highlight Card */}
                  <div className="rounded-xl border border-border/80 bg-linear-to-br from-card via-card to-muted/20 p-4 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'size-14 rounded-xl flex flex-col items-center justify-center border font-mono font-bold text-xl shadow-inner shrink-0',
                          overallScore != null && overallScore >= 80
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : overallScore != null && overallScore >= 50
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {overallScore != null ? `${overallScore.toFixed(0)}%` : '—'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            Benchmark Score
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[9px] font-mono px-1.5 py-0',
                              overallScore != null && overallScore >= 80
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : overallScore != null && overallScore >= 50
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {overallScore != null && overallScore >= 80
                              ? 'PASSED'
                              : overallScore != null && overallScore >= 50
                                ? 'WARNING'
                                : 'FAILED'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {results.total} test cases evaluated.
                        </p>
                      </div>
                    </div>

                    {job?.run_id && (
                      <Link
                        href={`/runs/${job.run_id}`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'xs' }),
                          'text-xs font-medium gap-1 h-7 shrink-0 shadow-2xs'
                        )}
                      >
                        <span>Full Report</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </div>

                  {/* 4 Metric Tiles in 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Mean Score */}
                    <div className="flex flex-col gap-0.5 rounded-xl bg-muted/80 p-3 shadow-2xs">
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Mean Score
                      </span>
                      <span className="font-mono text-lg font-bold text-foreground">
                        {overallScore != null ? `${overallScore.toFixed(1)}%` : '—'}
                      </span>
                    </div>

                    {/* Avg Latency */}
                    <div className="flex flex-col gap-0.5 rounded-xl bg-muted/80 p-3 shadow-2xs">
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Avg Latency
                      </span>
                      <span className="font-mono text-lg font-bold text-foreground">
                        {results.metrics?.mean_latency_ms != null
                          ? `${results.metrics.mean_latency_ms.toFixed(0)}ms`
                          : '—'}
                      </span>
                    </div>

                    {/* Total Cost */}
                    <div className="flex flex-col gap-0.5 rounded-xl bg-muted/80 p-3 shadow-2xs">
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Total Cost
                      </span>
                      <span className="font-mono text-lg font-bold text-foreground">
                        {results.metrics?.total_cost_usd != null
                          ? `$${results.metrics.total_cost_usd.toFixed(4)}`
                          : '$0.00'}
                      </span>
                    </div>

                    {/* Model & Dataset */}
                    <div className="flex flex-col gap-0.5 rounded-xl bg-muted/80 p-3 shadow-2xs">
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Target Model
                      </span>
                      <span className="truncate font-mono text-xs font-semibold text-foreground">
                        {results.provider}/{results.model || 'mock'}
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {results.dataset_name || 'dataset'}
                      </span>
                    </div>
                  </div>

                  {/* Evaluator Pass Rates with Progress Bars */}
                  {Object.entries(results.metrics?.pass_rates || {}).length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-muted/80 p-3.5 flex flex-col gap-2.5 shadow-2xs">
                      <span className="text-xs font-semibold tracking-tight text-foreground uppercase">
                        Evaluator Breakdown
                      </span>

                      <div className="flex flex-col gap-2.5">
                        {Object.entries(results.metrics?.pass_rates || {}).map(([key, val]) => {
                          const percentage = Math.round(val * 100)
                          return (
                            <div key={key} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono font-medium text-foreground">
                                  {key}
                                </span>
                                <span
                                  className={cn(
                                    'font-mono font-bold text-xs',
                                    percentage >= 80
                                      ? 'text-emerald-500'
                                      : percentage >= 50
                                        ? 'text-amber-500'
                                        : 'text-rose-500'
                                  )}
                                >
                                  {percentage}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    percentage >= 80
                                      ? 'bg-emerald-500'
                                      : percentage >= 50
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : isRunning || isQueued ? (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 flex flex-col items-center justify-center text-center gap-2.5">
                  <div className="size-9 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                    <RotateCcw className="size-4 animate-spin" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-xs text-foreground">
                      Benchmark In Progress
                    </span>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      Executing on background queue workers. Full scores and evaluator breakdown will render here once complete.
                    </p>
                  </div>
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-sky-500/20 mt-1">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-sky-500" />
                  </div>
                </div>
              ) : isFailed ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex flex-col items-center justify-center text-center gap-2.5">
                  <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-xs text-destructive">
                      Evaluation Failed
                    </span>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      No scoring data could be generated. Check the Diagnostics tab for troubleshooting details.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-6 flex flex-col items-center justify-center text-center gap-2">
                  <Clock className="size-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    No results available for this evaluation run.
                  </span>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Pipeline & Diagnostics */}
            <TabsContent value="diagnostics" className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 m-0">
              {/* Live Polling Banner */}
              {isTracking && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <RotateCcw className="size-3.5 text-primary animate-spin" />
                    <span>Real-time polling queue worker…</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">every 3s</span>
                </div>
              )}

              {/* Execution Status Card */}
              <div className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col gap-2.5 shadow-2xs">
                <span className="text-xs font-semibold tracking-tight text-foreground uppercase">
                  Worker Execution Lifecycle
                </span>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current State:</span>
                    {job && <JobStatusBadge status={job.status} />}
                  </div>

                  {/* Stage Visualizer */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <div
                      className={cn(
                        'p-2 rounded-lg border flex flex-col gap-0.5 text-center',
                        isQueued
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                          : 'border-border/60 bg-muted/20 text-muted-foreground'
                      )}
                    >
                      <span className="text-[9px] font-mono">Stage 1</span>
                      <span className="text-[11px] font-medium">Enqueued</span>
                    </div>

                    <div
                      className={cn(
                        'p-2 rounded-lg border flex flex-col gap-0.5 text-center',
                        isRunning
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                          : isCompleted
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                            : 'border-border/60 bg-muted/20 text-muted-foreground'
                      )}
                    >
                      <span className="text-[9px] font-mono">Stage 2</span>
                      <span className="text-[11px] font-medium">Processing</span>
                    </div>

                    <div
                      className={cn(
                        'p-2 rounded-lg border flex flex-col gap-0.5 text-center',
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : isFailed
                            ? 'border-destructive bg-destructive/10 text-destructive font-semibold'
                            : 'border-border/60 bg-muted/20 text-muted-foreground'
                      )}
                    >
                      <span className="text-[9px] font-mono">Stage 3</span>
                      <span className="text-[11px] font-medium">{isFailed ? 'Failed' : 'Finalized'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Traceback Box (if failed) */}
              {isFailed && (
                <div className="flex flex-col gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>Worker Failure Diagnostics</span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-destructive/20 bg-background/80 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
                    {job?.error || 'Worker encountered an unhandled exception during evaluation processing.'}
                  </pre>
                  <p className="text-[11px] text-muted-foreground">
                    Verify background worker daemon is active in terminal:{' '}
                    <code className="font-mono text-foreground font-semibold">uv run evalbench worker</code>
                  </p>
                </div>
              )}

              {/* Routing Infrastructure */}
              <div className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col gap-2.5 shadow-2xs">
                <span className="text-xs font-semibold tracking-tight text-foreground uppercase">
                  Routing Infrastructure
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">
                      Queue Destination
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground font-medium">
                      <Cpu className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">evalbench:jobs:queue</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">
                      Persistence Store
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground font-medium">
                      <Database className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">PostgreSQL</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Configuration */}
            <TabsContent value="config" className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 m-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase">
                  Configuration Payload
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleCopyConfig}
                  className="h-6 text-xs font-mono gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedConfig ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <div className="rounded-xl border border-border/60 overflow-hidden shadow-2xs bg-background">
                <div className="bg-muted/60 border-b border-border/50 px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <FileCode className="size-3" />
                    <span>{job?.config_path || 'payload.json'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {job?.config_path ? 'YAML' : 'JSON'}
                  </span>
                </div>
                <pre className="p-3.5 font-mono text-[11px] text-foreground overflow-x-auto leading-relaxed max-h-80">
                  {job?.config_path
                    ? `config_path: "${job.config_path}"\nstatus: "${job.status}"\njob_id: "${activeId}"`
                    : JSON.stringify(job, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Dock / Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Close
          </Button>

          {isCompleted && job?.run_id ? (
            <Link
              href={`/runs/${job.run_id}`}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'text-xs gap-1.5 h-9 font-medium cursor-pointer shadow-2xs'
              )}
            >
              <span>View Full Evaluation Run</span>
              <ExternalLink className="size-3.5" />
            </Link>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="text-xs gap-1.5 h-9 font-mono cursor-pointer shadow-2xs"
            >
              <Copy className="size-3" />
              <span>Copy Job UUID</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
