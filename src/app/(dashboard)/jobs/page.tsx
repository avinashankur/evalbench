'use client'

import * as React from 'react'
import { useCreateJob, useGetJob } from '@/modules/jobs'
import { JobSubmitForm, JobTracker } from './_components'

export default function JobsPage() {
  const [configPath, setConfigPath] = React.useState('')
  const { mutate: submitJob, isPending: isSubmitting, data: submittedJob } = useCreateJob()
  const [trackingJobId, setTrackingJobId] = React.useState('')
  const { data: trackedJob, isLoading: isTracking } = useGetJob(trackingJobId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configPath.trim()) return

    submitJob(
      { config_path: configPath.trim() },
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Distributed Jobs</h1>
        <p className="text-xs text-muted-foreground">
          Submit and track asynchronous evaluation jobs dispatched to the Redis worker queue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <JobSubmitForm
          configPath={configPath}
          onConfigPathChange={setConfigPath}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <JobTracker
          trackingJobId={trackingJobId}
          onTrackingJobIdChange={setTrackingJobId}
          job={jobToShow}
          isTracking={isTracking}
        />
      </div>
    </div>
  )
}
