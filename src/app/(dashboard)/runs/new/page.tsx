'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCreateRun } from '@/modules/runs'
import { useProviders, useEvaluators } from '@/modules/discovery'
import type { RunCreate } from '@/modules/runs'

export default function NewRunPage() {
  const router = useRouter()
  const { mutate, isPending } = useCreateRun()
  const { data: providersData } = useProviders()
  const { data: evaluatorsData } = useEvaluators()

  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o')
  const [dataset, setDataset] = useState('')
  const [promptTemplate, setPromptTemplate] = useState('{question}')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [concurrency, setConcurrency] = useState(10)
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>(['exact_match'])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body: RunCreate = {
      dataset: dataset,
      model: {
        provider,
        name: model,
      },
      prompt_template: promptTemplate,
      system_prompt: systemPrompt || undefined,
      concurrency,
      evaluators: selectedEvaluators,
    }

    mutate(body, {
      onSuccess(data) {
        router.push(`/runs/${data.run_id}`)
      },
    })
  }

  function toggleEvaluator(name: string) {
    setSelectedEvaluators((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name],
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/runs" className="rounded-md p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Evaluation Run</h1>
          <p className="text-muted-foreground">Configure and start an evaluation.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        {/* Model config */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">Model</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {providersData?.providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                )) ?? <option value="openai">openai</option>}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="gpt-4o"
                required
              />
            </div>
          </div>
        </fieldset>

        {/* Dataset */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dataset Path</label>
          <input
            type="text"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="path/to/dataset.jsonl"
            required
          />
          <p className="text-xs text-muted-foreground">
            Path to a JSONL dataset file on the server.
          </p>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt Template</label>
          <input
            type="text"
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            placeholder="{question}"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">System Prompt (optional)</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="You are a helpful assistant."
          />
        </div>

        {/* Concurrency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Concurrency</label>
          <input
            type="number"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
            min={1}
            max={100}
          />
        </div>

        {/* Evaluators */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Evaluators</legend>
          <div className="flex flex-wrap gap-2">
            {(evaluatorsData?.evaluators ?? ['exact_match', 'contains', 'llm_judge']).map(
              (name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleEvaluator(name)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selectedEvaluators.includes(name)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {name}
                </button>
              ),
            )}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Starting evaluation…' : 'Start Evaluation'}
        </button>
      </form>
    </div>
  )
}
