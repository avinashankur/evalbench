'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SendHorizontal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSubmitFormProps {
  configPath: string
  onConfigPathChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export function JobSubmitForm({
  configPath,
  onConfigPathChange,
  onSubmit,
  isSubmitting,
}: JobSubmitFormProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">Submit Evaluation Job</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Queue an asynchronous evaluation benchmark task on the backend worker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="config-path-input" className="text-xs font-medium text-foreground">
              Configuration Path
            </label>
            <Input
              id="config-path-input"
              type="text"
              value={configPath}
              onChange={(e) => onConfigPathChange(e.target.value)}
              placeholder="configs/mmlu.yaml"
              required
              className="text-xs bg-background/50 border-border/70"
            />
            <p className="text-[11px] text-muted-foreground">
              Relative or absolute path to a benchmark YAML config file on the server.
            </p>
          </div>

          <div className="flex justify-start">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !configPath.trim()}
              className="text-xs font-medium"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw data-icon="inline-start" className="size-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <SendHorizontal data-icon="inline-start" className="size-3.5" />
                  Submit Job
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
