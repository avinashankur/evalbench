'use client'

import * as React from 'react'
import { GitCompare, PlusCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RunSummary } from '@/modules/runs'

interface CompareEmptyStateProps {
  selectedCount: number
  allRuns: RunSummary[]
  onSelectRecent: (runIds: string[]) => void
}

export function CompareEmptyState({
  selectedCount,
  allRuns,
  onSelectRecent,
}: CompareEmptyStateProps) {
  function handleSelectTwoRecent() {
    if (allRuns.length >= 2) {
      onSelectRecent([allRuns[0].run_id, allRuns[1].run_id])
    } else if (allRuns.length === 1) {
      onSelectRecent([allRuns[0].run_id])
    }
  }

  if (selectedCount === 1) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="size-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
          <PlusCircle className="size-5" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-semibold text-foreground">
            Select One More Run to Compare
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You have selected 1 run. Choose at least one more benchmark run above—preferably evaluated on the same dataset—to unlock side-by-side metric diffs and regression analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="size-12 rounded-2xl bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground shadow-xs">
        <GitCompare className="size-6" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-semibold text-foreground">
          No Benchmark Runs Selected
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select two or more benchmark runs from the picker above to compare pass rates, mean scores, latency, and cost side-by-side.
        </p>
      </div>

      {allRuns.length >= 2 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectTwoRecent}
          className="text-xs gap-1.5 border-border/70 hover:bg-muted cursor-pointer"
        >
          <span>Compare 2 Most Recent Runs</span>
          <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
