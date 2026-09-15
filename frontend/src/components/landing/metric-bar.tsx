'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MetricBarProps {
  label?: string
  value?: string
  percent: number
  variant?: 'default' | 'warn'
  className?: string
}

export function MetricBar({
  label,
  value,
  percent,
  variant = 'default',
  className,
}: MetricBarProps) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percent)
    }, 100)
    return () => clearTimeout(timer)
  }, [percent])

  const hasLabel = Boolean(label && label.trim().length > 0)
  const hasValue = Boolean(value && value.trim().length > 0)

  return (
    <div
      className={cn(
        'flex w-full items-center text-xs text-muted-foreground',
        hasLabel || hasValue ? 'gap-2.5' : 'gap-0',
        className
      )}
    >
      {hasLabel && <span className="w-24 shrink-0 font-sans">{label}</span>}
      <div className="relative h-1.5 w-full flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            variant === 'warn' ? 'bg-amber-500' : 'bg-brand'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {hasValue && (
        <span className="w-10 shrink-0 text-right font-mono text-xs text-foreground">
          {value}
        </span>
      )}
    </div>
  )
}
