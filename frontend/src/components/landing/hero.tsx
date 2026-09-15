'use client'

import Link from 'next/link'
import { PulseDot } from '@/components/landing/pulse-dot'
import { Scoreboard } from '@/components/landing/scoreboard'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const { data: session } = authClient.useSession()
  const evalHref = session?.user ? '/runs/new' : '/signup'

  return (
    <section
      className={cn('relative mx-auto max-w-6xl px-6 pt-16 pb-14 sm:px-8 sm:pt-20', className)}
    >
      {/* Subtle Grid Texture with Radial Mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          backgroundPosition: '-1px -1px',
          color: 'var(--border, #DCDFE2)',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 85%)',
        }}
      />

      {/* Hero Content */}
      <div className="relative z-10">
        {/* Eyebrow */}
        <div className="mb-6">
          <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground hidden sm:inline-flex">
            10 Evaluators · RAG Triad · Multi-Provider
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-foreground max-w-4xl text-4xl leading-tight font-normal tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          AI changes,{' '}
          <span className="font-serif font-normal text-brand italic">measured</span> against ground
          truth.
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mt-5 max-w-2xl font-sans text-base leading-relaxed sm:text-lg md:text-xl">
          Benchmark LLMs and RAG pipelines for accuracy, latency, and cost before shipping to production.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={evalHref}
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'gap-2')}
          >
            <span>Run your first eval</span>
          </Link>

          <Link
            href="/docs"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'gap-2')}
          >
            <span>Read the docs</span>
          </Link>
        </div>

        {/* Scoreboard Visual */}
        <Scoreboard />
      </div>
    </section>
  )
}
