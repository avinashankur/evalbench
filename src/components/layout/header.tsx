'use client'

import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useHealth } from '@/modules/discovery'

export function Header() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealth()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  const isHealthy = !healthLoading && !healthError && health?.status === 'ok'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />

        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
