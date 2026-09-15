'use client'

import * as React from 'react'
import { use } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetRun, useGetRunResults } from '@/modules/runs'
import type { RunSummaryResponse, TestCaseResult } from '@/modules/runs'
import {
  RunDetailSkeleton,
  RunDetailHeader,
  RunMetricsOverview,
  TestCasesTable,
  TestCaseSheet,
} from './_components'

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = use(params)
  const {
    data: run,
    isLoading,
    isError,
    error,
    refetch: refetchRun,
    isRefetching: isRefetchingRun,
  } = useGetRun(runId)

  const [page, setPage] = React.useState(0)
  const pageSize = 20

  const {
    data: results,
    isLoading: isLoadingResults,
    refetch: refetchResults,
    isRefetching: isRefetchingResults,
  } = useGetRunResults(runId, {
    offset: page * pageSize,
    limit: pageSize,
  })

  // Selected test case for sleek slide-over inspection
  const [selectedTestCase, setSelectedTestCase] = React.useState<TestCaseResult | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  function handleSelectTestCase(item: TestCaseResult, globalIndex: number) {
    setSelectedTestCase(item)
    setSelectedIndex(globalIndex)
    setSheetOpen(true)
  }

  function handleRefreshAll() {
    refetchRun()
    refetchResults()
  }

  const isRefetching = isRefetchingRun || isRefetchingResults

  if (isLoading) {
    return <RunDetailSkeleton />
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center gap-3">
        <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-destructive">
            Failed to Load Evaluation Run
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            {error?.message || 'An unexpected error occurred while fetching run details.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchRun()}
          className="mt-2 text-xs gap-1.5 cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    )
  }

  if (!run) return null

  const isRunning = run.status === 'running'
  const isCompleted = run.status === 'completed'
  const isFailed = run.status === 'failed'
  const summary = isCompleted ? (run as RunSummaryResponse) : null

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Run Header */}
      <RunDetailHeader
        runId={runId}
        run={run}
        onRefresh={handleRefreshAll}
        isRefetching={isRefetching}
      />

      {/* Live Polling Alert Banner (if actively running) */}
      {isRunning && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-brand"></span>
            </span>
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="font-semibold text-foreground">
                Evaluation currently in progress:
              </span>
              <span className="text-muted-foreground truncate">
                {run.message || 'Worker processing test cases across model endpoints…'}
              </span>
            </div>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            auto-refreshing every 3s
          </span>
        </div>
      )}

      {/* Error Banner (if run failed) */}
      {isFailed && run.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-2 text-xs text-destructive">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Execution Failure Message</span>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-destructive/20 bg-background/80 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
            {run.error}
          </pre>
        </div>
      )}

      {/* Benchmark Metrics Strip */}
      {summary && <RunMetricsOverview summary={summary} />}

      {/* Test Cases Table */}
      <TestCasesTable
        results={results?.results ?? []}
        total={results?.total ?? 0}
        isLoading={isLoadingResults}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSelectTestCase={handleSelectTestCase}
      />

      {/* Sleek, Minimalist Test Case Inspection Sheet */}
      <TestCaseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        testCaseResult={selectedTestCase}
        index={selectedIndex}
        runId={runId}
      />
    </div>
  )
}
