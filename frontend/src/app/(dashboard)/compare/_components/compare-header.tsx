'use client'

import * as React from 'react'
import {
  Share2,
  X,
  RotateCcw,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RunSummary } from '@/modules/runs'

interface CompareHeaderProps {
  selectedRuns: RunSummary[]
  onRemoveRun: (runId: string) => void
  onClearAll: () => void
  onSwapRuns?: () => void
}

export function CompareHeader({
  selectedRuns,
  onRemoveRun,
  onClearAll,
  onSwapRuns,
}: CompareHeaderProps) {
  function handleShareLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Comparison link copied to clipboard')
    }
  }

  // Check if selected runs are on different datasets
  const uniqueDatasets = Array.from(new Set(selectedRuns.map((r) => r.dataset_name)))
  const hasMultipleDatasets = uniqueDatasets.length > 1

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Compare Models
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {selectedRuns.length} selected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Side-by-side benchmark performance, latency, cost, and regression analysis across evaluation runs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedRuns.length === 2 && onSwapRuns && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwapRuns}
              className="text-xs gap-1.5 border-border/70 cursor-pointer"
              title="Swap Baseline and Candidate model order"
            >
              <ArrowLeftRight className="size-3.5" />
              <span className="hidden sm:inline">Swap Baseline</span>
            </Button>
          )}

          {selectedRuns.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="text-xs gap-1.5 border-border/70 cursor-pointer"
              title="Copy shareable URL"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </Button>
          )}

          {selectedRuns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Selected Run Pills Strip */}
      {selectedRuns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase mr-1">
            Comparing:
          </span>
          {selectedRuns.map((run, idx) => (
            <div
              key={run.run_id}
              className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg border border-border/70 bg-card text-xs font-mono shadow-2xs"
            >
              <span className="font-semibold text-muted-foreground text-[11px]">
                #{idx + 1}
              </span>
              <span className="font-medium text-foreground truncate max-w-[140px]" title={run.model}>
                {run.model}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-sans">
                {run.dataset_name}
              </Badge>
              <button
                type="button"
                onClick={() => onRemoveRun(run.run_id)}
                className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={`Remove ${run.model} from comparison`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cross-Dataset Warning Banner */}
      {hasMultipleDatasets && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Cross-Dataset Comparison Detected:</span>
            <p className="opacity-90">
              Selected runs evaluate different datasets ({uniqueDatasets.join(', ')}). Test questions and evaluators differ, so accuracy metrics are not directly comparable.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
