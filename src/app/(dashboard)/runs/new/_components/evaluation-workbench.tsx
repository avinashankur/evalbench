'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Check, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODEL_PRESETS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  mock: ['mock-model'],
}

interface EvaluationWorkbenchProps {
  providers: string[]
  provider: string
  onProviderChange: (p: string) => void
  model: string
  onModelChange: (m: string) => void
  dataset: string
  onDatasetChange: (d: string) => void
  suggestedDatasets: string[]
  promptTemplate: string
  onPromptTemplateChange: (pt: string) => void
  systemPrompt: string
  onSystemPromptChange: (sp: string) => void
  concurrency: number
  onConcurrencyChange: (c: number) => void
  temperature: number
  onTemperatureChange: (t: number) => void
  maxTokens: string
  onMaxTokensChange: (mt: string) => void
  availableEvaluators: string[]
  selectedEvaluators: string[]
  onEvaluatorsChange: (evaluators: string[]) => void
  onSelectAllEvaluators: () => void
  onClearEvaluators: () => void
  onSelectRecommendedEvaluators: () => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  isValid: boolean
}

export function EvaluationWorkbench({
  providers,
  provider,
  onProviderChange,
  model,
  onModelChange,
  dataset,
  onDatasetChange,
  suggestedDatasets,
  promptTemplate,
  onPromptTemplateChange,
  systemPrompt,
  onSystemPromptChange,
  concurrency,
  onConcurrencyChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  availableEvaluators,
  selectedEvaluators,
  onEvaluatorsChange,
  onSelectAllEvaluators,
  onClearEvaluators,
  onSelectRecommendedEvaluators,
  onSubmit,
  isPending,
  isValid,
}: EvaluationWorkbenchProps) {
  const [showSystemPrompt, setShowSystemPrompt] = React.useState(Boolean(systemPrompt))
  const presets = MODEL_PRESETS[provider.toLowerCase()] ?? []

  function handleProviderSelect(p: string) {
    onProviderChange(p)
    const list = MODEL_PRESETS[p.toLowerCase()]
    if (list && list.length > 0 && !list.includes(model)) {
      onModelChange(list[0])
    }
  }

  function handleInsertToken(token: string) {
    if (!promptTemplate.includes(token)) {
      onPromptTemplateChange(promptTemplate ? `${promptTemplate} ${token}` : token)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Section 1: Target Model */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Target Model</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select the inference provider and model configuration to benchmark.
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <ToggleGroup
              value={[provider]}
              onValueChange={(val) => {
                if (val && val.length > 0) {
                  handleProviderSelect(val[val.length - 1])
                }
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start flex-wrap"
            >
              {providers.map((p) => (
                <ToggleGroupItem key={p} value={p} className="capitalize text-xs font-medium px-3.5">
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model-input" className="text-xs text-muted-foreground">
              Model Identifier
            </Label>
            <Input
              id="model-input"
              type="text"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder="e.g. gpt-4o, claude-3-5-sonnet-20241022"
              required
              className="font-mono text-xs h-9 bg-background/50 border-border/70"
            />
            {presets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="text-[11px]">Quick presets:</span>
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onModelChange(preset)}
                    className={cn(
                      'font-mono text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                      model === preset
                        ? 'border-foreground bg-foreground text-background font-medium'
                        : 'border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 2: Benchmark Dataset */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Benchmark Suite</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Target dataset containing test cases, reference contexts, and ground truth.
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dataset-input" className="text-xs text-muted-foreground">
                Dataset Key or Server Path
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">jsonl</span>
            </div>
            <Input
              id="dataset-input"
              type="text"
              value={dataset}
              onChange={(e) => onDatasetChange(e.target.value)}
              placeholder="e.g. customer-support-v1 or data/eval.jsonl"
              required
              className="font-mono text-xs h-9 bg-background/50 border-border/70"
            />
          </div>

          {suggestedDatasets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-[11px]">Suggestions:</span>
              {suggestedDatasets.map((ds) => (
                <Badge
                  key={ds}
                  variant={dataset === ds ? 'default' : 'outline'}
                  onClick={() => onDatasetChange(ds)}
                  className="cursor-pointer font-mono text-[11px] transition-colors hover:bg-muted font-normal"
                >
                  {ds}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Section 3: Evaluator Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Evaluation Criteria</h3>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {selectedEvaluators.length} active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automated scoring plugins applied to evaluate accuracy, latency, and conformance.
          </p>
          <div className="flex items-center gap-2 text-xs mt-2">
            <button
              type="button"
              onClick={onSelectRecommendedEvaluators}
              className="text-primary hover:underline cursor-pointer text-xs font-medium"
            >
              Recommended
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={onSelectAllEvaluators}
              className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer text-xs"
            >
              All
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={onClearEvaluators}
              className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer text-xs"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col gap-3">
          <ToggleGroup
            multiple
            value={selectedEvaluators}
            onValueChange={(val) => onEvaluatorsChange(val)}
            variant="outline"
            size="sm"
            className="flex flex-wrap gap-2 justify-start"
          >
            {availableEvaluators.map((name) => {
              const isSelected = selectedEvaluators.includes(name)
              return (
                <ToggleGroupItem
                  key={name}
                  value={name}
                  className={cn(
                    'h-8 font-mono text-xs capitalize gap-1.5 px-3 transition-all',
                    isSelected && 'border-primary/50 text-foreground shadow-xs'
                  )}
                >
                  {isSelected && <Check className="size-3 stroke-[2.5]" />}
                  {name.replace(/_/g, ' ')}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>

          {selectedEvaluators.length === 0 && (
            <p className="text-xs text-destructive font-medium">
              * Select at least one evaluator plugin to score outputs.
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Section 4: Prompt Engineering */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Prompt Template</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Template string with variables replaced per test case during inference execution.
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-template" className="text-xs text-muted-foreground">
                Template
              </Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-[10px]">Insert variable:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleInsertToken('{question}')}
                  className="font-mono text-[10px] h-5 px-1.5 border-border/70"
                >
                  {'{question}'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleInsertToken('{context}')}
                  className="font-mono text-[10px] h-5 px-1.5 border-border/70"
                >
                  {'{context}'}
                </Button>
              </div>
            </div>
            <Textarea
              id="prompt-template"
              value={promptTemplate}
              onChange={(e) => onPromptTemplateChange(e.target.value)}
              rows={2}
              className="font-mono text-xs bg-background/50 border-border/70"
              placeholder="{question}"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 5: Runtime & Hyperparameters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Runtime Controls</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure parallel execution workers and model sampling parameters.
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Concurrency Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Concurrency</Label>
              <Badge variant="secondary" className="font-mono text-xs">
                {concurrency} workers
              </Badge>
            </div>
            <Slider
              min={1}
              max={50}
              step={1}
              value={[concurrency]}
              onValueChange={(val) => {
                const num = Array.isArray(val) ? val[0] : val
                if (typeof num === 'number') onConcurrencyChange(num)
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>1 worker (sequential)</span>
              <span>50 parallel workers</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Badge variant="secondary" className="font-mono text-xs">
                {temperature.toFixed(2)}
              </Badge>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[temperature]}
              onValueChange={(val) => {
                const num = Array.isArray(val) ? val[0] : val
                if (typeof num === 'number') onTemperatureChange(num)
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.0 (Deterministic)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Max tokens input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-tokens-input" className="text-xs text-muted-foreground">
                Max Tokens Per Output
              </Label>
              <span className="text-[10px] text-muted-foreground">Optional cap</span>
            </div>
            <Input
              id="max-tokens-input"
              type="number"
              placeholder="Default (unlimited)"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(e.target.value)}
              className="font-mono text-xs h-8 bg-background/50 border-border/70 max-w-xs"
            />
          </div>

          {/* System prompt toggle */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-prompt-toggle" className="text-xs font-medium cursor-pointer text-foreground">
                  System Instructions
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Provide custom system role or instructions to the model
                </p>
              </div>
              <Switch
                id="system-prompt-toggle"
                checked={showSystemPrompt}
                onCheckedChange={(checked) => {
                  setShowSystemPrompt(checked)
                  if (!checked) onSystemPromptChange('')
                }}
              />
            </div>

            {showSystemPrompt && (
              <Textarea
                value={systemPrompt}
                onChange={(e) => onSystemPromptChange(e.target.value)}
                rows={2}
                className="text-xs bg-background/50 border-border/70 mt-1"
                placeholder="e.g. You are an expert AI agent. Answer accurately and concisely."
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Action Dock */}
      <div className="sticky bottom-4 z-20 rounded-xl border border-border/80 bg-secondary/90 backdrop-blur-md p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground truncate">
          <span className="font-semibold text-foreground truncate">{provider}/{model || '—'}</span>
          <span>·</span>
          <span className="truncate">{dataset || 'No dataset selected'}</span>
          <span>·</span>
          <span className="shrink-0">
            {selectedEvaluators.length} {selectedEvaluators.length === 1 ? 'evaluator' : 'evaluators'}
          </span>
          <span>·</span>
          <span className="shrink-0">{concurrency} workers</span>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <Link
            href="/runs"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-xs text-muted-foreground hover:text-foreground h-9'
            )}
          >
            Cancel
          </Link>
          <Button
            type="button"
            onClick={onSubmit}
            size="sm"
            disabled={isPending || !isValid}
            className="text-xs font-medium h-9 px-4"
          >
            {isPending ? (
              <>
                <RotateCcw data-icon="inline-start" className="size-3.5 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Play data-icon="inline-start" className="size-3.5" />
                Launch Evaluation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
