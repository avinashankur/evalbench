'use client'

import * as React from 'react'
import { Check, Copy, Cpu, Database, Network, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import { SectionHeader } from '@/components/landing/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExecutionMode {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  badge: string
  command: string
  description: string
  architectureNote: string
  snippet: string
}

const MODES: ExecutionMode[] = [
  {
    id: 'cli',
    title: 'CLI & CI/CD Pipeline',
    subtitle: 'Synchronous local execution',
    icon: Terminal,
    badge: 'Zero Overhead',
    command: 'evalbench run configs/rag-example.yaml',
    description:
      'Execute benchmarks directly in your local terminal or GitHub Actions runner. Loads YAML configs, executes concurrent model queries, and outputs formatted markdown tables and JSONL result files.',
    architectureNote: 'Supports mock provider and in-memory TF/cosine retrievers with zero external dependencies or API keys.',
    snippet: `# 1. Install via pip or uv
uv pip install evalbench

# 2. Run benchmark with concurrency
evalbench run configs/rag-example.yaml --concurrency 5

# 3. View terminal results summary
┌───────────────────┬──────────────┬──────────────┬────────────┐
│ Evaluator         │ Pass Rate    │ Mean Score   │ Latency    │
├───────────────────┼──────────────┼──────────────┼────────────┤
│ faithfulness      │ 95.8%        │ 0.958        │ 820ms      │
│ answer_relevance  │ 97.2%        │ 0.972        │ 820ms      │
│ context_precision │ 94.0%        │ 0.940        │ —          │
└───────────────────┴──────────────┴──────────────┴────────────┘`,
  },
  {
    id: 'api',
    title: 'FastAPI REST Service',
    subtitle: 'Headless automation & dashboard backend',
    icon: Network,
    badge: 'REST / JSON',
    command: 'evalbench serve --port 8000',
    description:
      'The FastAPI engine powers programmatic evaluation triggers and client dashboard inspection. Endpoints include /api/v1/runs, /api/v1/jobs, and /api/v1/health with full OpenAPI documentation.',
    architectureNote: 'Includes automated request timeout handling, CORS authorization, and Pydantic v2 payload validation.',
    snippet: `# Start the API server
evalbench serve --host 0.0.0.0 --port 8000

# Trigger an evaluation run via cURL
curl -X POST http://localhost:8000/api/v1/runs \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset": "datasets/customer-support-v1.jsonl",
    "model": { "provider": "openai", "name": "gpt-4o" },
    "evaluators": ["faithfulness", "answer_relevance", "latency"]
  }'

# Response: 201 Created
{
  "run_id": "run-8f2a1b9e",
  "status": "running",
  "message": "Evaluation started with 64 test cases"
}`,
  },
  {
    id: 'distributed',
    title: 'Distributed Redis Queue',
    subtitle: 'High-throughput async background workers',
    icon: Database,
    badge: 'Production Scale',
    command: 'evalbench worker & evalbench enqueue configs/large-suite.yaml',
    description:
      'For enterprise-scale benchmarks across thousands of test cases, EvalBench decouples job scheduling from execution. Workers pull tasks from Redis and persist deep telemetry traces to PostgreSQL via asyncpg.',
    architectureNote: 'Stateless worker pools can scale horizontally across Kubernetes pods or cloud instances.',
    snippet: `# Start a background worker daemon
evalbench worker --concurrency 10

# Enqueue an evaluation job to Redis
evalbench enqueue configs/large-suite.yaml
# Output: Enqueued job-74f9d12a to 'evalbench:jobs' queue

# Check real-time progress
evalbench status job-74f9d12a
# Output: Status: RUNNING [420/1000 items (42%) | Workers: 3]

# Inspect aggregated results stored in PostgreSQL
evalbench results job-74f9d12a --format json`,
  },
]

interface ExecutionModesProps {
  className?: string
}

export function ExecutionModes({ className }: ExecutionModesProps) {
  const [activeTab, setActiveTab] = React.useState<string>('cli')
  const [copied, setCopied] = React.useState(false)

  const activeMode = MODES.find((m) => m.id === activeTab) ?? MODES[0]

  async function handleCopy() {
    await navigator.clipboard.writeText(activeMode.command)
    setCopied(true)
    toast.success(`Copied command: ${activeMode.command}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// 3 execution topologies"
        title="From local terminal to distributed cloud"
        description="Run benchmarks locally during development, trigger runs via REST in CI, or scale across thousands of cases with Redis workers and PostgreSQL storage."
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col gap-6"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-1.5 gap-1.5 w-full">
          {MODES.map((mode) => {
            const Icon = mode.icon
            return (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className="flex items-center justify-start gap-2.5 p-3 text-left data-active:shadow-sm"
              >
                <div className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-foreground shrink-0">
                  <Icon className="size-3.5" />
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {mode.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {mode.subtitle}
                  </span>
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <Card className="border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {activeMode.title}
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {activeMode.badge}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                {activeMode.description}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <code className="hidden md:inline-block rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs text-foreground">
                {activeMode.command}
              </code>
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopy}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check data-icon="inline-start" className="text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy data-icon="inline-start" />
                    Copy Command
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="relative">
              <pre className="overflow-auto bg-neutral-950 p-5 font-mono text-xs leading-relaxed text-neutral-200 dark:bg-black/80 max-h-[380px] select-all">
                <code>{activeMode.snippet}</code>
              </pre>
            </div>

            <div className="border-t border-border/70 bg-muted/20 px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Cpu className="size-4 text-brand shrink-0" />
              <span>{activeMode.architectureNote}</span>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </section>
  )
}
