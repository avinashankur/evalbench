'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

interface CtaStripProps {
  className?: string
}

export function CtaStrip({ className }: CtaStripProps) {
  const { data: session } = authClient.useSession()
  const ctaHref = session?.user ? '/dashboard' : '/signup'

  return (
    <section className={cn('mx-auto mb-20 max-w-6xl px-6 sm:px-8', className)}>
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl bg-neutral-900 px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12 sm:py-14 dark:bg-card dark:text-card-foreground dark:border dark:border-border">
        {/* Ambient Radial Brand Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 size-80 -translate-y-1/3 translate-x-1/4 rounded-full bg-brand/30 blur-3xl"
        />

        {/* Headline & Subtitle */}
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl text-white dark:text-card-foreground">
            Ship the model version that actually scored better.
          </h2>
          <p className="text-sm text-neutral-300 dark:text-muted-foreground leading-relaxed">
            Run your evaluation suite against candidate models in minutes. Spot hallucinations, latency spikes, and cost regressions before production.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href={ctaHref}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'relative z-10 gap-2 bg-white text-neutral-900 hover:bg-white/90 dark:bg-primary dark:text-primary-foreground shrink-0'
          )}
        >
          <span>{session?.user ? 'Open Dashboard' : 'Get started free'}</span>
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    </section>
  )
}
