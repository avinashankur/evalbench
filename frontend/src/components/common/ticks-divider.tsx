import { cn } from '@/lib/utils'

interface TicksDividerProps {
  className?: string
  count?: number
}

export function TicksDivider({ className, count = 120 }: TicksDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-3.5 w-full items-center overflow-hidden',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isMajor = i % 5 === 0
        return (
          <span
            key={i}
            className={cn(
              'flex-1 shrink-0 border-l',
              isMajor
                ? 'h-3.5 border-[#9A9FA6] dark:border-muted-foreground/60'
                : 'h-1.5 border-[#C4C8CC] dark:border-border'
            )}
            style={{ minWidth: '10px' }}
          />
        )
      })}
    </div>
  )
}
