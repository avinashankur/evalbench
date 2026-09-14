import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface RunsMetricsStripProps {
  stats: {
    totalExecutions: number
    uniqueDatasets: number
    uniqueModels: number
    totalTestCases: number
  }
  isFiltered: boolean
  filteredCount: number
}

export function RunsMetricsStrip({
  stats,
  isFiltered,
  filteredCount,
}: RunsMetricsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="border-border/70">
        <CardContent className="p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Total Runs</p>
          <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
            {stats.totalExecutions}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isFiltered ? `${filteredCount} matching filters` : 'Benchmark executions logged'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Datasets Tested</p>
          <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
            {stats.uniqueDatasets}
          </p>
          <p className="text-[11px] text-muted-foreground">Unique test benchmark suites</p>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Models Evaluated</p>
          <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
            {stats.uniqueModels}
          </p>
          <p className="text-[11px] text-muted-foreground">Distinct model configurations</p>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Test Cases Processed</p>
          <p className="font-serif text-3xl font-medium tracking-tight text-foreground">
            {stats.totalTestCases.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">Total evaluation inputs scored</p>
        </CardContent>
      </Card>
    </div>
  )
}
