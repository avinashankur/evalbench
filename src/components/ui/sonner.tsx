'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react'

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme = 'dark' } = useTheme()
  const isLight = resolvedTheme === 'light'

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps['theme']}
      position="top-center"
      offset={16}
      className="toaster group font-sans"
      visibleToasts={4}
      icons={{
        success: <Check className="size-4 text-emerald-500 shrink-0" />,
        error: <AlertCircle className="size-4 text-rose-500 shrink-0" />,
        warning: <AlertTriangle className="size-4 text-amber-500 shrink-0" />,
        info: <Info className="size-4 text-sky-500 shrink-0" />,
        loading: <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />,
      }}
      toastOptions={{
        style: {
          backgroundColor: isLight ? '#ffffff' : '#18181b',
          borderColor: isLight ? '#e4e4e7' : '#27272a',
          color: isLight ? '#09090b' : '#fafafa',
          borderRadius: '8px',
        },
        classNames: {
          toast:
            'group toast font-sans group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:gap-2.5',
          title: 'text-[13px] font-medium leading-snug',
          description: 'text-xs text-muted-foreground leading-normal mt-0.5',
          actionButton:
            'text-xs font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton:
            'text-xs font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80',
          closeButton:
            'border-0 bg-transparent text-muted-foreground hover:text-foreground transition-colors',
          icon: 'shrink-0 self-center',
        },
      }}
      {...props}
    />
  )
}


