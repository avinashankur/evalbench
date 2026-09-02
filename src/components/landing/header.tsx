'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Docs', href: '#docs' },
    { label: 'Changelog', href: '#changelog' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <header className="relative z-20 w-full">
      <nav
        aria-label="Main Navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-8"
      >
        {/* Brand Wordmark */}
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

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          >
            Get started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="mx-6 mt-4 flex flex-col gap-4 rounded-md border border-border bg-background p-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'w-full')}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full')}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

