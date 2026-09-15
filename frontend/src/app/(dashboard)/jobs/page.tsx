'use client'

import * as React from 'react'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useCreateJob, useGetJob, type JobCreate } from '@/modules/jobs'
import {
  JobStatsCards,
  JobQueueTable,
  JobDispatchSheet,
  JobInspectorSheet,
  JobStatusBadge,
  type JobHistoryItem,
} from './_components'

const STORAGE_KEY = 'evalbench:jobs-history'

export default function JobsPage() {
  const [dispatchOpen, setDispatchOpen] = React.useState(false)
  const [inspectorOpen, setInspectorOpen] = React.useState(false)
  const [lookupInput, setLookupInput] = React.useState('')

  const { mutate: submitJob, isPending: isSubmitting, data: submittedJob } = useCreateJob()

  const [trackingJobId, setTrackingJobId] = React.useState('')
  const { data: trackedJob, isLoading: isTracking } = useGetJob(trackingJobId)

  // Session Job History
  const [jobHistory, setJobHistory] = React.useState<JobHistoryItem[]>([])

  // Load history from localStorage once mounted
  React.useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobHistory(parsed)
          if (!trackingJobId) {
            setTrackingJobId(parsed[0].job_id)
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save history to localStorage
  function updateHistory(updater: (prev: JobHistoryItem[]) => JobHistoryItem[]) {
    setJobHistory((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore localStorage quota errors
      }
      return next
    })
  }

  // Update history item when tracked job updates
  React.useEffect(() => {
    if (trackedJob) {
      updateHistory((prev) =>
        prev.map((item) =>
          item.job_id === trackedJob.job_id
            ? {
                ...item,
                status: trackedJob.status,
                run_id: trackedJob.run_id ?? item.run_id,
              }
            : item
        )
      )
    }
  }, [trackedJob])

  function handleSubmitJob(payload: JobCreate) {
    submitJob(payload, {
      onSuccess(data) {
        setTrackingJobId(data.job_id)

        // Add to history
        const newItem: JobHistoryItem = {
          job_id: data.job_id,
          config_path: payload.config_path || (payload.config ? 'Inline JSON' : undefined),
          status: data.status,
          run_id: data.run_id,
          created_at: Date.now(),
        }

        updateHistory((prev) => [newItem, ...prev.filter((i) => i.job_id !== data.job_id)])
        setInspectorOpen(true)
        toast.success(`Job dispatched! Tracking ${data.job_id.slice(0, 8)}…`)
      },
      onError(err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit evaluation job')
      },
    })
  }

  function handleSelectJob(jobId: string) {
    setTrackingJobId(jobId)
    setInspectorOpen(true)
  }

  function handleRemoveJob(jobId: string) {
    updateHistory((prev) => prev.filter((i) => i.job_id !== jobId))
    if (trackingJobId === jobId) {
      setTrackingJobId('')
    }
  }

  function handleClearHistory() {
    updateHistory(() => [])
    setTrackingJobId('')
  }

  function handleManualLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = lookupInput.trim()
    if (trimmed) {
      setTrackingJobId(trimmed)
      setLookupInput('')
      setInspectorOpen(true)
      toast.info(`Fetching job ${trimmed.slice(0, 8)}…`)
    }
  }

  const jobToShow = trackedJob ?? submittedJob
  const isActivelyProcessing = jobToShow?.status === 'running' || jobToShow?.status === 'queued'

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Evaluation Jobs
            </h1>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
              Worker Pipeline
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitor asynchronous evaluation jobs dispatched to Celery / Redis background workers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Lookup Input */}
          <form onSubmit={handleManualLookup} className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Lookup UUID…"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              className="h-8 w-44 sm:w-56 pl-8 pr-2 text-xs font-mono bg-background border-border/70 shadow-2xs"
            />
          </form>

          <Button
            size="sm"
            onClick={() => setDispatchOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>Dispatch Evaluation</span>
          </Button>
        </div>
      </div>

      {/* Active Job Live Alert Banner */}
      {isActivelyProcessing && jobToShow && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-brand"></span>
            </span>
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="font-semibold text-foreground">
                {jobToShow.status === 'running' ? 'Evaluation in progress' : 'Job waiting in queue'}:
              </span>
              <code className="font-mono text-muted-foreground truncate max-w-35 sm:max-w-55">
                {jobToShow.job_id}
              </code>
              <JobStatusBadge status={jobToShow.status} />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInspectorOpen(true)}
            className="h-7 text-xs font-mono gap-1.5 shrink-0"
          >
            <span>Open Inspector</span>
            <ChevronRight className="size-3" />
          </Button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <JobStatsCards history={jobHistory} />

      {/* Queue Monitor Table */}
      <JobQueueTable
        history={jobHistory}
        activeJobId={trackingJobId}
        onSelectJob={handleSelectJob}
        onRemoveJob={handleRemoveJob}
        onClearHistory={handleClearHistory}
        onOpenDispatch={() => setDispatchOpen(true)}
      />

      {/* Slide-over Dispatch Sheet */}
      <JobDispatchSheet
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
        onSubmit={handleSubmitJob}
        isSubmitting={isSubmitting}
      />

      {/* Slide-over Right Job Inspector Sheet */}
      <JobInspectorSheet
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        job={jobToShow}
        jobId={trackingJobId}
        isTracking={isTracking}
      />
    </div>
  )
}

