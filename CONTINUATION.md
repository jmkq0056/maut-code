# Maut code — Continuation Prompt

You are continuing work on **Maut code**, a personal fork of Microsoft VS Code by **jmkq0056** built to be Claude-Code-CLI-aware. The fork lives at:

- Local: `/Users/jmkq/Developer/maut-code/`
- Public: <https://github.com/jmkq0056/maut-code>
- Release: <https://github.com/jmkq0056/maut-code/releases/tag/v0.1.0>
- Built `.app`: `/Applications/Maut code.app` (ad-hoc signed)
- Production build output: `/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app`

## Build / launch quick reference

```bash
export PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH

# Dev compile (~1 min, fastest iteration for code-only changes)
cd /Users/jmkq/Developer/maut-code && npm run compile

# Build production .app (~50 s once compile is warm)
cd /Users/jmkq/Developer/maut-code && npm run gulp vscode-darwin-arm64

# Install + relaunch
pkill -9 -f "Maut code"; sleep 2
rm -rf "/Applications/Maut code.app"
cp -R "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app" /Applications/
codesign --force --deep --sign - "/Applications/Maut code.app"
xattr -dr com.apple.quarantine "/Applications/Maut code.app"
open "/Applications/Maut code.app"
```

Node version is pinned to 22.22.1 (`.nvmrc`). Use nvm. Don't use system Node 20.

## What this fork is

Maut code is **VS Code rebranded + bundled with 9 Maut extensions + 2 popular community extensions + a handful of workbench-source patches**, focused on making the Claude Code CLI (`clsp` = `claude --dangerously-skip-permissions`) a first-class part of the IDE without rewriting the chat layer.

## Directory of features

Read these in order to understand the fork chronologically. Each `.md` in `dpcs/` is short and tells you: what it does, where the code lives, how it works, known limits.

| # | File | Title |
|---|---|---|
| 00 | `dpcs/00-overview.md` | Top-level summary, repo state, current TODO |
| 01 | `dpcs/01-rebrand.md` | Name / bundle ID / dock icon / Mac app metadata |
| 02 | `dpcs/02-color-palette.md` | Maut dark + red palette via configurationDefaults |
| 03 | `dpcs/03-fonts.md` | JetBrains Mono everywhere, ligatures, hover delay |
| 04 | `dpcs/04-icon-theme.md` | Bundled `eddieposey.vscode-icons-mac`, set as default |
| 05 | `dpcs/05-copilot-strip.md` | How Copilot/chat are disabled without breaking deps |
| 06 | `dpcs/06-maut-claude-images.md` | `[Image #N]` terminal hover preview + click-to-open |
| 07 | `dpcs/07-terminal-drag.md` | Drag file or selection → `@path` / `@path:line` (workbench patch) |
| 08 | `dpcs/08-maut-cli-add.md` | Right-click + inline-`@` icon → add to Maut CLI |
| 09 | `dpcs/09-maut-focus.md` | Maut Mode (zen for file or terminal) |
| 10 | `dpcs/10-maut-git-commit.md` | Status-bar one-click commit+push |
| 11 | `dpcs/11-maut-open-external.md` | Right-click → Firefox/Word/Excel/PowerPoint; `.sh` run; `.tex` compile |
| 12 | `dpcs/12-maut-activity.md` | Claude session action feed with diff + undo + redo |
| 13 | `dpcs/13-maut-file-tools.md` | PDF page picker, file→TXT/JSON, DOCX/PPTX→PDF |
| 14 | `dpcs/14-terminal-naming.md` | `N -- MAUT` auto-rename + unique icon+color pool |
| 15 | `dpcs/15-workbench-patches.md` | Inline `@` button in explorer, hover-image markdown, OSC title template |
| 16 | `dpcs/16-release-pipeline.md` | GH Actions for Mac + Windows builds, DMG signing, current limitations |
| 17 | `dpcs/17-pdf-page-range.md` | Typed range input in the PDF page picker |
| 18 | `dpcs/18-maut-server-launcher.md` | Right-click folder → Start Server (Node/Python/Rust/etc.) |
| 19 | `dpcs/19-maut-markdown-preview.md` | `.md` opens rendered by default, `⇧⌘V` toggles to source |
| 20 | `dpcs/20-maut-themes.md` | Maut Light + Dark palettes with `⇧⌘L` toggle |

## Tone and method

- **Be honest about cost/benefit.** When the user asks for something that doesn't actually need a fork (most things are settings or one-extension territory), say so. Don't over-engineer.
- **Don't repeat past mistakes.** Inline image rendering in the terminal was tried twice and reverted because xterm's image protocol conflicts with Claude Code's TUI redraws. Do not retry without a substantially different approach.
- **Prefer extension API over workbench patches.** Patches only when API genuinely doesn't expose what's needed (so far: drag handlers, file explorer inline button, terminal hover markdown, terminal appearance setter — see `dpcs/15-workbench-patches.md`).
- **All built-in Maut extensions live in `extensions/maut-*` and are listed in both `build/npm/dirs.ts` and `build/gulpfile.extensions.ts`.** Adding a new one means touching both lists + writing `package.json` + `tsconfig.json` + `src/extension.ts` + running `npm install` inside the extension dir.
- **Sandbox safety:** the production `.app` renderer is sandboxed; you cannot `import 'fs'` from a workbench-level browser file consumed by terminal/editor renderers. Use `IFileService` (workbench) or stick to extensions (extension-host has Node).

## Open items / known limitations

- Windows installer is **not** built locally — relies on the GH Actions workflow in `.github/workflows/maut-release.yml`. The workflow may need credential / runner adjustments on first real run.
- Mac DMG ships ad-hoc signed; **not notarized**. On first download macOS will still scare-warn the user. To fix permanently: paid Apple Developer ID + notarization in the workflow.
- `terminal.integrated.tabs.title: "${sequence}${separator}${process}"` is set in `configurationDefaults` but VS Code's terminal title rendering may still prefer process name for shells that don't emit OSC titles. The actual rename happens via `workbench.action.terminal.renameWithArg`.
- LFS objects from upstream Microsoft VS Code's `extensions/copilot/test/` were **stripped** during the orphan-branch publish step. Reproducing the test fixtures is not in scope.

## How to start a fresh session

If you (a future Claude) are opening this codebase cold:

1. Read this file first.
2. Skim `dpcs/00-overview.md`.
3. Then jump to whichever feature file matches what the user is asking about.
4. Run `git log --oneline -20` to see recent work that may not yet be documented.
5. The only authoritative source of truth is the code itself and `git log`. These docs decay; trust the source.

— Last updated: 2026-05-15
