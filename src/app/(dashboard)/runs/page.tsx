'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Search, Play } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RunDetailDrawer } from '@/components/dashboard/run-detail-drawer'
import { useListRuns, useDeleteRun, type RunSummary } from '@/modules/runs'
import { cn } from '@/lib/utils'
import {
  RunsHeader,
  RunsMetricsStrip,
  RunsToolbar,
  RunsTable,
  RunsDeleteDialog,
  type SortOption,
} from './_components'

export default function RunsPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useListRuns({ limit: 100 })
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteRun()

  // State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [datasetFilter, setDatasetFilter] = React.useState('All')
  const [providerFilter, setProviderFilter] = React.useState('All')
  const [sortBy, setSortBy] = React.useState<SortOption>('newest')

  // Slide-over drawer and delete modal states
  const [selectedRunForDrawer, setSelectedRunForDrawer] = React.useState<RunSummary | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [runToDelete, setRunToDelete] = React.useState<RunSummary | null>(null)

  // Derived datasets
  const availableDatasets = React.useMemo(() => {
    if (!data?.runs || data.runs.length === 0) return ['All']
    const unique = Array.from(new Set(data.runs.map((r) => r.dataset_name)))
    return ['All', ...unique]
  }, [data?.runs])

  // Derived providers
  const availableProviders = React.useMemo(() => {
    if (!data?.runs || data.runs.length === 0) return ['All']
    const unique = Array.from(new Set(data.runs.map((r) => r.provider)))
    return ['All', ...unique]
  }, [data?.runs])

  // Aggregate KPI stats
  const stats = React.useMemo(() => {
    const runs = data?.runs || []
    return {
      totalExecutions: runs.length,
      uniqueDatasets: new Set(runs.map((r) => r.dataset_name)).size,
      uniqueModels: new Set(runs.map((r) => `${r.provider}/${r.model}`)).size,
      totalTestCases: runs.reduce((acc, r) => acc + (r.total_test_cases || 0), 0),
    }
  }, [data?.runs])

  // Filtered and sorted runs
  const filteredRuns = React.useMemo(() => {
    if (!data?.runs) return []
    let list = [...data.runs]

    if (datasetFilter !== 'All') {
      list = list.filter((r) => r.dataset_name === datasetFilter)
    }

    if (providerFilter !== 'All') {
      list = list.filter((r) => r.provider.toLowerCase() === providerFilter.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (r) =>
          r.run_id.toLowerCase().includes(q) ||
          r.dataset_name.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'latency') {
        return (a.metrics.mean_latency_ms || 0) - (b.metrics.mean_latency_ms || 0)
      }
      if (sortBy === 'cases') {
        return (b.total_test_cases || 0) - (a.total_test_cases || 0)
      }
      if (sortBy === 'score') {
        const getScore = (r: RunSummary) => {
          const s = Object.values(r.metrics.mean_scores || {})
          if (s.length > 0) return s.reduce((sum, v) => sum + v, 0) / s.length
          const p = Object.values(r.metrics.pass_rates || {})
          if (p.length > 0) return p.reduce((sum, v) => sum + v, 0) / p.length
          return 0
        }
        return getScore(b) - getScore(a)
      }
      return 0
    })

    return list
  }, [data?.runs, datasetFilter, providerFilter, searchQuery, sortBy])

  const isFiltered =
    searchQuery !== '' || datasetFilter !== 'All' || providerFilter !== 'All' || sortBy !== 'newest'

  function handleResetFilters() {
    setSearchQuery('')
    setDatasetFilter('All')
    setProviderFilter('All')
    setSortBy('newest')
  }

  function handleInspectRun(run: RunSummary) {
    setSelectedRunForDrawer(run)
    setIsDrawerOpen(true)
  }

  function handleConfirmDelete() {
    if (!runToDelete) return
    deleteMutate(runToDelete.run_id, {
      onSettled: () => setRunToDelete(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <RunsHeader onRefresh={() => refetch()} isRefetching={isRefetching} />

      <RunsMetricsStrip
        stats={stats}
        isFiltered={isFiltered}
        filteredCount={filteredRuns.length}
      />

      <RunsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        datasetFilter={datasetFilter}
        onDatasetFilterChange={setDatasetFilter}
        providerFilter={providerFilter}
        onProviderFilterChange={setProviderFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        availableDatasets={availableDatasets}
        availableProviders={availableProviders}
        totalCount={data?.runs.length ?? 0}
        filteredCount={filteredRuns.length}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load evaluation runs</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 text-xs">
            Retry
          </Button>
        </div>
      ) : !data?.runs.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-12 text-center shadow-xs">
          <div className="rounded-full bg-muted p-3.5 text-muted-foreground mb-3">
            <Play className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No evaluation runs yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Launch your first benchmark evaluation run to compare model performance, accuracy, latency, and cost.
          </p>
          <Link
            href="/runs/new"
            className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'mt-5 text-xs font-medium')}
          >
            <Plus data-icon="inline-start" className="size-3.5" />
            Launch Evaluation
          </Link>
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-12 text-center shadow-xs">
          <div className="rounded-full bg-muted p-3.5 text-muted-foreground mb-3">
            <Search className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No matching runs</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            No evaluation runs matched your active filter or search query.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 text-xs">
            Clear all filters
          </Button>
        </div>
      ) : (
        <RunsTable
          runs={filteredRuns}
          onInspectRun={handleInspectRun}
          onDeleteClick={setRunToDelete}
        />
      )}

      <RunDetailDrawer
        run={selectedRunForDrawer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <RunsDeleteDialog
        run={runToDelete}
        isOpen={!!runToDelete}
        isDeleting={isDeleting}
        onClose={() => setRunToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
