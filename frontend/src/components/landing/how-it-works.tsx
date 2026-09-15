import * as React from 'react'
import { FileCode2, Play, GitCompare } from 'lucide-react'
import { SectionHeader } from '@/components/landing/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HowItWorksProps {
  className?: string
}

const steps = [
  {
    num: '01',
    title: 'Define test cases & evaluators',
    badge: 'dataset + config',
    icon: FileCode2,
    description:
      'Point to a JSONL dataset (e.g. customer-support-v1.jsonl) with queries and ground-truth contexts. Select your evaluators: faithfulness, exact match, JSON validity, or write your own custom Python evaluator.',
    detail: 'datasets/*.jsonl + YAML schema',
  },
  {
    num: '02',
    title: 'Execute via CLI, API, or Worker',
    badge: 'model × concurrency',
    icon: Play,
    description:
      'Run evaluations against any LLM provider (OpenAI, Anthropic, Gemini, or Mock). Execute synchronously via CLI (evalbench run) or enqueue distributed jobs in Redis for async background worker processing.',
    detail: 'FastAPI / Redis async queue',
  },
  {
    num: '03',
    title: 'Diff regressions & verify SLAs',
    badge: 'baseline → candidate',
    icon: GitCompare,
    description:
      'Every run lands in the comparison matrix, automatically diffed against your verified baseline. Inspect token counts, cost deltas, and per-test-case judge rationale before shipping to production.',
    detail: 'Δ score • Δ latency • Δ cost',
  },
]

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// the workflow"
        title="How EvalBench works"
        description="Define your ground truth, execute across model checkpoints or RAG configurations, and catch regressions before they reach your users."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Card
              key={step.num}
              className="group relative flex flex-col justify-between overflow-hidden border-border/70 bg-card/60 transition-all hover:border-border hover:bg-card hover:shadow-md"
            >
              <CardHeader className="flex w-full flex-col gap-4 pb-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-foreground transition-colors group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                    Step {step.num}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                    {step.title}
                  </CardTitle>
                  <div className="font-mono text-xs font-medium text-brand">
                    {step.badge}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </CardDescription>

                <div className="border-t border-border/50 pt-3">
                  <code className="rounded border border-border/60 bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors group-hover:border-border group-hover:text-foreground">
                    {step.detail}
                  </code>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
