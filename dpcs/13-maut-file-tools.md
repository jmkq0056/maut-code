# 13 · maut-file-tools

## What it does

Five right-click actions that produce a temp file and `@-mention` it in the Maut CLI. None of these writes anywhere inside the user's workspace.

| Right-click on | Action | Pipeline |
|---|---|---|
| `.pdf` | **Add Selected Pages to Maut CLI** | webview thumbnail picker → `pdf-lib` page extraction → `~/.maut-tmp/.../<base>--pages-N-N-N.pdf` |
| `.docx`/`.doc` | **Add to Maut CLI as TXT** | `mammoth.extractRawText` |
| `.xlsx`/`.xls` | **Add to Maut CLI as TXT** | `xlsx.sheet_to_csv` (tab-separated, one section per sheet) |
| `.xlsx`/`.xls` | **Add to Maut CLI as JSON** | `xlsx.sheet_to_json` (per-sheet) |
| `.csv`/`.tsv` | **Add to Maut CLI as TXT/JSON** | direct or trivial parse |
| `.pdf` | **Add to Maut CLI as TXT** | `pdfjs-dist` text-layer extraction |
| `.html`/`.htm` | **Add to Maut CLI as TXT** | regex strip-tags |
| `.docx`/`.doc` | **Convert DOCX → PDF and add** | LibreOffice headless **or** Microsoft Word via AppleScript |
| `.pptx`/`.ppt` | **Convert PPTX → PDF and add** | LibreOffice headless **or** Microsoft PowerPoint via AppleScript |

## Temp store

`extensions/maut-file-tools/src/tempStore.ts` — every output goes into `~/.maut-tmp/<8-digit-timestamp-prefix>/`. The filename embeds the source's parent folder + base name so a user reading the path knows what it is:

```
~/.maut-tmp/1758716/UNI__report.pdf
~/.maut-tmp/1758716/UNI__report--pages-3-5-8.pdf
~/.maut-tmp/1758716/UNI__roster.txt
```

The 8-digit prefix is `String(Date.now()).slice(0, -3)` — coarse enough to share within a session but unique enough across reboots.

## PDF page picker

Webview opens in the active editor column. Renders all pages via `pdfjs-dist` (loaded from `cdn.jsdelivr.net` because bundling the pdfjs worker is annoying). Each page is a 40%-scaled canvas thumbnail. Click toggles selection (red border). Buttons: All / None / Add N pages.

On submit, `pdf-lib` does the actual extraction — pure JS, fast, no shell-outs.

## DOCX / PPTX → PDF fallback chain

1. **LibreOffice** if installed at `/Applications/LibreOffice.app/Contents/MacOS/soffice` or via brew. Headless, fastest, no AppleScript permission prompt.
2. **Microsoft Word** for `.docx`/`.doc` via AppleScript:
   ```applescript
   tell application "Microsoft Word"
     set theDoc to open file name (POSIX file <src> as string)
     save as theDoc file name (POSIX file <out> as string) file format format PDF
     close theDoc saving no
   end tell
   ```
3. **Microsoft PowerPoint** for `.pptx`/`.ppt` via AppleScript (similar shape with `save thePres ... as save as PDF`).
4. Otherwise: clear error message.

On first AppleScript run, macOS prompts for automation permission. Grant once.

## Files

```
extensions/maut-file-tools/
├── package.json
├── tsconfig.json
└── src/
    ├── extension.ts        ← command registrations + dispatch
    ├── converters.ts       ← docx/xlsx/csv/pdf/html → txt/json + office→pdf
    ├── pdfPagePicker.ts    ← webview + page extraction
    ├── cliBridge.ts        ← findMautTerminal + appendToMautCli
    └── tempStore.ts        ← getTempRoot, buildOutName, sanitize
```

## Bundle size

`pdfjs-dist` is loaded at runtime from a CDN inside the webview (so the .app doesn't bundle it). `pdf-lib`, `mammoth`, `xlsx` are full `node_modules` deps — adds ~5 MB to the installed extension. Acceptable.

## Why right-click only

Auto-conversion would be presumptuous (user might just want to view the file). Explicit right-click → menu item is the pattern. PDF picker is the only one with its own UI because page selection is fundamentally interactive.
