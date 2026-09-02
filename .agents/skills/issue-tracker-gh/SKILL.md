---
name: issue-tracker-gh
description: Create, list, search, modify, close, and delete GitHub issues on the current repository using the gh CLI. Automatically evaluate on every prompt to spot potential bugs, unhandled errors, tech debt, missing tests, or deferred tasks. Also use whenever the user explicitly asks to file a bug, create a task/issue, check open issues, update an issue, or link issues to PRs. Always use this skill instead of running raw gh commands ad hoc.
---

# Issue Tracker

A skill for managing GitHub issues on the current repository via the `gh` CLI with proactive issue detection on every prompt.

## Scope

- Operates **only on the current repository**, detected from the local git remote. Never pass `--repo owner/name` to target a different repo, and never ask the user which repo — infer it.
- Before doing anything, confirm `gh` is authenticated and a repo is detected:
  ```bash
  gh repo view --json nameWithOwner -q .nameWithOwner
  ```
  If this fails, tell the user to run `gh auth login` and/or check they're inside a git repo with a GitHub remote. Don't proceed until it succeeds.

## Automatic Evaluation & Trigger Patterns

### 1. Proactive Auto-Detection (Every Prompt)
On **every prompt**, actively inspect the conversation and code context for potential issues:
- **Bugs / Errors**: Unhandled runtime errors, edge-case failures, or regressions identified during discussion/debugging that are not immediately fixed.
- **Tech Debt / TODOs**: Unresolved `TODO`/`FIXME` comments, deprecated APIs, performance bottlenecks, or code smell discovered in touched files.
- **Deferred Tasks & Enhancements**: Feature requests, architectural improvements, or follow-up items the user mentions wanting to do later.

When a potential issue is spotted, append a lightweight suggestion at the end of your response:
```markdown
> 💡 **Potential Issue Detected**: [1-sentence summary]
> - **Proposed Title**: `<type>(<scope>): <summary>`
> - **Labels**: `bug` / `enhancement` / `tech-debt`
> Would you like me to file this as a GitHub issue?
```

*Note: Do not suggest issues for trivial typos or things that were completely resolved in the current turn.*

### 2. Explicit User Triggers
- Natural language: "file a bug for...", "create an issue about...", "what's open right now", "find the issue about the login bug", "close #12", "add the bug label to #7", "assign #9 to me", "delete issue #3", "yes file it", "create that issue"
- Slash-style: `/issue create`, `/issue list`, `/issue search`, `/issue edit`, `/issue close`, `/issue delete`

Parse the intent (create/list/search/edit/close/delete) regardless of phrasing style, then follow the matching workflow below.

## Workflows

### Create
```bash
gh issue create --title "<title>" --body "<body>" [--label "<label>"]... [--assignee "<user>"]...
```

Before running the create command, work through these steps in order:

**1. Check for duplicates.**
Pull 3-5 key terms from the title/description and run:
```bash
gh issue list --search "<key terms>" --state all --limit 5
```
If any results look like plausible duplicates (similar title or clearly the same underlying problem), stop and show them to the user — number, title, state — and ask whether to proceed with a new issue, or to use one of the existing ones instead (comment on it, reopen it, etc.). Only skip this check if the user has explicitly said to create it without checking, or the description is too generic to search meaningfully.

**2. Draft the content.**
If the user gives a rough description rather than a clean title/body, write a concise title and a short structured body (summary, repro steps / context, expected vs actual if it's a bug) before running the command. Show the user what you're about to create if you had to infer significant content; otherwise just create it.

**3. Attach code context, if relevant.**
If the issue is about a bug or code problem the user just encountered in this session — a specific file, function, or error — pull the relevant reference and fold it into the body rather than describing it vaguely:
```bash
git blame -L <start>,<end> -- <file>      # who/when touched these lines
git log -1 --format="%H %an %ad" -- <file>  # last commit touching the file
```
Include a short snippet (file path + line range + relevant code, a few lines at most — not the whole file) and, if useful, the blame info (last commit/author) as context. Format it as a fenced code block with the file path noted above it, e.g.:
```
`src/auth/login.ts:42-48`
<code snippet>
```
Only pull this in when there's an actual file/line to point to — don't fabricate a location. If the user references code but you're not sure which file, ask or search for it first (`grep`/`rg`) rather than guessing.

**4. Create it.**
Labels/assignees are optional — only pass them if the user specified them or they're obvious from context (e.g. user says "assign to me" → use `gh api user -q .login` to resolve "me" to their username).

### List
```bash
gh issue list [--state open|closed|all] [--label "<label>"] [--assignee "<user>"] [--limit N]
```
- Default to `--state open` unless the user asks for closed/all issues.
- Summarize results in a readable list (number, title, labels) rather than dumping raw output.

### Search
```bash
gh issue list --search "<query>"
```
- Use GitHub search qualifiers as needed (`in:title`, `in:body`, `label:`, `author:`, etc.) based on what the user is looking for.

### Edit (title/body/labels/assignees)
```bash
gh issue edit <number> [--title "<title>"] [--body "<body>"] [--add-label "<label>"] [--remove-label "<label>"] [--add-assignee "<user>"] [--remove-assignee "<user>"]
```
- Only pass the flags for what's actually changing.
- To comment instead of editing the body: `gh issue comment <number> --body "<text>"`.

### Close
```bash
gh issue close <number> [--comment "<reason>"] [--reason completed|"not planned"]
```
- No confirmation needed — run directly when the user asks to close an issue.

### Delete
```bash
gh issue delete <number>
```
- **Always confirm before running.** Show the issue's title and number, ask the user to explicitly confirm, and only then run the delete command. This is the one destructive, irreversible action in this skill — don't skip the confirmation step even if the request sounds casual or certain.

### PR linking (optional)

Only use this when the user explicitly asks to link an issue and a PR — don't do it automatically on every create/edit.

- **"Close this issue when PR #x merges"**: add `Closes #<issue-number>` (or `Fixes #N`, `Resolves #N`) to the PR's body — GitHub auto-closes the issue on merge:
  ```bash
  gh pr edit <pr-number> --body "$(gh pr view <pr-number> --json body -q .body)

Closes #<issue-number>"
  ```
  If the user is asking this while creating a new PR, just include the `Closes #N` line in the initial `gh pr create --body` instead.
- **"What issues are linked to this PR / branch"**: check the current PR's body and comments for `closes`/`fixes`/`resolves` references:
  ```bash
  gh pr view [<number>] --json body,number -q .body
  ```
  Report back which issue numbers are referenced, if any.

## Output style

- After any create/edit/close/delete, report back the issue number and a link (`gh issue view <number> --json url -q .url` if needed) rather than raw JSON.
- Keep confirmations and summaries short — this is a dev workflow tool, not a report generator.