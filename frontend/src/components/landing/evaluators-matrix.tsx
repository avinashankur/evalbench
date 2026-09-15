'use client'

import * as React from 'react'
import {
  Binary,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FileCheck,
  FileJson,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { SectionHeader } from '@/components/landing/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface EvaluatorDetail {
  name: string
  identifier: string
  badge: string
  description: string
  formula: string
  icon: React.ElementType
  sampleInput: string
  sampleOutput: string
  verdict: {
    passed: boolean
    score: string
    note: string
  }
}

interface CategoryGroup {
  id: string
  label: string
  count: number
  kicker: string
  description: string
  evaluators: EvaluatorDetail[]
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'rag',
    label: 'RAG & Hallucination Guardrails',
    count: 4,
    kicker: 'Hallucination prevention & retriever evaluation',
    description:
      'Mathematical verification that generated claims are strictly grounded in retrieved document chunks, eliminating hallucinations and evaluating retriever quality.',
    evaluators: [
      {
        name: 'Faithfulness',
        identifier: 'faithfulness',
        badge: 'Hallucination Check',
        icon: ShieldCheck,
        description: 'Measures the fraction of claims in the generated response that are mathematically entailed by the retrieved context.',
        formula: 'entailed_claims / total_claims',
        sampleInput: 'Context: "Refunds processed within 5 business days."',
        sampleOutput: 'Response: "Refunds are completed in 24 hours."',
        verdict: {
          passed: false,
          score: '0.0 / 1.0',
          note: 'Claim contradicts context chunk',
        },
      },
      {
        name: 'Answer Relevance',
        identifier: 'answer_relevance',
        badge: 'Query Alignment',
        icon: Sparkles,
        description: 'Assesses whether the response directly addresses the question without superfluous or evasive reasoning.',
        formula: 'cosine_similarity(query_embedding, answer_embedding)',
        sampleInput: 'Query: "How do I reset my account password?"',
        sampleOutput: 'Response: "Navigate to Settings > Account > Reset Password."',
        verdict: {
          passed: true,
          score: '0.97 / 1.0',
          note: 'Direct semantic alignment',
        },
      },
      {
        name: 'Context Precision',
        identifier: 'context_precision',
        badge: 'Retriever Ranking',
        icon: Layers,
        description: 'Evaluates signal-to-noise ratio in retrieved documents, penalizing irrelevant chunks that rank higher than ground truth.',
        formula: 'mean_average_precision @ k',
        sampleInput: 'Query: "What is the warranty period?" (Top 3 retrieved)',
        sampleOutput: 'Chunk #1: "Hardware carries a 2-year warranty."',
        verdict: {
          passed: true,
          score: '1.0 / 1.0',
          note: 'Relevant chunk ranked at index 0',
        },
      },
      {
        name: 'Context Recall',
        identifier: 'context_recall',
        badge: 'Fact Coverage',
        icon: Search,
        description: 'Validates whether the retriever extracted all ground truth facts necessary to formulate an accurate answer.',
        formula: 'retrieved_facts / ground_truth_facts',
        sampleInput: 'Ground truth requires: [pricing, tier_limits]',
        sampleOutput: 'Retriever returned: [pricing, tier_limits, sla]',
        verdict: {
          passed: true,
          score: '1.0 / 1.0',
          note: 'All ground truth facts captured',
        },
      },
    ],
  },
  {
    id: 'deterministic',
    label: 'Deterministic & Schema Guardrails',
    count: 3,
    kicker: 'Zero-tolerance programmatic scoring',
    description:
      'Fast, offline, and deterministic evaluation checks. Validate structured JSON tool-call syntax and exact string ground-truth matches without calling LLM judges.',
    evaluators: [
      {
        name: 'Exact Match',
        identifier: 'exact_match',
        badge: 'Binary Strict',
        icon: Binary,
        description: 'Deterministic string matching against expected ground-truth answers with normalized whitespace and casing options.',
        formula: 'normalize(response) === normalize(ground_truth)',
        sampleInput: 'Expected: "42" (Math proof result)',
        sampleOutput: 'Response: "42"',
        verdict: {
          passed: true,
          score: '1.0 (pass)',
          note: 'Exact character sequence matched',
        },
      },
      {
        name: 'Contains Substring',
        identifier: 'contains',
        badge: 'Keyword & Regex',
        icon: FileCheck,
        description: 'Inspects model responses for the presence of required keywords, specific policy citations, or regex patterns.',
        formula: 'ground_truth in response',
        sampleInput: 'Required token: "REFUND_APPROVED_V2"',
        sampleOutput: 'Response: "Transaction REFUND_APPROVED_V2 recorded."',
        verdict: {
          passed: true,
          score: '1.0 (pass)',
          note: 'Required entity present',
        },
      },
      {
        name: 'JSON Validity',
        identifier: 'json_validity',
        badge: 'Structured Output',
        icon: FileJson,
        description: 'Ensures model outputs parse as valid JSON and conform strictly to expected object keys and primitive types.',
        formula: 'json.loads(response) & schema.validate()',
        sampleInput: 'Target schema: { action: string, amount: number }',
        sampleOutput: 'Response: {"action": "refund", "amount": 49.99}',
        verdict: {
          passed: true,
          score: '1.0 (pass)',
          note: 'Valid JSON & schema conformant',
        },
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performance, Economics & LLM Judge',
    count: 3,
    kicker: 'Latency distributions, token budgets & rubric judges',
    description:
      'Track real unit economics, latency distributions, and flexible rubric scoring with model-as-a-judge evaluators.',
    evaluators: [
      {
        name: 'Latency Distribution',
        identifier: 'latency',
        badge: 'P95 Response SLA',
        icon: Clock,
        description: 'Profiles response time across P50, P90, P95, and P99 percentiles to detect tail-latency regressions.',
        formula: 'duration_ms <= pass_threshold_ms',
        sampleInput: 'Budget SLA: 1,200ms threshold',
        sampleOutput: 'Inference runtime: 820ms response time',
        verdict: {
          passed: true,
          score: '820ms',
          note: 'Within SLA budget (380ms headroom)',
        },
      },
      {
        name: 'Token Usage & Cost',
        identifier: 'token_usage',
        badge: 'Unit Economics',
        icon: Coins,
        description: 'Meters prompt and completion tokens per test case and calculates exact USD expenditures using provider pricing matrices.',
        formula: '(prompt_tok * rate) + (comp_tok * rate)',
        sampleInput: 'Model: gpt-4o (420 prompt + 84 completion tokens)',
        sampleOutput: 'Total tokens: 504 tokens',
        verdict: {
          passed: true,
          score: '$0.0021',
          note: 'Priced against provider rate card',
        },
      },
      {
        name: 'LLM Judge',
        identifier: 'llm_judge',
        badge: 'Custom Rubric',
        icon: Cpu,
        description: 'Evaluates nuanced criteria (tone, helpfulness, clarity) using customizable rubric prompts and threshold scoring.',
        formula: 'judge_model.score(rubric, output) >= threshold',
        sampleInput: 'Rubric: "Customer empathy & clarity on 1-5 scale"',
        sampleOutput: 'Judge feedback: "Clear, polite, and actionable resolution."',
        verdict: {
          passed: true,
          score: '4.8 / 5.0',
          note: 'Threshold >= 4.0 satisfied',
        },
      },
    ],
  },
]

interface EvaluatorsMatrixProps {
  className?: string
}

export function EvaluatorsMatrix({ className }: EvaluatorsMatrixProps) {
  const [activeTab, setActiveTab] = React.useState<string>('rag')
  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0]

  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// 10 built-in evaluators"
        title="Scoring built for production AI"
        description="EvalBench ships with 10 native evaluators categorized across RAG groundedness, deterministic schema compliance, and performance economics."
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col gap-6"
      >
        {/* Category Selector Tabs */}
        <div className="flex justify-center sm:justify-start">
          <TabsList className="h-auto p-1.5 gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium"
              >
                <span>{cat.label}</span>
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4">
                  {cat.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Category Description Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-5 py-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-muted-foreground">
            <span className="font-semibold text-foreground">{currentCategory.label}:</span>
            <span>{currentCategory.kicker}</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {currentCategory.count} evaluators active
          </span>
        </div>

        {/* Evaluator Grid for Active Category */}
        {CATEGORIES.map((cat) => (
          <TabsContent
            key={cat.id}
            value={cat.id}
            className="mt-0"
          >
            <div
              className={cn(
                'grid grid-cols-1 gap-5',
                cat.id === 'rag' ? 'md:grid-cols-2' : 'md:grid-cols-3'
              )}
            >
              {cat.evaluators.map((evaluator) => {
                const Icon = evaluator.icon
                return (
                  <Card
                    key={evaluator.identifier}
                    className="flex flex-col justify-between border-border/70 bg-card transition-all hover:border-border hover:shadow-lg"
                  >
                    <CardHeader className="flex flex-col gap-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {evaluator.name}
                            </CardTitle>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {evaluator.identifier}
                            </span>
                          </div>
                        </div>

                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {evaluator.badge}
                        </Badge>
                      </div>

                      <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                        {evaluator.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3 pt-1">
                      {/* Formula / Scoring Logic */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 font-mono text-[11px] text-muted-foreground">
                        <span className="text-muted-foreground/70">Scoring:</span>
                        <code className="text-foreground font-medium truncate max-w-[210px] text-right">
                          {evaluator.formula}
                        </code>
                      </div>

                      {/* Interactive Sample Verification Box */}
                      <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs">
                        <div className="truncate text-[11px] text-muted-foreground">
                          {evaluator.sampleInput}
                        </div>
                        <div className="truncate text-[11px] text-foreground font-medium">
                          {evaluator.sampleOutput}
                        </div>

                        <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {evaluator.verdict.passed ? (
                              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-red-500 shrink-0" />
                            )}
                            <span
                              className={cn(
                                'font-semibold',
                                evaluator.verdict.passed
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              )}
                            >
                              Score: {evaluator.verdict.score}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[130px] text-right">
                            {evaluator.verdict.note}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Extensible Python Registry Note */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Extensible Python Architecture:</span> Add your own metric with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              @register_evaluator(&quot;custom_metric&quot;)
            </code>{' '}
            and it automatically integrates across the CLI, FastAPI, and comparison dashboard.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs shrink-0 self-start sm:self-auto">
          evalbench.evaluators
        </Badge>
      </div>
    </section>
  )
}
