# 22 · Type-Anywhere `maut` Trigger

## What it does

Type the letters `m-a-u-t` in sequence — no modifiers, <900 ms gap between letters — anywhere in the workbench (editor, terminal, file search, command palette, input prompt) and:

1. The 4 typed letters get deleted best-effort.
2. A fresh `N -- MAUT` terminal spawns and runs `claude --dangerously-skip-permissions`.

## Files

`src/vs/workbench/contrib/mautcode/browser/mautTypeTrigger.ts` — workbench-level contribution, registered from `mautcode.contribution.ts`. Imports `ITerminalService` for the terminal-focused removal path.

## How

Single `document.addEventListener('keydown', handler, false)` at activation. Bubble phase so we don't pre-empt the editor's text rendering — the chars *are* typed first, then we remove them once the full pattern matches.

State machine is a `{ ch, t }[]` buffer length-capped at 4. Modifier press (Cmd/Ctrl/Alt) resets the buffer. Non-letter key resets. Gap > 900 ms resets.

On match:
- **Terminal focused** (`document.activeElement.closest('.xterm')`) → `terminalService.activeInstance.sendText('\x7f\x7f\x7f\x7f', false)` (four DEL bytes).
- **HTML input/textarea** → `setRangeText('', start, end, 'end')` directly slicing the typed chars off the value.
- **Monaco / quickpick / contenteditable** → fall back to `commandService.executeCommand('deleteLeft')` four times. The standard `deleteLeft` command works whenever an editor/input is focused.
- After deletion → `commandService.executeCommand('maut.chat.startClaude')`.

## Limitations

- If you legitimately type a word ending in `maut` (e.g. "automaut"), it fires too. Acceptable false-positive rate for this workflow; you can always close the spawned terminal.
- The Monaco fallback removes the 4 leftmost chars of the cursor — if you typed `maut` then moved the cursor elsewhere before 900 ms, the wrong chars get removed.
