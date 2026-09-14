# EvalBench — AI Agent Evaluation & Regression Platform

**Status:** Approved  
**Document type:** Design Document  
**Scope:** Product / UX / Frontend / System Design / Component Architecture  
**Source:** Supplied EvalBench HTML/CSS/JavaScript prototype & Next.js Implementation  

> This document describes the design, user experience, theming, and technical architecture of the EvalBench platform. It incorporates all system guidelines, design token specifications, Shadcn component standards, and authentication flows.

---

## 1. Summary

EvalBench is an AI-agent evaluation and regression-monitoring product. Its central workflow is to evaluate an agent version against a test suite, measure the resulting performance, and compare it with a baseline.

The platform centers the product around three explicit dimensions:

1. **Accuracy**
2. **Cost**
3. **Latency**

The product's core interaction is a baseline-versus-candidate comparison. A user can determine whether an agent change improved the score, introduced a regression, increased cost, or affected latency before shipping that version.

The platform consists of three primary user surfaces:

- **Public Landing Page**: Communicates the product value proposition, multi-dimensional tracking, and live scoreboard demonstration.
- **Authentication Workbench (Login & Sign Up)**: Cardless split-screen studio workbench with live evaluation telemetry and distraction-free forms.
- **Operational Dashboard**: Provides run management, distributed job tracking, multi-run comparison matrix, and granular test-case drilldowns.

---

## 2. Background and Context

Agent behavior changes when prompts, models, retrieval systems, tools, or orchestration logic change. Looking only at a single aggregate score does not provide enough information to understand whether a new version is actually better.

The EvalBench interface presents evaluation results comparatively:

- The landing-page message is explicitly centered on measuring each agent change against the last one.
- The dashboard extends that idea into a run history where each run contains a score, baseline delta, pass rate, cost, p95 latency, and status.
- Example tradeoff: `support-agent v4.2` achieves a `+1.8 pts` score improvement and `1.0s` p95 latency (down from `1.1s`), but incurs a cost increase from `$0.038` to `$0.049`.

---

## 3. Design System & Frontend Architecture Standards

### 3.1 Shadcn Component Standards
To maintain codebase consistency, accessibility, and maintainability, **custom components must not be invented from scratch** when standard Shadcn components exist:
- **Buttons**: All buttons and action links must use `Button` or `buttonVariants` from `@/components/ui/button`.
- **Inputs**: All text, email, password, search, and number inputs must use `Input` from `@/components/ui/input`.
- **Tables**: All data grids and tables must use `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, and `TableCell` from `@/components/ui/table`.
- **Cards & Panels**: When structured bounding boxes are required (e.g., dashboard widgets, compare matrix), use `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` from `@/components/ui/card`.
- **Dropdowns & Menus**: All action menus, user profiles, and popover actions must use `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, and `DropdownMenuSeparator` from `@/components/ui/dropdown-menu`.
- **Avatars**: All user profile images, fallback initials, and status avatars must use `Avatar`, `AvatarImage`, and `AvatarFallback` from `@/components/ui/avatar`.

> **Shadcn-First Invariant**: Before building any UI element or interaction from scratch, always verify whether an equivalent Shadcn component exists. If Shadcn contains the component, always adopt and compose that component rather than reinventing the wheel.

### 3.2 No Arbitrary Tailwind Values
All styling must strictly use standard Tailwind utility classes and theme tokens. Arbitrary value brackets (e.g., `px-[22px]`, `w-[200px]`, `text-[13px]`) are prohibited. Use standard Tailwind scale units (`px-4.5`, `max-w-xs`, `text-sm`, etc.).

### 3.3 Form Architecture
Forms are built on top of type-safe form primitives (`@/components/form`):
- `<Form<TSchema>>`: Context provider wrapping `react-hook-form` and `@hookform/resolvers/zod`.
- `<FormField>`: Layout wrapper providing accessible labels (`<label htmlFor={id}>`), error messaging (`role="alert"`), and hint text.
- `<SubmitButton>`: Context-aware submit button with automatic loading state and spinner.
- Type-safe schema validation defined via `zod`.

