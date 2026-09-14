'use client'

import { Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useHealth } from '@/modules/discovery'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function Header() {
  const pathname = usePathname()
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealth()

  const isHealthy = !healthLoading && !healthError && health?.status === 'ok'

  const getPageTitle = () => {
    if (pathname.startsWith('/runs/new')) return 'New Evaluation'
    if (pathname.startsWith('/runs/')) return 'Run Inspection'
    if (pathname.startsWith('/runs')) return 'Evaluation Runs'
    if (pathname.startsWith('/jobs')) return 'Jobs & Queue'
    if (pathname.startsWith('/compare')) return 'Compare Models'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'Overview'
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b justify-between bg-sidebar/70 px-4 md:px-7 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1" />
        <span className="text-base font-medium tracking-tight text-foreground">
          {getPageTitle()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="hidden md:flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={
            healthLoading
              ? 'Checking backend health...'
              : isHealthy
                ? `Backend operational (v${health?.version})`
                : 'Backend health issues detected'
          }
        >
          <span
            className={cn(
              'size-2 rounded-full',
              healthLoading
                ? 'animate-pulse bg-amber-500'
                : isHealthy
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
            )}
          />
          <span className="font-mono text-[11px]">
            {healthLoading
              ? 'checking api...'
              : isHealthy
                ? 'api operational'
                : 'api degraded'}
          </span>
        </Link>

        <Link
          href="/runs/new"
          className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex text-xs font-medium')}
        >
          <Plus data-icon="inline-start" />
          New Evaluation
        </Link>
      </div>
    </header>
  )
}
