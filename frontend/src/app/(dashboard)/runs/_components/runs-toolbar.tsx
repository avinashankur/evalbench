'use client'

import * as React from 'react'
import {
  Search,
  X,
  RotateCcw,
  ArrowUpDown,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { SORT_LABELS, type SortOption } from './types'

interface RunsToolbarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  datasetFilter: string
  onDatasetFilterChange: (ds: string) => void
  providerFilter: string
  onProviderFilterChange: (p: string) => void
  sortBy: SortOption
  onSortByChange: (s: SortOption) => void
  availableDatasets: string[]
  availableProviders: string[]
  totalCount: number
  filteredCount: number
  isFiltered: boolean
  onResetFilters: () => void
}

export function RunsToolbar({
  searchQuery,
  onSearchChange,
  datasetFilter,
  onDatasetFilterChange,
  providerFilter,
  onProviderFilterChange,
  sortBy,
  onSortByChange,
  availableDatasets,
  availableProviders,
  totalCount,
  filteredCount,
  isFiltered,
  onResetFilters,
}: RunsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by run ID, dataset, model, provider…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0 focus-visible:shadow-none dark:bg-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right controls: Provider filter, Sort, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2"
              aria-label="Filter by provider"
            >
              <Filter className="size-3.5 text-muted-foreground" />
              <span>Provider: {providerFilter === 'All' ? 'All' : providerFilter}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel className="text-[11px]">Filter by Provider</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onProviderFilterChange('All')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>All Providers</span>
                {providerFilter === 'All' && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
              {availableProviders
                .filter((p) => p !== 'All')
                .map((prov) => (
                  <DropdownMenuItem
                    key={prov}
                    onClick={() => onProviderFilterChange(prov)}
                    className="flex items-center justify-between text-xs capitalize cursor-pointer"
                  >
                    <span>{prov}</span>
                    {providerFilter === prov && <Check className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2"
              aria-label="Sort runs"
            >
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <span>Sort: {SORT_LABELS[sortBy]}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-[11px]">Sort Evaluations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => onSortByChange(opt)}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>{SORT_LABELS[opt]}</span>
                  {sortBy === opt && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset filters button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onResetFilters}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw data-icon="inline-start" className="size-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Dataset filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground font-medium pr-1 text-xs">Dataset:</span>
          {availableDatasets.map((ds) => (
            <button
              key={ds}
              type="button"
              onClick={() => onDatasetFilterChange(ds)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                datasetFilter === ds
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              {ds}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground font-mono">
          Showing {filteredCount} of {totalCount} runs
        </span>
      </div>
    </div>
  )
}
