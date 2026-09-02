import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CtaStripProps {
  className?: string
}

export function CtaStrip({ className }: CtaStripProps) {
  return (
    <section className={cn('mx-auto mb-20 max-w-6xl px-6 sm:px-8', className)}>
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-md bg-neutral-900 px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12 sm:py-14 dark:bg-card dark:text-card-foreground dark:border dark:border-border">
        {/* Ambient Radial Blue Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 size-80 -translate-y-1/3 translate-x-1/4 rounded-full bg-blue-600/30 blur-3xl"
        />

        {/* Headline */}
        <h2 className="relative z-10 max-w-md font-serif text-3xl font-normal tracking-tight sm:text-3xl">
          Ship the version that actually scored better.
        </h2>

        {/* CTA Button */}
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'relative z-10 bg-white text-neutral-900 hover:bg-white/90 dark:bg-primary dark:text-primary-foreground'
          )}
        >
          Get started free
        </Link>
      </div>
    </section>
  )
}
