# How to Build Type-Safe Forms with Form Components

> **Audience:** Frontend and Full-Stack Developers building features in EvalBench  
> **Time required:** 10 minutes  
> **Last verified:** 2026-09-02  

## Prerequisites

- Familiarity with React Hook Form and Zod schema validation
- Project dependencies installed (`npm install`)
- Form components available in [`src/components/form/`](file:///e:/dev/evalbench-frontend/src/components/form) (`<Form>`, `<FormField>`, `<SubmitButton>`)

---

## Overview

The form module provides a type-safe, zero-boilerplate abstraction over `react-hook-form` and `@hookform/resolvers/zod`:

- **[`Form`](file:///e:/dev/evalbench-frontend/src/components/form/form.tsx)**: Wrapper providing `FormProvider` context, schema validation, and typed submit handler.
- **[`FormField`](file:///e:/dev/evalbench-frontend/src/components/form/form-field.tsx)**: Accessible layout wrapper managing field labels, required indicators, hints, and error alerts.
- **[`SubmitButton`](file:///e:/dev/evalbench-frontend/src/components/form/submit-button.tsx)**: Context-aware submit button with automatic submission spinner, disabled state, and external mutation support.

---

## Steps

### 1. Define the Zod Schema and TypeScript Type

Define your validation schema using Zod and infer the TypeScript data type:

```tsx
import { z } from 'zod'

export const createJobSchema = z.object({
  name: z.string().min(3, 'Job name must be at least 3 characters'),
  model: z.string().min(1, 'Please select a model'),
  datasetUrl: z.string().url('Must be a valid URL'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
```

---

### 2. Set Up the `<Form>` Component

Wrap your form layout with `<Form>`. Pass the `schema`, `onSubmit` handler, and optional `defaultValues`:

```tsx
'use client'

import { Form } from '@/components/form/form'
import { createJobSchema, type CreateJobInput } from './schema'

export function CreateJobForm() {
  async function handleSubmit(data: CreateJobInput) {
    // Perform async API submission
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  return (
    <Form<CreateJobInput>
      schema={createJobSchema}
      onSubmit={handleSubmit}
      defaultValues={{ temperature: 0.7 }}
      className="space-y-6"
    >
      {({ register, formState: { errors } }) => (
        <>
          {/* Form fields and submit button go here */}
        </>
      )}
    </Form>
  )
}
```

---

### 3. Add Input Fields with `<FormField>`

Wrap each input inside a `<FormField>` to render consistent labels, help text, and error messages:

```tsx
import { FormField } from '@/components/form/form-field'

{({ register, formState: { errors } }) => (
  <>
    <FormField
      label="Job Name"
      required
      error={errors.name?.message}
      hint="Unique name to identify this benchmark run"
    >
      <input
        {...register('name')}
        type="text"
        placeholder="e.g., Llama-3-Eval-v1"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </FormField>

    <FormField
      label="Dataset URL"
      required
      error={errors.datasetUrl?.message}
    >
      <input
        {...register('datasetUrl')}
        type="url"
        placeholder="https://example.com/dataset.json"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </FormField>
  </>
)}
```

---

### 4. Add the `<SubmitButton>`

Place `<SubmitButton>` inside the `<Form>` children render function. It automatically tracks `isSubmitting` and disables itself while showing a loading spinner:

```tsx
import { SubmitButton } from '@/components/form/submit-button'

{({ register, formState: { errors } }) => (
  <>
    {/* Input fields */}

    <SubmitButton loadingText="Creating job...">
      Create Benchmark Job
    </SubmitButton>
  </>
)}
```

---

### 5. (Optional) Integrating with TanStack Query Mutation

If using TanStack Query `useMutation` where the async work is handled outside the `onSubmit` promise, forward `isPending` to `<SubmitButton>`:

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { Form } from '@/components/form/form'
import { FormField } from '@/components/form/form-field'
import { SubmitButton } from '@/components/form/submit-button'
import { createJobSchema, type CreateJobInput } from './schema'

export function CreateJobWithMutation() {
  const mutation = useMutation({
    mutationFn: async (data: CreateJobInput) => {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create job')
      return res.json()
    },
  })

  return (
    <Form<CreateJobInput>
      schema={createJobSchema}
      onSubmit={async (data) => {
        await mutation.mutateAsync(data)
      }}
    >
      {({ register, formState: { errors } }) => (
        <>
          <FormField label="Job Name" required error={errors.name?.message}>
            <input {...register('name')} className="rounded-md border p-2" />
          </FormField>

          <SubmitButton isPending={mutation.isPending} loadingText="Submitting...">
            Submit Job
          </SubmitButton>
        </>
      )}
    </Form>
  )
}
```

---

## Full Working Example

```tsx
'use client'

import { z } from 'zod'
import { Form } from '@/components/form/form'
import { FormField } from '@/components/form/form-field'
import { SubmitButton } from '@/components/form/submit-button'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(160, 'Bio cannot exceed 160 characters').optional(),
})

type ProfileInput = z.infer<typeof profileSchema>

export function ProfileForm() {
  async function handleSubmit(values: ProfileInput) {
    // Simulating API request
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Saved profile:', values)
  }

  return (
    <Form<ProfileInput>
      schema={profileSchema}
      onSubmit={handleSubmit}
      defaultValues={{ username: '', email: '', bio: '' }}
      className="max-w-md space-y-4 rounded-lg border bg-card p-6"
    >
      {({ register, formState: { errors } }) => (
        <>
          <FormField label="Username" required error={errors.username?.message}>
            <input
              {...register('username')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="johndoe"
            />
          </FormField>

          <FormField label="Email" required error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="john@example.com"
            />
          </FormField>

          <FormField label="Bio" hint="Brief summary for your profile" error={errors.bio?.message}>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Tell us about yourself"
            />
          </FormField>

          <SubmitButton className="w-full" loadingText="Saving...">
            Save Changes
          </SubmitButton>
        </>
      )}
    </Form>
  )
}
```

---

## Verify It Worked

1. Start your local development server:
   ```bash
   npm run dev
   ```
2. Navigate to your form's page in the browser.
3. Test validation by clicking the **Submit** button with invalid / empty values:
   - Check that validation messages appear under invalid fields.
   - Check that the form does not execute `onSubmit`.
4. Fill in valid data and click **Submit**:
   - Check that the button disables and displays the `Loader2` spinner.
   - Check that the `loadingText` displays (if configured).
   - Check that the submit handler completes successfully.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Form does not submit and no error messages appear | Validation is failing on fields that do not have `error={errors.fieldName?.message}` rendered. | Check `formState.errors` or inspect the console to ensure all required schema fields are mapped to a visible `<FormField>`. |
| Number inputs return validation error `Expected number, received string` | Native `<input type="number">` returns a string value to React Hook Form. | Use `z.coerce.number()` in your Zod schema instead of `z.number()`. |
| Submit button doesn't show loading spinner during async mutation | Async work is triggered without returning a Promise in `onSubmit` or without passing `isPending`. | Either `await` the async mutation call inside `onSubmit` or pass `isPending={mutation.isPending}` to `<SubmitButton>`. |
| `Cannot read properties of null (reading 'formState')` | `<SubmitButton>` or `useFormContext` is rendered outside of a `<Form>` / `FormProvider` tree. | Ensure `<SubmitButton>` is nested inside the `<Form>` component. |

---

## Related

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Validation Documentation](https://zod.dev/)
- [`001-api-client-usage.md`](file:///e:/dev/evalbench-frontend/docs/architecture/001-api-client-usage.md) — Standard patterns for backend API calls
