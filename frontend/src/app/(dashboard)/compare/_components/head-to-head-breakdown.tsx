'use client'

import * as React from 'react'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Filter,
  Columns2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useGetRunResults } from '@/modules/runs'
import type { RunSummary, TestCaseResult } from '@/modules/runs'

interface HeadToHeadBreakdownProps {
  runA: RunSummary
  runB: RunSummary
}

type OutcomeFilter = 'all' | 'regressions' | 'improvements' | 'disagreements'

interface MatchedPair {
  id: string
  question: string
  expectedAnswer?: string
  resultA: TestCaseResult
  resultB: TestCaseResult
  passA: boolean
  passB: boolean
  outcome: 'both_passed' | 'both_failed' | 'regression' | 'improvement'
}

export function HeadToHeadBreakdown({ runA, runB }: HeadToHeadBreakdownProps) {
  const [filter, setFilter] = React.useState<OutcomeFilter>('disagreements')
  const [expandedPairId, setExpandedPairId] = React.useState<string | null>(null)

  // Fetch results for both runs
  const { data: resultsA, isLoading: isLoadingA } = useGetRunResults(runA.run_id, {
    limit: 100,
  })
  const { data: resultsB, isLoading: isLoadingB } = useGetRunResults(runB.run_id, {
    limit: 100,
  })

  // Match test cases between runs
  const matchedPairs: MatchedPair[] = React.useMemo(() => {
    if (!resultsA?.results || !resultsB?.results) return []

    const mapB = new Map<string, TestCaseResult>()
    resultsB.results.forEach((item, index) => {
      const key = item.test_case.id || item.test_case.question || String(index)
      mapB.set(key, item)
    })

    const pairs: MatchedPair[] = []

    resultsA.results.forEach((itemA, indexA) => {
      const key = itemA.test_case.id || itemA.test_case.question || String(indexA)
      const itemB = mapB.get(key) || resultsB.results[indexA]

      if (itemB) {
        const passA = itemA.eval_results.every((e) => e.status === 'passed')
        const passB = itemB.eval_results.every((e) => e.status === 'passed')

        let outcome: MatchedPair['outcome'] = 'both_passed'
        if (passA && !passB) {
          outcome = 'regression'
        } else if (!passA && passB) {
          outcome = 'improvement'
        } else if (!passA && !passB) {
          outcome = 'both_failed'
        }

        pairs.push({
          id: key,
          question: itemA.test_case.question,
          expectedAnswer: itemA.test_case.expected_answer || undefined,
          resultA: itemA,
          resultB: itemB,
          passA,
          passB,
          outcome,
        })
      }
    })

    return pairs
  }, [resultsA, resultsB])

  // Count stats
  const stats = React.useMemo(() => {
    let regressions = 0
    let improvements = 0
    let bothPassed = 0
    let bothFailed = 0

    matchedPairs.forEach((p) => {
      if (p.outcome === 'regression') regressions++
      else if (p.outcome === 'improvement') improvements++
      else if (p.outcome === 'both_passed') bothPassed++
      else if (p.outcome === 'both_failed') bothFailed++
    })

    return {
      total: matchedPairs.length,
      regressions,
      improvements,
      disagreements: regressions + improvements,
      bothPassed,
      bothFailed,
    }
  }, [matchedPairs])

  // Filtered pairs
  const filteredPairs = React.useMemo(() => {
    return matchedPairs.filter((p) => {
      if (filter === 'regressions') return p.outcome === 'regression'
      if (filter === 'improvements') return p.outcome === 'improvement'
      if (filter === 'disagreements')
        return p.outcome === 'regression' || p.outcome === 'improvement'
      return true
    })
  }, [matchedPairs, filter])

  const isLoading = isLoadingA || isLoadingB

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-56 rounded-md" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (matchedPairs.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs space-y-4 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Head-to-Head Case Analysis
            </h3>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {stats.total} matched cases
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Comparing <span className="font-semibold text-foreground">{runA.model}</span> (Baseline) vs{' '}
            <span className="font-semibold text-foreground">{runB.model}</span> (Candidate)
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="inline-flex items-center p-0.5 rounded-lg border border-border/60 bg-muted/40 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('disagreements')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
              filter === 'disagreements'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Disagreements ({stats.disagreements})
          </button>
          <button
            type="button"
            onClick={() => setFilter('regressions')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
              filter === 'regressions'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Regressions ({stats.regressions})
          </button>
          <button
            type="button"
            onClick={() => setFilter('improvements')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
              filter === 'improvements'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Improvements ({stats.improvements})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
              filter === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All ({stats.total})
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="size-3.5 text-rose-500" />
            <span className="text-muted-foreground font-sans text-[11px]">Regressions</span>
          </div>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            {stats.regressions}
          </span>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-emerald-500" />
            <span className="text-muted-foreground font-sans text-[11px]">Improvements</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {stats.improvements}
          </span>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-sans text-[11px]">Both Passed</span>
          </div>
          <span className="font-semibold text-foreground">{stats.bothPassed}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <XCircle className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-sans text-[11px]">Both Failed</span>
          </div>
          <span className="font-semibold text-foreground">{stats.bothFailed}</span>
        </div>
      </div>

      {/* Head to Head Table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b border-border/60 text-xs">
              <TableHead className="w-12 text-center font-mono">#</TableHead>
              <TableHead className="w-28 text-center font-mono">Change</TableHead>
              <TableHead className="min-w-[240px] text-left">Test Prompt</TableHead>
              <TableHead className="w-36 text-center font-mono">{runA.model}</TableHead>
              <TableHead className="w-36 text-center font-mono">{runB.model}</TableHead>
              <TableHead className="w-20 text-right"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/40 text-xs">
            {filteredPairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Filter className="size-4 opacity-40" />
                    <span>No test cases found matching this filter</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPairs.map((pair, idx) => {
                const isExpanded = expandedPairId === pair.id

                return (
                  <React.Fragment key={pair.id}>
                    <TableRow
                      onClick={() =>
                        setExpandedPairId(isExpanded ? null : pair.id)
                      }
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/40',
                        pair.outcome === 'regression' && 'bg-rose-500/5',
                        pair.outcome === 'improvement' && 'bg-emerald-500/5'
                      )}
                    >
                      {/* Row Index */}
                      <TableCell className="text-center font-mono text-muted-foreground text-[11px]">
                        {idx + 1}
                      </TableCell>

                      {/* Outcome Badge */}
                      <TableCell className="text-center">
                        {pair.outcome === 'regression' && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 gap-1"
                          >
                            <TrendingDown className="size-2.5" />
                            <span>Regression</span>
                          </Badge>
                        )}
                        {pair.outcome === 'improvement' && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1"
                          >
                            <TrendingUp className="size-2.5" />
                            <span>Improved</span>
                          </Badge>
                        )}
                        {pair.outcome === 'both_passed' && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-muted-foreground">
                            Both Passed
                          </Badge>
                        )}
                        {pair.outcome === 'both_failed' && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-muted-foreground">
                            Both Failed
                          </Badge>
                        )}
                      </TableCell>

                      {/* Question */}
                      <TableCell className="font-sans text-foreground max-w-sm truncate">
                        {pair.question}
                      </TableCell>

                      {/* Model A Result */}
                      <TableCell className="text-center font-mono">
                        <div className="inline-flex items-center gap-1.5">
                          {pair.passA ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="size-3.5 text-rose-500" />
                          )}
                          <span>
                            {pair.resultA.eval_results[0]?.score != null
                              ? pair.resultA.eval_results[0].score.toFixed(2)
                              : pair.passA
                                ? 'Pass'
                                : 'Fail'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Model B Result */}
                      <TableCell className="text-center font-mono">
                        <div className="inline-flex items-center gap-1.5">
                          {pair.passB ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="size-3.5 text-rose-500" />
                          )}
                          <span>
                            {pair.resultB.eval_results[0]?.score != null
                              ? pair.resultB.eval_results[0].score.toFixed(2)
                              : pair.passB
                                ? 'Pass'
                                : 'Fail'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Expand Chevron */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground"
                          aria-label="Toggle response comparison"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Side-by-Side Outputs Row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-3">
                            <div className="text-xs font-semibold text-foreground">
                              Prompt: <span className="font-normal font-sans text-muted-foreground">{pair.question}</span>
                            </div>

                            {pair.expectedAnswer && (
                              <div className="text-xs font-mono p-3 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground">
                                <span className="font-semibold text-[10px] uppercase font-sans text-foreground block mb-1">
                                  Expected Answer
                                </span>
                                {pair.expectedAnswer}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {/* Model A Output */}
                              <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                                <div className="flex items-center justify-between font-mono text-xs border-b border-border/40 pb-2">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    {pair.passA ? (
                                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    ) : (
                                      <XCircle className="size-3.5 text-rose-500" />
                                    )}
                                    <span>{runA.model}</span>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">
                                    {pair.resultA.response.latency_ms.toFixed(0)} ms
                                  </span>
                                </div>
                                <div className="font-mono text-xs text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                                  {pair.resultA.response.text || <span className="italic text-muted-foreground">Empty</span>}
                                </div>
                              </div>

                              {/* Model B Output */}
                              <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                                <div className="flex items-center justify-between font-mono text-xs border-b border-border/40 pb-2">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    {pair.passB ? (
                                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    ) : (
                                      <XCircle className="size-3.5 text-rose-500" />
                                    )}
                                    <span>{runB.model}</span>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">
                                    {pair.resultB.response.latency_ms.toFixed(0)} ms
                                  </span>
                                </div>
                                <div className="font-mono text-xs text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                                  {pair.resultB.response.text || <span className="italic text-muted-foreground">Empty</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
