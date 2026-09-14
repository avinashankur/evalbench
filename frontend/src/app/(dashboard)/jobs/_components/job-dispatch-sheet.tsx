'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  SendHorizontal,
  RotateCcw,
  FileCode,
  Sliders,
  Database,
  Cpu,
  Check,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobCreate } from '@/modules/jobs'

const PRESETS = [
  {
    label: 'Mock Suite',
    path: 'configs/mock-example.yaml',
    desc: 'Mock fast test for pipeline & worker verification (zero API costs).',
    tag: 'Quick Start',
  },
  {
    label: 'LLM Judge',
    path: 'configs/llm-judge-example.yaml',
    desc: 'Evaluates test cases using LLM-as-a-judge scoring & criteria.',
    tag: 'Model Eval',
  },
  {
    label: 'RAG Pipeline',
    path: 'configs/rag-example.yaml',
    desc: 'Benchmarks retrieval relevance and answer correctness over datasets.',
    tag: 'Retrieval',
  },
]

const SAMPLE_JSON_CONFIG = `{
  "dataset": "datasets/customer-support-v1.jsonl",
  "model": {
    "provider": "mock",
    "name": "mock-model",
    "temperature": 0.0
  },
  "concurrency": 5,
  "evaluators": ["contains", "json_validity", "token_usage"]
}`

interface JobDispatchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: JobCreate) => void
  isSubmitting: boolean
  trigger?: React.ReactNode
}

export function JobDispatchSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  trigger,
}: JobDispatchSheetProps) {
  const [mode, setMode] = React.useState<'path' | 'inline'>('path')
  const [configPath, setConfigPath] = React.useState('configs/mock-example.yaml')
  const [jsonConfig, setJsonConfig] = React.useState('')
  const [jsonError, setJsonError] = React.useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setJsonError(null)

    if (mode === 'path') {
      if (!configPath.trim()) return
      const normalizedPath = configPath.trim().replace(/\\/g, '/')
      onSubmit({ config_path: normalizedPath })
      onOpenChange(false)
    } else {
      if (!jsonConfig.trim()) return
      try {
        const parsed = JSON.parse(jsonConfig.trim())
        if (typeof parsed !== 'object' || parsed === null) {
          setJsonError('Config must be a valid JSON object')
          return
        }
        onSubmit({ config: parsed })
        onOpenChange(false)
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax')
      }
    }
  }

  function handleInsertSample() {
    setJsonConfig(SAMPLE_JSON_CONFIG)
    setJsonError(null)
  }

  const isFormValid =
    mode === 'path' ? Boolean(configPath.trim()) : Boolean(jsonConfig.trim())

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col justify-between overflow-hidden bg-background"
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-4" />
              </span>
              <div>
                <SheetTitle className="text-base font-semibold">
                  Dispatch Evaluation Job
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Enqueue a benchmark run to be processed by background workers.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Form Content */}
          <form id="dispatch-job-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 flex-1">
            {/* Mode Switcher Segmented Control */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Configuration Format</Label>
              <div className="inline-flex p-1 rounded-lg bg-muted/80 border border-border/50 gap-1 shadow-2xs self-start">
                <button
                  type="button"
                  onClick={() => setMode('path')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                    mode === 'path'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileCode className="size-3.5" />
                  <span>Config Path (YAML)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('inline')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                    mode === 'inline'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sliders className="size-3.5" />
                  <span>Inline JSON</span>
                </button>
              </div>
            </div>

            {mode === 'path' ? (
              <div className="flex flex-col gap-4">
                {/* Preset Cards */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">Preset Benchmark Suites</Label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {PRESETS.map((preset) => {
                      const isSelected = configPath === preset.path
                      return (
                        <div
                          key={preset.path}
                          onClick={() => setConfigPath(preset.path)}
                          className={cn(
                            'p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 text-left',
                            isSelected
                              ? 'border-muted bg-muted/80 shadow-2xs'
                              : 'border-border/60 hover:bg-muted/50 bg-muted/30'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-foreground">
                                {preset.label}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                                {preset.tag}
                              </Badge>
                            </div>
                            {isSelected && (
                              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="size-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {preset.desc}
                          </p>
                          <code className="text-[10px] font-mono text-muted-foreground/80 truncate mt-0.5">
                            {preset.path}
                          </code>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Path Input */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sheet-config-path" className="text-xs text-foreground font-medium">
                      Server Config Path
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">Relative to backend root</span>
                  </div>
                  <Input
                    id="sheet-config-path"
                    type="text"
                    value={configPath}
                    onChange={(e) => setConfigPath(e.target.value)}
                    placeholder="configs/mock-example.yaml"
                    required
                    className="font-mono text-xs h-9 bg-background border-border/70 shadow-2xs"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sheet-json-input" className="text-xs text-foreground font-medium">
                    Benchmark Payload JSON
                  </Label>
                  <button
                    type="button"
                    onClick={handleInsertSample}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Insert template
                  </button>
                </div>

                <div className="rounded-lg border border-border/60 overflow-hidden shadow-2xs bg-background">
                  <div className="bg-muted/60 border-b border-border/50 px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <Sliders className="size-3" />
                      <span>payload.json</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">JSON</span>
                  </div>
                  <Textarea
                    id="sheet-json-input"
                    value={jsonConfig}
                    onChange={(e) => {
                      setJsonConfig(e.target.value)
                      setJsonError(null)
                    }}
                    rows={10}
                    placeholder={`{\n  "dataset": "datasets/customer-support-v1.jsonl",\n  "model": { "provider": "mock", "name": "mock-model" },\n  "concurrency": 5\n}`}
                    className="font-mono text-xs bg-background/50 border-0 rounded-none focus-visible:ring-0 leading-relaxed resize-y"
                  />
                </div>

                {jsonError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-[11px] text-destructive font-medium">
                    {jsonError}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Destination Target Strip */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 flex flex-col gap-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Pipeline Destination
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-background font-mono text-[11px] gap-1.5 py-1 px-2.5 shadow-2xs">
                  <Cpu className="size-3 text-muted-foreground" />
                  <span>evalbench:jobs:queue</span>
                </Badge>
                <Badge variant="outline" className="bg-background font-mono text-[11px] gap-1.5 py-1 px-2.5 shadow-2xs">
                  <Database className="size-3 text-muted-foreground" />
                  <span>PostgreSQL (evalbench)</span>
                </Badge>
              </div>
            </div>
          </form>
        </div>

        {/* Footer / Action Dock */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="dispatch-job-form"
            disabled={isSubmitting || !isFormValid}
            size="sm"
            className="text-xs font-medium h-9 px-4 gap-2 cursor-pointer shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="size-3.5 animate-spin" />
                Enqueuing…
              </>
            ) : (
              <>
                <SendHorizontal className="size-3.5" />
                Dispatch Evaluation
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
