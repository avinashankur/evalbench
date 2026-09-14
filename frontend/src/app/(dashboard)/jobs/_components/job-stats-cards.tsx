'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react'
import type { JobHistoryItem } from './types'

interface JobStatsCardsProps {
  history: JobHistoryItem[]
}

export function JobStatsCards({ history }: JobStatsCardsProps) {
  const total = history.length
  const completed = history.filter((j) => j.status === 'completed').length
  const runningOrQueued = history.filter(
    (j) => j.status === 'running' || j.status === 'queued'
  ).length
  const failed = history.filter((j) => j.status === 'failed').length

  const finishedTotal = completed + failed
  const successRate =
    finishedTotal > 0 ? Math.round((completed / finishedTotal) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Dispatched */}
      <Card className="shadow-2xs border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Dispatched
          </CardTitle>
          <Layers className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {total}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Session runs
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. In Progress / Queued */}
      <Card className="shadow-2xs border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            In Progress
          </CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {runningOrQueued}
            </div>
            {runningOrQueued > 0 ? (
              <Badge variant="secondary" className="gap-1.5 font-mono text-[10px] bg-primary/10 text-primary border-primary/20 animate-pulse">
                <span className="size-1.5 rounded-full bg-primary" />
                Active
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono">
                Queue idle
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Completed */}
      <Card className="shadow-2xs border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Completed
          </CardTitle>
          <CheckCircle2 className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {completed}
            </div>
            {finishedTotal > 0 ? (
              <Badge variant="secondary" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                {successRate}% rate
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono">
                —
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Failed */}
      <Card className="shadow-2xs border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Failed
          </CardTitle>
          <AlertTriangle className={failed > 0 ? "size-4 text-destructive" : "size-4 text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {failed}
            </div>
            {failed > 0 ? (
              <Badge variant="destructive" className="font-mono text-[10px]">
                {failed} error{failed === 1 ? '' : 's'}
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono">
                Clean run
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
