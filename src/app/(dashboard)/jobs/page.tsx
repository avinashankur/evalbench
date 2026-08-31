'use client'

import { useState } from 'react'
import { useCreateJob, useGetJob } from '@/modules/jobs'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function JobsPage() {
  const [configPath, setConfigPath] = useState('')
  const { mutate: submitJob, isPending: isSubmitting, data: submittedJob } = useCreateJob()
  const [trackingJobId, setTrackingJobId] = useState('')
  const { data: trackedJob, isLoading: isTracking } = useGetJob(trackingJobId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitJob(
      { config_path: configPath },
      {
        onSuccess(data) {
          setTrackingJobId(data.job_id)
          setConfigPath('')
        },
      },
    )
  }

  const jobToShow = trackedJob ?? submittedJob

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Distributed Jobs</h1>
        <p className="text-muted-foreground">
          Submit evaluation jobs to the Redis worker queue.
        </p>
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Submit Job</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Config Path</label>
          <input
            type="text"
            value={configPath}
            onChange={(e) => setConfigPath(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="configs/mmlu.yaml"
            required
          />
          <p className="text-xs text-muted-foreground">
            Path to a YAML config file on the server.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Job'}
        </button>
      </form>

      {/* Job tracker */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Track Job</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={trackingJobId}
            onChange={(e) => setTrackingJobId(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Paste a job ID to track…"
          />
        </div>

        {isTracking && (
          <p className="text-sm text-muted-foreground">Loading job status…</p>
        )}

        {jobToShow && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{jobToShow.job_id}</span>
              <JobStatusBadge status={jobToShow.status} />
            </div>
            {jobToShow.config_path && (
              <p className="text-sm text-muted-foreground">
                Config: {jobToShow.config_path}
              </p>
            )}
            {jobToShow.run_id && (
              <p className="text-sm">
                Run ID:{' '}
                <a href={`/runs/${jobToShow.run_id}`} className="text-primary hover:underline">
                  {jobToShow.run_id.slice(0, 8)}…
                </a>
              </p>
            )}
            {jobToShow.error && (
              <p className="text-sm text-destructive">{jobToShow.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; className: string }> = {
    queued: {
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    running: {
      icon: RefreshCw,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      icon: XCircle,
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const { icon: Icon, className } = config[status] ?? config.queued

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  )
}
