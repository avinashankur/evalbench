'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TestCaseResult } from '@/modules/runs'

interface TestCasesTableProps {
  results: TestCaseResult[]
  total: number
  isLoading?: boolean
  page: number
  pageSize: number
  onPageChange: (newPage: number) => void
  onSelectTestCase: (testCase: TestCaseResult, index: number) => void
}

type StatusFilter = 'all' | 'passed' | 'failed'

export function TestCasesTable({
  results,
  total,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onSelectTestCase,
}: TestCasesTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  // Client-side filtering
  const filteredResults = React.useMemo(() => {
    return results.filter((item) => {
      const allPassed = item.eval_results.every((e) => e.status === 'passed')
      const hasFailed = item.eval_results.some((e) => e.status === 'failed')

      if (statusFilter === 'passed' && !allPassed) return false
      if (statusFilter === 'failed' && !hasFailed) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const qMatch = item.test_case.question.toLowerCase().includes(query)
        const rMatch = item.response.text?.toLowerCase().includes(query) ?? false
        const eMatch = item.test_case.expected_answer?.toLowerCase().includes(query) ?? false
        if (!qMatch && !rMatch && !eMatch) return false
      }

      return true
    })
  }, [results, statusFilter, searchQuery])

  // Status counts
  const passedCount = results.filter((i) =>
    i.eval_results.every((e) => e.status === 'passed')
  ).length
  const failedCount = results.filter((i) =>
    i.eval_results.some((e) => e.status === 'failed')
  ).length

  const startRecord = page * pageSize + 1
  const endRecord = Math.min((page + 1) * pageSize, total)

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Test Cases
          </h2>
          <Badge variant="outline" className="text-xs font-mono font-normal">
            {total}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex p-1 rounded-lg bg-muted/80 border border-border/50 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All ({results.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('passed')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === 'passed'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Passed ({passedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('failed')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === 'failed'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <XCircle className="size-3 text-rose-500" />
              <span>Failed ({failedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter test cases…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs w-48 sm:w-56 font-mono bg-background border-border/70"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 text-center text-xs font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="w-20 text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground min-w-[220px]">
                Question / Prompt
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground min-w-[240px]">
                Model Output
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground hidden md:table-cell min-w-[160px]">
                Expected Target
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground min-w-[140px]">
                Evaluator Scores
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right hidden sm:table-cell w-20">
                Latency
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-4 mx-auto rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-52 rounded" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-32 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 rounded" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    <Skeleton className="h-4 w-10 ml-auto rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : total === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Filter className="size-5 opacity-40" />
                    <p className="text-xs font-medium">No test cases recorded yet</p>
                    <p className="text-[11px] opacity-70">
                      Results will appear here once evaluation items are finished
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Filter className="size-5 opacity-40" />
                    <p className="text-xs font-medium">No test cases match filter</p>
                    <p className="text-[11px] opacity-70">
                      Try clearing your search query or filter
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((item, i) => {
                const globalIndex = page * pageSize + i
                const allPassed = item.eval_results.every((e) => e.status === 'passed')
                const hasFailed = item.eval_results.some((e) => e.status === 'failed')

                return (
                  <TableRow
                    key={item.test_case.id || i}
                    onClick={() => onSelectTestCase(item, globalIndex)}
                    className="border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {/* Index */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {globalIndex + 1}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0 border',
                          allPassed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : hasFailed
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        )}
                      >
                        {allPassed ? 'Passed' : hasFailed ? 'Failed' : 'Partial'}
                      </Badge>
                    </TableCell>

                    {/* Question */}
                    <TableCell className="max-w-[220px] font-medium text-xs text-foreground truncate">
                      <span title={item.test_case.question}>
                        {item.test_case.question}
                      </span>
                    </TableCell>

                    {/* Output Preview */}
                    <TableCell className="max-w-[240px] font-mono text-xs text-muted-foreground truncate">
                      <span title={item.response.text}>
                        {item.response.text || <span className="italic">Empty</span>}
                      </span>
                    </TableCell>

                    {/* Expected Answer Preview */}
                    <TableCell className="max-w-[160px] font-mono text-xs text-muted-foreground/80 truncate hidden md:table-cell">
                      <span title={item.test_case.expected_answer ?? '—'}>
                        {item.test_case.expected_answer ?? '—'}
                      </span>
                    </TableCell>

                    {/* Evaluator Verdict Badges */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {item.eval_results.map((ev) => (
                          <span
                            key={ev.evaluator_name}
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0 rounded border',
                              ev.status === 'passed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            )}
                          >
                            {ev.evaluator_name}: {ev.score.toFixed(1)}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Latency */}
                    <TableCell className="text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="size-3 opacity-60" />
                        <span>{item.response.latency_ms.toFixed(0)}ms</span>
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-muted-foreground font-mono text-[11px]">
            Showing <span className="font-semibold text-foreground">{startRecord}</span>–
            <span className="font-semibold text-foreground">{endRecord}</span> of{' '}
            <span className="font-semibold text-foreground">{total}</span> test cases
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="h-7 text-xs font-medium cursor-pointer shadow-2xs"
            >
              Previous
            </Button>

            <span className="text-[11px] font-mono text-muted-foreground px-1.5">
              Page {page + 1} of {Math.ceil(total / pageSize) || 1}
            </span>

            <Button
              variant="outline"
              size="xs"
              onClick={() => onPageChange(page + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="h-7 text-xs font-medium cursor-pointer shadow-2xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
