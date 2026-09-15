'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Trophy,
  Zap,
  DollarSign,
  ExternalLink,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'

interface MetricsComparisonTableProps {
  selectedRuns: RunSummary[]
}

export function MetricsComparisonTable({
  selectedRuns,
}: MetricsComparisonTableProps) {
  if (selectedRuns.length < 2) return null

  // Collect all unique evaluator names across selected runs
  const allEvaluatorNames = Array.from(
    new Set(
      selectedRuns.flatMap((r) => [
        ...Object.keys(r.metrics.pass_rates || {}),
        ...Object.keys(r.metrics.mean_scores || {}),
      ])
    )
  )

  // Compute average overall pass rate for each run
  const runAverages = selectedRuns.map((r) => {
    const rates = Object.values(r.metrics.pass_rates || {})
    const avgPass =
      rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null
    return {
      runId: r.run_id,
      avgPass,
      latency: r.metrics.mean_latency_ms,
      cost: r.metrics.total_cost_usd,
    }
  })

  // Determine winners
  const bestPassRun = [...runAverages]
    .filter((r) => r.avgPass != null)
    .sort((a, b) => (b.avgPass ?? 0) - (a.avgPass ?? 0))[0]

  const fastestRun = [...runAverages]
    .filter((r) => r.latency > 0)
    .sort((a, b) => a.latency - b.latency)[0]

  const lowestCostRun = [...runAverages]
    .filter((r) => r.cost != null)
    .sort((a, b) => a.cost - b.cost)[0]

  const baselineRun = selectedRuns[0]

  return (
    <div className="space-y-6">
      {/* 1. Executive Winner KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Highest Accuracy Card */}
        {bestPassRun && bestPassRun.avgPass != null && (
          <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Trophy className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Highest Accuracy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                  {selectedRuns.find((r) => r.run_id === bestPassRun.runId)?.model}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {(bestPassRun.avgPass * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lowest Latency Card */}
        {fastestRun && fastestRun.latency > 0 && (
          <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
              <Zap className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Fastest Throughput
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                  {selectedRuns.find((r) => r.run_id === fastestRun.runId)?.model}
                </span>
                <span className="font-mono text-xs font-bold text-brand">
                  {fastestRun.latency.toFixed(0)} ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lowest Cost Card */}
        {lowestCostRun && (
          <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Most Economical
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                  {selectedRuns.find((r) => r.run_id === lowestCostRun.runId)?.model}
                </span>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  ${lowestCostRun.cost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Side-by-Side Detailed Metrics Matrix */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border/60">
                <TableHead className="min-w-[200px] w-1/4 px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Evaluation Dimension
                </TableHead>

                {selectedRuns.map((run, idx) => (
                  <TableHead
                    key={run.run_id}
                    className="min-w-[200px] px-4 py-3.5 text-right font-normal"
                  >
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 border-border/70">
                            Baseline
                          </Badge>
                        )}
                        <span className="font-semibold text-xs text-foreground truncate max-w-[160px]" title={run.model}>
                          {run.model}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-sans">
                          {run.provider}
                        </Badge>
                        <span>•</span>
                        <span>{run.dataset_name}</span>
                      </div>

                      <Link
                        href={`/runs/${run.run_id}`}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'xs' }),
                          'h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1 mt-0.5 cursor-pointer'
                        )}
                      >
                        <span>Inspect run</span>
                        <ExternalLink className="size-2.5" />
                      </Link>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/40 text-xs">
              {/* SECTION: Overview Benchmarks */}
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableCell
                  colSpan={selectedRuns.length + 1}
                  className="px-4 py-2 font-semibold text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                >
                  Core Metrics
                </TableCell>
              </TableRow>

              {/* Mean Pass Rate */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="px-4 py-3 font-medium flex items-center gap-2">
                  <Target className="size-3.5 text-muted-foreground" />
                  <span>Mean Pass Rate</span>
                </TableCell>
                {selectedRuns.map((r, i) => {
                  const pass = runAverages[i].avgPass
                  const baselinePass = runAverages[0].avgPass
                  const delta =
                    i > 0 && pass != null && baselinePass != null
                      ? (pass - baselinePass) * 100
                      : null
                  const isBest = bestPassRun && r.run_id === bestPassRun.runId

                  return (
                    <TableCell key={r.run_id} className="px-4 py-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        {delta != null && delta !== 0 && (
                          <span
                            className={cn(
                              'text-[10px] inline-flex items-center',
                              delta > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {delta > 0 ? (
                              <ArrowUpRight className="size-3 inline mr-0.5" />
                            ) : (
                              <ArrowDownRight className="size-3 inline mr-0.5" />
                            )}
                            {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                          </span>
                        )}

                        <span
                          className={cn(
                            'font-semibold',
                            isBest && 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {pass != null ? `${(pass * 100).toFixed(1)}%` : '—'}
                        </span>

                        {isBest && selectedRuns.length > 1 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono px-1 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            Best
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* Avg Latency */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="px-4 py-3 font-medium flex items-center gap-2">
                  <Zap className="size-3.5 text-muted-foreground" />
                  <span>Mean Latency</span>
                </TableCell>
                {selectedRuns.map((r, i) => {
                  const lat = r.metrics.mean_latency_ms
                  const baseLat = baselineRun.metrics.mean_latency_ms
                  const delta = i > 0 && lat > 0 && baseLat > 0 ? lat - baseLat : null
                  const isFastest = fastestRun && r.run_id === fastestRun.runId

                  return (
                    <TableCell key={r.run_id} className="px-4 py-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        {delta != null && Math.abs(delta) > 5 && (
                          <span
                            className={cn(
                              'text-[10px]',
                              delta < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground'
                            )}
                          >
                            {delta > 0 ? `+${delta.toFixed(0)}ms` : `${delta.toFixed(0)}ms`}
                          </span>
                        )}

                        <span
                          className={cn(
                            'font-semibold',
                            isFastest && 'text-brand'
                          )}
                        >
                          {lat > 0 ? `${lat.toFixed(0)} ms` : '—'}
                        </span>

                        {isFastest && selectedRuns.length > 1 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono px-1 py-0 bg-brand/10 text-brand border border-brand/20"
                          >
                            Fastest
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* Total Cost */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="px-4 py-3 font-medium flex items-center gap-2">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <span>Total Benchmark Cost</span>
                </TableCell>
                {selectedRuns.map((r) => {
                  const isLowest = lowestCostRun && r.run_id === lowestCostRun.runId
                  return (
                    <TableCell key={r.run_id} className="px-4 py-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            isLowest && 'text-purple-600 dark:text-purple-400'
                          )}
                        >
                          {r.metrics.total_cost_usd != null
                            ? `$${r.metrics.total_cost_usd.toFixed(4)}`
                            : '—'}
                        </span>
                        {isLowest && selectedRuns.length > 1 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono px-1 py-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          >
                            Lowest
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* SECTION: Evaluator Pass Rates */}
              {allEvaluatorNames.length > 0 && (
                <>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell
                      colSpan={selectedRuns.length + 1}
                      className="px-4 py-2 font-semibold text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                    >
                      Evaluator Pass Rates
                    </TableCell>
                  </TableRow>

                  {allEvaluatorNames.map((name) => {
                    // Find max rate for this evaluator
                    const rates = selectedRuns.map(
                      (r) => r.metrics.pass_rates?.[name] ?? null
                    )
                    const maxRate = Math.max(
                      ...rates.filter((v): v is number => v != null)
                    )

                    return (
                      <TableRow key={`pass-${name}`} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 font-medium">
                          <span className="font-mono text-foreground">{name}</span>
                          <span className="text-[11px] text-muted-foreground ml-1 font-sans">
                            (pass rate)
                          </span>
                        </TableCell>

                        {selectedRuns.map((r, i) => {
                          const rate = r.metrics.pass_rates?.[name]
                          const baseRate = baselineRun.metrics.pass_rates?.[name]
                          const delta =
                            i > 0 && rate != null && baseRate != null
                              ? (rate - baseRate) * 100
                              : null
                          const isMax =
                            rate != null && rate === maxRate && selectedRuns.length > 1

                          return (
                            <TableCell key={r.run_id} className="px-4 py-3 text-right font-mono">
                              <div className="flex items-center justify-end gap-1.5">
                                {delta != null && delta !== 0 && (
                                  <span
                                    className={cn(
                                      'text-[10px]',
                                      delta > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    )}
                                  >
                                    {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    rate != null && isMax
                                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                      : 'text-foreground'
                                  )}
                                >
                                  {rate != null ? `${(rate * 100).toFixed(1)}%` : '—'}
                                </span>
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}

                  {/* SECTION: Evaluator Mean Scores */}
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell
                      colSpan={selectedRuns.length + 1}
                      className="px-4 py-2 font-semibold text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                    >
                      Evaluator Mean Scores (0.00 – 1.00)
                    </TableCell>
                  </TableRow>

                  {allEvaluatorNames.map((name) => {
                    const scores = selectedRuns.map(
                      (r) => r.metrics.mean_scores?.[name] ?? null
                    )
                    const maxScore = Math.max(
                      ...scores.filter((v): v is number => v != null)
                    )

                    return (
                      <TableRow key={`score-${name}`} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 font-medium">
                          <span className="font-mono text-foreground">{name}</span>
                          <span className="text-[11px] text-muted-foreground ml-1 font-sans">
                            (mean score)
                          </span>
                        </TableCell>

                        {selectedRuns.map((r, i) => {
                          const score = r.metrics.mean_scores?.[name]
                          const baseScore = baselineRun.metrics.mean_scores?.[name]
                          const delta =
                            i > 0 && score != null && baseScore != null
                              ? score - baseScore
                              : null
                          const isMax =
                            score != null && score === maxScore && selectedRuns.length > 1

                          return (
                            <TableCell key={r.run_id} className="px-4 py-3 text-right font-mono">
                              <div className="flex items-center justify-end gap-1.5">
                                {delta != null && Math.abs(delta) >= 0.01 && (
                                  <span
                                    className={cn(
                                      'text-[10px]',
                                      delta > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    )}
                                  >
                                    {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    score != null && isMax
                                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                      : 'text-foreground'
                                  )}
                                >
                                  {score != null ? score.toFixed(3) : '—'}
                                </span>
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
