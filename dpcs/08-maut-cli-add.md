# 08 · maut-cli-add

## What it does

Right-click in the explorer or editor → "Add to Maut CLI" appends the relevant `@<path>` references to the active Maut Claude terminal.

Three entry points:

1. **Explorer right-click** on a file or folder — adds `@path`.
2. **Multi-select in explorer** (Cmd+click) + right-click — adds `@path1 @path2 … @pathN ` with a confirmation dialog if more than one item.
3. **Editor right-click with text selected** → "Add Selection to Maut CLI" — adds `@path:start-end ` using the editor's current selection range.
4. **Inline `@` icon** on every file/folder row in the explorer — see `dpcs/15-workbench-patches.md` for the workbench-level part of that.

## Files

```
extensions/maut-cli-add/
├── package.json                  ← menu contributions (explorer/context, view/item/context, editor/context, editor/title/context)
├── tsconfig.json
└── src/extension.ts              ← addFiles(focused, allSelected) + addSelection()
```

## Where the @ goes

`findMautTerminal()` returns the first terminal whose `name` includes `MAUT` or starts with `Maut`, falling back to `vscode.window.activeTerminal`. The mention is sent via `terminal.sendText(..., false)` — no newline, so the user can keep typing.

## Bulk confirmation

When `>1` URI is in play, a modal appears:

```
Add 12 items to the Maut Claude CLI as @-mentions?

• maut-activity/src/extension.ts
• maut-claude-images/src/extension.ts
• maut-cli-add/src/extension.ts
… and 9 more

[ Add ]
```

The list caps at 12 items shown; the rest are summarized. Confirmation via VS Code quick-pick UI, not a macOS modal.

## Selection format

Single line: `@path/to/file.ts:42 `
Range:        `@path/to/file.ts:42-58 `
Selection 0-cols at the same line as line `N`: counts as single line `:N`.
