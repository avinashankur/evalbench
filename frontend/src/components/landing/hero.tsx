'use client'

import Link from 'next/link'
import { PulseDot } from '@/components/landing/pulse-dot'
import { Scoreboard } from '@/components/landing/scoreboard'
import { buttonVariants } from '@/components/ui/button'
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
        <div className="mb-5 flex items-center gap-2 font-mono text-xs font-medium text-blue-600">
          <PulseDot />
          <span>214 runs evaluated today</span>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-foreground max-w-3xl text-4xl leading-tight font-normal tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Every agent change,{' '}
          <span className="font-serif font-normal text-blue-600 italic">measured</span> against the
          last one.
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mt-5 max-w-2xl font-sans text-base leading-relaxed sm:text-lg md:text-xl">
          EvalBench runs your test suites against every agent version and shows exactly what got
          better, worse, or broke — before it reaches production.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={evalHref}
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
          >
            Run your first eval
          </Link>
          <Link
            href="/docs"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Read the docs
          </Link>
        </div>

        {/* Scoreboard Visual */}
        <Scoreboard />
      </div>
    </section>
  )
}
