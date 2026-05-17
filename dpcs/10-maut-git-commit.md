# 10 · maut-git-commit

## What it does

A status-bar button (bottom-right, highest priority) that runs one-click `git add -A && git commit -m <msg>` followed by an optional push, with VS-Code-native quick-pick confirmations at every step.

## Status bar display

Refreshes every 4 s and on `onDidSaveTextDocument`. Shows one of:

- `$(git-commit)  <branch> · <N>` when the working tree is dirty with `N` changes
- `$(check)  <branch> · clean` when clean
- `$(git-commit)  Commit all` when no git or no workspace

## Click flow

1. **Confirm commit** — quick-pick with the staged file preview (first 8 lines of `git status --porcelain`), branch name, Cancel option.
2. **Commit message** — input box. Default value: `wip: <ISO timestamp>`.
3. **Run** — status-bar spinner. On `add` or `commit` failure, error notification with stderr; bail out.
4. **Push?** — quick-pick: `Push to origin/<branch>` / `Skip push`.
5. **Confirm push** — second quick-pick: `Yes, push origin/<branch>` / `Cancel`.
6. **Push** — status-bar spinner. Notification on success or error.

All UI is VS Code quick-pick / input box / status-bar message — **never** `{ modal: true }` (which renders as a macOS-native dialog and looks out of place).

## Files

```
extensions/maut-git-commit/
├── package.json
├── tsconfig.json
└── src/extension.ts
```

## Gotcha

`commit -m` with messages containing double quotes: the implementation escapes via `message.replace(/"/g, '\\"')` and runs through `exec('git ...')`. If the user's message has shell metacharacters that survive the escape (backticks, `$()`, etc.) it could break. Acceptable risk for personal use; switch to argv-style `execFile('git', ['commit', '-m', message], …)` if you ever want to be paranoid.
