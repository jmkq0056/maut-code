# 02 · Color Palette

## Current Maut Dark (v1.0.0)

Flat **grey-red** `#2a181c` background — not pitch black, has a clear red undertone. `#c62a47` red accent, `#f0f0f8` text, `#a8a8bb` muted, `#6868a0` subtle.

Adjacent shades:
- `#3a2026` — one step lighter (borders, separators, tab activeBackground, button.secondary, list.activeSelectionBackground)
- `#1f1216` — one step darker (input.background, menu.background, dropdown.background, list.hoverBackground)

No gradients anywhere. Single flat solid colors.

## Maut Light

Sister palette — `#fafaf5` bg, `#1a1a2e` fg, same `#c62a47` accent. Sister-step shades use warm cream tones (`#f0eee8` instead of `#1f1216`, etc.).

## How both ship

The dark palette is shipped as a `configurationDefaults` block on the built-in `configuration-editing` extension's `package.json` — that extension is always loaded, so the defaults apply at workbench init.

The light palette + the `⇧⌘L` toggle live in `extensions/maut-themes/src/extension.ts`. The toggle:
1. Reads `workbench.colorTheme` from user settings.
2. Flips to `Default Light Modern` ↔ `Default Dark Modern` (VS Code stock bases for syntax colors).
3. Writes the matching DARK or LIGHT object to `workbench.colorCustomizations` in **global** user settings via `vscode.ConfigurationTarget.Global`.

## Why not real themes

A real `contributes.themes` entry would give us syntax (token) colors too. Two reasons we skipped:
1. Writing two full `tokenColors[]` arrays is hundreds of lines of JSON per theme.
2. The stock Default Dark/Light Modern token colors are already fine; we only wanted to re-skin workbench chrome.

The toggle pairs a real stock theme (for tokens) with our color customizations (for chrome). Hybrid approach.

## Menu/quickpick visibility fix

A separate change bumped these to full opacity so hovered menu items show as a solid red bar with white text:

```json
"menu.selectionBackground": "#c62a47",
"menu.selectionForeground": "#ffffff",
"menubar.selectionBackground": "#c62a47",
"quickInputList.focusBackground": "#c62a47"
```

## Branding source

The reaper-logo SVG was the design driver — it uses `#0c0c14` (old navy, now archived), `#c62a47` (red), `#1a1a2e` (hood grey), `#8888a0` (scythe). Source at `~/Downloads/maut-v6.0/icon.svg`. The icon file is committed at `resources/darwin/code.icns` (built from the SVG via `rsvg-convert` + `iconutil`) and `docs/icon.svg` (used by the landing page).
