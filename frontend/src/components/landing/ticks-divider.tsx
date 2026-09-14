import { cn } from '@/lib/utils'

interface TicksDividerProps {
  className?: string
  count?: number
}

export function TicksDivider({ className, count = 120 }: TicksDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex h-3.5 w-full items-center overflow-hidden', className)}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isMajor = i % 5 === 0
        return (
          <span
            key={i}
            className={cn(
              'min-w-2.5 flex-1 shrink-0 border-l',
              isMajor ? 'h-3.5 border-muted-foreground/60' : 'h-1.5 border-border'
            )}
          />
        )
      })}
    </div>
  )
}
