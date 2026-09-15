'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, Terminal, ShieldCheck } from 'lucide-react'
import { Form, FormField, SubmitButton } from '@/components/form'
import { Input } from '@/components/ui/input'
import { ModeToggle } from '@/components/mode-toggle'
import { PulseDot, TicksDivider } from '@/components/landing'
import { Logo } from '@/components/common'
import { authClient } from '@/lib/auth-client'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginInput = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [serverError, setServerError] = useState('')
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(callbackUrl)
    }
  }, [session, isPending, router, callbackUrl])

  async function handleSubmit(data: LoginInput) {
    setServerError('')

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setServerError(result.error.message ?? 'Invalid email or password')
      } else {
        router.push(callbackUrl)
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    }
  }

  if (session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Redirecting to dashboard…
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Column: Live Evaluation Terminal & Telemetry Stream (Desktop only) */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-muted/30 p-10 transition-colors lg:flex xl:p-14 dark:bg-neutral-950">
        {/* Subtle Radial Glow & Coordinate Grid Texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '-1px -1px',
            color: 'var(--border, #DCDFE2)',
            maskImage:
              'radial-gradient(ellipse 90% 80% at 30% 30%, black 40%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 30% 30%, black 40%, transparent 85%)',
          }}
        />

        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/4 size-96 -translate-y-1/2 rounded-full bg-brand/15 blur-3xl dark:bg-brand/20"
        />

        {/* Top Wordmark & Telemetry Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90 dark:text-white"
          >
            <Logo className="size-6 shrink-0 rounded-md" />
            <span>EvalBench</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
            <PulseDot color="bg-emerald-500" />
            <span>runner daemon active</span>
          </div>
        </div>

        {/* Center: Live Evaluation Terminal Stream */}
        <div className="relative z-10 my-auto w-full max-w-lg space-y-4">
          {/* Terminal Window */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lg backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-2xl">
            {/* Terminal Window Bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-muted-foreground/30 dark:bg-neutral-700" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30 dark:bg-neutral-700" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30 dark:bg-neutral-700" />
                <span className="ml-2 font-mono font-medium text-foreground dark:text-neutral-300">
                  evalbench-runner · core-suite
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-muted-foreground dark:text-neutral-400">
                <Terminal className="size-3.5" />
                <span>v4.2</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="space-y-3 p-5 font-mono text-xs">
              {/* Command Invocation */}
              <div className="text-muted-foreground dark:text-neutral-400">
                <span className="text-brand">$</span> evalbench test --suite support-agent --baseline v4.1 --candidate v4.2
              </div>

              {/* Real-time execution lines */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-foreground dark:text-neutral-300">
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✔</span> [1/128] intent_classification
                  </span>
                  <span className="text-muted-foreground dark:text-neutral-400">28ms · 1.00</span>
                </div>
                <div className="flex items-center justify-between text-foreground dark:text-neutral-300">
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✔</span> [2/128] multi_turn_tool_call
                  </span>
                  <span className="text-muted-foreground dark:text-neutral-400">142ms · 0.98</span>
                </div>
                <div className="flex items-center justify-between text-brand">
                  <span className="flex items-center gap-2">
                    <span className="text-brand">▲</span> [3/128] prompt_injection_guard
                  </span>
                  <span className="font-medium text-brand">+12.4% pass</span>
                </div>
                <div className="flex items-center justify-between text-foreground dark:text-neutral-300">
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✔</span> [4/128] hallucination_guardrail
                  </span>
                  <span className="text-muted-foreground dark:text-neutral-400">84ms · 0.99</span>
                </div>
                <div className="flex items-center justify-between text-foreground dark:text-neutral-300">
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✔</span> [5/128] token_compression_ratio
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">-$0.003 / run</span>
                </div>
              </div>

              {/* Progress & Verdict Bar */}
              <div className="border-t border-border pt-3 dark:border-neutral-800">
                <div className="flex items-center justify-between text-muted-foreground dark:text-neutral-400">
                  <span>Evaluation Status</span>
                  <span className="text-emerald-600 font-medium dark:text-emerald-400">128/128 Passed (100%)</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 rounded bg-muted/40 p-2.5 text-center text-xs dark:bg-neutral-950">
                  <div>
                    <span className="block text-muted-foreground dark:text-neutral-400">Score</span>
                    <span className="font-semibold text-foreground dark:text-white">94.2 <span className="text-brand font-normal">+1.8</span></span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground dark:text-neutral-400">P95 Latency</span>
                    <span className="font-semibold text-foreground dark:text-white">1.0s</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground dark:text-neutral-400">Cost/Run</span>
                    <span className="font-semibold text-foreground dark:text-white">$0.049</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero regression verdict confirmed</span>
            </span>
            <span className="font-mono">1.42s total run</span>
          </div>
        </div>

        {/* Bottom Security / Protocol Marker */}
        <div className="relative z-10 flex items-center justify-between font-mono text-xs text-muted-foreground dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" />
            <span>Encrypted telemetry · SOC2 Type II</span>
          </div>
          <span>cluster: us-east-1</span>
        </div>
      </div>

      {/* Right Column: Cardless Open Authentication Surface */}
      <div className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Top Bar for Mobile/Desktop */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Back to site</span>
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </div>

        {/* Center Form Area */}
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 font-mono text-xs font-medium text-brand">
              {'// authentication'}
            </div>
            <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your evaluation workspace.
            </p>
          </div>

          <TicksDivider className="mb-6 opacity-60" count={40} />

          {/* Form */}
          <Form<LoginInput>
            schema={loginSchema}
            onSubmit={handleSubmit}
            defaultValues={{ email: '', password: '' }}
            className="space-y-4"
          >
            {({ register, formState: { errors } }) => (
              <>
                {serverError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                  >
                    {serverError}
                  </div>
                )}

                <FormField
                  label="Email address"
                  required
                  error={errors.email?.message}
                >
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="h-10"
                    aria-invalid={!!errors.email}
                  />
                </FormField>

                <FormField
                  label="Password"
                  required
                  error={errors.password?.message}
                >
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-10"
                    aria-invalid={!!errors.password}
                  />
                </FormField>

                <div className="pt-2">
                  <SubmitButton
                    className="h-10 w-full font-medium"
                    loadingText="Signing in…"
                  >
                    Sign in to workspace
                  </SubmitButton>
                </div>
              </>
            )}
          </Form>

          {/* Bottom Switcher */}
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4 hover:text-brand"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>EvalBench Workbench</span>
          <Link href="/docs" className="hover:text-foreground">
            Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Loading sign in…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
