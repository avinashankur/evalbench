'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Activity,
  GitCompare,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Play,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

export const Header = () => {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { data: session, isPending } = authClient.useSession()

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      setMobileMenuOpen(false)
    } finally {
      setIsSigningOut(false)
    }
  }

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Docs', href: '#docs' },
    { label: 'Changelog', href: '#changelog' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <header className="relative z-20 w-full">
      <nav
        aria-label="Main Navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-8"
      >
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <span
            className="inline-block h-2 w-2 rounded-xs bg-blue-600"
            aria-hidden="true"
          />
          EvalBench
        </Link>

        {/* Desktop Nav Links */}
        {/* <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div> */}

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              {/* <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
              >
                Dashboard
              </Link> */}

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="group relative flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-background transition-all hover:border-blue-600/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="User station menu"
                >
                  <Avatar className="size-full">
                    {session.user.image && (
                      <AvatarImage
                        src={session.user.image}
                        alt={session.user.name || session.user.email}
                      />
                    )}
                    <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
                      {(session.user.name?.[0] || session.user.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-emerald-500" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-72 overflow-hidden rounded-xl border border-border/80 bg-card/95 p-0 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95"
                >
                  {/* Station HUD Identity Header */}
                  <div className="border-b border-border/70 bg-muted/30 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/60">
                    <div className="flex items-center justify-between pb-2 font-mono text-[10px] text-muted-foreground">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        // eval workbench
                      </span>
                      {/* <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>runner active</span>
                      </div> */}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-9 ring-1 ring-border">
                        {session.user.image && (
                          <AvatarImage
                            src={session.user.image}
                            alt={session.user.name || session.user.email}
                          />
                        )}
                        <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
                          {(session.user.name?.[0] || session.user.email[0]).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden text-left">
                        {session.user.name && (
                          <span className="truncate text-xs font-semibold text-foreground">
                            {session.user.name}
                          </span>
                        )}
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {session.user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Station Tiles */}
                  <div className="p-2 space-y-1">
                    <div className="px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      Workbench Navigation
                    </div>

                    <DropdownMenuItem
                      onClick={() => router.push('/dashboard')}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="size-3.5 text-muted-foreground" />
                        <span>Dashboard</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">workspace</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push('/runs')}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="size-3.5 text-muted-foreground" />
                        <span>Evaluation Runs</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">history</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push('/compare')}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <GitCompare className="size-3.5 text-muted-foreground" />
                        <span>Compare Matrix</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">diff</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push('/settings')}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="size-3.5 text-muted-foreground" />
                        <span>Settings</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {resolvedTheme === 'dark' ? (
                          <Sun className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Moon className="size-3.5 text-muted-foreground" />
                        )}
                        <span>{resolvedTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground capitalize">
                        {resolvedTheme === 'dark' ? 'dark' : 'light'}
                      </span>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="m-0" />

                  {/* Sign Out Action */}
                  <div className="bg-muted/20 p-1.5 dark:bg-neutral-950/40">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="size-3.5" />
                        <span>{isSigningOut ? 'Signing out…' : 'Log out'}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-70">terminate</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="mx-6 mt-4 flex flex-col gap-4 rounded-md border border-border bg-background p-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
            {isPending ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            ) : session?.user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <Avatar className="size-10 shrink-0 shadow-xs">
                    {session.user.image && (
                      <AvatarImage
                        src={session.user.image}
                        alt={session.user.name || session.user.email}
                      />
                    )}
                    <AvatarFallback className="bg-blue-600 text-sm font-semibold text-white">
                      {(session.user.name?.[0] || session.user.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden text-left">
                    {session.user.name && (
                      <span className="truncate text-sm font-medium text-foreground">
                        {session.user.name}
                      </span>
                    )}
                    <span className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full justify-center gap-2')}
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>

                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/runs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center gap-1.5 text-xs')}
                  >
                    <Play className="size-3.5" />
                    <span>Runs</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center gap-1.5 text-xs')}
                  >
                    <Settings className="size-3.5" />
                    <span>Settings</span>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="w-full justify-center gap-1.5 text-xs"
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="size-3.5" />
                    ) : (
                      <Moon className="size-3.5" />
                    )}
                    <span>{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="default"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>{isSigningOut ? 'Signing out…' : 'Log out'}</span>
                </Button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'w-full')}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full')}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

