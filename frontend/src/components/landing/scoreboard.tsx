'use client'

import * as React from 'react'
import { HelpCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { MetricBar } from '@/components/landing/metric-bar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ScoreboardProps {
  className?: string
}

interface BenchmarkPreset {
  id: string
  label: string
  dataset: string
  testCases: number
  description: string
  baseline: {
    model: string
    provider: string
    score: string
    latency: string
    cost: string
    metrics: { label: string; value: string; percent: number }[]
  }
  candidate: {
    model: string
    provider: string
    score: string
    delta: string
    deltaType: 'up' | 'down'
    latency: string
    cost: string
    metrics: { label: string; value: string; percent: number; variant?: 'default' | 'warn' }[]
  }
}

const PRESETS: BenchmarkPreset[] = [
  {
    id: 'rag-support',
    label: 'RAG Support QA',
    dataset: 'datasets/customer-support-v1.jsonl',
    testCases: 64,
    description:
      'Retrieval groundedness and hallucination detection on customer refund and SLA queries.',
    baseline: {
      model: 'claude-3-5-sonnet',
      provider: 'Anthropic',
      score: '91.4',
      latency: '980ms',
      cost: '$0.024',
      metrics: [
        { label: 'faithfulness', value: '91%', percent: 91 },
        { label: 'answer relevance', value: '92%', percent: 92 },
        { label: 'context precision', value: '88%', percent: 88 },
        { label: 'mean latency', value: '980ms', percent: 45 },
      ],
    },
    candidate: {
      model: 'gpt-4o',
      provider: 'OpenAI',
      score: '95.8',
      delta: '+4.4 pts',
      deltaType: 'up',
      latency: '820ms',
      cost: '$0.021',
      metrics: [
        { label: 'faithfulness', value: '96%', percent: 96 },
        { label: 'answer relevance', value: '97%', percent: 97 },
        { label: 'context precision', value: '94%', percent: 94 },
        { label: 'mean latency', value: '820ms', percent: 38 },
      ],
    },
  },
  {
    id: 'math-reasoning',
    label: 'Reasoning & Math',
    dataset: 'datasets/gsm8k-bench.jsonl',
    testCases: 120,
    description: 'Multi-step mathematical proof and exact numeric ground truth verification.',
    baseline: {
      model: 'gpt-4o',
      provider: 'OpenAI',
      score: '94.2',
      latency: '1,150ms',
      cost: '$0.038',
      metrics: [
        { label: 'exact match', value: '94%', percent: 94 },
        { label: 'llm judge rubric', value: '96%', percent: 96 },
        { label: 'mean latency', value: '1.15s', percent: 55 },
        { label: 'token cost / run', value: '$0.038', percent: 40 },
      ],
    },
    candidate: {
      model: 'gpt-4o-mini',
      provider: 'OpenAI',
      score: '91.6',
      delta: '-2.6 pts',
      deltaType: 'down',
      latency: '390ms',
      cost: '$0.003',
      metrics: [
        { label: 'exact match', value: '91%', percent: 91 },
        { label: 'llm judge rubric', value: '93%', percent: 93 },
        { label: 'mean latency', value: '390ms', percent: 18 },
        { label: 'token cost / run', value: '$0.003', percent: 8 },
      ],
    },
  },
  {
    id: 'json-schema',
    label: 'Structured JSON',
    dataset: 'datasets/tool-calling-v1.jsonl',
    testCases: 95,
    description:
      'Strict schema compliance, field validation, and deterministic function arguments.',
    baseline: {
      model: 'gemini-1.5-pro',
      provider: 'Google Gemini',
      score: '92.6',
      latency: '910ms',
      cost: '$0.014',
      metrics: [
        { label: 'json validity', value: '93%', percent: 93 },
        { label: 'contains schema', value: '95%', percent: 95 },
        { label: 'mean latency', value: '910ms', percent: 42 },
        { label: 'token cost / run', value: '$0.014', percent: 22 },
      ],
    },
    candidate: {
      model: 'claude-3-5-sonnet',
      provider: 'Anthropic',
      score: '98.9',
      delta: '+6.3 pts',
      deltaType: 'up',
      latency: '740ms',
      cost: '$0.019',
      metrics: [
        { label: 'json validity', value: '100%', percent: 100 },
        { label: 'contains schema', value: '99%', percent: 99 },
        { label: 'mean latency', value: '740ms', percent: 34 },
        { label: 'token cost / run', value: '$0.019', percent: 28 },
      ],
    },
  },
]

