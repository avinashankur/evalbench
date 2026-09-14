'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MetricBarProps {
  label: string
  value: string
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
    // Smooth initial animation
    const timer = setTimeout(() => {
      setWidth(percent)
    }, 100)
    return () => clearTimeout(timer)
  }, [percent])

  return (
    <div className={cn('flex items-center gap-2.5 text-xs text-muted-foreground', className)}>
      <span className="w-24 shrink-0 font-sans">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-xs bg-muted">
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-1000 ease-out',
            variant === 'warn' ? 'bg-orange-600' : 'bg-blue-600'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-foreground">
        {value}
      </span>
    </div>
  )
}
