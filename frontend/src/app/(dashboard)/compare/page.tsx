'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useListRuns } from '@/modules/runs'
import type { RunSummary } from '@/modules/runs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CompareHeader,
  RunSelectorPanel,
  MetricsComparisonTable,
  HeadToHeadBreakdown,
  CompareEmptyState,
} from './_components'

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { data, isLoading } = useListRuns({ limit: 100 })
  const allRuns: RunSummary[] = data?.runs ?? []

  // Initialize selected runs from URL
  const selectedFromUrl = React.useMemo(() => {
    const runsParam = searchParams.get('runs')
    if (runsParam) {
      return runsParam.split(',').filter(Boolean)
    }
    const r1 = searchParams.get('run1')
    const r2 = searchParams.get('run2')
    return [r1, r2].filter((id): id is string => Boolean(id))
  }, [searchParams])

  const [selectedIds, setSelectedIds] = React.useState<string[]>(selectedFromUrl)

  // Keep state and URL in sync
  React.useEffect(() => {
    setSelectedIds(selectedFromUrl)
  }, [selectedFromUrl])

  const updateUrl = React.useCallback(
    (newIds: string[]) => {
      setSelectedIds(newIds)
      const params = new URLSearchParams()
      if (newIds.length > 0) {
        params.set('runs', newIds.join(','))
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname]
  )

  function handleToggleRun(runId: string) {
    const next = selectedIds.includes(runId)
      ? selectedIds.filter((id) => id !== runId)
      : [...selectedIds, runId]
    updateUrl(next)
  }

  function handleRemoveRun(runId: string) {
    updateUrl(selectedIds.filter((id) => id !== runId))
  }

  function handleClearAll() {
    updateUrl([])
  }

  function handleSelectMultiple(runIds: string[]) {
    updateUrl(runIds)
  }

  function handleSwapRuns() {
    if (selectedIds.length === 2) {
      updateUrl([selectedIds[1], selectedIds[0]])
    }
  }

  // Preserve the user's selected ordering (selectedIds[0] is Baseline)
  const selectedRuns: RunSummary[] = React.useMemo(() => {
    const map = new Map<string, RunSummary>()
    allRuns.forEach((r) => map.set(r.run_id, r))
    return selectedIds
      .map((id) => map.get(id))
      .filter((r): r is RunSummary => Boolean(r))
  }, [allRuns, selectedIds])

  // Check if exactly 2 runs are selected on the same dataset
  const canShowHeadToHead =
    selectedRuns.length === 2 &&
    selectedRuns[0].dataset_name === selectedRuns[1].dataset_name

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Header & Selected Chips */}
      <CompareHeader
        selectedRuns={selectedRuns}
        onRemoveRun={handleRemoveRun}
        onClearAll={handleClearAll}
        onSwapRuns={selectedRuns.length === 2 ? handleSwapRuns : undefined}
      />

      {/* Run Selector Accordion / Panel */}
      <RunSelectorPanel
        allRuns={allRuns}
        selectedIds={selectedIds}
        isLoading={isLoading}
        onToggleRun={handleToggleRun}
        onSelectMultiple={handleSelectMultiple}
      />

      {/* Comparison Views */}
      {selectedRuns.length >= 2 ? (
        <div className="space-y-8">
          {/* 1. Multi-run Metrics Matrix & Winner Highlights */}
          <MetricsComparisonTable selectedRuns={selectedRuns} />

          {/* 2. Head-to-Head Test Case Breakdown (If 2 runs on same dataset) */}
          {canShowHeadToHead && (
            <HeadToHeadBreakdown
              runA={selectedRuns[0]}
              runB={selectedRuns[1]}
            />
          )}
        </div>
      ) : (
        <CompareEmptyState
          selectedCount={selectedRuns.length}
          allRuns={allRuns}
          onSelectRecent={handleSelectMultiple}
        />
      )}
    </div>
  )
}

function CompareSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function ComparePage() {
  return (
    <React.Suspense fallback={<CompareSkeleton />}>
      <CompareContent />
    </React.Suspense>
  )
}
