import { type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

/**
 * Layout wrapper for any form control — label, hint, and error message
 * positioned consistently. Works with Input, Textarea, Select, custom
 * controls — anything passed as children.
 *
 * The htmlFor/id wiring is handled via React's useId so labels and
 * controls stay associated even with dynamic forms.
 */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
