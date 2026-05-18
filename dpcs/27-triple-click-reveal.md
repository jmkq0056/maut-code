# 27 · Triple-Click → Reveal in Finder

## What it does

Triple-click any row in the file explorer (the explorer tree) **or** any editor tab → the file is revealed in macOS Finder.

## Files

`src/vs/workbench/contrib/mautcode/browser/mautTripleClickReveal.ts` — workbench contribution, registered from `mautcode.contribution.ts`.

## How

`document.addEventListener('click', handler, true)` at activation, capture phase. `MouseEvent.detail === 3` means triple-click.

When the click happens:
1. **Closest `.monaco-list-row`** AND the explorer view is the focused list → execute `revealFileInOS` (operates on the explorer's currently focused resource, which is the row that received the click).
2. **Closest `.tab`** → look for `data-resource-name` to get the URI, otherwise fall back to `workbench.action.files.revealActiveFileInWindows` then `revealFileInOS`.

Both branches call `preventDefault` + `stopPropagation` so the default rename-on-triple-click behavior doesn't fire.

## Gotchas

- The standard VS Code "rename on double-click slow-burst" still works because that's a double-click (`detail === 2`); triple-click goes through us.
- `revealFileInOS` is the VS Code-built-in for macOS Finder reveal. On Windows the command is `revealFileInWindows`. We use the OS command which is aliased on macOS.
