'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SubmitButtonProps extends Omit<React.ComponentProps<typeof Button>, 'type'> {
  /**
   * Pass an external pending state (e.g. from a TanStack Query mutation)
   * to combine with the form's own isSubmitting state. Useful when the
   * actual async work happens outside RHF (like an API call in onSubmit).
   */
  isPending?: boolean
  /**
   * Optional custom content or label to display while pending/submitting.
   */
  loadingText?: React.ReactNode
}

/**
 * Drop-in submit button that's automatically aware of the surrounding
 * <Form>'s submission state — no manual isPending prop threading needed
 * unless you want to combine it with an external mutation's pending state.
 *
 * Usage:
 * ```tsx
 * <Form schema={schema} onSubmit={onSubmit}>
 *   {() => (
 *     <>
 *       <FormField label="Email"><Input {...register('email')} /></FormField>
 *       <SubmitButton isPending={mutation.isPending}>Submit</SubmitButton>
 *     </>
 *   )}
 * </Form>
 * ```
 */
export function SubmitButton({
  isPending,
  loadingText,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  const formContext = useFormContext()
  const pending = isPending ?? formContext?.formState?.isSubmitting ?? false

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      {...props}
    >
      {pending && <Loader2 className="animate-spin" />}
      {pending && loadingText ? loadingText : children}
    </Button>
  )
}