import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

interface TrackingFeaturesProps {
  className?: string
}

const features = [
  {
    num: '01',
    stat: '94.2% avg',
    title: 'Accuracy',
    description:
      'Pass rate against your eval suite, broken down by test case and failure category.',
  },
  {
    num: '02',
    stat: '$0.042 / run',
    title: 'Cost',
    description:
      'Tokens and dollars per run, tracked alongside score so cheap regressions dont slip through.',
  },
  {
    num: '03',
    stat: '1.2s p95',
    title: 'Latency',
    description:
      'Response time distribution per agent version, not just an average that hides the tail.',
  },
]

export function TrackingFeatures({ className }: TrackingFeaturesProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// measured, not felt"
        title="What EvalBench tracks"
        description="Three axes, tracked on every single run — because a model that's more accurate but three times slower isn't automatically a win."
      />

      {/* 3-Column Features Grid */}
      <div className="grid grid-cols-1 border-t border-border md:grid-cols-3">
        {features.map((feature, idx) => (
          <div
            key={feature.num}
            className={cn(
              'group pt-7 pb-8 transition-colors md:pb-0',
              idx !== 0 && 'md:border-l md:border-border md:pl-6',
              idx !== features.length - 1 && 'border-b border-border md:border-b-0 md:pr-6'
            )}
          >
            <span className="mb-1.5 block font-serif text-3xl font-normal text-muted-foreground/40 transition-colors duration-200 group-hover:text-blue-600">
              {feature.num}
            </span>
            <div className="mb-3.5 font-mono text-xs font-medium text-blue-600">
              {feature.stat}
            </div>
            <h3 className="mb-2.5 text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
