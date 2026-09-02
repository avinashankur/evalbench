---
name: smart-stage
description: >
  Analyze uncommitted changes in the working tree, group related files into
  logical commit-sized units, and interactively stage + commit each group.
  Use when the user says "group my changes", "smart stage", "what should I
  commit together", "split my changes into commits", "help me commit",
  "/smart-stage", or any phrasing about organizing messy uncommitted work
  into clean, separate commits.
---

# Smart Stage

Inspect all uncommitted changes (staged + unstaged + untracked), cluster
them into logical groups that belong in the same commit, present the groups
for approval, and stage + commit each approved group one at a time.

## Step 1 — Collect the full picture

Run these commands to get the complete state:

```bash
git status --short                        # all changed / untracked files
git diff --stat                           # unstaged diff summary
git diff --cached --stat                  # already-staged diff summary
```

If `git status` is clean, stop and tell the user there's nothing to group.

Also gather context that helps with grouping:

```bash
git log --oneline -10                     # recent commits for context
```

## Step 2 — Understand every change

For each changed file, read enough to understand *what* the change is about.
Use the most efficient approach per file:

- **Modified files**: `git diff <file>` (or `git diff --cached <file>` if staged) — read the diff, not the whole file.
- **Untracked / new files**: read the file directly (or at least the first ~100 lines and any obvious indicators like package name, component name, imports).
- **Deleted files**: note the deletion; check `git log -1 -- <file>` for context on what it was.

Build a mental model of each change's *purpose* — what feature, fix, chore,
or refactor does it serve?

## Step 3 — Form groups

Cluster files into groups where each group represents **one logical change**
that belongs in a single commit. Use these signals:

| Signal | Weight |
|---|---|
| **Same feature / component** — files in the same feature directory, or a component + its styles/tests/types | Strongest |
| **Same concern** — e.g. all dependency updates, all CI config, all docs | Strong |
| **Cross-cutting but coupled** — e.g. a util change + every call-site that needed updating | Strong |
| **Temporal proximity in `git log`** — files last touched in the same recent commit | Weak tiebreaker |

### Grouping rules

1. **Don't over-split.** If all changes genuinely serve one purpose, produce
   **one group**. Multiple groups only when the changes are clearly unrelated.
   Err on the side of fewer groups — the user can always split further.
2. **Don't leave orphans.** Every changed file must appear in exactly one
   group.
3. **Order groups** by dependency: if group B depends on group A's changes
   (e.g. A adds a utility, B uses it), A comes first.
4. **Name each group** with a short label that could serve as a commit scope
   (e.g. "shadcn UI setup", "auth page restyling", "docs updates").

## Step 4 — Present the groups

Output the groups in a clear, scannable format. For each group show:

```
### Group N: <label>
<1-sentence rationale for why these files belong together>

Files:
- path/to/file1  (modified)
- path/to/file2  (new)
- path/to/file3  (modified)
```

After listing all groups, show a summary table:

| # | Label | Files |
|---|---|---|
| 1 | ... | N |
| 2 | ... | N |

Then **ask the user** how they'd like to proceed. Use the `ask_question`
tool with options like:

- "Stage and commit all groups in order"
- "Let me pick which groups to commit (by number)"
- "Walk me through one group at a time"
- "I want to modify the groups first"

### Batch mode ("all" or "pick by number")

If the user approves all groups, or selects specific ones (e.g. "1, 3, 4"),
process each approved group sequentially **without asking again between
groups** — just commit them in dependency order and report progress.

### Interactive mode ("one at a time")

Process one group at a time, asking before each:
- "Yes, stage and commit this group"
- "Skip this group"
- "I want to modify this group first"

### Modify mode

If the user wants to modify groups (move files, rename, change message,
merge two groups, split one), make the changes and re-present the updated
groups before proceeding to staging.

## Step 5 — Stage and commit (per approved group)

For each group being committed (whether batch or interactive):

1. **Unstage everything first** (safety reset):
   ```bash
   git reset HEAD
   ```
2. **Stage only this group's files**:
   ```bash
   git add <file1> <file2> ...
   ```
3. **Verify** what's staged matches the group:
   ```bash
   git diff --cached --stat
   ```
4. **Generate the commit message using the `git-commit` skill.**
   Do NOT write your own commit message. Invoke the `git-commit` skill
   against the currently staged diff — it will produce a properly formatted
   Conventional Commits message. Present the generated message to the user
   and let them accept or override it.
5. **Commit** with the message from the `git-commit` skill (or the user's
   override):
   ```bash
   git commit -m "<message>"
   ```

In batch mode, repeat steps 1–4 for each group in order, printing a
one-line confirmation after each commit (`✅ Group N: <hash> <message>`).

## Step 6 — Wrap up

After all groups are processed, show a summary:

```
✅ Committed:
  - <hash> <message>
  - <hash> <message>

⏭️ Skipped:
  - Group 3: <label> (N files still uncommitted)

Remaining uncommitted files: N
```

If any files remain uncommitted, offer to stage them as a final catch-all
commit or leave them for later.

## Edge cases

- **Already-staged files**: include them in the analysis. If they logically
  belong with unstaged files, group them together (they'll be unstaged and
  re-staged as part of the group).
- **Merge conflicts**: if `git status` shows conflicts, stop and tell the
  user to resolve them first.
- **Large number of files (>30)**: still group them, but be more aggressive
  about combining into fewer groups to avoid group fatigue. Mention that the
  user can ask you to split specific groups further.
- **Binary files**: include them in groups based on their path/name, but
  note them as `(binary)` since their diff can't be read.

## Commit messages

**All commit messages are generated by the `git-commit` skill.** This skill
does not generate commit messages on its own — ever. After staging a group's
files, invoke the `git-commit` skill to produce the message from the staged
diff. This ensures consistent Conventional Commits formatting across the
entire repo. See `.agents/skills/git-commit/SKILL.md` for the full rules.

## Boundaries

- This skill **groups, stages, and commits**. It does **not** push.
  After all commits are done, remind the user they can push when ready:
  `git push origin <branch>`.
- If the user only wants grouping suggestions without committing, stop
  after Step 4 and don't proceed to staging.
- Respect the user's decisions — if they want to merge or rearrange groups,
  do it without pushback.
