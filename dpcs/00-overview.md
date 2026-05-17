# 00 · Overview

## What this fork is

**Maut code** = VS Code (`microsoft/vscode` at the time of fork: branch `main`, around insider 1.121.x) + a personal Claude-Code-CLI-aware layer on top, all branded "Maut" with a reaper-skull logo.

## Repo layout (Maut additions only)

```
maut-code/
├── CONTINUATION.md                  ← start here
├── dpcs/                            ← these docs
├── product.json                     ← name/icon/bundleId edits (search for "Maut")
├── package.json                     ← "name": "maut-code-dev"
├── resources/darwin/code.icns       ← reaper icon (generated from ~/Downloads/maut-v6.0/icon.svg)
├── resources/linux/code.png         ← reaper PNG
├── extensions/
│   ├── maut-activity/               ← Claude action feed + undo/redo
│   ├── maut-claude-images/          ← [Image #N] hover + image cache integration
│   ├── maut-cli-add/                ← right-click → add as @-mention
│   ├── maut-diff-gate/              ← stub (kept for future use)
│   ├── maut-file-tools/             ← PDF picker, file→TXT/JSON, DOCX/PPTX→PDF
│   ├── maut-focus/                  ← Maut Mode zen
│   ├── maut-git-commit/             ← status bar commit + push
│   ├── maut-open-external/          ← Firefox/Word/Excel/PowerPoint/.sh/.tex
│   ├── tomoki1207-pdf/              ← bundled community PDF viewer
│   ├── vscode-icons-mac/            ← bundled community icon theme
│   ├── configuration-editing/       ← UPSTREAM ext we modified to ship configurationDefaults
│   ├── copilot/                     ← UPSTREAM, package.json renamed to .disabled
│   └── mermaid-chat-features/       ← UPSTREAM, package.json renamed to .disabled
├── src/vs/workbench/contrib/
│   ├── mautcode/browser/            ← workbench-level Maut contributions (CSS, file-explorer inline button, terminal-appearance command)
│   └── terminal/browser/terminalInstance.ts  ← patched for drag-as-@-mention
├── src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts  ← patched for markdown hover (image preview)
├── build/lib/copilot.ts             ← patched: gracefully skip when copilot is disabled
├── build/lib/extensions.ts          ← patched: skip copilot stream if no package.json
├── build/gulpfile.extensions.ts     ← lists Maut extensions for compile
├── build/npm/dirs.ts                ← lists Maut extensions for npm install
└── .github/workflows/maut-release.yml  ← CI release pipeline
```

## Current public state

- Repo: <https://github.com/jmkq0056/maut-code>
- Branch: `main` (orphan branch — upstream microsoft/vscode history was dropped during the publish step due to LFS objects)
- Tag/release: `v0.1.0` with `Maut-code-arm64.dmg` (358 MB, ad-hoc signed)

## Build dependencies

- macOS for the local build (Apple Silicon)
- Node 22.22.1 via nvm
- git-lfs (brew install)
- LibreOffice **or** Microsoft Word/PowerPoint for the DOCX/PPTX → PDF converter (runtime, not build)

## Common tasks

| Goal | Command |
|---|---|
| Iterate fast | `npm run compile` → `pkill -9 -f "Maut code"` → relaunch from `.build/electron/Maut\ code.app/Contents/MacOS/Maut\ code` |
| Ship a release build | `npm run gulp vscode-darwin-arm64` then DMG + sign |
| Test an extension change | `npm run compile` then relaunch; extensions are loaded from `.app/Contents/Resources/app/extensions/` after a full rebuild, or from `extensions/<name>/out/` in dev mode |
| Find Maut-specific code | `grep -rn "Maut\|maut\\." extensions/maut-* src/vs/workbench/contrib/mautcode` |
