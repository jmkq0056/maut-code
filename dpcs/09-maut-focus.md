# 09 · maut-focus (Maut Mode)

## What it does

One-click full-screen-ish zen mode for either the active editor or the active terminal, with the layout restored exactly when toggled off. Preserves all state — Claude Code session, terminal scrollback, file scroll position.

## Entry points

- **Editor tab toolbar** — `$(screen-full)` button.
- **Terminal panel toolbar** — same icon.
- **Keyboard**:
  - `Cmd+K Cmd+M` — smart toggle (focuses whichever is active, or unfocuses if already focused).
  - `Cmd+K Cmd+F` — explicitly focus the active file.
  - `Cmd+K Cmd+T` — explicitly focus the active terminal.
- **Toggle file tree** while focused — `$(layout-sidebar-left)` button (also visible in the toolbar).

## How

Wraps `workbench.action.toggleZenMode`. For terminal focus, it first moves the active terminal into the editor area via `workbench.action.terminal.moveToEditor`, then enters zen. On unfocus, it exits zen and moves the terminal back via `workbench.action.terminal.moveToTerminalPanel`.

## Defaults that make zen mode usable

`extensions/configuration-editing/package.json`:

```json
"zenMode.centerLayout": false,    // don't center to 50% — use full width
"zenMode.hideTabs": false,         // keep tabs visible so our exit button is reachable
"zenMode.fullScreen": false,       // don't OS-fullscreen the window
"zenMode.hideActivityBar": true,
"zenMode.hideStatusBar": true,
"zenMode.silentNotifications": false,
"zenMode.restore": false
```

## Files

```
extensions/maut-focus/
├── package.json
├── tsconfig.json
└── src/extension.ts
```

## Gotchas

- The terminal must be the active terminal at the moment `Cmd+K Cmd+T` fires, otherwise `moveToEditor` no-ops. The smart toggle uses `vscode.window.activeTextEditor` vs `vscode.window.activeTerminal` to pick. If both are valid, editor wins.
- Zen mode hides the editor tabs by default; we override that — without it, you couldn't see the toggle button to exit.
