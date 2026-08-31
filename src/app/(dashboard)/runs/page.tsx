'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { useListRuns, useDeleteRun } from '@/modules/runs'

export default function RunsPage() {
  const [datasetFilter, setDatasetFilter] = useState('')
  const { data, isLoading, isError, error } = useListRuns(
    datasetFilter ? { dataset_name: datasetFilter } : undefined,
  )
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteRun()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Runs</h1>
          <p className="text-muted-foreground">All evaluation runs stored in the system.</p>
        </div>
        <Link
          href="/runs/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Run
        </Link>
      </div>

      <div>
        <input
          type="text"
          placeholder="Filter by dataset name…"
          value={datasetFilter}
          onChange={(e) => setDatasetFilter(e.target.value)}
          className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading runs…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : !data?.runs.length ? (
        <p className="text-sm text-muted-foreground">No runs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Dataset</th>
                <th className="px-4 py-3 text-left font-medium">Model</th>
                <th className="px-4 py-3 text-right font-medium">Cases</th>
                <th className="px-4 py-3 text-right font-medium">Pass Rates</th>
                <th className="px-4 py-3 text-right font-medium">Latency</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => (
                <tr key={run.run_id} className="border-b transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/runs/${run.run_id}`} className="text-primary hover:underline">
                      {run.dataset_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {run.provider}/{run.model}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{run.total_test_cases}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {Object.entries(run.metrics.pass_rates)
                      .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {run.metrics.mean_latency_ms.toFixed(0)}ms
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${run.metrics.total_cost_usd.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMutate(run.run_id)}
                      disabled={isDeleting}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Delete run"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
