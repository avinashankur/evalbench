'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RunsHeaderProps {
  onRefresh: () => void
  isRefetching: boolean
}

export function RunsHeader({ onRefresh, isRefetching }: RunsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        Explore, filter, and inspect benchmark executions across models and datasets.
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefetching}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw
          className={cn('size-3.5', isRefetching && 'animate-spin')}
          data-icon="inline-start"
        />
        {isRefetching ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  )
}
