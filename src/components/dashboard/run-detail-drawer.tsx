'use client'

import * as React from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'

interface RunDetailDrawerProps {
  run: RunSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunDetailDrawer({ run, open, onOpenChange }: RunDetailDrawerProps) {
  if (!run) return null

  // Compute real score
  const meanScores = Object.entries(run.metrics.mean_scores)
  const passRates = Object.entries(run.metrics.pass_rates)

  let formattedScore = '—'
  if (meanScores.length > 0) {
    const avg = meanScores.reduce((acc, [, v]) => acc + v, 0) / meanScores.length
    formattedScore = (avg <= 1 ? avg * 100 : avg).toFixed(1)
  } else if (passRates.length > 0) {
    const avg = passRates.reduce((acc, [, v]) => acc + v, 0) / passRates.length
    formattedScore = (avg * 100).toFixed(1)
  }

  // Combine real evaluator breakdown items from pass_rates and mean_scores
  const evaluatorItems: { name: string; value: number; isPercentage: boolean }[] = []
  const seenKeys = new Set<string>()

  for (const [key, val] of passRates) {
    seenKeys.add(key)
    evaluatorItems.push({
      name: key.replace(/_/g, ' '),
      value: Math.round(val * 100),
      isPercentage: true,
    })
  }

  for (const [key, val] of meanScores) {
    if (!seenKeys.has(key)) {
      evaluatorItems.push({
        name: key.replace(/_/g, ' '),
        value: Number((val <= 1 ? val * 100 : val).toFixed(1)),
        isPercentage: val <= 1,
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="space-y-1 text-left pb-4 border-b border-border/70">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              #{run.run_id.slice(0, 8)}
            </span>
            <Badge variant="outline" className="text-xs font-normal capitalize">
              {run.provider}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold tracking-tight">
            {run.model}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Benchmark: <span className="font-medium text-foreground">{run.dataset_name}</span> ·{' '}
            {run.total_test_cases} test cases evaluated
          </SheetDescription>
        </SheetHeader>

        {/* Score & Latency Section */}
        <div className="grid grid-cols-2 gap-4 py-6 border-b border-border/70">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Overall Score</p>
            <p className="text-3xl font-semibold tracking-tight">{formattedScore}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mean Latency</p>
            <p className="text-2xl font-mono tracking-tight text-foreground">
              {run.metrics.mean_latency_ms
                ? run.metrics.mean_latency_ms >= 1000
                  ? `${(run.metrics.mean_latency_ms / 1000).toFixed(2)}s`
                  : `${Math.round(run.metrics.mean_latency_ms)}ms`
                : '—'}
            </p>
          </div>
        </div>

        {/* Diagnostics & Evaluators */}
        <div className="py-6 space-y-4 border-b border-border/70">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Evaluator Breakdown
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              {evaluatorItems.length} metrics
            </span>
          </div>

          {evaluatorItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No evaluator metrics recorded for this benchmark run.
            </p>
          ) : (
            <div className="space-y-3">
              {evaluatorItems.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground capitalize">{item.name}</span>
                    <span className="font-mono font-medium">
                      {item.value}{item.isPercentage ? '%' : ' pts'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.value >= 80
                          ? 'bg-emerald-500'
                          : item.value >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Link */}
        <div className="pt-6">
          <Link
            href={`/runs/${run.run_id}`}
            className={cn(buttonVariants(), 'w-full')}
          >
            View Full Run Inspection
            <ExternalLink data-icon="inline-end" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