### 3.4 Dual-Theme Design Tokens (Dark & Light Mode)
EvalBench provides seamless dark and light mode support via `next-themes` and the `<ModeToggle />` component:

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `bg-background` | `#FFFFFF` | `#0A0A0A` | Main page background |
| `text-foreground` | `#1C1F26` | `#FAFAFA` | Primary typography |
| `bg-card` | `#FFFFFF` | `#141414` | Card / surface backgrounds |
| `border-border` | `#E4E7EB` | `#262626` | Hairline borders & dividers |
| `text-muted-foreground` | `#6B7078` | `#A1A1AA` | Secondary copy, metadata |
| `bg-blue-600` / `text-blue-600` | `#2563EB` | `#3B82F6` (dark) | Primary brand accent & positive diffs |
| `text-destructive` | `#DC2626` | `#EF4444` | Errors, regressions, alerts |
| `text-emerald-600` | `#059669` | `#34D399` | Pass markers, test completions |

**Mode Toggle Placement**:
- Kept in the landing page **Footer** and auth page **Top Right**, leaving primary navigation headers clean and focused.

---

## 4. Typography

EvalBench utilizes a 4-font typography system:

| Role | Font Family | Tailwind Class | Usage |
|---|---|---|---|
| **Headings** | Space Grotesk | `font-heading` | Page titles, section headings, card titles |
| **Editorial Accents** | Fraunces | `font-serif italic` | Key highlight words (e.g., *measured*, *production*) |
| **Body / UI** | Inter / Geist Sans | `font-sans` | Paragraphs, labels, buttons, form inputs |
| **Technical Data** | JetBrains Mono | `font-mono` | Eyebrow markers (`// 01`), run IDs, scores, latencies |

---

## 5. User Surfaces & Layouts

### 5.1 Landing Page
- **Header**: Minimalist brand logo with blue dot square (`h-2 w-2 rounded-xs bg-blue-600`), navigation links, and dynamic session-aware controls:
  - *Unauthenticated*: Renders `Sign in` and `Get started` buttons.
  - *Authenticated*: Renders a direct `Dashboard` button and a compact, space-efficient circular `Avatar` trigger with a live runner daemon indicator.
- **Hero**:
  - Live pulse status dot (`PulseDot`).
  - Tightened headline: *"Every agent change, measured against the last."* with serif italic accent on *measured*.
  - Subtitle: Clear explanation of multi-axis evaluation (accuracy, cost, latency).
  - Primary CTA link (`Run your first eval` / `Get started free` dynamically routing to `/runs/new` or `/dashboard` for logged-in users) and secondary link (`Read the docs`).
- **Scoreboard**: Central baseline-versus-candidate demonstration with side-by-side metric bars.
- **Three Core Pillars**: Dedicated sections for Accuracy, Cost, and Latency with technical feature lists.
- **Demo Comparison Table**: Rendered using Shadcn `Table` primitives with static non-clickable demo runs.
- **CTA Strip**: Directs unauthenticated visitors to `/signup` and authenticated users to `/dashboard` (*"Go to dashboard"*).
- **Footer**: Brand copyright, navigation links, and the `<ModeToggle />`.

---

### 5.2 Authentication Surfaces (Login & Sign Up)

Both authentication surfaces reject generic floating card boxes in favor of a **Split-Screen Studio Workbench** layout:

```text
+------------------------------------------+------------------------------------------+
| LEFT PANEL: Workbench Visuals            | RIGHT PANEL: Cardless Form Surface       |
|                                          |                                          |
| [Wordmark]          [Telemetry Badge]    | [Back to site]             [ModeToggle]  |
|                                          |                                          |
| [Dynamic Content: Terminal / Minimal]    | [// Eyebrow]                             |
|                                          | [Heading: Sign in / Create account]      |
|                                          | [TicksDivider]                           |
|                                          |                                          |
|                                          | [Form Fields with Shadcn Input]          |
|                                          | [SubmitButton]                           |
|                                          |                                          |
| [Security & Protocol Marker]             | [Account Switcher Link]                  |
+------------------------------------------+------------------------------------------+
```

#### Login Page (`/login`)
- **Left Panel (Desktop)**: **Live Evaluation Runner Terminal Stream**:
  - Top titlebar: `evalbench-runner · core-suite · v4.2`.
  - Invocation: `$ evalbench test --suite support-agent --baseline v4.1 --candidate v4.2`.
  - Color-coded live execution lines with micro-latencies (`✔ [1/128] intent_classification · 28ms`).
  - Metric summary footer (`128/128 Passed`, Score `94.2 (+1.8)`, Latency `1.0s`, Cost `$0.049`).
  - Zero-regression verification confirmation.
- **Right Panel**:
  - Cardless, open form layout.
  - Zod schema validation: Email format + Password.
  - Shadcn `Input` with `autoComplete` and `aria-invalid` accessibility attributes.

