'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Activity, Cpu, Scale, Sliders, User } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SystemHealthPanel,
  ProvidersCatalogPanel,
  EvaluatorsCatalogPanel,
  PreferencesPanel,
  AccountPanel,
} from './_components'

const VALID_TABS = ['system', 'providers', 'evaluators', 'preferences', 'account'] as const
type SettingsTab = (typeof VALID_TABS)[number]

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab') as SettingsTab | null
  const initialTab: SettingsTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'system'

  const [activeTab, setActiveTab] = React.useState<string>(initialTab)

  React.useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  function handleTabChange(value: string) {
    setActiveTab(value)
    const params = new URLSearchParams()
    if (value !== 'system') {
      params.set('tab', value)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      {/* Header */}
      <p className="text-xs text-muted-foreground">
        System telemetry, model providers, evaluator rubrics, and platform preferences.
      </p>

      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="flex h-9 max-w-full flex-wrap rounded-lg border border-border/50 bg-muted/70 p-1">
          <TabsTrigger value="system" className="cursor-pointer gap-1.5 text-xs font-medium">
            <Activity className="size-3.5" />
            <span>System Health</span>
          </TabsTrigger>

          <TabsTrigger value="providers" className="cursor-pointer gap-1.5 text-xs font-medium">
            <Cpu className="size-3.5" />
            <span>LLM Providers</span>
          </TabsTrigger>

          <TabsTrigger value="evaluators" className="cursor-pointer gap-1.5 text-xs font-medium">
            <Scale className="size-3.5" />
            <span>Evaluator Rubrics</span>
          </TabsTrigger>

          <TabsTrigger value="preferences" className="cursor-pointer gap-1.5 text-xs font-medium">
            <Sliders className="size-3.5" />
            <span>Preferences</span>
          </TabsTrigger>

          <TabsTrigger value="account" className="cursor-pointer gap-1.5 text-xs font-medium">
            <User className="size-3.5" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="m-0 outline-none">
          <SystemHealthPanel />
        </TabsContent>

        <TabsContent value="providers" className="m-0 outline-none">
          <ProvidersCatalogPanel />
        </TabsContent>

        <TabsContent value="evaluators" className="m-0 outline-none">
          <EvaluatorsCatalogPanel />
        </TabsContent>

        <TabsContent value="preferences" className="m-0 outline-none">
          <PreferencesPanel />
        </TabsContent>

        <TabsContent value="account" className="m-0 outline-none">
          <AccountPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <Skeleton className="h-10 w-96 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </React.Suspense>
  )
}
