'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Database,
  Cpu,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { RunStatusResponse, RunSummaryResponse } from '@/modules/runs'
import { formatRunDate } from '../../_components/types'

interface RunDetailHeaderProps {
  runId: string
  run: RunStatusResponse | RunSummaryResponse
  onRefresh: () => void
  isRefetching: boolean
}

export function RunDetailHeader({
  runId,
  run,
  onRefresh,
  isRefetching,
}: RunDetailHeaderProps) {
  const [copied, setCopied] = React.useState(false)

  const isCompleted = run.status === 'completed'
  const isRunning = run.status === 'running'
  const isFailed = run.status === 'failed'
  const summary = isCompleted ? (run as RunSummaryResponse) : null

  function handleCopyId() {
    navigator.clipboard.writeText(runId)
    setCopied(true)
    toast.success('Run ID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Runs</span>
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-mono text-[11px] text-foreground font-medium truncate max-w-45">
          {runId}
        </span>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Title & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Run {runId.slice(0, 8)}
            </h1>

            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopyId}
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer font-mono"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </Button>

            {/* Run Status Pill */}
            {isRunning && (
              <Badge
                variant="secondary"
                className="gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium"
              >
                <RotateCcw className="size-3 animate-spin" />
                Running
              </Badge>
            )}

            {isCompleted && (
              <Badge
                variant="secondary"
                className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
              >
                <Check className="size-3" />
                Completed
              </Badge>
            )}

            {isFailed && (
              <Badge
                variant="destructive"
                className="gap-1.5 text-xs font-medium"
              >
                Failed
              </Badge>
            )}
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {summary && (
              <>
                <Badge variant="outline" className="gap-1.5 py-0.5 px-2 bg-muted/40 font-mono text-[11px]">
                  <Database className="size-3 text-muted-foreground shrink-0" />
                  <span>{summary.dataset_name}</span>
                </Badge>

                <Badge variant="outline" className="gap-1.5 py-0.5 px-2 bg-muted/40 font-mono text-[11px]">
                  <Cpu className="size-3 text-muted-foreground shrink-0" />
                  <span>
                    {summary.provider}/{summary.model}
                  </span>
                </Badge>

                <Badge variant="outline" className="gap-1.5 py-0.5 px-2 bg-muted/40 font-mono text-[11px]">
                  <Layers className="size-3 text-muted-foreground shrink-0" />
                  <span>{summary.total} test cases</span>
                </Badge>

                {summary.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono ml-1">
                    <Clock className="size-3" />
                    <span>{formatRunDate(summary.created_at)}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefetching}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
          >
            <RotateCcw
              className={cn('size-3.5', isRefetching && 'animate-spin')}
              data-icon="inline-start"
            />
            <span>{isRefetching ? 'Refreshing…' : 'Refresh'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
