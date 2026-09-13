import type { RunSummary, RunMetrics } from '@/modules/runs'

export type SortOption = 'newest' | 'oldest' | 'score' | 'latency' | 'cases'

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  score: 'Highest Score',
  latency: 'Lowest Latency',
  cases: 'Most Test Cases',
}

export function computeRunScore(run: { metrics: RunMetrics }): {
  scoreDisplay: string
  scorePercent: number | null
} {
  const meanScores = Object.values(run.metrics.mean_scores || {})
  const passRates = Object.values(run.metrics.pass_rates || {})

  if (meanScores.length > 0) {
    const avg = meanScores.reduce((a, b) => a + b, 0) / meanScores.length
    const percent = avg <= 1 ? avg * 100 : avg
    return { scoreDisplay: `${percent.toFixed(1)}%`, scorePercent: percent }
  }
  if (passRates.length > 0) {
    const avg = passRates.reduce((a, b) => a + b, 0) / passRates.length
    const percent = avg * 100
    return { scoreDisplay: `${percent.toFixed(1)}%`, scorePercent: percent }
  }
  return { scoreDisplay: '—', scorePercent: null }
}

export function computeRunLatency(latencyMs?: number): {
  display: string
  tier: 'fast' | 'moderate' | 'slow' | 'none'
} {
  if (latencyMs === undefined || latencyMs === null || isNaN(latencyMs)) {
    return { display: '—', tier: 'none' }
  }
  const display =
    latencyMs >= 1000 ? `${(latencyMs / 1000).toFixed(2)}s` : `${Math.round(latencyMs)}ms`
  const tier = latencyMs < 500 ? 'fast' : latencyMs < 1500 ? 'moderate' : 'slow'
  return { display, tier }
}

export function formatRunDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
