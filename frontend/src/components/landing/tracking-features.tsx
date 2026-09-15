import * as React from 'react'
import { Coins, FileCheck2, ShieldAlert } from 'lucide-react'
import { SectionHeader } from '@/components/landing/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TrackingFeaturesProps {
  className?: string
}

const features = [
  {
    num: '01',
    stat: 'Hallucination Triad',
    title: 'RAG Groundedness',
    icon: ShieldAlert,
    description:
      'Mathematical verification that every claim in generated output is directly entailed by retrieved context chunks. Eliminates hallucinated facts and verifies retrieval precision.',
    evaluators: ['faithfulness', 'answer_relevance', 'context_precision', 'context_recall'],
  },
  {
    num: '02',
    stat: 'Cost & Latency SLAs',
    title: 'Unit Economics',
    icon: Coins,
    description:
      'Per-run token metering (prompt vs completion) and exact USD cost calculation alongside p50/p95 latency distributions. A model 2% more accurate but 3x more expensive is rarely a win.',
    evaluators: ['latency', 'token_usage', 'llm_judge'],
  },
  {
    num: '03',
    stat: 'Deterministic Guardrails',
    title: 'Structural Integrity',
    icon: FileCheck2,
    description:
      'High-speed zero-cost verification for tool calling, strict JSON schemas, regex patterns, and exact ground-truth matching before dispatching to downstream pipelines.',
    evaluators: ['json_validity', 'exact_match', 'contains'],
  },
]

export function TrackingFeatures({ className }: TrackingFeaturesProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// measured, not felt"
        title="What EvalBench tracks on every run"
        description="Three core evaluation pillars, tracked across every model version and prompt change — because quality, speed, and unit economics must be evaluated together."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card
              key={feature.num}
              className="group relative flex flex-col justify-between overflow-hidden border-border/70 bg-card/60 transition-all hover:border-border hover:bg-card hover:shadow-md"
            >
              <CardHeader className="flex w-full flex-col gap-4 pb-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-foreground transition-colors group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                    {feature.num} / 03
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </CardTitle>
                  <div className="font-mono text-xs font-medium text-brand">
                    {feature.stat}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-5 pt-0">
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardDescription>

                <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    <span>Evaluators</span>
                    <span className="font-normal lowercase text-muted-foreground/50">built-in</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {feature.evaluators.map((ev) => (
                      <code
                        key={ev}
                        className="rounded border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-foreground/90 transition-colors group-hover:border-border"
                      >
                        {ev}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
