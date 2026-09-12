'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, X, ExternalLink, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { JobStatusResponse } from '@/modules/jobs'
import { JobStatusBadge } from './job-status-badge'

interface JobTrackerProps {
  trackingJobId: string
  onTrackingJobIdChange: (id: string) => void
  job: JobStatusResponse | undefined
  isTracking: boolean
}

export function JobTracker({
  trackingJobId,
  onTrackingJobIdChange,
  job,
  isTracking,
}: JobTrackerProps) {
  const [copied, setCopied] = React.useState(false)

  function handleCopyJobId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(true)
    toast.success('Job ID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">Track Job Status</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Monitor execution progress, run outputs, or errors for an existing job.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={trackingJobId}
            onChange={(e) => onTrackingJobIdChange(e.target.value)}
            placeholder="Paste a job UUID to track status…"
            className="pl-8 pr-8 text-xs font-mono bg-background/50 border-border/70"
          />
          {trackingJobId && (
            <button
              type="button"
              onClick={() => onTrackingJobIdChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear job ID"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {isTracking && (
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-60" />
          </div>
        )}

        {!isTracking && job && (
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/60 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Job ID:</span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {job.job_id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJobId(job.job_id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  title="Copy job ID"
                  aria-label="Copy job ID"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>

              <JobStatusBadge status={job.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {job.config_path && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Configuration</span>
                  <span className="font-mono font-medium text-foreground">{job.config_path}</span>
                </div>
              )}

              {job.run_id && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Associated Run</span>
                  <Link
                    href={`/runs/${job.run_id}`}
                    className="inline-flex items-center gap-1 font-mono font-medium text-primary hover:underline"
                  >
                    #{job.run_id.slice(0, 8)}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              )}
            </div>

            {job.message && (
              <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                {job.message}
              </p>
            )}

            {job.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <span className="font-semibold">Error: </span>
                {job.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
