'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  LogOut,
  Shield,
  Building,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

export function AccountPanel() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch {
      toast.error('Failed to sign out')
      setIsSigningOut(false)
    }
  }

  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : 'EB'

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {user?.image && <AvatarImage src={user.image} alt={user.name || 'User'} />}
              <AvatarFallback className="font-mono text-xs font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  {user?.name || 'EvalBench User'}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 bg-primary/10 text-primary border border-primary/20">
                  Active
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                {user?.email || 'authenticated session'}
              </CardDescription>
            </div>
          </div>

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs gap-1.5 border-border/70 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
            >
              <LogOut className="size-3.5" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <span className="text-[10px] font-sans uppercase text-muted-foreground">
                  Account Identifier
                </span>
                <p className="font-semibold text-foreground truncate select-all">
                  {user.id || 'usr_evalbench_default'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <span className="text-[10px] font-sans uppercase text-muted-foreground">
                  Authentication Method
                </span>
                <p className="font-semibold text-foreground">
                  Better Auth HTTP Session
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <span className="text-[10px] font-sans uppercase text-muted-foreground">
                  Workspace Role
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Shield className="size-3.5 text-primary" />
                  <span>Workspace Administrator</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <span className="text-[10px] font-sans uppercase text-muted-foreground">
                  Session Creation
                </span>
                <p className="font-semibold text-foreground">
                  {new Date().toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center space-y-3">
              <User className="size-6 mx-auto text-muted-foreground opacity-50" />
              <div className="space-y-1">
                <p className="font-semibold text-xs text-foreground">Anonymous Session</p>
                <p className="text-[11px] text-muted-foreground">
                  You are currently using EvalBench in local / demo mode without an active user account.
                </p>
              </div>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'text-xs gap-1 cursor-pointer'
                )}
              >
                <span>Sign in to your account</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization / Workspace Information */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Building className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Workspace Context</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Current multi-tenant evaluation tenant and cluster details.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs text-foreground">
                  EvalBench Default Workspace
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Production
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                All benchmark jobs, test datasets, and comparison runs are scoped to this workspace.
              </p>
            </div>

            <span className="font-mono text-xs text-muted-foreground bg-background/80 px-2.5 py-1 rounded-md border border-border/50 shrink-0">
              ws_main_default
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 font-mono">
            <div className="flex items-center gap-1.5">
              <KeyRound className="size-3.5" />
              <span>Multi-tenant Isolation:</span>
            </div>
            <span className="text-foreground font-semibold">Enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
