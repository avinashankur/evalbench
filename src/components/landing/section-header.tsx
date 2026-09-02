import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  kicker: string
  title: string
  description: string
  className?: string
}

export function SectionHeader({
  kicker,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-11 max-w-2xl', className)}>
      <div className="mb-2.5 font-mono text-xs font-medium text-blue-600">
        {kicker}
      </div>
      <h2 className="font-serif text-3xl font-normal tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 font-sans text-base leading-relaxed text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  )
}
