'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Settings,
  Activity,
  LogOut,
  Moon,
  Sun,
  ChevronsUpDown,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { siteConfig } from '@/config/site'
import { authClient } from '@/lib/auth-client'
import {
  LayoutDashboardIcon,
  PlayIcon,
  LayersIcon,
  GitCompareIcon,
  SettingsIcon,
} from '@animateicons/react/lucide'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Runs', href: '/runs', icon: PlayIcon },
  { label: 'Jobs', href: '/jobs', icon: LayersIcon },
  { label: 'Compare', href: '/compare', icon: GitCompareIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
]

export function Sidebar({ ...props }: React.ComponentProps<typeof SidebarContainer>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  const isDark = mounted && resolvedTheme === 'dark'
  const userInitial = (session?.user?.email?.[0] || session?.user?.name?.[0] || 'U').toUpperCase()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'EvalBench User'
  const userEmail = session?.user?.email || 'admin@evalbench.dev'

  return (
    <SidebarContainer collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={siteConfig.name}>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{siteConfig.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Benchmarking Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)) ||
                  (item.href === '/dashboard' && pathname === '/dashboard')

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex w-full items-center gap-1.5">
          {/* User Profile Button with Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg p-1.5 text-left transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User account menu"
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-xs font-semibold text-primary">
                  {userInitial}
                </AvatarFallback>
              </Avatar>

              <div className="grid min-w-0 flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-sidebar-foreground">{userName}</span>
                <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
              </div>

              <ChevronsUpDown className="mr-0.5 size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-60 rounded-xl border border-border/80 bg-popover p-1 shadow-lg backdrop-blur-md"
            >
              {/* User Identity Header */}
              <DropdownMenuLabel className="px-3 py-1 font-normal">
                <h1>Options</h1>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Theme Toggle option */}
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

              {/* Settings link */}
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
              >
                <Settings className="size-3.5 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout Button */}
              <DropdownMenuItem
                onClick={handleSignOut}
                variant="destructive"
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarContainer>
  )
}
