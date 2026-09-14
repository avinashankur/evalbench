'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCreateRun, useListRuns, type RunCreate } from '@/modules/runs'
import { useProviders, useEvaluators, useHealth } from '@/modules/discovery'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EvaluationWorkbench } from './_components'

const DEFAULT_DATASET_SUGGESTIONS = ['customer-support-v1', 'inline', 'data/mmlu.jsonl']

export default function NewRunPage() {
  const router = useRouter()
  const { mutate, isPending } = useCreateRun()
  const { data: health } = useHealth()
  const { data: providersData } = useProviders()
  const { data: evaluatorsData } = useEvaluators()
  const { data: runsData } = useListRuns({ limit: 50 })

  // Form State
  const [provider, setProvider] = React.useState('openai')
  const [model, setModel] = React.useState('gpt-4o')
  const [dataset, setDataset] = React.useState('')
  const [promptTemplate, setPromptTemplate] = React.useState('{question}')
  const [systemPrompt, setSystemPrompt] = React.useState('')
  const [concurrency, setConcurrency] = React.useState(10)
  const [temperature, setTemperature] = React.useState(0.7)
  const [maxTokens, setMaxTokens] = React.useState('')
  const [selectedEvaluators, setSelectedEvaluators] = React.useState<string[]>([
    'exact_match',
    'contains',
    'latency',
  ])

  // Discovery data
  const providers = React.useMemo(() => {
    if (providersData?.providers && providersData.providers.length > 0) {
      return providersData.providers
    }
    return ['openai', 'anthropic', 'gemini', 'mock']
  }, [providersData?.providers])

  const evaluators = React.useMemo(() => {
    if (evaluatorsData?.evaluators && evaluatorsData.evaluators.length > 0) {
      return evaluatorsData.evaluators
    }
    return ['exact_match', 'contains', 'llm_judge', 'latency', 'token_usage']
  }, [evaluatorsData?.evaluators])

  // Suggested datasets from DB runs + default fallbacks
  const datasetSuggestions = React.useMemo(() => {
    const fromRuns = runsData?.runs?.map((r) => r.dataset_name) ?? []
    return Array.from(new Set([...fromRuns, ...DEFAULT_DATASET_SUGGESTIONS]))
  }, [runsData?.runs])

  // Evaluator selection handlers
  function handleToggleEvaluator(name: string) {
    setSelectedEvaluators((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]
    )
  }

  function handleSelectAllEvaluators() {
    setSelectedEvaluators([...evaluators])
  }

  function handleClearEvaluators() {
    setSelectedEvaluators([])
  }

  function handleSelectRecommended() {
    setSelectedEvaluators(
      ['exact_match', 'contains', 'latency'].filter((e) => evaluators.includes(e))
    )
  }

  function handleResetDefaults() {
    setProvider('openai')
    setModel('gpt-4o')
    setDataset('')
    setPromptTemplate('{question}')
    setSystemPrompt('')
    setConcurrency(10)
    setTemperature(0.7)
    setMaxTokens('')
    setSelectedEvaluators(['exact_match', 'contains', 'latency'])
  }

  const isValid = Boolean(dataset.trim() && model.trim() && selectedEvaluators.length > 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || isPending) return

    const payload: RunCreate = {
      dataset: dataset.trim(),
      model: {
        provider,
        name: model.trim(),
        temperature,
        max_tokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      },
      prompt_template: promptTemplate.trim() || '{question}',
      system_prompt: systemPrompt.trim() || undefined,
      concurrency,
      evaluators: selectedEvaluators,
    }

    mutate(payload, {
      onSuccess(data) {
        router.push(`/runs/${data.run_id}`)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          href="/runs"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'xs' }),
            'group text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2'
          )}
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            data-icon="inline-start"
          />
          Back to Evaluation Runs
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px] gap-1.5 py-0.5">
            <span
              className={cn(
                'size-1.5 rounded-full',
                health?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <span>{health?.status === 'ok' ? 'API Connected' : 'Checking API...'}</span>
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleResetDefaults}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="size-3" data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Cardless Linear/Vercel-style Studio Form */}
      <form onSubmit={handleSubmit}>
        <EvaluationWorkbench
          providers={providers}
          provider={provider}
          onProviderChange={setProvider}
          model={model}
          onModelChange={setModel}
          dataset={dataset}
          onDatasetChange={setDataset}
          suggestedDatasets={datasetSuggestions}
          promptTemplate={promptTemplate}
          onPromptTemplateChange={setPromptTemplate}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          concurrency={concurrency}
          onConcurrencyChange={setConcurrency}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          availableEvaluators={evaluators}
          selectedEvaluators={selectedEvaluators}
          onEvaluatorsChange={setSelectedEvaluators}
          onSelectAllEvaluators={handleSelectAllEvaluators}
          onClearEvaluators={handleClearEvaluators}
          onSelectRecommendedEvaluators={handleSelectRecommended}
          onSubmit={handleSubmit}
          isPending={isPending}
          isValid={isValid}
        />
      </form>
    </div>
  )
}
