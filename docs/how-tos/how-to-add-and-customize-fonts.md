# How to Add and Customize Fonts

> **Audience:** Frontend and Full-Stack Developers working on EvalBench  
> **Time required:** 5 minutes  
> **Last verified:** 2026-09-02  

## Prerequisites

- Node.js 20+ and project dependencies installed (`npm install`)
- Familiarity with Next.js App Router (`src/app/layout.tsx`) and Tailwind CSS v4 (`src/app/globals.css`)

---

## Steps

### 1. Choose your font source (Google Font vs. Local Font)

Determine whether you are importing a font from Google Fonts or bundling a local font file (`.woff2`, `.woff`, `.ttf`).

#### Option A: Google Font (e.g., Space Grotesk, Fraunces, Inter)
Import the font function from `next/font/google` in [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx):

```tsx
import { Geist, Geist_Mono, Space_Grotesk, Fraunces } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
})
```

> **Note on Non-Variable Fonts:** If using a non-variable font (like Roboto), specify the `weight` parameter:
> ```tsx
> const roboto = Roboto({
>   weight: ['400', '700'],
>   variable: '--font-roboto',
>   subsets: ['latin'],
> })
> ```

#### Option B: Local Custom Font
Place your font files in `src/app/fonts/` (e.g. `src/app/fonts/my-font.woff2`). Then import `localFont` in [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx):

```tsx
import localFont from 'next/font/local'

const customFont = localFont({
  src: './fonts/my-font.woff2',
  variable: '--font-custom',
  display: 'swap',
})
```

---

### 2. Inject CSS font variables onto the root `<html>` element

In [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx), append all font `.variable` properties to the `<html>` element's `className`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
```

---

### 3. Register font utility classes in Tailwind CSS v4

Open [`src/app/globals.css`](file:///e:/dev/evalbench-frontend/src/app/globals.css) and map the CSS variables inside the `@theme inline` block. In Tailwind CSS v4, `--font-<name>` automatically creates the `font-<name>` utility class:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  /* Font Utilities */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-space-grotesk);
  --font-serif: var(--font-fraunces);
  
  /* ...other theme tokens */
}
```

---

### 4. Apply font classes in components

Use the generated Tailwind classes in JSX/TSX:

```tsx
export function PageHeader() {
  return (
    <header>
      {/* Uses --font-heading (Space Grotesk) */}
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Evaluation Runs
      </h1>

      {/* Uses default body font-sans (Geist Sans) */}
      <p className="font-sans text-sm text-muted-foreground">
        Track baseline and candidate regressions.
      </p>

      {/* Uses --font-serif (Fraunces) for display metrics */}
      <div className="font-serif text-4xl font-semibold">94.2</div>

      {/* Uses --font-mono (Geist Mono) for run IDs */}
      <span className="font-mono text-xs text-muted-foreground">run-8f21a3</span>
    </header>
  )
}
```

---

### 5. (Optional) Removing or replacing a font

To completely remove a font:
1. Delete the font loader declaration from [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx).
2. Remove `${fontName.variable}` from `<html className="...">` in [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx).
3. Remove or reassign `--font-<name>` in [`src/app/globals.css`](file:///e:/dev/evalbench-frontend/src/app/globals.css).

---

## Verify it worked

1. Start the Next.js local development server:
   ```bash
   npm run dev
   ```
2. Open the application at `http://localhost:3000` in your browser.
3. Inspect any text element using Developer Tools (F12) -> **Computed Styles** -> **font-family**.
4. Verify that the computed font family resolves to your chosen font (e.g. `__Space_Grotesk_...`, `__Geist_...`) instead of system fallback fonts (`Times New Roman`, `Arial`).

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Text falls back to Times New Roman / Serif font | The `@theme inline` mapping is circular (e.g. `--font-sans: var(--font-sans)`) or references an undefined variable name. | Ensure `--font-sans` in [`src/app/globals.css`](file:///e:/dev/evalbench-frontend/src/app/globals.css) references the exact variable name defined in `layout.tsx` (e.g. `var(--font-geist-sans)`). |
| Font classes have no effect on child elements | The font `.variable` class was not added to `<html>` or `<body>` in [`src/app/layout.tsx`](file:///e:/dev/evalbench-frontend/src/app/layout.tsx). | Check `className` on `<html>` and make sure `${myFont.variable}` is present. |
| Build error: `Missing required "weight" prop` | The requested Google Font is not a variable font. | Add explicit weights in the font definition: `weight: ['400', '600', '700']`. |
| Local font returns 404 / module not found | Font file path in `localFont({ src: '...' })` is incorrect. | Use paths relative to the file calling `localFont` (e.g., `./fonts/my-font.woff2` when called from `src/app/layout.tsx`). |

---

## Related

- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [`DESIGN.md`](file:///e:/dev/evalbench-frontend/DESIGN.md) — Visual design tokens and typography specification
