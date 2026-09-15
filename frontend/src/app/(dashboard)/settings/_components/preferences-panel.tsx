'use client'

import * as React from 'react'
import {
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sliders,
  Palette,
  Timer,
  Zap,
  Target,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface BenchmarkPreferences {
  concurrency: number
  pollingIntervalMs: number
  passThreshold: number
}

const DEFAULT_PREFERENCES: BenchmarkPreferences = {
  concurrency: 5,
  pollingIntervalMs: 3000,
  passThreshold: 0.7,
}

const STORAGE_KEY = 'evalbench_benchmark_preferences'

export function PreferencesPanel() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  const [prefs, setPrefs] = React.useState<BenchmarkPreferences>(DEFAULT_PREFERENCES)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPrefs(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      setSaved(true)
      toast.success('Preferences saved successfully')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  function handleReset() {
    setPrefs(DEFAULT_PREFERENCES)
    try {
      localStorage.removeItem(STORAGE_KEY)
      toast.success('Reset to default benchmark preferences')
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Appearance / Theme */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Palette className="size-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-foreground">Theme Preference</h4>
              <p className="text-[11px] text-muted-foreground">Select light, dark, or system color theme.</p>
            </div>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg border border-border/60 bg-muted/40 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                mounted && theme === 'light'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="size-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                mounted && theme === 'dark'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="size-3.5 text-brand" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                mounted && theme === 'system'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Laptop className="size-3.5 text-purple-500" />
              <span>System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Benchmark Execution Defaults */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Benchmark Defaults
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Default operational limits applied when staging new evaluation runs.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="text-xs gap-1.5 cursor-pointer"
            >
              {saved ? <Check className="size-3.5 text-emerald-300" /> : null}
              <span>{saved ? 'Saved!' : 'Save Preferences'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Concurrency Limit */}
            <div className="space-y-2 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Zap className="size-3.5 text-primary" />
                <span>Worker Concurrency</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Maximum parallel test cases evaluated simultaneously.
              </p>
              <div className="pt-2">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={prefs.concurrency}
                  onChange={(e) =>
                    setPrefs({ ...prefs, concurrency: Number(e.target.value) || 1 })
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Polling Interval */}
            <div className="space-y-2 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Timer className="size-3.5 text-primary" />
                <span>Live Refresh Rate (ms)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Background polling frequency while an evaluation run is active.
              </p>
              <div className="pt-2">
                <Input
                  type="number"
                  step={500}
                  min={1000}
                  max={30000}
                  value={prefs.pollingIntervalMs}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      pollingIntervalMs: Number(e.target.value) || 3000,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Default Pass Threshold */}
            <div className="space-y-2 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Target className="size-3.5 text-primary" />
                <span>Default Pass Threshold</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Minimum score (0.00 – 1.00) required to consider an evaluation passed.
              </p>
              <div className="pt-2">
                <Input
                  type="number"
                  step={0.05}
                  min={0.1}
                  max={1.0}
                  value={prefs.passThreshold}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      passThreshold: Number(e.target.value) || 0.7,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
