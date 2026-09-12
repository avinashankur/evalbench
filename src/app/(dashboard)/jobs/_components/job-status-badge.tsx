'use client'

import * as React from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface JobStatusBadgeProps {
  status: string
  className?: string
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const normalized = status.toLowerCase()

  if (normalized === 'running') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium',
          className
        )}
      >
        <RefreshCw className="size-3 animate-spin" />
        Running
      </Badge>
    )
  }

  if (normalized === 'completed') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium',
          className
        )}
      >
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    )
  }

  if (normalized === 'failed') {
    return (
      <Badge
        variant="destructive"
        className={cn('gap-1.5 text-xs font-medium', className)}
      >
        <XCircle className="size-3" />
        Failed
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium',
        className
      )}
    >
      <Clock className="size-3" />
      {status || 'Queued'}
    </Badge>
  )
}
