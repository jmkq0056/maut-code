# 21 · Office File Auto-Handoff

## What it does

Click a `.docx` / `.doc` / `.odt` / `.rtf` / `.xlsx` / `.xls` / `.ods` / `.pptx` / `.ppt` / `.odp` / `.key` in the explorer → it opens in Microsoft Word / Excel / PowerPoint automatically. No "file is binary or uses an unsupported encoding" warning.

## How

Custom-editor providers in `maut-open-external`. Each provider registers via `vscode.window.registerCustomEditorProvider` with `priority: "default"`. When VS Code routes a click to the provider:

1. `openCustomDocument` returns a minimal `CustomDocument` for the URI.
2. `resolveCustomEditor` paints a brief placeholder webview ("Opening *foo.docx* in Microsoft Word…"), spawns `open -a "Microsoft Word" <path>` via `child_process.spawn`, then `panel.dispose()` after 600 ms.

## Files

`extensions/maut-open-external/package.json` — three `customEditors` blocks:
- `maut.openInWord` — `*.docx, *.doc, *.odt, *.rtf`
- `maut.openInExcel` — `*.xlsx, *.xls, *.ods`
- `maut.openInPowerPoint` — `*.pptx, *.ppt, *.odp, *.key`

`extensions/maut-open-external/src/extension.ts` — `class HandoffEditorProvider` constructor takes the app name; same class used for all three.

## Gotcha

The provider is `CustomReadonlyEditorProvider` (no edit support) — VS Code's contract for it is the simplest. We never actually edit the file from Maut; the user edits inside the native app and macOS file-watch reflects it back.
