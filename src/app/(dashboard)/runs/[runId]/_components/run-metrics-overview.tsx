'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RunSummaryResponse } from '@/modules/runs'
import { computeRunScore, computeRunLatency } from '../../_components/types'

interface RunMetricsOverviewProps {
  summary: RunSummaryResponse
}

export function RunMetricsOverview({ summary }: RunMetricsOverviewProps) {
  const { scoreDisplay } = computeRunScore(summary)
  const latency = computeRunLatency(summary.metrics.mean_latency_ms)

  const passRatesEntries = Object.entries(summary.metrics.pass_rates || {})
  const avgPassRate =
    passRatesEntries.length > 0
      ? (passRatesEntries.reduce((acc, [, v]) => acc + v, 0) / passRatesEntries.length) * 100
      : null

  return (
    <div className="flex flex-col gap-3">
      {/* 4 Clean KPI Metric Cards matching Dashboard Standards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Mean Score</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {scoreDisplay}
            </p>
            <p className="text-[11px] text-muted-foreground">Across all evaluators</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Pass Rate</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {avgPassRate != null ? `${avgPassRate.toFixed(1)}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">Overall test cases passed</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {latency.display}
            </p>
            <p className="text-[11px] text-muted-foreground">Per test case inference</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
              ${summary.metrics.total_cost_usd.toFixed(4)}
            </p>
            <p className="text-[11px] text-muted-foreground">Estimated token usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Subtle Evaluator Breakdown Badges */}
      {passRatesEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
          <span className="text-muted-foreground font-medium text-[11px]">Evaluator Pass Rates:</span>
          {passRatesEntries.map(([name, rate]) => {
            const pct = Math.round(rate * 100)
            return (
              <Badge
                key={name}
                variant="secondary"
                className="text-[11px] font-mono px-2 py-0.5 border border-border/60 bg-muted/30"
              >
                <span className="text-muted-foreground">{name}:</span>
                <span className="ml-1 font-semibold text-foreground">{pct}%</span>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
