'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { SectionHeader } from '@/components/landing/section-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ComparisonTableProps {
  className?: string
}

interface BenchmarkRow {
  runId: string
  dataset: string
  provider: string
  model: string
  evaluators: string[]
  score: string
  latency: string
  cost: string
  delta: string
  deltaType: 'up' | 'down' | 'baseline'
  status: 'passed' | 'regressed'
}

const SHOWCASE_RUNS: BenchmarkRow[] = [
  {
    runId: 'run-9f2b10',
    dataset: 'customer-support-v1.jsonl',
    provider: 'openai',
    model: 'gpt-4o',
    evaluators: ['faithfulness', 'answer_relevance', 'context_precision'],
    score: '95.8%',
    latency: '820ms',
    cost: '$0.021',
    delta: '+4.4 pts',
    deltaType: 'up',
    status: 'passed',
  },
  {
    runId: 'run-8c14a2',
    dataset: 'customer-support-v1.jsonl',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    evaluators: ['faithfulness', 'answer_relevance', 'context_precision'],
    score: '91.4%',
    latency: '980ms',
    cost: '$0.024',
    delta: 'baseline',
    deltaType: 'baseline',
    status: 'passed',
  },
  {
    runId: 'run-7b49e1',
    dataset: 'gsm8k-bench.jsonl',
    provider: 'openai',
    model: 'gpt-4o',
    evaluators: ['exact_match', 'llm_judge', 'latency'],
    score: '94.2%',
    latency: '1.15s',
    cost: '$0.038',
    delta: 'baseline',
    deltaType: 'baseline',
    status: 'passed',
  },
  {
    runId: 'run-6d30f4',
    dataset: 'gsm8k-bench.jsonl',
    provider: 'openai',
    model: 'gpt-4o-mini',
    evaluators: ['exact_match', 'llm_judge', 'latency'],
    score: '91.6%',
    latency: '390ms',
    cost: '$0.003',
    delta: '-2.6 pts',
    deltaType: 'down',
    status: 'passed',
  },
  {
    runId: 'run-5a82c9',
    dataset: 'tool-calling-v1.jsonl',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    evaluators: ['json_validity', 'contains'],
    score: '98.9%',
    latency: '740ms',
    cost: '$0.019',
    delta: '+6.3 pts',
    deltaType: 'up',
    status: 'passed',
  },
  {
    runId: 'run-4e17b8',
    dataset: 'tool-calling-v1.jsonl',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    evaluators: ['json_validity', 'contains'],
    score: '92.6%',
    latency: '910ms',
    cost: '$0.014',
    delta: 'baseline',
    deltaType: 'baseline',
    status: 'passed',
  },
]

export function ComparisonTable({ className }: ComparisonTableProps) {
  const [activeFilter, setActiveFilter] = React.useState<string>('All')

  const filteredRows = React.useMemo(() => {
    if (activeFilter === 'All') return SHOWCASE_RUNS
    return SHOWCASE_RUNS.filter((r) =>
      r.dataset.toLowerCase().includes(activeFilter.toLowerCase())
    )
  }, [activeFilter])

  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
        <SectionHeader
          kicker="// regression matrix"
          title="Catch model regressions before they ship"
          description="Every run lands in a unified comparison matrix. Diff accuracy, groundedness, latency, and costs against your verified baseline."
        />

        {/* Wide Shot Table Card */}
        <Card className="overflow-hidden border-border bg-card shadow-xl">
          {/* Table Control Header */}
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 bg-muted/20 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-foreground">Filter Benchmark:</span>
              {['All', 'Customer-Support', 'GSM8K', 'Tool-Calling'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    activeFilter === cat
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                Verified Benchmark Matrix
              </Badge>

              <Link
                href="/compare"
                className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <span>Full compare view</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-5 font-mono text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Run ID
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Benchmark Dataset
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Target Model
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Primary Score
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Latency / Cost
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Δ Baseline
                  </TableHead>
                  <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredRows.map((run) => (
                  <TableRow
                    key={run.runId}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {run.runId}
                    </TableCell>

                    <TableCell className="px-5 py-3.5 font-mono text-xs text-foreground font-medium">
                      {run.dataset}
                    </TableCell>

                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                          {run.provider}
                        </Badge>
                        <span className="font-medium text-xs text-foreground">
                          {run.model}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-3.5 font-mono font-medium text-sm text-foreground">
                      {run.score}
                    </TableCell>

                    <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{run.latency}</span>
                        <span>•</span>
                        <span className="text-foreground">{run.cost}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-3.5 font-mono text-xs">
                      {run.deltaType === 'up' && (
                        <div className="flex items-center gap-1 text-brand font-semibold">
                          <TrendingUp className="size-3.5" />
                          <span>{run.delta}</span>
                        </div>
                      )}
                      {run.deltaType === 'down' && (
                        <div className="flex items-center gap-1 text-amber-600 font-semibold dark:text-amber-400">
                          <TrendingDown className="size-3.5" />
                          <span>{run.delta}</span>
                        </div>
                      )}
                      {run.deltaType === 'baseline' && (
                        <span className="text-muted-foreground">
                          {run.delta}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-3.5 text-xs">
                      <Badge
                        variant={run.status === 'passed' ? 'outline' : 'destructive'}
                        className="font-mono text-[11px] gap-1"
                      >
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            run.status === 'passed' ? 'bg-emerald-500' : 'bg-red-500'
                          )}
                        />
                        <span className="capitalize">{run.status}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
  )
}
