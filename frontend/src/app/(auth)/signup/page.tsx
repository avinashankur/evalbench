'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { Form, FormField, SubmitButton } from '@/components/form'
import { Input } from '@/components/ui/input'
import { ModeToggle } from '@/components/mode-toggle'
import { PulseDot, TicksDivider } from '@/components/landing'
import { authClient } from '@/lib/auth-client'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type SignupInput = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/dashboard')
    }
  }, [session, isPending, router])

  async function handleSubmit(data: SignupInput) {
    setServerError('')

    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setServerError(result.error.message ?? 'Failed to create account')
      } else {
        router.push('/dashboard')
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
      {/* Left Column: Quiet, Minimalist Editorial (Desktop only) */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-muted/20 p-10 transition-colors lg:flex xl:p-14 dark:bg-neutral-950/60">
        {/* Coordinate Grid Texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            backgroundPosition: '-1px -1px',
            color: 'var(--border, #DCDFE2)',
            maskImage:
              'radial-gradient(ellipse 90% 80% at 30% 30%, black 40%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 30% 30%, black 40%, transparent 85%)',
          }}
        />

        {/* Top Brand & Status */}
        <div className="relative z-10 flex items-center justify-between">
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
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-xs">
            <PulseDot color="bg-blue-600" />
            <span>v4.2</span>
          </div>
        </div>

        {/* Center: Quiet, Non-Distracting Value Proposition */}
        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div className="space-y-3">
            <div className="font-mono text-xs font-medium text-blue-600">
              {'// continuous evaluation'}
            </div>
            <h2 className="font-heading text-3xl font-normal leading-snug tracking-tight text-foreground sm:text-4xl">
              The evaluation stack for teams building{' '}
              <span className="font-serif italic text-blue-600">production</span>{' '}
              AI agents.
            </h2>
          </div>

          {/* Minimal 3-Point Checklist */}
          <div className="space-y-3.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <Check className="size-2.5 stroke-[3]" />
              </span>
              <span>Automated regression detection against baseline runs</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <Check className="size-2.5 stroke-[3]" />
              </span>
              <span>Side-by-side accuracy, latency, and token cost diffs</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <Check className="size-2.5 stroke-[3]" />
              </span>
              <span>Built for fast agent iteration and CI/CD pipelines</span>
            </div>
          </div>
        </div>

        {/* Bottom Security / Protocol Marker */}
        <div className="relative z-10 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
          <span>SOC2 Type II Certified · Encrypted telemetry pipelines</span>
        </div>
      </div>

      {/* Right Column: Cardless Open Authentication Surface */}
      <div className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Top Bar */}
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
            <div className="mb-2 font-mono text-xs font-medium text-blue-600">
              {'// onboarding'}
            </div>
            <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
              Create account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to begin benchmarking your AI agents in minutes.
            </p>
          </div>

          <TicksDivider className="mb-6 opacity-60" count={40} />

          {/* Form */}
          <Form<SignupInput>
            schema={signupSchema}
            onSubmit={handleSubmit}
            defaultValues={{ name: '', email: '', password: '' }}
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
                  label="Full name"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    {...register('name')}
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="h-10"
                    aria-invalid={!!errors.name}
                  />
                </FormField>

                <FormField
                  label="Work email"
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
                  hint="Must be at least 8 characters long"
                >
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-10"
                    aria-invalid={!!errors.password}
                  />
                </FormField>

                <div className="pt-2">
                  <SubmitButton
                    className="h-10 w-full font-medium"
                    loadingText="Creating account…"
                  >
                    Create workspace account
                  </SubmitButton>
                </div>
              </>
            )}
          </Form>

          {/* Bottom Switcher */}
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:text-blue-600"
            >
              Sign in
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
