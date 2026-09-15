import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'
import { Logo } from '@/components/common'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-16 pt-4 text-xs text-muted-foreground sm:flex-row sm:px-8',
        className
      )}
    >
      {/* Brand Wordmark */}
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
      >
        <Logo className="size-5 shrink-0 rounded-sm" />
        <span>EvalBench</span>
      </Link>

      {/* Footer Navigation Links + Theme Toggle */}
      <div className="flex items-center gap-6">
        <Link
          href="/docs"
          className="transition-colors hover:text-foreground"
        >
          Docs
        </Link>
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
        <Link
          href="/settings"
          className="transition-colors hover:text-foreground"
        >
          Status
        </Link>
        <span
          className="h-3.5 w-px bg-border"
          aria-hidden="true"
        />
        <ModeToggle className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>
    </footer>
  )
}
