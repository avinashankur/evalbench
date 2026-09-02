'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetRun, useGetRunResults } from '@/modules/runs'
import type { RunSummaryResponse } from '@/modules/runs'

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params)
  const { data: run, isLoading, isError, error } = useGetRun(runId)
  const [page, setPage] = useState(0)
  const pageSize = 20
  const { data: results } = useGetRunResults(runId, {
    offset: page * pageSize,
    limit: pageSize,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading run…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{error.message}</p>
  }

  if (!run) return null

  const isRunning = run.status === 'running'
  const isCompleted = run.status === 'completed'
  const summary = isCompleted ? (run as RunSummaryResponse) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/runs" className="rounded-md p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            Run {runId.slice(0, 8)}…
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isRunning
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : isCompleted
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isRunning && <RefreshCw className="h-3 w-3 animate-spin" />}
              {run.status}
            </span>
            {run.message && (
              <span className="text-sm text-muted-foreground">{run.message}</span>
            )}
          </div>
        </div>
      </div>

      {run.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {run.error}
        </div>
      )}

      {/* Metrics */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Dataset" value={summary.dataset_name} />
          <MetricCard label="Model" value={`${summary.provider}/${summary.model}`} />
          <MetricCard label="Test Cases" value={String(summary.total)} />
          <MetricCard
            label="Avg Latency"
            value={`${summary.metrics.mean_latency_ms.toFixed(0)}ms`}
          />
          <MetricCard label="Total Cost" value={`$${summary.metrics.total_cost_usd.toFixed(4)}`} />
          {Object.entries(summary.metrics.pass_rates).map(([name, rate]) => (
            <MetricCard key={name} label={`${name} pass rate`} value={`${(rate * 100).toFixed(1)}%`} />
          ))}
          {Object.entries(summary.metrics.mean_scores).map(([name, score]) => (
            <MetricCard key={name} label={`${name} mean score`} value={score.toFixed(3)} />
          ))}
        </div>
      )}

      {/* Results table */}
      {results && results.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Test Case Results ({results.total} total)
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Question</th>
                  <th className="px-4 py-3 text-left font-medium">Response</th>
                  <th className="px-4 py-3 text-left font-medium">Expected</th>
                  <th className="px-4 py-3 text-left font-medium">Evaluators</th>
                  <th className="px-4 py-3 text-right font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="max-w-48 truncate px-4 py-3">
                      {r.test_case.question}
                    </td>
                    <td className="max-w-48 truncate px-4 py-3">
                      {r.response.text}
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">
                      {r.test_case.expected_answer ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.eval_results.map((ev) => (
                          <span
                            key={ev.evaluator_name}
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              ev.status === 'passed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {ev.evaluator_name}: {ev.score.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.response.latency_ms.toFixed(0)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, results.total)} of{' '}
              {results.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= results.total}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
