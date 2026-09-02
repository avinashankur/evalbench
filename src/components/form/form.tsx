'use client'

import { type ReactNode } from 'react'
import {
  useForm,
  FormProvider,
  type UseFormProps,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType } from 'zod'
import { cn } from '@/lib/utils'

interface FormProps<TSchema extends FieldValues> {
  schema: ZodType<TSchema, any, any>
  onSubmit: SubmitHandler<TSchema>
  children: (methods: UseFormReturn<TSchema>) => ReactNode
  defaultValues?: UseFormProps<TSchema>['defaultValues']
  mode?: UseFormProps<TSchema>['mode']
  className?: string
  resetOnSubmit?: boolean
}

/**
 * Generic, reusable form wrapper. Drop any Zod schema in, get a fully
 * validated, typed form with zero boilerplate repeated per-form.
 *
 * Usage:
 * ```tsx
 * <Form schema={mySchema} onSubmit={handleSubmit}>
 *   {({ register, formState: { errors } }) => (
 *     <>
 *       <FormField label="Email" error={errors.email?.message}>
 *         <Input {...register('email')} />
 *       </FormField>
 *       <Button type="submit">Submit</Button>
 *     </>
 *   )}
 * </Form>
 * ```
 */
export function Form<TSchema extends FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  mode = 'onSubmit',
  className,
  resetOnSubmit = false,
}: FormProps<TSchema>) {
  const methods = useForm<TSchema>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  })

  const { handleSubmit, reset } = methods

  async function handleFormSubmit(values: TSchema) {
    await onSubmit(values)
    if (resetOnSubmit) reset()
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        className={cn('flex flex-col gap-4', className)}
      >
        {children(methods)}
      </form>
    </FormProvider>
  )
}
