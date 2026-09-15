'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Settings,
  Activity,
  LogOut,
  Moon,
  Sun,
  ChevronsUpDown,
  Plus,
  LayoutDashboard,
  Play,
  Layers,
  GitCompare,
  Cpu,
  Scale,
  Sliders,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { authClient } from '@/lib/auth-client'
import { useHealth } from '@/modules/discovery'
import { useListRuns } from '@/modules/runs'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/common'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  badge?: string | number
}

function SidebarNavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab')
  const { data: runsData } = useListRuns({ limit: 100 })
  const totalRuns = runsData?.runs?.length

  const isSettingsActive = (tabKey: string) => {
    return pathname === '/settings' && (activeTab === tabKey || (!activeTab && tabKey === 'system'))
  }

  const workbenchItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Evaluation Runs',
      href: '/runs',
      icon: Play,
      badge: totalRuns != null && totalRuns > 0 ? totalRuns : undefined,
    },
    {
      label: 'Job Queue',
      href: '/jobs',
      icon: Layers,
    },
    {
      label: 'Compare',
      href: '/compare',
      icon: GitCompare,
    },
  ]

  const registryItems: NavItem[] = [
    {
      label: 'LLM Providers',
      href: '/settings?tab=providers',
      icon: Cpu,
    },
    {
      label: 'Evaluator Rubrics',
      href: '/settings?tab=evaluators',
      icon: Scale,
    },
  ]

  const configItems: NavItem[] = [
    {
      label: 'System Health',
      href: '/settings?tab=system',
      icon: Activity,
    },
    {
      label: 'Preferences',
      href: '/settings?tab=preferences',
      icon: Sliders,
    },
  ]

  return (
    <>
      {/* Group 1: Evaluation Hub */}
      <SidebarGroup className="p-2 py-1.5 group-data-[collapsible=icon]:p-2">
        <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          Workbench
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {workbenchItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      'transition-colors',
                      isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <span className="truncate text-xs group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                      {item.badge != null && (
                        <span className="ml-auto inline-flex h-4.5 min-w-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/80 px-1.5 font-mono text-[10px] leading-none font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Group 2: Registries & Discovery */}
      <SidebarGroup className="p-2 py-1.5 group-data-[collapsible=icon]:p-2">
        <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          Registries
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {registryItems.map((item) => {
              const isTabActive = item.href.includes('tab=providers')
                ? isSettingsActive('providers')
                : isSettingsActive('evaluators')

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isTabActive}
                    tooltip={item.label}
                    className={cn(
                      'transition-colors',
                      isTabActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          'size-4 shrink-0',
                          isTabActive ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <span className="truncate text-xs group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Group 3: System & Preferences */}
      <SidebarGroup className="p-2 py-1.5 group-data-[collapsible=icon]:p-2">
        <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          Platform
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {configItems.map((item) => {
              const isTabActive = item.href.includes('tab=system')
                ? isSettingsActive('system')
                : isSettingsActive('preferences')

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isTabActive}
                    tooltip={item.label}
                    className={cn(
                      'transition-colors',
                      isTabActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          'size-4 shrink-0',
                          isTabActive ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <span className="truncate text-xs group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

function SidebarNavFallback() {
  const pathname = usePathname()

  const basicItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Evaluation Runs', href: '/runs', icon: Play },
    { label: 'Job Queue', href: '/jobs', icon: Layers },
    { label: 'Compare', href: '/compare', icon: GitCompare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <SidebarGroup className="p-2 py-1.5 group-data-[collapsible=icon]:p-2">
      <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
        Platform
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {basicItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function Sidebar({ ...props }: React.ComponentProps<typeof SidebarContainer>) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: health, isLoading: healthLoading } = useHealth()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Global keyboard shortcut: Cmd+N / Ctrl+N to create a new evaluation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        const target = e.target as HTMLElement | null
        const isInput =
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        if (!isInput) {
          e.preventDefault()
          router.push('/runs/new')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  const isDark = mounted && resolvedTheme === 'dark'
  const isHealthy = !healthLoading && health?.status === 'ok'
  const userInitial = (session?.user?.email?.[0] || session?.user?.name?.[0] || 'U').toUpperCase()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'EvalBench User'
  const userEmail = session?.user?.email || 'admin@evalbench.dev'

  return (
    <SidebarContainer collapsible="icon" {...props}>
      {/* Header: Brand Emblem, Workspace Indicator & Action */}
      <SidebarHeader className="space-y-2.5 border-b border-sidebar-border p-3 pb-3 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={siteConfig.name}
              className="transition-colors hover:bg-sidebar-accent/80"
            >
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <Logo size={32} className="size-8 shrink-0 rounded-lg shadow-xs" />
                <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-foreground">
                      {siteConfig.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-4 border-border/60 px-1 py-0 font-mono text-[9px]"
                    >
                      v0.1
                    </Badge>
                  </div>
                  <span className="truncate text-[11px] text-muted-foreground">
                    Benchmark Suite
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Quick Action: "+ New Evaluation" Launcher */}
        <div className="pt-0.5">
          <Link
            href="/runs/new"
            title="New Evaluation (⌘N)"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'h-8 w-full cursor-pointer justify-between bg-foreground px-2.5 text-xs font-medium text-background shadow-xs transition-all group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 hover:bg-foreground/90',
            )}
          >
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Plus className="size-3.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">New Evaluation</span>
            </div>
            <kbd className="hidden items-center rounded bg-background/20 px-1 py-0.5 font-mono text-[10px] opacity-70 group-data-[collapsible=icon]:hidden sm:inline-flex">
              ⌘N
            </kbd>
          </Link>
        </div>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent className="p-0">
        <React.Suspense fallback={<SidebarNavFallback />}>
          <SidebarNavContent />
        </React.Suspense>

        {/* Live Backend Telemetry Widget (Collapsible-aware) */}
        <div className="mx-2 mt-auto mb-2 space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors group-data-[collapsible=icon]:hidden">
          <Link
            href="/settings?tab=system"
            className="flex items-center justify-between text-xs transition-opacity hover:opacity-80"
            title="Inspect System Health"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-foreground">Backend API</span>
            </div>
            <Badge
              variant="outline"
              className="h-4 border-border/50 px-1 py-0 font-mono text-[10px] font-normal"
            >
              {health?.version ? `v${health.version}` : 'v0.1.0'}
            </Badge>
          </Link>

          <div className="flex items-center justify-between border-t border-border/40 pt-1 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  health?.postgres === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground',
                )}
              />
              PG: {health?.postgres ?? 'ok'}
            </span>
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  health?.redis === 'connected' || health?.redis === 'disabled'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground',
                )}
              />
              Redis: {health?.redis ?? 'ok'}
            </span>
          </div>
        </div>
      </SidebarContent>

      {/* Footer: User Account & Workspace Profile */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg p-1.5 text-left transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User account menu"
          >
            <div className="shrink-0">
              <Avatar className="size-7 border border-border/60">
                <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid min-w-0 flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-foreground">{userName}</span>
              <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
            </div>

            <ChevronsUpDown className="mr-0.5 size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-64 rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl backdrop-blur-md"
          >
            {/* Identity Tile */}
            <div className="space-y-1 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{userName}</span>
                <Badge
                  variant="secondary"
                  className="bg-muted px-1.5 py-0 font-mono text-[10px] text-muted-foreground"
                >
                  Admin
                </Badge>
              </div>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{userEmail}</p>
            </div>

            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem
              onClick={toggleTheme}
              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Sun className="size-3.5 text-muted-foreground" />
                ) : (
                  <Moon className="size-3.5 text-muted-foreground" />
                )}
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground capitalize">
                {isDark ? 'dark' : 'light'}
              </span>
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
            >
              <Settings className="size-3.5 text-muted-foreground" />
              <span>Platform Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarContainer>
  )
}
