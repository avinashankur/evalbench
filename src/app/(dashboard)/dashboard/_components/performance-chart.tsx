'use client'

import * as React from 'react'
import Link from 'next/link'
import { LineChart, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'

interface PerformanceChartProps {
  runs?: RunSummary[]
  className?: string
}

const MODEL_PALETTE = ['#d17b57', '#39d28a', '#6fa5ff', '#e2bb56', '#a855f7']

export function PerformanceChart({ runs, className }: PerformanceChartProps) {
  const chartData = React.useMemo(() => {
    if (!runs || runs.length < 2) {
      return null
    }

    // Sort runs chronologically
    const sorted = [...runs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Identify unique models in the dataset
    const uniqueModels = Array.from(new Set(sorted.map((r) => r.model)))
    const width = 710
    const leftPad = 40
    const topPad = 25
    const plotHeight = 180

    const modelSeries = uniqueModels.map((modelName, mIdx) => {
      const modelRuns = sorted.filter((r) => r.model === modelName)
      const color = MODEL_PALETTE[mIdx % MODEL_PALETTE.length]

      const points = modelRuns.map((r, idx) => {
        const meanScores = Object.values(r.metrics.mean_scores)
        const passRates = Object.values(r.metrics.pass_rates)

        let score = 0
        if (meanScores.length > 0) {
          const avg = meanScores.reduce((a, b) => a + b, 0) / meanScores.length
          score = avg <= 1 ? avg * 100 : avg
        } else if (passRates.length > 0) {
          const avg = passRates.reduce((a, b) => a + b, 0) / passRates.length
          score = avg * 100
        }

        const normScore = Math.max(0, Math.min(100, score))
        const x =
          modelRuns.length > 1
            ? leftPad + (idx / (modelRuns.length - 1)) * width
            : leftPad + width / 2
        const y = topPad + plotHeight - (normScore / 100) * plotHeight

        return {
          x: Number(x.toFixed(1)),
          y: Number(y.toFixed(1)),
          score: score.toFixed(1),
          date: new Date(r.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        }
      })

      const pathD = points
        .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x} ${pt.y}`)
        .join(' ')

      const latestScore = points[points.length - 1]?.score ?? '0.0'

      return {
        model: modelName,
        color,
        pathD,
        points,
        latestScore,
      }
    })

    return {
      series: modelSeries,
      totalRuns: sorted.length,
    }
  }, [runs])

  return (
    <Card className={cn('flex flex-col h-full border-border/70', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">Benchmark Performance</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Mean score trajectories across evaluation executions
          </CardDescription>
        </div>
        {chartData && (
          <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {chartData.totalRuns} runs recorded
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-1">
        {!chartData ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[220px]">
            <div className="rounded-full bg-muted p-3 text-muted-foreground mb-3">
              <LineChart className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Not enough data to plot trends</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Performance trends require at least 2 benchmark runs to visualize score trajectories.
            </p>
            <Link
              href="/runs/new"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4 text-xs font-medium')}
            >
              <Plus data-icon="inline-start" />
              Launch Evaluation
            </Link>
          </div>
        ) : (
          <>
            <div className="relative min-h-[200px] w-full flex-1">
              <svg
                viewBox="0 0 760 225"
                preserveAspectRatio="none"
                className="size-full overflow-visible"
              >
                {/* Horizontal reference gridlines */}
                <line x1="40" y1="25" x2="750" y2="25" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="750" y2="70" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                <line x1="40" y1="115" x2="750" y2="115" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                <line x1="40" y1="160" x2="750" y2="160" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                <line x1="40" y1="205" x2="750" y2="205" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />

                {/* Y-axis score markers */}
                <text x="8" y="28" className="fill-muted-foreground font-mono text-[9px]">100</text>
                <text x="14" y="73" className="fill-muted-foreground font-mono text-[9px]">75</text>
                <text x="14" y="118" className="fill-muted-foreground font-mono text-[9px]">50</text>
                <text x="14" y="163" className="fill-muted-foreground font-mono text-[9px]">25</text>
                <text x="18" y="208" className="fill-muted-foreground font-mono text-[9px]">0</text>

                {/* Real model trajectory paths & nodes */}
                {chartData.series.map((s) => (
                  <g key={s.model}>
                    {s.points.length > 1 && (
                      <path
                        d={s.pathD}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {s.points.map((pt, pIdx) => (
                      <circle
                        key={pIdx}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill={s.color}
                        className="stroke-background stroke-2 transition-transform hover:scale-150"
                      >
                        <title>{`${s.model}: ${pt.score}% on ${pt.date}`}</title>
                      </circle>
                    ))}
                  </g>
                ))}
              </svg>
            </div>

            {/* Dynamic Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
              {chartData.series.map((s) => (
                <div key={s.model} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-medium text-foreground font-mono">{s.model}</span>
                  <span className="font-mono text-[11px]">({s.latestScore}%)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
