'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Check,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { RunSummary } from '@/modules/runs'
import { computeRunScore, computeRunLatency, formatRunDate } from './types'

interface RunsTableProps {
  runs: RunSummary[]
  onInspectRun: (run: RunSummary) => void
  onDeleteClick: (run: RunSummary) => void
}

export function RunsTable({
  runs,
  onInspectRun,
  onDeleteClick,
}: RunsTableProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  function handleCopyId(runId: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    navigator.clipboard.writeText(runId)
    setCopiedId(runId)
    toast.success('Run ID copied to clipboard')
    setTimeout(() => {
      setCopiedId((curr) => (curr === runId ? null : curr))
    }, 2000)
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-[110px] text-xs font-medium text-muted-foreground">
              Run ID
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              Benchmark Dataset
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              Model & Provider
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              Score
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              Latency
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              Cost
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              Test Cases
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              Executed
            </TableHead>
            <TableHead className="w-[120px] text-right text-xs font-medium text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const { scoreDisplay, scorePercent } = computeRunScore(run)
            const { display: latencyDisplay, tier: latencyTier } = computeRunLatency(
              run.metrics.mean_latency_ms
            )
            const cost = run.metrics.total_cost_usd
            const costDisplay =
              cost !== undefined && cost !== null ? `$${cost.toFixed(4)}` : '—'
            const isCopied = copiedId === run.run_id

            return (
              <TableRow
                key={run.run_id}
                onClick={() => onInspectRun(run)}
                className="cursor-pointer transition-colors hover:bg-muted/40 border-border/50"
              >
                {/* Run ID with copy button */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{run.run_id.slice(0, 8)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(run.run_id, e)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      title="Copy full Run ID"
                      aria-label="Copy run ID"
                    >
                      {isCopied ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                </TableCell>

                {/* Dataset */}
                <TableCell className="py-3">
                  <Link
                    href={`/runs/${run.run_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-xs text-foreground hover:text-primary hover:underline"
                  >
                    {run.dataset_name}
                  </Link>
                </TableCell>

                {/* Model & Provider */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-foreground">
                      {run.model}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize px-1.5 py-0 font-normal"
                    >
                      {run.provider}
                    </Badge>
                  </div>
                </TableCell>

                {/* Score */}
                <TableCell className="py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        'font-mono text-xs font-semibold',
                        scorePercent !== null
                          ? scorePercent >= 80
                            ? 'text-emerald-500'
                            : scorePercent >= 50
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          : 'text-muted-foreground'
                      )}
                    >
                      {scoreDisplay}
                    </span>
                    {scorePercent !== null && (
                      <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            scorePercent >= 80
                              ? 'bg-emerald-500'
                              : scorePercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(0, scorePercent))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Latency */}
                <TableCell className="py-3 text-right">
                  <span
                    className={cn(
                      'font-mono text-xs',
                      latencyTier === 'fast'
                        ? 'text-emerald-500 font-medium'
                        : latencyTier === 'slow'
                          ? 'text-amber-500 font-medium'
                          : 'text-foreground'
                    )}
                  >
                    {latencyDisplay}
                  </span>
                </TableCell>

                {/* Cost */}
                <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                  {costDisplay}
                </TableCell>

                {/* Test Cases */}
                <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                  {run.total_test_cases.toLocaleString()}
                </TableCell>

                {/* Executed Date */}
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {formatRunDate(run.created_at)}
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onInspectRun(run)
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      title="Quick inspect drawer"
                    >
                      <Eye data-icon="inline-start" className="size-3.5" />
                      Inspect
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 cursor-pointer"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => onInspectRun(run)}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            <span>Quick Inspect</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => router.push(`/runs/${run.run_id}`)}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                            <span>Full Details</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => router.push(`/compare?run1=${run.run_id}`)}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                            <span>Compare Run</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleCopyId(run.run_id)}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Copy className="size-3.5 text-muted-foreground" />
                            <span>Copy Run ID</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteClick(run)}
                          className="flex cursor-pointer items-center gap-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete Run</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
