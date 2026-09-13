'use client'

import * as React from 'react'
import {
  Search,
  Filter,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'

interface RunSelectorPanelProps {
  allRuns: RunSummary[]
  selectedIds: string[]
  isLoading: boolean
  onToggleRun: (runId: string) => void
  onSelectMultiple: (runIds: string[]) => void
}

export function RunSelectorPanel({
  allRuns,
  selectedIds,
  isLoading,
  onToggleRun,
  onSelectMultiple,
}: RunSelectorPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedDataset, setSelectedDataset] = React.useState<string>('all')

  // Collect unique datasets
  const datasets = React.useMemo(() => {
    return Array.from(new Set(allRuns.map((r) => r.dataset_name))).filter(Boolean)
  }, [allRuns])

  // Filter runs by dataset and search query
  const filteredRuns = React.useMemo(() => {
    return allRuns.filter((run) => {
      if (selectedDataset !== 'all' && run.dataset_name !== selectedDataset) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const modelMatch = run.model.toLowerCase().includes(q)
        const providerMatch = run.provider.toLowerCase().includes(q)
        const datasetMatch = run.dataset_name.toLowerCase().includes(q)
        const idMatch = run.run_id.toLowerCase().includes(q)
        if (!modelMatch && !providerMatch && !datasetMatch && !idMatch) return false
      }
      return true
    })
  }, [allRuns, selectedDataset, searchQuery])

  function handleSelectAllVisible() {
    const visibleIds = filteredRuns.map((r) => r.run_id)
    const newSelected = Array.from(new Set([...selectedIds, ...visibleIds]))
    onSelectMultiple(newSelected)
  }

  function handleDeselectAllVisible() {
    const visibleSet = new Set(filteredRuns.map((r) => r.run_id))
    const newSelected = selectedIds.filter((id) => !visibleSet.has(id))
    onSelectMultiple(newSelected)
  }

  // Calculate average pass rate for a run
  function getAvgPassRate(run: RunSummary): number | null {
    const rates = Object.values(run.metrics.pass_rates)
    if (rates.length === 0) return null
    return rates.reduce((acc, v) => acc + v, 0) / rates.length
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all shadow-xs">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <span>Select Benchmark Runs</span>
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
          <Badge variant="secondary" className="text-[11px] font-mono font-normal">
            {selectedIds.length} of {allRuns.length} selected
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isExpanded && filteredRuns.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleSelectAllVisible}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Select Filtered ({filteredRuns.length})
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDeselectAllVisible}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Deselect Filtered
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expandable Picker Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Filters Bar: Search & Dataset Tabs */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Filter by model, provider, or dataset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Dataset Filter Pills */}
            {datasets.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 md:pt-0">
                <span className="text-[11px] text-muted-foreground font-mono mr-1">Dataset:</span>
                <button
                  type="button"
                  onClick={() => setSelectedDataset('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border',
                    selectedDataset === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                  )}
                >
                  All
                </button>
                {datasets.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDataset(d)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border',
                      selectedDataset === d
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Runs Grid / List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl space-y-1">
              <Filter className="size-5 mx-auto opacity-40 mb-1" />
              <p className="font-medium">No benchmark runs match criteria</p>
              <p className="opacity-75">Try clearing your search query or dataset filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredRuns.map((run) => {
                const isSelected = selectedIds.includes(run.run_id)
                const passRate = getAvgPassRate(run)

                return (
                  <div
                    key={run.run_id}
                    onClick={() => onToggleRun(run.run_id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-left',
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-2xs'
                        : 'border-border/60 bg-muted/30 hover:bg-muted/60'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleRun(run.run_id)}
                      className="mt-1"
                    />

                    <div className="flex flex-col min-w-0 flex-1 gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate" title={run.model}>
                          {run.model}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 shrink-0">
                          {run.provider}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span className="truncate" title={run.dataset_name}>
                          {run.dataset_name}
                        </span>
                        <span>•</span>
                        <span>{run.total_test_cases} cases</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                        <span className="text-muted-foreground">
                          {new Date(run.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {passRate != null && (
                          <span
                            className={cn(
                              'font-semibold',
                              passRate >= 0.8
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : passRate >= 0.5
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {(passRate * 100).toFixed(1)}% pass
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
