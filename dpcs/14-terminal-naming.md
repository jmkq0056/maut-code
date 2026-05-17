# 14 · Terminal Naming & Appearance

## What ships

Every terminal where `claude` or `clsp` is running gets:

- An auto-assigned **unique number** in the format `N -- MAUT` (1, 2, 3…). Numbers are **never** reused even after a terminal closes.
- A **unique codicon** from a pool of 20.
- A **unique terminal color** from a pool of 12 (ansi colors).

Different states:

| State | Look |
|---|---|
| Claude actively running | Numbered name + colored unique icon |
| Claude exited (idle) | Name kept, icon becomes `history` in `terminal.ansiBlack` — slot freed back to pool |
| Re-run claude in same terminal | Allocated fresh icon+color, becomes colorful again |
| Terminal closed | Slot freed |

A switcher button (`$(list-tree)`) lives in both the editor title bar and the terminal panel toolbar — opens a quick-pick of all numbered Maut terminals with an `active` / `idle` badge and a **Start new** option.

## How

1. **Shell-execution events** (`onDidStartTerminalShellExecution` / `onDidEndTerminalShellExecution`, provided by VS Code's shell integration) detect when `claude` / `clsp` starts and ends in any terminal.
2. **Adoption**: If a terminal we didn't spawn runs claude, we adopt it — `nextNumber()`, `allocateIcon()`, `allocateColor()`, then rename via the built-in workbench command:
   ```ts
   await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', { name });
   await vscode.commands.executeCommand('maut.terminal.setAppearance', { icon, color });
   ```
3. **`maut.terminal.setAppearance`** is a workbench-level command registered in `src/vs/workbench/contrib/mautcode/browser/mautTerminalAppearance.ts`. It uses `ITerminalService.activeInstance.changeIcon({id})` + `.changeColor(colorId, true)` — the standard internal calls, just bypassing their interactive quick-pick prompt.

## Files

| File | Role |
|---|---|
| `extensions/maut-claude-images/src/extension.ts` | Pool management (`ICON_POOL`, `COLOR_POOL`, `allocate*`/`releaseAllocation`), shell-execution binding |
| `src/vs/workbench/contrib/mautcode/browser/mautTerminalAppearance.ts` | The `maut.terminal.setAppearance` workbench command |
| `src/vs/workbench/contrib/mautcode/browser/mautcode.contribution.ts` | Imports the above so it's registered at workbench startup |

## Pools

```ts
ICON_POOL = ['flame', 'rocket', 'star-empty', 'beaker', 'lightbulb', 'mortar-board',
  'snake', 'octoface', 'bug', 'gear', 'plug', 'briefcase', 'bell', 'book',
  'calendar', 'compass', 'dashboard', 'database', 'archive', 'diff'];

COLOR_POOL = ['terminal.ansiBlue', 'terminal.ansiCyan', 'terminal.ansiGreen',
  'terminal.ansiMagenta', 'terminal.ansiRed', 'terminal.ansiYellow',
  'terminal.ansiBrightBlue', 'terminal.ansiBrightCyan', 'terminal.ansiBrightGreen',
  'terminal.ansiBrightMagenta', 'terminal.ansiBrightRed', 'terminal.ansiBrightYellow'];
```

When all 20 icons (or 12 colors) are simultaneously in use, the least-used one is reused. Both pools are reference-counted in `Map<string, number>` so when a slot is released, the counter drops and the pool reopens.

## Why `terminal.integrated.tabs.title: "${sequence}${separator}${process}"`

Set in `configurationDefaults`. Without `${sequence}` in the template, VS Code ignores any OSC 0 title sequences the shell emits — would prevent shells that set their own title (Claude Code does) from being respected. Including `${process}` as a fallback means an unrenamed terminal still shows something useful.

## Limitations

- The pool size (20 × 12) is large but finite. In practice users never run 20+ active Maut terminals at once.
- Numbering finds the smallest unused positive integer among ACTIVE Maut terminals — so a fresh `clsp` after a close gets `1` back if it's free. Across restarts, mautTerminals is empty and numbering restarts from 1.
- The `onDidStartTerminalShellExecution` API requires shell integration — works for zsh/bash/fish/pwsh on macOS by default, but exotic shells may not fire the events.

## CLOSED state (post-v0.1.0)

- When `claude` / `clsp` exits in a Maut terminal, the `onDidEndTerminalShellExecution` handler renames the tab to **`CLOSED`**, sets the muted `history` icon + `terminal.ansiBlack` color, and releases the icon+color+number slots back to the pool.
- Re-running `clsp` in a CLOSED terminal allocates a fresh number (smallest unused) and a fresh icon+color and renames to `N -- MAUT`.
- On extension activation, `markRestoredTerminalsClosed()` runs after 1.5 s and finds any restored `N -- MAUT` tabs (left behind from a previous session) that aren't yet tracked, renaming them to CLOSED preemptively. This prevents stale numbers from blocking the pool.
