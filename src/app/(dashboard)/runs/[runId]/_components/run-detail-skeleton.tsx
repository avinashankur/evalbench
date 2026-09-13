'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function RunDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Metrics Overview Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="border-border/70 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
          <div className="flex flex-col divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
