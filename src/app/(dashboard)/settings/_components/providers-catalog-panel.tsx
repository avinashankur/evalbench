'use client'

import * as React from 'react'
import {
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProviders } from '@/modules/discovery'

interface ProviderMetadata {
  id: string
  name: string
  description: string
  models: string[]
  envKey: string
}

const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Frontier reasoning, instruction-tuned, and lightweight models.',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    envKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Analytical reasoning, code generation, and long context windows.',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku'],
    envKey: 'ANTHROPIC_API_KEY',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    description: 'Native multimodal models with high-throughput inference.',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    envKey: 'GEMINI_API_KEY',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Self-hosted private inference without external data egress.',
    models: ['llama3.1', 'mistral', 'qwen2.5-coder'],
    envKey: 'OLLAMA_BASE_URL',
  },
  groq: {
    id: 'groq',
    name: 'Groq LPU',
    description: 'Ultra-low latency inference on LPU hardware.',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    envKey: 'GROQ_API_KEY',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'European open-weight and frontier reasoning models.',
    models: ['mistral-large-latest', 'codestral-latest'],
    envKey: 'MISTRAL_API_KEY',
  },
}

export function ProvidersCatalogPanel() {
  const { data, isLoading, refetch, isRefetching } = useProviders()
  const discoveredProviders = data?.providers ?? []

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  function handleCopyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    toast.success(`Copied ${key} to clipboard`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const allProviderKeys = Array.from(
    new Set([...discoveredProviders, ...Object.keys(PROVIDER_METADATA)])
  )

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              LLM Providers
            </h3>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {discoveredProviders.length} connected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Inference gateways and model families available for benchmarks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs gap-1.5 border-border/70 hover:bg-muted cursor-pointer shrink-0"
        >
          <RefreshCw className={isRefetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
          <span>Refresh Providers</span>
        </Button>
      </div>

      {/* Clean Table List */}
      <Card className="border-border/60 shadow-xs overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border/60 text-xs">
                <TableHead className="w-56 font-medium">Provider</TableHead>
                <TableHead className="font-medium">Supported Model Families</TableHead>
                <TableHead className="w-64 font-medium">Environment Key</TableHead>
                <TableHead className="w-32 text-right font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/40 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-52 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36 rounded" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto rounded" /></TableCell>
                  </TableRow>
                ))
              ) : (
                allProviderKeys.map((pKey) => {
                  const meta = PROVIDER_METADATA[pKey] || {
                    id: pKey,
                    name: pKey.charAt(0).toUpperCase() + pKey.slice(1),
                    description: 'Custom inference provider registered in backend.',
                    models: ['custom-model'],
                    envKey: `${pKey.toUpperCase()}_API_KEY`,
                  }

                  const isDiscovered = discoveredProviders.includes(pKey)

                  return (
                    <TableRow key={pKey} className="hover:bg-muted/30 transition-colors">
                      {/* Provider Info */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-foreground font-mono text-xs font-bold shrink-0">
                            {pKey.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground text-xs block truncate">
                              {meta.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              id: {pKey}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Model Badges */}
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {meta.models.map((m) => (
                            <Badge
                              key={m}
                              variant="secondary"
                              className="text-[10px] font-mono px-1.5 py-0 bg-muted/60 text-muted-foreground border-border/50"
                            >
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      {/* Env Key with Copy Action */}
                      <TableCell className="py-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/50 font-mono text-[11px]">
                          <span className="text-foreground">{meta.envKey}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(meta.envKey)}
                            className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title={`Copy ${meta.envKey}`}
                          >
                            {copiedKey === meta.envKey ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-right">
                        {isDiscovered ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="size-2.5" />
                            <span>Connected</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-2 py-0.5 text-muted-foreground border-border/60 inline-flex items-center gap-1"
                          >
                            <CircleDashed className="size-2.5 opacity-60" />
                            <span>Not active</span>
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discreet Security Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
        <span>
          Keys are stored in your Python server <code className="font-mono text-foreground font-semibold">.env</code> file and are never sent to or stored in the browser.
        </span>
      </div>
    </div>
  )
}
