<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proactive Issue Tracking

- On every prompt, actively check if the conversation or codebase reveals a potential bug, unhandled error, tech debt, or deferred feature. If detected, proactively offer to file a GitHub issue using the `issue-tracker-gh` skill.
- If any of the issues is fixed after a converstaion, mark the issue closed after confirming.

# General
- If making an API call to the backend, make sure to read @docs/architecture/001-api-client-usage.md
- use shadcn components everywhere possible instead of making components from sratch