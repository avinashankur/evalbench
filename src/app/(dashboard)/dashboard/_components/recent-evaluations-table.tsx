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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { RunDetailDrawer } from './run-detail-drawer'
import type { RunSummary } from '@/modules/runs'

import { Play } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface RecentEvaluationsTableProps {
  runs?: RunSummary[]
  isLoading?: boolean
  className?: string
}

export function RecentEvaluationsTable({
  runs,
  isLoading,
  className,
}: RecentEvaluationsTableProps) {
  const [selectedRun, setSelectedRun] = React.useState<RunSummary | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const hasRuns = runs && runs.length > 0

  function handleRowClick(run: RunSummary) {
    setSelectedRun(run)
    setDrawerOpen(true)
  }

  return (
    <>
      <Card className={cn('flex flex-col h-full border-border/70', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Recent Evaluations</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Latest benchmark executions from the database
            </CardDescription>
          </div>
          <Link
            href="/runs"
            className="text-xs font-medium text-primary transition-colors hover:underline"
          >
            Open evaluations →
          </Link>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !hasRuns ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3 text-muted-foreground mb-3">
                <Play className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No evaluation runs yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Launch your first benchmark run to compare model performance, accuracy, and latency.
              </p>
              <Link
                href="/runs/new"
                className={cn(buttonVariants({ size: 'sm' }), 'mt-4 text-xs font-medium')}
              >
                Launch Evaluation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-[100px] text-xs">Run ID</TableHead>
                    <TableHead className="text-xs">Benchmark Dataset</TableHead>
                    <TableHead className="text-xs">Model & Provider</TableHead>
                    <TableHead className="text-xs text-right">Score</TableHead>
                    <TableHead className="text-xs text-right">Latency</TableHead>
                    <TableHead className="text-xs text-right">Test Cases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.slice(0, 6).map((run) => {
                    const meanScores = Object.values(run.metrics.mean_scores)
                    const passRates = Object.values(run.metrics.pass_rates)
                    
                    let scoreDisplay = '—'
                    if (meanScores.length > 0) {
                      const avg = meanScores.reduce((a, b) => a + b, 0) / meanScores.length
                      scoreDisplay = (avg <= 1 ? avg * 100 : avg).toFixed(1)
                    } else if (passRates.length > 0) {
                      const avg = passRates.reduce((a, b) => a + b, 0) / passRates.length
                      scoreDisplay = (avg * 100).toFixed(1)
                    }

                    const latencyMs = run.metrics.mean_latency_ms
                    const latencyDisplay = latencyMs
                      ? latencyMs >= 1000
                        ? `${(latencyMs / 1000).toFixed(2)}s`
                        : `${Math.round(latencyMs)}ms`
                      : '—'

                    return (
                      <TableRow
                        key={run.run_id}
                        className="cursor-pointer transition-colors hover:bg-muted/40 border-border/50"
                        onClick={() => handleRowClick(run)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{run.run_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {run.dataset_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono text-foreground font-medium">{run.model}</span>
                          <span className="text-muted-foreground text-[10px] ml-1.5 capitalize">({run.provider})</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                          {scoreDisplay}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {latencyDisplay}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {run.total_test_cases} cases
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RunDetailDrawer
        run={selectedRun}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
}
