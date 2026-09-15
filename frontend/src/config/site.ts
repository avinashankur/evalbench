export const siteConfig = {
  name: 'EvalBench',
  description: 'Evaluate, benchmark, and compare AI models systematically.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? '',

  nav: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Runs', href: '/runs' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'Settings', href: '/settings' },
  ],

  links: {
    github: 'https://github.com/avinashankur/evalbench',
  },
} as const

export type SiteConfig = typeof siteConfig
