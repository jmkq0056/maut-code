# 24 · Terminal Numbering, State, and Icon/Color Pool

## States

A Maut Claude terminal has two states:

- **active** — `claude` / `clsp` is currently running. Tab is named `N -- MAUT` with a colored icon from the pool.
- **idle / CLOSED** — the claude process exited. Tab is renamed to `CLOSED`, icon goes muted (`history` codicon, `terminal.ansiBlack`), and the number + icon + color slots are released back to the pool.

## Number allocation

`nextNumber()` in `extensions/maut-claude-images/src/extension.ts`:

```ts
function nextNumber(): number {
    const used = new Set<number>();
    for (const info of mautTerminals.values()) {
        if (info.state === 'active') { used.add(info.number); }
    }
    let n = 1;
    while (used.has(n)) { n++; }
    return n;
}
```

Smallest unused positive integer among **currently active** Maut terminals. Closing terminal 1 then spawning a new one gets `1` back, not `2`. CLOSED terminals don't claim numbers.

## Icon + color pool

Two arrays of options (20 codicons × 12 ansi colors) with reference-counted allocation:

```ts
const ICON_POOL = ['flame', 'rocket', 'star-empty', 'beaker', 'lightbulb', …];
const COLOR_POOL = ['terminal.ansiBlue', 'terminal.ansiCyan', …];
const usedIcons = new Map<string, number>();   // icon → refcount
const usedColors = new Map<string, number>();
```

`allocateIcon()` returns the first unused icon, or the least-used if all are taken. `releaseAllocation(info)` decrements the refcount.

## State transitions

- **Spawn** (new terminal via `startClaudeInNewTerminal`): name = `makeMautName(n)`, set `iconPath` + `color` in `TerminalOptions`. Adds to `mautTerminals` Map.
- **Adopt** (someone runs `claude` in a non-Maut terminal): `onDidStartTerminalShellExecution` fires → check `isClaudeCommand` → if not tracked, allocate number + icon + color, then `workbench.action.terminal.renameWithArg` + `maut.terminal.setAppearance`.
- **Idle**: `onDidEndTerminalShellExecution` for claude → mark idle, rename to `CLOSED`, mute icon, release slots.
- **Re-activate** (claude restarts in a CLOSED terminal): start handler sees `info.state === 'idle'` → allocate fresh number + icon + color, rename to new `N -- MAUT`.
- **Restored terminal on app open** (`markRestoredTerminalsClosed`): scans `vscode.window.terminals` after 1.5 s of activation; any tab matching `/^\d+ -- MAUT$/` that's not tracked → rename to `CLOSED`. Prevents stale numbers from blocking the pool.

## The `maut.terminal.setAppearance` workbench command

Defined in `src/vs/workbench/contrib/mautcode/browser/mautTerminalAppearance.ts`. Takes `{ terminalName?, icon, color }`. Resolves the terminal via `ITerminalService` (matching by `title` or `shellLaunchConfig.name`), then calls `instance.changeIcon({ id })` + `instance.changeColor(color, true)` — the existing internal methods, with `skipQuickPick: true` so they apply silently.

## Quick-pick switcher

`maut.terminals.switch` command. Lists all tracked Maut terminals with `$(circle-filled)` for active / `$(circle-outline)` for idle, plus a `$(add) Start new MAUT` option at the bottom. Available in editor title bar + terminal panel toolbar via menu contributions.
