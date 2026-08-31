'use client'

import { useState } from 'react'
import { useListRuns } from '@/modules/runs'
import type { RunSummary } from '@/modules/runs'

export default function ComparePage() {
  const { data, isLoading } = useListRuns()
  const [selected, setSelected] = useState<string[]>([])

  function toggleRun(runId: string) {
    setSelected((prev) =>
      prev.includes(runId) ? prev.filter((id) => id !== runId) : [...prev, runId],
    )
  }

  const selectedRuns: RunSummary[] =
    data?.runs.filter((r) => selected.includes(r.run_id)) ?? []

  const allEvaluatorNames = [
    ...new Set(selectedRuns.flatMap((r) => Object.keys(r.metrics.pass_rates))),
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Compare Runs</h1>
        <p className="text-muted-foreground">
          Select runs to compare their metrics side by side.
        </p>
      </div>

      {/* Run selector */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-3 font-semibold">Select Runs</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {data?.runs.map((run) => (
              <label
                key={run.run_id}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(run.run_id)}
                  onChange={() => toggleRun(run.run_id)}
                  className="rounded border"
                />
                <span className="text-sm">
                  {run.dataset_name} — {run.provider}/{run.model}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleDateString()}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Comparison table */}
      {selectedRuns.length >= 2 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Metric</th>
                {selectedRuns.map((r) => (
                  <th key={r.run_id} className="px-4 py-3 text-right font-medium">
                    {r.dataset_name}
                    <br />
                    <span className="font-normal text-muted-foreground">
                      {r.provider}/{r.model}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium">Test Cases</td>
                {selectedRuns.map((r) => (
                  <td key={r.run_id} className="px-4 py-3 text-right font-mono">
                    {r.total_test_cases}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium">Avg Latency</td>
                {selectedRuns.map((r) => (
                  <td key={r.run_id} className="px-4 py-3 text-right font-mono">
                    {r.metrics.mean_latency_ms.toFixed(0)}ms
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium">Total Cost</td>
                {selectedRuns.map((r) => (
                  <td key={r.run_id} className="px-4 py-3 text-right font-mono">
                    ${r.metrics.total_cost_usd.toFixed(4)}
                  </td>
                ))}
              </tr>
              {allEvaluatorNames.map((name) => (
                <tr key={name} className="border-b">
                  <td className="px-4 py-3 font-medium">{name} (pass rate)</td>
                  {selectedRuns.map((r) => (
                    <td key={r.run_id} className="px-4 py-3 text-right font-mono">
                      {r.metrics.pass_rates[name] != null
                        ? `${(r.metrics.pass_rates[name] * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRuns.length === 1 && (
        <p className="text-sm text-muted-foreground">
          Select at least 2 runs to compare.
        </p>
      )}
    </div>
  )
}
