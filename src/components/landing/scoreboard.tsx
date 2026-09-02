'use client'

import { PulseDot } from '@/components/landing/pulse-dot'
import { MetricBar } from '@/components/landing/metric-bar'
import { cn } from '@/lib/utils'

interface ScoreboardProps {
  className?: string
}

export function Scoreboard({ className }: ScoreboardProps) {
  return (
    <div
      className={cn(
        'mt-14 overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-xl',
        className
      )}
    >
      {/* Scoreboard Head */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 text-xs text-muted-foreground">
        <span className="font-medium">core-suite · 128 test cases</span>
        <span className="flex items-center gap-2">
          <PulseDot />
          <span className="font-mono text-xs text-muted-foreground">
            support-agent v4.1 → v4.2
          </span>
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Baseline Column */}
        <div className="p-6 sm:p-7">
          <div className="mb-2 font-mono text-xs text-muted-foreground">
            support-agent · v4.1 (baseline)
          </div>
          <div className="font-serif text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            92.4
          </div>
          <div className="mt-1.5 font-mono text-sm text-muted-foreground">
            baseline run
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <MetricBar label="accuracy" value="92%" percent={92} />
            <MetricBar label="cost / run" value="$.038" percent={38} />
            <MetricBar label="p95 latency" value="1.1s" percent={44} />
          </div>
        </div>

        {/* Candidate Column */}
        <div className="p-6 sm:p-7">
          <div className="mb-2 font-mono text-xs text-muted-foreground">
            support-agent · v4.2 (candidate)
          </div>
          <div className="font-serif text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            94.2
          </div>
          <div className="mt-1.5 flex items-center gap-1 font-mono text-sm font-medium text-blue-600">
            <span>▲</span> +1.8 pts
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <MetricBar label="accuracy" value="94%" percent={94} />
            <MetricBar
              label="cost / run"
              value="$.049"
              percent={48}
              variant="warn"
            />
            <MetricBar label="p95 latency" value="1.0s" percent={41} />
          </div>
        </div>
      </div>
    </div>
  )
}
