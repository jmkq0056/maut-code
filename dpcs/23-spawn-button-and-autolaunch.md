# 23 · Reaper Spawn Button + Smart Auto-Launch

## Reaper `$(flame)` button

A `$(flame)` (codicon flame, close stand-in for the reaper aesthetic) button lives in the terminal panel toolbar, immediately next to the `+ new terminal` button. Click → `maut.chat.startClaude` → fresh `N -- MAUT` terminal running `claude --dangerously-skip-permissions`.

Contributed in `extensions/maut-claude-images/package.json` via:

```json
"menus": {
  "view/title": [
    { "command": "maut.chat.startClaude", "when": "view == terminal", "group": "navigation@1" }
  ]
}
```

## Smart auto-launch on app open

On extension activation (after the workbench is restored):
1. Look for any existing `N -- MAUT` terminal (matches `/^\d+ -- MAUT$/`).
2. If one exists → bind it as the active Maut terminal, no spawn.
3. If none exists AND `maut.autoLaunchClsp` setting is `true` (default) → defer 400 ms, then `startClaudeInNewTerminal({ autoResume: true })`.
4. If `maut.autoEnterFocusMode` is true (default `false`), trigger `maut.focus.toggleTerminal` 250 ms after the spawn.

This means: open Maut → fresh terminal with claude already resuming the most recent session. See `dpcs/25-auto-resume.md` for the resume mechanism.

## Settings

| Setting | Default | What |
|---|---|---|
| `maut.autoLaunchClsp` | `true` | Spawn a Maut terminal on app open if none exists |
| `maut.autoEnterFocusMode` | `false` | After auto-spawn, also enter Maut Focus Mode |
| `maut.autoResumeOnLaunch` | `true` | Use `--continue` to restore the most recent session |
