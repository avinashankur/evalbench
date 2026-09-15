import Link from 'next/link'
import { ExternalLink, Lock, Server, Wrench } from 'lucide-react'
import { SectionHeader } from '@/components/landing/section-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

interface OpenSourceStripProps {
  className?: string
}

const highlights = [
  {
    icon: Lock,
    label: 'Offline & Zero-Cost Testing',
    badge: 'Mock Provider',
    description:
      'Run entire benchmark test suites and RAG retrieval simulations offline without API keys using the built-in Mock provider and in-memory retriever.',
  },
  {
    icon: Wrench,
    label: '10 Built-in Evaluators',
    badge: 'Python Registry',
    description:
      'Score groundedness (faithfulness, answer relevance), deterministic structure (JSON validity, exact match), and economics (latency, tokens, USD cost).',
  },
  {
    icon: Server,
    label: 'Self-Hosted Architecture',
    badge: 'PostgreSQL + Redis',
    description:
      'Run on your own infrastructure with total privacy. FastAPI REST server, asynchronous Redis queues, and asyncpg PostgreSQL storage ensure zero telemetry leaves your VPC.',
  },
]

export function OpenSourceStrip({ className }: OpenSourceStripProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// open source"
        title="Built in the open for full engineering control"
        description="EvalBench is fully open source. Inspect the evaluation logic, self-host on your own infrastructure, extend custom Python evaluators, and own your AI benchmarks end-to-end."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              className="group relative flex flex-col justify-between overflow-hidden border-border/70 bg-card/60 transition-all hover:border-border hover:bg-card hover:shadow-md"
            >
              <CardHeader className="flex w-full flex-col gap-4 pb-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-foreground transition-colors group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                    {item.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'gap-2')}
        >
          <ExternalLink className="size-4" data-icon="inline-start" />
          View on GitHub
        </a>
        <Link
          href="/docs"
          className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }))}
        >
          Read the docs
        </Link>
      </div>
    </section>
  )
}
