'use client'

import * as React from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Share2,
  Clock,
  Coins,
  Cpu,
  Layers,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGetRun, useGetRunResults } from '@/modules/runs'
import { CaseDiffViewer } from './_components/case-diff-viewer'

export default function TestCaseDetailPage({
  params,
}: {
  params: Promise<{ runId: string; testCaseId: string }>
}) {
  const { runId, testCaseId } = use(params)
  const router = useRouter()

  const {
    data: run,
    isLoading: isLoadingRun,
    isError: isRunError,
    refetch: refetchRun,
  } = useGetRun(runId)

  // Fetch all results for navigation and indexing
  const {
    data: resultsData,
    isLoading: isLoadingResults,
    isError: isResultsError,
    refetch: refetchResults,
  } = useGetRunResults(runId, { limit: 100 })

  const results = resultsData?.results ?? []

  // Find the active test case result
  const currentIndex = React.useMemo(() => {
    return results.findIndex(
      (r, i) =>
        r.test_case.id === testCaseId ||
        String(i) === testCaseId ||
        String(i + 1) === testCaseId
    )
  }, [results, testCaseId])

  const testCaseResult = currentIndex >= 0 ? results[currentIndex] : null
  const prevCase = currentIndex > 0 ? results[currentIndex - 1] : null
  const nextCase =
    currentIndex >= 0 && currentIndex < results.length - 1
      ? results[currentIndex + 1]
      : null

  // Copy helpers
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null)

  function copyText(text: string, label: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedSection(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  function handleShareLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Test case URL copied to clipboard')
    }
  }

  // Keyboard navigation between test cases: ArrowLeft / ArrowRight
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Avoid triggering when user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowLeft' && prevCase) {
        e.preventDefault()
        router.push(`/runs/${runId}/cases/${prevCase.test_case.id || currentIndex - 1}`)
      } else if (e.key === 'ArrowRight' && nextCase) {
        e.preventDefault()
        router.push(`/runs/${runId}/cases/${nextCase.test_case.id || currentIndex + 1}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, runId, prevCase, nextCase, currentIndex])

  const isLoading = isLoadingRun || isLoadingResults

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isRunError || isResultsError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 flex flex-col items-center justify-center text-center gap-3 max-w-lg mx-auto mt-12">
        <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="text-base font-semibold text-destructive">
          Failed to Load Test Case
        </h2>
        <p className="text-xs text-muted-foreground">
          An error occurred while loading this evaluation record from the backend.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchRun()
              refetchResults()
            }}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Retry</span>
          </Button>
          <Link
            href={`/runs/${runId}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs cursor-pointer')}
          >
            Return to Run
          </Link>
        </div>
      </div>
    )
  }

  if (!testCaseResult) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col items-center justify-center text-center gap-3 max-w-lg mx-auto mt-12">
        <h2 className="text-base font-semibold text-foreground">Test Case Not Found</h2>
        <p className="text-xs text-muted-foreground">
          Could not locate test case #{testCaseId} in this evaluation run.
        </p>
        <Link
          href={`/runs/${runId}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2 text-xs cursor-pointer')}
        >
          <ArrowLeft className="size-3.5 mr-1.5" /> Back to Run
        </Link>
      </div>
    )
  }

  const { test_case, response, eval_results } = testCaseResult
  const allPassed = eval_results.every((e) => e.status === 'passed')
  const hasFailed = eval_results.some((e) => e.status === 'failed')

  const contextContent =
    test_case.context ||
    (test_case.reference_contexts && test_case.reference_contexts.length > 0
      ? test_case.reference_contexts.join('\n\n---\n\n')
      : null)

  const datasetName = run && 'dataset_name' in run ? (run.dataset_name as string) : null

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Top Bar: Navigation, Breadcrumbs & Sequence Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb links */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Link
              href="/runs"
              className="hover:text-foreground transition-colors hover:underline underline-offset-2"
            >
              Runs
            </Link>
            <span>/</span>
            <Link
              href={`/runs/${runId}`}
              className="hover:text-foreground transition-colors hover:underline underline-offset-2 truncate max-w-[200px]"
              title={datasetName || runId}
            >
              {datasetName || runId.slice(0, 8)}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">
              Case #{currentIndex + 1}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Test Case #{currentIndex + 1}
            </h1>

            {eval_results.length > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-mono px-2 py-0.5 border inline-flex items-center gap-1.5',
                  allPassed
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : hasFailed
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                )}
              >
                {allPassed ? (
                  <CheckCircle2 className="size-3.5 shrink-0" />
                ) : (
                  <XCircle className="size-3.5 shrink-0" />
                )}
                <span>{allPassed ? 'All Passed' : hasFailed ? 'Failed' : 'Partial'}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Sequential Navigation & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="text-xs gap-1.5 border-border/60 cursor-pointer"
            title="Copy shareable link to this test case"
          >
            <Share2 className="size-3.5" />
            <span className="hidden md:inline">Share</span>
          </Button>

          <Link
            href={`/runs/${runId}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'text-xs border-border/60 cursor-pointer'
            )}
          >
            <ArrowLeft className="size-3.5 mr-1" />
            <span>Back to Run</span>
          </Link>

          <div className="inline-flex items-center border border-border/60 rounded-md bg-card">
            {prevCase ? (
              <Link
                href={`/runs/${runId}/cases/${prevCase.test_case.id || currentIndex - 1}`}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer'
                )}
                title="Previous test case (Left Arrow)"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                <span>Prev</span>
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-8 px-2.5 text-xs text-muted-foreground opacity-35 select-none'
                )}
                title="No previous test case"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                <span>Prev</span>
              </span>
            )}

            <span className="text-[11px] font-mono text-muted-foreground px-1 border-x border-border/40 select-none">
              {currentIndex + 1}/{results.length}
            </span>

            {nextCase ? (
              <Link
                href={`/runs/${runId}/cases/${nextCase.test_case.id || currentIndex + 1}`}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer'
                )}
                title="Next test case (Right Arrow)"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5 ml-1" />
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-8 px-2.5 text-xs text-muted-foreground opacity-35 select-none'
                )}
                title="No next test case"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5 ml-1" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata & Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2.5 text-xs font-mono">
          <Clock className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Latency</span>
            <span className="font-semibold text-foreground">
              {response.latency_ms > 0 ? `${response.latency_ms.toFixed(0)} ms` : '—'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2.5 text-xs font-mono">
          <Layers className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Tokens</span>
            <span className="font-semibold text-foreground">
              {response.total_tokens > 0 ? `${response.total_tokens.toLocaleString()}` : '—'}
              {response.prompt_tokens > 0 && (
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  ({response.prompt_tokens} in / {response.completion_tokens} out)
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2.5 text-xs font-mono">
          <Coins className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Cost</span>
            <span className="font-semibold text-foreground">
              {response.cost_usd != null ? `$${response.cost_usd.toFixed(4)}` : '—'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2.5 text-xs font-mono">
          <Cpu className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0 truncate">
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Model</span>
            <span className="font-semibold text-foreground truncate" title={`${response.provider}/${response.model}`}>
              {response.model || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Prompt & Expected Ground Truth */}
        <div className="space-y-6">
          {/* Prompt Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prompt / Input Question
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => copyText(test_case.question, 'Prompt')}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer"
              >
                {copiedSection === 'Prompt' ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>{copiedSection === 'Prompt' ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
            <div className="p-5 rounded-xl border border-border/60 bg-card text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {test_case.question}
            </div>
          </div>

          {/* Context / Reference Documents (Full scroll, no nested scroll trap) */}
          {contextContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Retrieved Context / References
                </h3>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => copyText(contextContent, 'Context')}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer"
                >
                  {copiedSection === 'Context' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedSection === 'Context' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-muted/40 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto">
                {contextContent}
              </div>
            </div>
          )}

          {/* Expected Ground Truth Answer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expected Ground Truth
              </h3>
              {test_case.expected_answer && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => copyText(test_case.expected_answer || '', 'Expected Answer')}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer"
                >
                  {copiedSection === 'Expected Answer' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedSection === 'Expected Answer' ? 'Copied' : 'Copy'}</span>
                </Button>
              )}
            </div>
            <div className="p-5 rounded-xl border border-border/60 bg-muted/30 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {test_case.expected_answer || (
                <span className="italic text-muted-foreground">
                  No expected answer defined for this test case.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Model Output with Diff Viewer & Evaluations */}
        <div className="space-y-6">
          {/* Model Response with Side-by-side / Unified Diff Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Model Output & Visual Diff
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => copyText(response.text || '', 'Model Response')}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer"
              >
                {copiedSection === 'Model Response' ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>{copiedSection === 'Model Response' ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>

            <CaseDiffViewer
              expected={test_case.expected_answer || ''}
              actual={response.text || ''}
            />
          </div>

          {/* Evaluations Section (Clean Monochrome + Distinct Status Cues) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">
                Evaluator Assessments ({eval_results.length})
              </h3>
            </div>

            {eval_results.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground italic text-center">
                No evaluator scores recorded for this test case.
              </div>
            ) : (
              <div className="space-y-3">
                {eval_results.map((ev) => {
                  const isPass = ev.status === 'passed'
                  return (
                    <div
                      key={ev.evaluator_name}
                      className="p-4 rounded-xl border border-border/60 bg-muted/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {isPass ? (
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="size-4 text-rose-500 shrink-0" />
                          )}
                          <span className="font-semibold text-foreground truncate">
                            {ev.evaluator_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-semibold text-foreground">
                            {ev.score.toFixed(2)}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-mono px-2 py-0.5 capitalize border',
                              isPass
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            )}
                          >
                            {ev.status}
                          </Badge>
                        </div>
                      </div>

                      {ev.reason && (
                        <div className="text-xs text-muted-foreground leading-relaxed font-sans pt-2 border-t border-border/40">
                          <p className="font-medium text-[11px] text-foreground/80 mb-1">Judge Reasoning:</p>
                          <p>{ev.reason}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
