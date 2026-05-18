# 26 · Drag-and-Drop Into Terminal in Focus Mode

## Problem

When the Maut terminal lives in the editor area (during Maut Focus Mode via `moveToEditor`), dragging a file from the explorer onto the terminal **opened the file as an editor instead** of inserting `@workspace/path` into the terminal.

## Cause

VS Code's editor part has a drop target that catches file drops and opens them as editors. The terminal's `TerminalInstanceDragAndDropController.onDrop` *did* fire, but it didn't call `stopPropagation`/`preventDefault`, so the editor part's drop handler ran *after* and opened the file as a new editor anyway.

## Fix

`src/vs/workbench/contrib/terminal/browser/terminalInstance.ts`:

```ts
onDragOver(e: DragEvent) {
    // …
    e.preventDefault();
    e.stopImmediatePropagation();
}

async onDrop(e: DragEvent) {
    this._clearDropOverlay();
    e.preventDefault();
    e.stopImmediatePropagation();
    // …
}
```

The terminal now claims the drop event on both `dragover` and `drop` phases. The editor part's drop handler doesn't fire because event propagation stops at the terminal.

## Side effect

This affects **all** drops on **all** terminals (panel and editor), Maut or otherwise. The previous behavior of `drop file on terminal → terminal types the path` is unchanged for non-Maut terminals (still routed through `sendPath` / shell-quoted paste). The fix only prevents the *editor part* from also handling the drop.

In practice no one wants a drop on a terminal to also open the file — so the fix is a strict improvement.
