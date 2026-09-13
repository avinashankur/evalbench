'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Columns2, GitCommit, FileText } from 'lucide-react'

interface CaseDiffViewerProps {
  expected: string
  actual: string
  className?: string
}

type DiffMode = 'side-by-side' | 'unified' | 'raw'

interface DiffLine {
  type: 'equal' | 'add' | 'remove'
  expectedLine?: string
  actualLine?: string
  expectedNum?: number
  actualNum?: number
}

// Compute simple line-based diff using LCS
function computeLineDiff(expected: string, actual: string): DiffLine[] {
  const expectedLines = expected ? expected.split('\n') : []
  const actualLines = actual ? actual.split('\n') : []

  const n = expectedLines.length
  const m = actualLines.length

  // Standard LCS DP Table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  )

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (expectedLines[i - 1] === actualLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to generate diff
  let i = n
  let j = m
  const result: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expectedLines[i - 1] === actualLines[j - 1]) {
      result.unshift({
        type: 'equal',
        expectedLine: expectedLines[i - 1],
        actualLine: actualLines[j - 1],
        expectedNum: i,
        actualNum: j,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'add',
        actualLine: actualLines[j - 1],
        actualNum: j,
      })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'remove',
        expectedLine: expectedLines[i - 1],
        expectedNum: i,
      })
      i--
    }
  }

  return result
}

export function CaseDiffViewer({
  expected,
  actual,
  className,
}: CaseDiffViewerProps) {
  const [mode, setMode] = React.useState<DiffMode>('side-by-side')

  const diffLines = React.useMemo(
    () => computeLineDiff(expected, actual),
    [expected, actual]
  )

  const stats = React.useMemo(() => {
    let additions = 0
    let deletions = 0
    for (const l of diffLines) {
      if (l.type === 'add') additions++
      if (l.type === 'remove') deletions++
    }
    return { additions, deletions }
  }, [diffLines])

  return (
    <div className={cn('flex flex-col rounded-xl border border-border/60 bg-muted/30 overflow-hidden', className)}>
      {/* Diff Controls Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/50 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-muted-foreground">Diff View</span>
          {stats.deletions > 0 && (
            <span className="text-rose-600 dark:text-rose-400">-{stats.deletions}</span>
          )}
          {stats.additions > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">+{stats.additions}</span>
          )}
          {stats.additions === 0 && stats.deletions === 0 && (
            <span className="text-muted-foreground italic">Exact Match</span>
          )}
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg border border-border/50 bg-background/60 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer',
              mode === 'side-by-side'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Columns2 className="size-3" />
            <span className="hidden sm:inline">Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('unified')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer',
              mode === 'unified'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <GitCommit className="size-3" />
            <span>Unified</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('raw')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer',
              mode === 'raw'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="size-3" />
            <span>Raw</span>
          </button>
        </div>
      </div>

      {/* View Modes */}
      <div className="font-mono text-xs overflow-x-auto max-h-130 overflow-y-auto divide-y divide-border/30">
        {mode === 'raw' ? (
          <div className="p-4 whitespace-pre-wrap leading-relaxed text-foreground bg-card/60">
            {actual || <span className="italic text-muted-foreground">Empty response</span>}
          </div>
        ) : mode === 'unified' ? (
          <div className="">
            {diffLines.map((line, idx) => {
              const isAdd = line.type === 'add'
              const isRemove = line.type === 'remove'
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 px-3 py-0.5 leading-relaxed font-mono',
                    isAdd && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    isRemove && 'bg-rose-500/10 text-rose-700 dark:text-rose-300 line-through decoration-rose-400/50',
                    line.type === 'equal' && 'text-muted-foreground'
                  )}
                >
                  <span className="w-4 select-none shrink-0 text-center font-bold">
                    {isAdd ? '+' : isRemove ? '-' : ' '}
                  </span>
                  <span className="w-8 select-none text-muted-foreground/60 text-right shrink-0">
                    {line.actualNum || line.expectedNum || ''}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1">
                    {isAdd ? line.actualLine : line.expectedLine || line.actualLine}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          /* Side-by-side mode */
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {/* Left: Expected */}
            <div className="flex flex-col">
              <div className="sticky top-0 bg-muted/90 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 uppercase tracking-wider">
                Expected Ground Truth
              </div>
              <div className="flex-1">
                {expected ? (
                  diffLines.map((line, idx) => {
                    // if (line.type === 'add') {
                    //   return (
                    //     <div
                    //       key={idx}
                    //       className="px-3 min-h-6 bg-muted/10 opacity-30 select-none"
                    //     >
                    //       &nbsp;
                    //     </div>
                    //   )
                    // }
                    const isRemove = line.type === 'remove'
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 px-3 leading-relaxed',
                          isRemove && 'bg-rose-500/10 text-rose-700 dark:text-rose-300 h-full py-2'
                        )}
                      >
                        <span className="w-6 select-none text-muted-foreground/60 text-right shrink-0">
                          {line.expectedNum}
                        </span>
                        <span className="whitespace-pre-wrap break-all flex-1">
                          {line.expectedLine}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 text-xs italic text-muted-foreground">
                    No expected answer defined for this test case.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actual Model Output */}
            <div className="flex flex-col">
              <div className="sticky top-0 bg-muted/90 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 uppercase tracking-wider">
                Model Response
              </div>
              <div className="flex-1">
                {actual ? (
                  diffLines.map((line, idx) => {
                    // if (line.type === 'remove') {
                    //   return (
                    //     <div
                    //       key={idx}
                    //       className="px-3 py-0.5 min-h-6 bg-muted/10 opacity-30 select-none"
                    //     >
                    //       &nbsp;
                    //     </div>
                    //   )
                    // }
                    const isAdd = line.type === 'add'
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 px-3 leading-relaxed',
                          isAdd && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-2'
                        )}
                      >
                        <span className="w-6 select-none text-muted-foreground/60 text-right shrink-0">
                          {line.actualNum}
                        </span>
                        <span className="whitespace-pre-wrap break-all flex-1">
                          {line.actualLine}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 text-xs italic text-muted-foreground">
                    Empty response
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
