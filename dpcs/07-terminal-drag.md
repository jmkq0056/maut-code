# 07 · Terminal drag-and-drop → @-mention

## What it does

Inside a Maut Claude terminal (name starts with `MAUT` or `Maut`):

- **Drag a file from the explorer** → inserts `@<workspace-relative-path> ` at the prompt.
- **Drag an editor text selection** → inserts `@<workspace-relative-path>:<startLine>-<endLine> ` (or just `:line` if single line).
- Any other terminal: drag behaves the standard VS Code way (paste shell-quoted absolute path).

## Files touched

Patched workbench source — there is no extension API for this:

`src/vs/workbench/contrib/terminal/browser/terminalInstance.ts`

Two changes:

1. In `TerminalInstanceDragAndDropController.onDrop`, when no file URI is in the drop, fire a new event `onDropText` with the `text/plain` payload (so the parent `TerminalInstance` can react with workbench context).
2. In `TerminalInstance._initDragAndDrop`, subscribe to `onDropFile` AND `onDropText`. For Maut-named terminals, branch to the @-mention behaviour; otherwise fall through to the default.

## Why a patch and not an extension

`vscode.window.registerTerminalLinkProvider` exists but only fires on **outgoing** terminal text (lines on screen), not on drop events. There's no extension API for "intercept terminal drop". Workbench patch was the only path.

## Detection: "is this a Maut terminal?"

```ts
if (this.title.includes('MAUT') || this.title.startsWith('Maut')) { … }
```

Both forms are checked because terminals we create at spawn time are named `N -- MAUT` but `Terminal.title` can also be the older `Maut · Claude N` if an old session is restored from VS Code's terminal restore.

## Gotcha

Selection drag passes the SELECTED TEXT in `text/plain`. We don't actually inspect it — we read the **currently active editor's selection** at drop time. There's a race where the user could change focus between starting the drag and dropping; in practice the editor stays focused during drag so this is fine.
