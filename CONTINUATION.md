# Maut code — Continuation Prompt

You are continuing work on **Maut code**, a personal fork of Microsoft VS Code by **jmkq0056** built to be Claude-Code-CLI-aware. **Current shipped version: v1.0.0.**

- Local working tree: `/Users/jmkq/Developer/maut-code/`
- Public repo: <https://github.com/jmkq0056/maut-code>
- Landing page (GH Pages): <https://jmkq0056.github.io/maut-code/>
- Releases: <https://github.com/jmkq0056/maut-code/releases>
- Latest release: <https://github.com/jmkq0056/maut-code/releases/tag/v1.0.0>
- Installed `.app`: `/Applications/Maut code.app` (ad-hoc signed, dequarantined)
- Production build output: `/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app`

## Build / launch quick reference

```bash
export PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH

# Dev compile (~1 min, fastest iteration for code-only changes)
cd /Users/jmkq/Developer/maut-code && npm run compile

# Production .app build (~50 s once compile is warm)
cd /Users/jmkq/Developer/maut-code && npm run gulp vscode-darwin-arm64

# Install + relaunch (full cycle)
pkill -9 -f "Maut code"; sleep 2
rm -rf "/Applications/Maut code.app"
cp -R "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app" /Applications/
codesign --force --deep --sign - "/Applications/Maut code.app"
xattr -dr com.apple.quarantine "/Applications/Maut code.app"
open "/Applications/Maut code.app"

# DMG-wrap + release
rm -f /tmp/Maut-code-arm64.dmg
hdiutil create -volname "Maut code" \
  -srcfolder "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app" \
  -ov -format UDZO /tmp/Maut-code-arm64.dmg
gh release create vX.Y.Z /tmp/Maut-code-arm64.dmg \
  --repo jmkq0056/maut-code --title "Maut code X.Y.Z" --notes "…"
```

Node version is pinned to **22.22.1** (`.nvmrc`). Use nvm. Don't use system Node 20.

## What this fork is

Maut code = **VS Code rebranded + 11 bundled Maut extensions + 2 community extensions + workbench-level patches**, focused on making the Claude Code CLI a first-class IDE citizen without rewriting the chat UI.

Branded around a reaper skull/scythe logo (Danish: "manden med leen" — the man with the scythe). Maut Dark palette is flat grey-red `#2a181c` with `#c62a47` accent. JetBrains Mono fonts. macOS-style file icons (`vscode-icons-mac`).

## Directory of features — read these in order

| # | File | Title |
|---|---|---|
| 00 | `dpcs/00-overview.md` | Top-level summary + repo state |
| 01 | `dpcs/01-rebrand.md` | Name / bundle ID / dock icon |
| 02 | `dpcs/02-color-palette.md` | Maut Dark grey-red palette + ⇧⌘L Light variant |
| 03 | `dpcs/03-fonts.md` | JetBrains Mono, hover delay, line-height |
| 04 | `dpcs/04-icon-theme.md` | Bundled vscode-icons-mac |
| 05 | `dpcs/05-copilot-strip.md` | How Copilot/chat are disabled without breaking deps |
| 06 | `dpcs/06-maut-claude-images.md` | `[Image #N]` hover preview + cmd-click |
| 07 | `dpcs/07-terminal-drag.md` | Drag file/selection → `@path` |
| 08 | `dpcs/08-maut-cli-add.md` | Right-click + inline `@` icon |
| 09 | `dpcs/09-maut-focus.md` | Maut Mode (zen) |
| 10 | `dpcs/10-maut-git-commit.md` | Status-bar commit + push |
| 11 | `dpcs/11-maut-open-external.md` | Firefox / Word / .sh / .tex |
| 12 | `dpcs/12-maut-activity.md` | Claude action feed + undo/redo |
| 13 | `dpcs/13-maut-file-tools.md` | PDF picker, → TXT / JSON / PDF |
| 14 | `dpcs/14-terminal-naming.md` | (older overview — see also 24) |
| 15 | `dpcs/15-workbench-patches.md` | Index of every src/ patch |
| 16 | `dpcs/16-release-pipeline.md` | GH Actions for Mac/Windows |
| 17 | `dpcs/17-pdf-page-range.md` | Typed range input in PDF picker |
| 18 | `dpcs/18-maut-server-launcher.md` | Right-click → Start Server |
| 19 | `dpcs/19-maut-markdown-preview.md` | Custom HTML render with TOC |
| 20 | `dpcs/20-maut-themes.md` | ⇧⌘L Light/Dark toggle |
| **21** | `dpcs/21-office-auto-handoff.md` | Click `.docx/.xlsx/.pptx` → native app |
| **22** | `dpcs/22-type-anywhere-trigger.md` | Type `maut` anywhere → spawn |
| **23** | `dpcs/23-spawn-button-and-autolaunch.md` | Reaper button + auto-launch on open |
| **24** | `dpcs/24-terminal-numbering-state.md` | Smallest-unused numbering + CLOSED |
| **25** | `dpcs/25-auto-resume.md` | `--continue` flag for last session |
| **26** | `dpcs/26-drag-drop-focus-fix.md` | Drag works in editor-area terminal |
| **27** | `dpcs/27-triple-click-reveal.md` | Triple-click → reveal in Finder |
| **28** | `dpcs/28-landing-page-and-distribution.md` | GH Pages + release flow |
| **29** | `dpcs/29-claude-command-portability.md` | Full claude cmd instead of `clsp` alias |

Bold = added since v0.1.0.

