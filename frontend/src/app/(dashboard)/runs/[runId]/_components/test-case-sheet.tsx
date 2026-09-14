'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Copy, Check, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TestCaseResult } from '@/modules/runs'

interface TestCaseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  testCaseResult: TestCaseResult | null
  index: number | null
  runId?: string
}

export function TestCaseSheet({
  open,
  onOpenChange,
  testCaseResult,
  index,
  runId,
}: TestCaseSheetProps) {
  const [copied, setCopied] = React.useState(false)

  if (!testCaseResult) return null

  const { test_case, response, eval_results } = testCaseResult

  function handleCopy() {
    if (response.text) {
      navigator.clipboard.writeText(response.text)
      setCopied(true)
      toast.success('Response copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const allPassed = eval_results.every((e) => e.status === 'passed')
  const hasFailed = eval_results.some((e) => e.status === 'failed')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col justify-between overflow-hidden bg-card border-l border-border shadow-2xl"
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b border-border/70 bg-card space-y-1.5 text-left">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Test Case #{index != null ? index + 1 : '—'}
              </SheetTitle>

              <div className="flex items-center gap-2">
                {eval_results.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[11px] font-mono px-2 py-0.5 border',
                      allPassed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : hasFailed
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    )}
                  >
                    {allPassed ? 'Passed' : hasFailed ? 'Failed' : 'Partial'}
                  </Badge>
                )}

                {runId && (
                  <Link
                    href={`/runs/${runId}/cases/${test_case.id || index}`}
                    onClick={() => onOpenChange(false)}
                    title="Open full page view"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'xs' }),
                      'h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 border-border/60 hover:bg-muted cursor-pointer'
                    )}
                  >
                    <ExternalLink className="size-3" />
                    <span>Full view</span>
                  </Link>
                )}
              </div>
            </div>

            <SheetDescription className="text-xs text-muted-foreground font-mono flex flex-wrap items-center gap-2 pt-0.5">
              <span>ID: {test_case.id.slice(0, 8)}</span>
              <span>•</span>
              <span>{response.latency_ms.toFixed(0)}ms</span>
              {response.total_tokens > 0 && (
                <>
                  <span>•</span>
                  <span>{response.total_tokens} tokens</span>
                </>
              )}
              {response.cost_usd != null && (
                <>
                  <span>•</span>
                  <span>${response.cost_usd.toFixed(4)}</span>
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          {/* Body Content - Soft bg-muted/50 tiles on bg-card elevated surface (Linear/Vercel style) */}
          <div className="p-6 space-y-5">
            {/* 1. Prompt / Question Card */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prompt
              </h4>
              <div className="text-sm text-foreground leading-relaxed rounded-xl border border-border/60 bg-muted/50 p-4">
                {test_case.question}
              </div>

              {/* Context if provided */}
              {(test_case.context || (test_case.reference_contexts && test_case.reference_contexts.length > 0)) && (
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Context</span>
                  <div className="text-xs text-muted-foreground font-mono leading-relaxed rounded-lg border border-border/50 bg-muted/30 p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {test_case.context || test_case.reference_contexts?.join('\n---\n')}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Model Output Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Model Output
                </h4>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopy}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer hover:bg-muted/70"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <div className="text-xs text-foreground font-mono leading-relaxed rounded-xl border border-border/60 bg-muted/50 p-4 whitespace-pre-wrap max-h-56 overflow-y-auto">
                {response.text || <span className="italic text-muted-foreground">Empty response</span>}
              </div>
            </div>

            {/* 3. Expected Ground Truth Card */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expected Answer
              </h4>
              <div className="text-xs text-muted-foreground font-mono leading-relaxed rounded-xl border border-border/50 bg-muted/30 p-4 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {test_case.expected_answer || (
                  <span className="italic">No expected answer defined for this test case.</span>
                )}
              </div>
            </div>

            {/* 4. Evaluator Results Cards */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">
                Evaluations
              </h4>

              {eval_results.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground italic">
                  No evaluator scores recorded for this test case.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {eval_results.map((ev) => {
                    const isPass = ev.status === 'passed'
                    return (
                      <div
                        key={ev.evaluator_name}
                        className="p-3.5 rounded-xl border border-border/60 bg-muted/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isPass ? (
                              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {ev.evaluator_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-foreground">
                              {ev.score.toFixed(2)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] font-mono px-1.5 py-0 capitalize border',
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
                          <p className="text-xs text-muted-foreground leading-relaxed font-sans pt-2 border-t border-border/40">
                            {ev.reason}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