#### Sign Up Page (`/signup`)
- **Left Panel (Desktop)**: **Quiet, Minimalist Editorial (Distraction-Free)**:
  - Editorial headline: *"The evaluation stack for teams building production AI agents."*
  - 3-point minimal checklist: Automated regression detection, side-by-side diffs, and CI/CD pipelines.
  - Low visual noise designed to maximize signup conversion without distraction.
- **Right Panel**:
  - Cardless, open form layout.
  - Fields: Full name, Work email, Password (minimum 8 characters).
  - Shadcn `Input` components + `<SubmitButton>` with automatic loading spinner.

---

### 5.3 Operational Dashboard

- **Sidebar Navigation**: `Runs`, `Agents`, `Suites`, `Traces`, `Settings`.
- **Top Bar**: Search bar with Shadcn `Input`, environment badge, user avatar.
- **Runs Page (`/runs`)**:
  - Top metrics summary (Total runs, Avg score, Regressions flagged, Avg cost).
  - Search/filter input built on Shadcn `Input`.
  - Runs table built on Shadcn `Table`.
  - Actions using Shadcn `Button`.
- **Jobs Page (`/jobs`)**:
  - YAML config path submission form using Shadcn `Input` and `Button`.
  - Real-time job tracker with status badges (`queued`, `running`, `completed`, `failed`).
- **New Run Page (`/runs/new`)**:
  - Provider selector and model name input.
  - Dataset path and prompt template inputs using Shadcn `Input`.
  - Evaluator toggle chips using Shadcn `Button`.
- **Compare Page (`/compare`)**:
  - Side-by-side multi-run comparison matrix built on Shadcn `Card` and `Table`.
  - Highlights deltas in test cases, latency, cost, and evaluator pass rates.

---

### 5.4 Interactive Station HUD & User Cockpit Dropdown

To avoid generic, cookie-cutter floating box menus, user identity and session controls utilize a **Workbench Station HUD** design language built strictly on top of Shadcn `DropdownMenu` and `Avatar` primitives:

```text
+-------------------------------------------------------------+
| // eval workbench                          [● runner active] |
| [Avatar]  User Display Name                                 |
|           user@company.com                                  |
+-------------------------------------------------------------+
| WORKBENCH NAVIGATION                                        |
|   [Dashboard Icon]        Dashboard             workspace   |
|   [Activity Icon]         Evaluation Runs         history   |
|   [GitCompare Icon]       Compare Matrix             diff   |
|   [Settings Icon]         Settings                          |
|   [Sun / Moon Icon]       Light / Dark Theme         mode   |
+-------------------------------------------------------------+
|   [LogOut Icon]           Log out               terminate   |
+-------------------------------------------------------------+
```

- **Trigger Philosophy**: A compact, space-efficient circular `Avatar` trigger (`size-8`) with a live emerald runner daemon dot (`runner active`) in the corner. Avoids horizontal navbar clutter by omitting raw name strings from the main navigation row.
- **Identity HUD**: Prominent studio card header featuring a monospace telemetry tag (`// eval workbench`), pulsing live daemon status indicator, user avatar, name, and monospace email.
- **Direct Workbench Navigation**: Streamlined action items connecting users to Dashboard (`workspace`), Evaluation Runs (`history`), Compare Matrix (`diff`), and Settings.
- **Integrated Theme Switcher**: In-menu dark/light mode toggle with matching `Sun`/`Moon` icons reflecting current theme state.
- **Session Termination**: Clean `terminate` sign-out item with destructive hover styling that reactively purges cookies via Better Auth `authClient.signOut()`.

---

## 6. Data Models & API Contracts

### 6.1 Evaluation Run
```typescript
interface EvaluationRun {
  run_id: string
  dataset_name: string
  provider: string
  model: string
  prompt_template?: string
  system_prompt?: string
  total_test_cases: number
  metrics: {
    mean_latency_ms: number
    total_cost_usd: number
    pass_rates: Record<string, number>
  }
  created_at: string
}
```

### 6.2 Distributed Job
```typescript
interface Job {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  config_path?: string
  run_id?: string
  error?: string
  created_at: string
}
```

---

## 7. Accessibility & Engineering Quality Checklist

- [x] All interactive controls use semantic HTML `<button>` / Shadcn `Button` instead of non-interactive `<div>` or raw `<a>` tags.
- [x] All form inputs link labels via `htmlFor`/`id` and bind `aria-invalid` and `role="alert"` for error states.
- [x] Full responsive support across mobile, tablet, and desktop viewports.
- [x] Zero arbitrary Tailwind classes; consistent token reuse.
- [x] Dark mode and light mode tested with optimal color contrast ratios.
