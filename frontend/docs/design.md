# UI & Visual Hierarchy Guidelines

## Slide-Over Sheets & Drawers (Clean Monochrome - Linear/Vercel Style)

When building slide-over inspection panels (`Sheet side="right"`) or drawer monitors:

1. **Elevated Sheet Container**:
   - The sheet container uses solid `bg-card` with `border-l border-border shadow-2xl`.
   - The deep drop-shadow (`shadow-2xl`) and crisp left border physically separate the panel from the page canvas beneath it.
   - **Never** use slash-opacity (e.g. `bg-muted/40`) on the sheet container, which makes it semi-transparent and causes background text to bleed through.

2. **Sheet Header & Footer**:
   - Uses `bg-card` with a clean `border-b border-border/70 space-y-1.5`.

3. **Inner Content Blocks & Tiles**:
   - Sub-sections (Prompt, Model Output, Expected Answer, Evaluator Cards, Telemetry) sit inside soft, calm `bg-muted/50` or `bg-muted/40` blocks with `border border-border/60 rounded-xl p-4`.
   - **Evaluations Section**: Evaluator diagnostic cards must use neutral borders (`border border-border/60 bg-muted/40`), never loud red or green borders around entire cards. Indicate failures clearly with red status badges and icons (`XCircle` + `text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20`) and passes with emerald (`CheckCircle2` + `text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20`). This ensures errors and failures are immediately scannable without overwhelming the card outlines.
   - Monospace code/output blocks remain crisp, clean, and legible.

## Brand Accent Token Architecture

All accent, brand, and primary highlight colors in EvalBench are centralized into a single CSS design token:

- Defined in `src/app/globals.css`:
  - `@theme inline { --color-brand: var(--brand); --color-brand-foreground: var(--brand-foreground); }`
  - `:root { --brand: #4F46E5; --brand-foreground: #ffffff; }` (Light mode)
  - `.dark { --brand: #818CF8; --brand-foreground: #ffffff; }` (Dark mode)

**Guidelines**:
- **Never hardcode static color classes** like `text-blue-600`, `bg-indigo-500`, etc., for brand accents.
- Always use semantic Tailwind utility classes: `text-brand`, `bg-brand`, `border-brand`, `bg-brand/10`, `border-brand/20`, `hover:text-brand`, etc.
- Changing the brand/theme accent color across the entire application now requires modifying **only one single line** in `src/app/globals.css`.