## Tone and method (read before doing anything)

- **Be honest about cost/benefit.** When the user asks for something that doesn't actually need a fork (most things are settings or one-extension territory), say so. Don't over-engineer.
- **Don't repeat past mistakes.** **Inline image rendering in the terminal** was tried twice and reverted because xterm's image protocol conflicts with Claude Code's TUI redraws. **Do not retry without a substantially different approach.**
- **Prefer extension API over workbench patches.** Patches only when the API genuinely doesn't expose what's needed.
- **Hard requirement: stay portable.** Don't hard-code shell aliases (e.g., `clsp`). Use the full `claude --dangerously-skip-permissions` so the DMG works on a fresh Mac without any zshrc tweaks. See `dpcs/29-claude-command-portability.md`.
- **All Maut extensions live in `extensions/maut-*` and are listed in both `build/npm/dirs.ts` and `build/gulpfile.extensions.ts`.** Adding a new one means touching both lists + writing `package.json` + `tsconfig.json` + `src/extension.ts` + running `npm install` inside the extension dir.
- **Sandbox safety:** the production `.app` renderer is sandboxed; you cannot `import 'fs'` from a workbench-level browser file consumed by terminal/editor renderers. Use `IFileService` (workbench-level) or stick to extensions (extension-host has Node).

## Current list of bundled extensions

```
extensions/
├── maut-activity/             ← Claude action feed + per-file undo/redo
├── maut-claude-images/        ← terminal pool, naming, hover-preview, auto-launch, switcher
├── maut-cli-add/              ← right-click + inline @ icon → add to Maut CLI
├── maut-diff-gate/            ← stub (unused, retained)
├── maut-file-tools/           ← PDF picker, file → TXT / JSON / PDF
├── maut-focus/                ← ⌘K ⌘M Maut Mode
├── maut-git-commit/           ← status-bar commit + push
├── maut-markdown-preview/     ← custom HTML render with TOC
├── maut-open-external/        ← Firefox / Office handoff / .sh / .tex
├── maut-server-launcher/      ← right-click → Start Server
├── maut-themes/               ← ⇧⌘L palette toggle
├── tomoki1207-pdf/            ← bundled PDF viewer (community)
└── vscode-icons-mac/          ← bundled icon theme (community)
```

## Current list of workbench patches (under src/)

All under `src/vs/workbench/contrib/mautcode/browser/`:

- `mautcode.contribution.ts` — entry; imports the rest + hides aux bar at startup
- `media/mautcode.css` — styles for the inline `@` button
- `mautExplorerInlineAdd.ts` — inline `@` button on each explorer row
- `mautTerminalAppearance.ts` — `maut.terminal.setAppearance` command for programmatic icon/color
- `mautTypeTrigger.ts` — global `maut` keystroke trigger
- `mautTripleClickReveal.ts` — triple-click reveal in Finder

Plus three targeted edits in upstream files:
- `src/vs/workbench/contrib/terminal/browser/terminalInstance.ts` — drag-as-`@-mention`, `onDropText` event, drag-drop fix in focus mode
- `src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts` — markdown hover support for `mautImg:` prefix
- `build/lib/copilot.ts` and `build/lib/extensions.ts` — gracefully skip Copilot when its `package.json` is renamed to `.disabled`

## Open items / known limitations

- **Notarization**: the .app is **ad-hoc signed**, not notarized. First-time download on macOS triggers "cannot be verified" — user has to right-click → Open once. To fix, need a paid Apple Developer ID + `xcrun notarytool` step in the workflow.
- **Windows installer reliability**: the GH Actions workflow includes a `windows-x64` job that builds a zip. Has not been thoroughly tested across versions; may need credential or runner tweaks if it starts failing.
- **Markdown preview CSP**: `highlight.js` is loaded from `cdn.jsdelivr.net` — requires internet on first preview open. Could be bundled to remove the dependency.
- **Type-anywhere `maut` trigger**: false-positive if the user legitimately types a word ending in `maut` (e.g. "automaut"). Acceptable for personal use.
- **Drag-drop fix is global**: `terminalInstance.ts.onDrop` now calls `stopImmediatePropagation` for **all** terminal drops, not just Maut. Currently no observed downside but worth knowing if drop behavior on other terminals seems different.

## How to start a fresh session

If you (a future Claude or anyone else) are opening this codebase cold:

1. Read this file.
2. Skim `dpcs/00-overview.md`.
3. Jump to the dpcs entry matching what the user is asking about.
4. Run `git log --oneline -30` to see recent work that may post-date these docs.
5. The only authoritative source of truth is the **code itself + git log**. These docs decay; trust the source when in doubt.

## Versioning history

- **v0.1.0** (initial public release) — branding, palette, copilot strip, maut-claude-images, terminal `@-mention`, activity feed, focus mode, git commit, open-external, file tools, themes, server launcher, markdown preview.
- **v0.2.0** — server launcher, markdown preview-by-default, light/dark toggle, PDF range input, terminal CLOSED state.
- **v0.3.0** — custom markdown previewer (TOC + highlight.js), type-anywhere `maut` trigger, reaper spawn button, smart auto-launch on app open, smallest-unused numbering.
- **v1.0.0** (current) — office-file auto-handoff, full `claude --dangerously-skip-permissions` command (no zsh alias dependency), drag-drop fix in focus mode, triple-click reveal in Finder, landing page on GH Pages, new grey-red Maut Dark palette `#2a181c`.

— Last updated: 2026-05-18