export function Scoreboard({ className }: ScoreboardProps) {
  const [activeTab, setActiveTab] = React.useState<string>('rag-support')
  const activePreset = PRESETS.find((p) => p.id === activeTab) ?? PRESETS[0]

  return (
    <TooltipProvider delay={100}>
      <div
        className={cn(
          'mt-12 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl',
          className,
        )}
      >
        {/* Scenario Selector & Header Bar */}
        <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
              Benchmark Comparison
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {activePreset.dataset} · {activePreset.testCases} test cases
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="h-8">
                {PRESETS.map((preset) => (
                  <TabsTrigger key={preset.id} value={preset.id} className="px-2.5 py-1 text-xs">
                    {preset.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Baseline Column */}
          <div className="flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>{activePreset.baseline.provider}</span>
                  <span>/</span>
                  <span className="font-semibold text-foreground">
                    {activePreset.baseline.model}
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Baseline
                </Badge>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <div className="font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
                  {activePreset.baseline.score}
                </div>
                <div className="font-mono text-xs text-muted-foreground">/ 100 aggregate score</div>
              </div>

              <div className="mt-1 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                <span>Latency: {activePreset.baseline.latency}</span>
                <span>•</span>
                <span>Cost: {activePreset.baseline.cost}</span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {activePreset.baseline.metrics.map((metric) => (
                  <div key={metric.label} className="group/metric grid grid-cols-[1fr_2fr]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                        <span>{metric.label}</span>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                className="cursor-help text-muted-foreground/60 hover:text-muted-foreground"
                              >
                                <HelpCircle className="size-3" />
                                <span className="sr-only">Metric info</span>
                              </button>
                            }
                          />
                          <TooltipContent>
                            Evaluated via EvalBench built-in evaluator: {metric.label}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MetricBar percent={metric.percent} className="w-full" />
                      <span className="font-mono text-xs font-medium text-foreground">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidate Column */}
          <div className="flex flex-col justify-between bg-muted/5 p-6 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>{activePreset.candidate.provider}</span>
                  <span>/</span>
                  <span className="font-semibold text-foreground">
                    {activePreset.candidate.model}
                  </span>
                </div>
                <Badge
                  variant="default"
                  className="bg-brand font-mono text-[10px] text-white hover:bg-brand/90"
                >
                  Candidate
                </Badge>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <div className="font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
                  {activePreset.candidate.score}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 font-mono text-sm font-semibold',
                    activePreset.candidate.deltaType === 'up'
                      ? 'text-brand'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {activePreset.candidate.deltaType === 'up' ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  <span>{activePreset.candidate.delta}</span>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                <span>Latency: {activePreset.candidate.latency}</span>
                <span>•</span>
                <span>Cost: {activePreset.candidate.cost}</span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {activePreset.candidate.metrics.map((metric) => (
                  <div key={metric.label} className="group/metric grid grid-cols-[1fr_2fr]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                        <span>{metric.label}</span>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                className="cursor-help text-muted-foreground/60 hover:text-muted-foreground"
                              >
                                <HelpCircle className="size-3" />
                                <span className="sr-only">Metric info</span>
                              </button>
                            }
                          />
                          <TooltipContent>
                            Evaluated via EvalBench built-in evaluator: {metric.label}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MetricBar
                        percent={metric.percent}
                        variant={metric.variant}
                        className="w-full"
                      />
                      <span className="font-mono text-xs font-medium text-foreground">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
