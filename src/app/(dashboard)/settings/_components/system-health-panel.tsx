'use client'

import * as React from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Database,
  Server,
  Zap,
  Globe,
  Lock,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useHealth } from '@/modules/discovery'

export function SystemHealthPanel() {
  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useHealth()

  const [pingLatency, setPingLatency] = React.useState<number | null>(null)
  const [isPinging, setIsPinging] = React.useState(false)

  async function handlePing() {
    setIsPinging(true)
    const start = performance.now()
    try {
      await refetch()
      const elapsed = Math.round(performance.now() - start)
      setPingLatency(elapsed)
      toast.success(`Backend responded in ${elapsed}ms`)
    } catch {
      toast.error('Health ping failed')
    } finally {
      setIsPinging(false)
    }
  }

  const isHealthy = !isError && health?.status === 'ok'
  const isPostgresOk = health?.postgres === 'connected'
  const isRedisOk = health?.redis === 'connected'
  const isRedisDisabled = health?.redis === 'disabled'

  return (
    <div className="space-y-6">
      {/* Service Status Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FastAPI Backend */}
        <Card className="border-border/60 shadow-2xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Server className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">FastAPI Engine</h4>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {health ? `v${health.version}` : 'api service'}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : isHealthy ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  <span>Operational</span>
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1"
                >
                  <XCircle className="size-3" />
                  <span>Degraded</span>
                </Badge>
              )}
            </div>

            <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Status:</span>
              <span className="font-semibold text-foreground">
                {isLoading ? 'checking...' : health?.status || 'unreachable'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PostgreSQL Database */}
        <Card className="border-border/60 shadow-2xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Database className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">PostgreSQL</h4>
                  <span className="text-[11px] text-muted-foreground font-mono">relational store</span>
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : isPostgresOk ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  <span>Connected</span>
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1"
                >
                  <XCircle className="size-3" />
                  <span>Disconnected</span>
                </Badge>
              )}
            </div>

            <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Persistence:</span>
              <span className="font-semibold text-foreground">
                {isLoading ? 'checking...' : health?.postgres || 'unavailable'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Redis Cache */}
        <Card className="border-border/60 shadow-2xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">Redis Queue</h4>
                  <span className="text-[11px] text-muted-foreground font-mono">job dispatcher</span>
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : isRedisOk ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  <span>Active</span>
                </Badge>
              ) : isRedisDisabled ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono px-2 py-0.5 text-muted-foreground border-border/60"
                >
                  Disabled
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1"
                >
                  <XCircle className="size-3" />
                  <span>Error</span>
                </Badge>
              )}
            </div>

            <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Cache Queue:</span>
              <span className="font-semibold text-foreground">
                {isLoading ? 'checking...' : health?.redis || 'n/a'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics & Ping Controller */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-semibold">Live Connectivity Diagnostics</CardTitle>
            <CardDescription className="text-xs">
              Verify round-trip network response times to the FastAPI evaluation server.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePing}
            disabled={isPinging || isRefetching}
            className="text-xs gap-1.5 border-border/70 hover:bg-muted cursor-pointer shrink-0"
          >
            <RotateCcw className={cn('size-3.5', (isPinging || isRefetching) && 'animate-spin')} />
            <span>{isPinging ? 'Pinging API...' : 'Ping API Endpoint'}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {pingLatency != null && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Last Measured Ping Latency:</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-bold',
                    pingLatency < 100
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : pingLatency < 400
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {pingLatency} ms
                </span>
                <Badge variant="outline" className="text-[10px] font-sans">
                  {pingLatency < 100 ? 'Ultra Low Latency' : pingLatency < 400 ? 'Normal' : 'High Latency'}
                </Badge>
              </div>
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Backend Unreachable:</span>
                <p className="opacity-90 leading-relaxed">
                  {error?.message || 'Could not establish connection to /api/v1/health. Check that your Python FastAPI server is running.'}
                </p>
              </div>
            </div>
          )}

          {/* Network & Protocol Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                <Globe className="size-3.5" />
                <span>Base API URL</span>
              </div>
              <p className="font-semibold text-foreground truncate">
                {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000 (Default)'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                <Clock className="size-3.5" />
                <span>Client Request Timeout</span>
              </div>
              <p className="font-semibold text-foreground">
                15,000 ms (AbortController Signal)
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                <Lock className="size-3.5" />
                <span>Session Propagation</span>
              </div>
              <p className="font-semibold text-foreground">
                credentials: &apos;include&apos; (HTTP-only cookies)
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                <Server className="size-3.5" />
                <span>Health Endpoint</span>
              </div>
              <p className="font-semibold text-foreground">
                GET /api/v1/health
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
