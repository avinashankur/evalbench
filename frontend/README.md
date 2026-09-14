# EvalBench Frontend

> Modern web interface for the EvalBench AI evaluation and benchmarking platform.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-v1.7-black)](https://better-auth.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is this?

**EvalBench Frontend** is the user-facing web application for [EvalBench](https://github.com/your-org/evalbench), an AI evaluation and benchmarking engine. It gives AI engineers and researchers a unified interface to configure evaluation suites across multiple LLM providers, track running benchmarks with live progress updates, inspect granular per-test-case results, and compare performance across models and prompt versions.

The application is built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TanStack Query v5**, and **Better Auth**.

---

## Features

- **✨ Public Marketing Landing Page**: Rich interactive hero, live evaluation scoreboard, telemetry metric bars, and model comparison matrix.
- **🚀 Evaluation Run Management**: Configure and trigger single or multi-evaluator benchmarks with custom datasets, temperature settings, and model providers.
- **⚡ Live Execution Polling**: Real-time progress tracking, live status polling, and immediate result visualization for active evaluation runs and distributed jobs.
- **📊 Granular Test Case Inspection**: Drill down into individual prompt/response pairs, evaluator outputs, token usage, latency metrics, and failure diagnostics.
- **⚖️ Side-by-Side Model Comparison**: Compare multiple evaluation runs simultaneously to evaluate tradeoffs across accuracy, latency, and cost.
- **🔍 System & Provider Discovery**: View available LLM providers, registered evaluators, and backend API health from a centralized dashboard.
- **🎨 Modern Design System**: Built with shadcn/ui primitives, Tailwind CSS v4 design tokens, Google Fonts (Space Grotesk & Fraunces), and accessible theme switching.
- **🔐 Secure Authentication**: Integrated user registration, login, and session handling powered by Better Auth and PostgreSQL.

---

## Quick Start

### Prerequisites

- **Node.js**: `v20.x LTS` or newer
- **PostgreSQL**: Running instance for Better Auth session storage (e.g. Neon, AWS RDS, or local Docker)
- **EvalBench Backend**: Running instance of the EvalBench FastAPI service (default: `http://localhost:8000`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/evalbench-frontend.git
   cd evalbench-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=postgresql://user:password@localhost:5432/evalbench_auth
   BETTER_AUTH_SECRET=your_32_character_or_longer_secret_here
   ```

4. **Run database migrations for Better Auth:**
   ```bash
   npx @better-auth/cli migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuration

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | URL of the EvalBench FastAPI backend service |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Canonical frontend application URL |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string for Better Auth |
| `BETTER_AUTH_SECRET` | Yes | — | 32+ character random secret for signing session cookies |

---

## Scripts

```bash
npm run dev        # Starts development server on http://localhost:3000
npm run build      # Creates production build
npm run start      # Runs production server
npm run lint       # Runs ESLint checks
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router (landing, studio workbench auth & dashboard)
├── components/
│   ├── common/           # Shared visual primitives (TicksDivider)
│   ├── form/             # Type-safe form system (Form, FormField, SubmitButton)
│   ├── landing/          # Marketing landing page components (Hero, Scoreboard, Station HUD Header)
│   ├── layout/           # App shell, navigation sidebar, and header
│   ├── ui/               # shadcn UI primitives (Avatar, Button, Card, DropdownMenu, Input, Table)
│   └── mode-toggle.tsx   # Theme switcher
├── config/               # Site configuration and navigation metadata
├── env.ts                # Runtime type-safe env validation (t3-env)
├── lib/
│   ├── api/              # Centralized apiClient, baseApi, error parsers
│   ├── auth.ts           # Better Auth server configuration
│   ├── auth-client.ts    # Better Auth client library
│   └── utils.ts          # Class merging utility (cn)
├── proxy.ts              # Next.js 16 route proxy & session cookie guard
├── modules/
│   ├── runs/             # Run creation, details, results, and query hooks
│   ├── jobs/             # Distributed jobs management and tracking
│   └── discovery/        # Model provider, evaluator, and health discovery
└── providers/            # AppProvider wrapping QueryClient, Theme, Sonner
```

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, C4 context/containers, and data flow
- [CONTEXT.md](./CONTEXT.md) — Agent and developer mental model, conventions, and invariants
- [DESIGN.md](./DESIGN.md) — Product & UX design specifications and metric models
- [Subsystem Architecture](./docs/architecture/) — Project-specific architecture deep-dives
- [Product Requirements](./docs/prd.md) — User personas, value proposition, and feature scope
- [Architecture Decisions (ADRs)](./docs/adr/) — Record of architectural decisions and trade-offs
- [Concepts](./docs/concepts/) — Universal algorithms, scoring theory, and math models
- [How-To Guides](./docs/how-tos/) — Step-by-step developer implementation recipes
- [Runbooks](./docs/runbooks/) — Operational guides and troubleshooting steps

---

## License

MIT © EvalBench Team
