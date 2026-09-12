'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  FileCode,
  Sliders,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { JobStatusBadge } from './job-status-badge'
import type { JobHistoryItem } from './types'

interface JobQueueTableProps {
  history: JobHistoryItem[]
  activeJobId: string
  onSelectJob: (jobId: string) => void
  onRemoveJob: (jobId: string) => void
  onClearHistory: () => void
  onOpenDispatch: () => void
}

type StatusFilter = 'all' | 'running' | 'completed' | 'failed'

export function JobQueueTable({
  history,
  activeJobId,
  onSelectJob,
  onRemoveJob,
  onClearHistory,
  onOpenDispatch,
}: JobQueueTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  function handleCopy(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Job ID copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered jobs
  const filteredHistory = React.useMemo(() => {
    return history.filter((job) => {
      // Status filter
      if (statusFilter === 'running') {
        if (job.status !== 'running' && job.status !== 'queued') return false
      } else if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false
      }

      // Query filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchesId = job.job_id.toLowerCase().includes(q)
      const matchesConfig = (job.config_path || '').toLowerCase().includes(q)
      const matchesRun = (job.run_id || '').toLowerCase().includes(q)

      return matchesId || matchesConfig || matchesRun
    })
  }, [history, statusFilter, searchQuery])

  // Status counts
  const counts = React.useMemo(() => {
    return {
      all: history.length,
      running: history.filter((j) => j.status === 'running' || j.status === 'queued').length,
      completed: history.filter((j) => j.status === 'completed').length,
      failed: history.filter((j) => j.status === 'failed').length,
    }
  }, [history])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by ID, config, or run…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs font-mono h-8 bg-background border-border/70 shadow-2xs"
          />
        </div>

        {/* Status Filter Chips & Table Actions */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-muted/80 border border-border/50 text-xs">
            {(['all', 'running', 'completed', 'failed'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5',
                  statusFilter === tab
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab}</span>
                <span className="font-mono text-[10px] text-muted-foreground/80">
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearHistory}
              className="text-[11px] text-muted-foreground hover:text-destructive h-7 px-2"
            >
              <Trash2 className="size-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-28">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Job Identifier
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Configuration
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Result Run ID
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right w-16">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <p className="text-xs font-medium text-foreground">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No jobs match the current filter'
                        : 'No distributed jobs dispatched in this session'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try clearing the search query or status filter to see all jobs.'
                        : 'Submit a new evaluation job to run asynchronously on background workers.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={onOpenDispatch}
                        className="mt-2 text-xs gap-1.5 h-8 font-medium shadow-2xs"
                      >
                        <Plus className="size-3.5" />
                        Dispatch First Job
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => {
                const isSelected = item.job_id === activeJobId
                return (
                  <TableRow
                    key={item.job_id}
                    onClick={() => onSelectJob(item.job_id)}
                    className={cn(
                      'cursor-pointer transition-colors border-b border-border/40',
                      isSelected
                        ? 'bg-muted/60 font-medium'
                        : 'hover:bg-muted/30'
                    )}
                  >
                    {/* Status */}
                    <TableCell className="py-2.5">
                      <JobStatusBadge status={item.status} />
                    </TableCell>

                    {/* Job ID */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground">
                          {item.job_id.slice(0, 8)}…{item.job_id.slice(-4)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(item.job_id, e)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                          title="Copy Full UUID"
                        >
                          {copiedId === item.job_id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Config */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground truncate max-w-xs">
                        {item.config_path?.includes('.yaml') || item.config_path?.includes('.yml') ? (
                          <FileCode className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Sliders className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate text-foreground">
                          {item.config_path || 'Inline Config'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Result Run ID */}
                    <TableCell className="py-2.5">
                      {item.run_id ? (
                        <Link
                          href={`/runs/${item.run_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                        >
                          <span>{item.run_id.slice(0, 8)}…</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs font-mono">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveJob(item.job_id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Remove from session history"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onSelectJob(item.job_id)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Inspect Job"
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
