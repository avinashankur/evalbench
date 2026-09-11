'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'

import { Award } from 'lucide-react'

interface LeaderboardEntry {
  rank: string
  name: string
  provider: string
  score: number
  percentage: number
  runCount: number
}

interface ModelLeaderboardProps {
  runs?: RunSummary[]
  className?: string
}

export function ModelLeaderboard({ runs, className }: ModelLeaderboardProps) {
  const entries = React.useMemo(() => {
    if (!runs || runs.length === 0) {
      return []
    }

    const modelMap = new Map<string, { provider: string; scores: number[]; count: number }>()

    for (const r of runs) {
      const key = `${r.provider}/${r.model}`
      const entry = modelMap.get(key) || { provider: r.provider, scores: [], count: 0 }
      const scores = Object.values(r.metrics.mean_scores)
      if (scores.length > 0) {
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length) * (scores[0] <= 1 ? 100 : 1)
        entry.scores.push(avg)
      } else {
        const passVals = Object.values(r.metrics.pass_rates)
        if (passVals.length > 0) {
          entry.scores.push(passVals[0] * 100)
        }
      }
      entry.count += 1
      modelMap.set(key, entry)
    }

    const aggregated: LeaderboardEntry[] = []
    for (const [key, val] of modelMap.entries()) {
      const [provider, name] = key.split('/')
      const avgScore = val.scores.length
        ? val.scores.reduce((a, b) => a + b, 0) / val.scores.length
        : 0

      aggregated.push({
        rank: '',
        name: name || key,
        provider: provider || val.provider,
        score: Number(avgScore.toFixed(1)),
        percentage: Math.min(100, Math.round(avgScore)),
        runCount: val.count,
      })
    }

    aggregated.sort((a, b) => b.score - a.score)

    return aggregated.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: String(idx + 1).padStart(2, '0'),
    }))
  }, [runs])

  const hasEntries = entries.length > 0

  return (
    <Card className={cn('flex flex-col h-full border-border/70', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">Model Leaderboard</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ranked by mean accuracy across runs
          </CardDescription>
        </div>
        <Link
          href="/compare"
          className="text-xs font-medium text-primary transition-colors hover:underline"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center space-y-3 pt-1">
        {!hasEntries ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-muted p-2.5 text-muted-foreground mb-2">
              <Award className="size-4" />
            </div>
            <p className="text-xs font-medium text-foreground">No models evaluated yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
              Rankings will appear once benchmark runs have completed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {entries.map((entry) => (
              <div
                key={`${entry.provider}-${entry.name}`}
                className="grid grid-cols-[28px_1fr_48px] items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="font-mono text-xs text-muted-foreground">{entry.rank}</span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-foreground">{entry.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {entry.provider} · {entry.runCount} {entry.runCount === 1 ? 'run' : 'runs'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#d17b57] transition-all duration-500"
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-right font-mono text-xs font-semibold text-foreground">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
