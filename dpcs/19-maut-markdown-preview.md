# 19 · maut-markdown-preview

## What it does

Opens `.md` and `.markdown` files in VS Code's built-in **rendered preview** by default (not the raw source). One toggle to switch to source for editing, and back again.

## Why

Vibecoders read more docs than they write. Default-to-source has them staring at backslash escapes and headings. Default-to-preview makes the IDE feel like a doc browser.

## Toggle

- **`⇧⌘V`** (Shift+Cmd+V) anywhere in a `.md` / preview tab.
- **Editor-title button** (file-text icon).
- Setting: `maut.markdown.previewByDefault` (default `true`).

When you toggle from preview, the same file opens as a regular text editor. Edit, save, hit `⇧⌘V` again → back to rendered view.

## How it works

`vscode.workspace.onDidOpenTextDocument` listener; for markdown docs not already routed:

1. Wait 50 ms so VS Code has fully opened the source editor.
2. Execute `markdown.showPreview` for the URI (the built-in command — uses VS Code's bundled markdown extension's renderer).
3. Walk `vscode.window.tabGroups.all` and close the original source tab if it still exists.

Re-entry guard: a transient `Set<string>` of recently-opened URIs prevents infinite loops if the preview itself somehow triggers another open event. Cleared after 1.5 s.

## Files

```
extensions/maut-markdown-preview/
├── package.json
├── tsconfig.json
└── src/extension.ts
```

## Gotcha

For markdown files that contain mermaid blocks, math, etc., this uses whatever the user's installed markdown preview extensions provide — same as if they manually triggered Show Preview. No custom rendering pipeline.
