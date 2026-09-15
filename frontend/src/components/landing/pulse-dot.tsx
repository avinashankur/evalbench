import { cn } from '@/lib/utils'

interface PulseDotProps {
  className?: string
  color?: string
}

export function PulseDot({ className, color = 'bg-brand' }: PulseDotProps) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      <span
        className={cn(
          'absolute h-3 w-3 animate-ping rounded-full opacity-75',
          color
        )}
      />
    </span>
  )
}
