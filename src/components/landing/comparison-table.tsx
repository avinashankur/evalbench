import { SectionHeader } from '@/components/landing/section-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface ComparisonTableProps {
  className?: string
}

interface RunRow {
  id: string
  agent: string
  suite: string
  score: string
  delta: string
  deltaType: 'up' | 'down' | 'flat'
  status: 'pass' | 'regression'
}

const sampleRuns: RunRow[] = [
  {
    id: 'run-8f21a3',
    agent: 'support-agent v4.2',
    suite: 'core-suite',
    score: '94.2',
    delta: '+1.8',
    deltaType: 'up',
    status: 'pass',
  },
  {
    id: 'run-7c19b0',
    agent: 'support-agent v4.1',
    suite: 'core-suite',
    score: '92.4',
    delta: 'baseline',
    deltaType: 'flat',
    status: 'pass',
  },
  {
    id: 'run-6ab445',
    agent: 'retrieval-agent v2.0',
    suite: 'rag-suite',
    score: '81.6',
    delta: '-6.3',
    deltaType: 'down',
    status: 'regression',
  },
  {
    id: 'run-5f0e21',
    agent: 'retrieval-agent v1.9',
    suite: 'rag-suite',
    score: '87.9',
    delta: 'baseline',
    deltaType: 'flat',
    status: 'pass',
  },
  {
    id: 'run-4d3c10',
    agent: 'planner-agent v1.3',
    suite: 'planning-suite',
    score: '76.0',
    delta: '-2.1',
    deltaType: 'down',
    status: 'pass',
  },
]

export function ComparisonTable({ className }: ComparisonTableProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-6 py-16 sm:px-8', className)}>
      <SectionHeader
        kicker="// the comparison table"
        title="Catch regressions before they ship"
        description="Every run lands in one comparison table, diffed against whatever you call your baseline."
      />

      {/* Wide Shot Table Card */}
      <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-lg">
        {/* Table Head Bar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 text-xs text-muted-foreground">
          <span className="font-medium">Recent runs</span>
          <span className="font-mono text-xs text-muted-foreground">
            5 of 214
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
              <TableHead className="px-5 font-mono text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Run
              </TableHead>
              <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Suite
              </TableHead>
              <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Score
              </TableHead>
              <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Δ baseline
              </TableHead>
              <TableHead className="px-5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {sampleRuns.map((run) => (
              <TableRow
                key={run.id}
                className="transition-colors hover:bg-muted/30"
              >
                <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                  {run.id}
                </TableCell>
                <TableCell className="px-5 py-3.5 font-medium text-foreground">
                  {run.agent}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-muted-foreground">
                  {run.suite}
                </TableCell>
                <TableCell className="px-5 py-3.5 font-mono font-medium text-foreground">
                  {run.score}
                </TableCell>
                <TableCell className="px-5 py-3.5 font-mono text-xs">
                  {run.deltaType === 'up' && (
                    <span className="font-medium text-blue-600">{run.delta}</span>
                  )}
                  {run.deltaType === 'down' && (
                    <span className="font-medium text-orange-600">{run.delta}</span>
                  )}
                  {run.deltaType === 'flat' && (
                    <span className="text-muted-foreground">
                      {run.delta}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        run.status === 'regression'
                          ? 'bg-orange-600'
                          : 'bg-blue-600'
                      )}
                    />
                    <span
                      className={
                        run.status === 'regression'
                          ? 'text-orange-600'
                          : 'text-foreground'
                      }
                    >
                      {run.status}
                    </span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
