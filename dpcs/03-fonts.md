# 03 · Fonts

## What ships

- **JetBrains Mono** as the editor and terminal font, with sensible fallbacks for users who don't have it installed.
- Ligatures **on**, weight 400, size 13, line-height 1.5 (editor) / 1.1 (terminal).
- Hover delay dropped from VS Code's default 700 ms to **80 ms** — snappier tooltips.

## Files touched

`extensions/configuration-editing/package.json` — `contributes.configurationDefaults`:

```json
"editor.fontFamily": "'JetBrains Mono', 'JetBrainsMono Nerd Font', 'Fira Code', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
"editor.fontLigatures": true,
"editor.fontWeight": "400",
"editor.fontSize": 13,
"editor.lineHeight": 1.5,
"terminal.integrated.fontFamily": "'JetBrains Mono', …same chain…",
"terminal.integrated.fontSize": 13,
"terminal.integrated.lineHeight": 1.1,
"terminal.integrated.fontWeight": "400",
"workbench.hover.delay": 80,
"editor.hover.delay": 80,
"editor.hover.sticky": true
```

## Install of the font itself

JetBrains Mono is **not** bundled in the .app. The fork relies on the user having the OS font installed.

Install once:
```bash
brew install --cask font-jetbrains-mono
```

If absent, the fallback chain ships SF Mono / Menlo / Monaco which look acceptable. Bundling a font into VS Code itself is non-trivial (requires webview / CSS plumbing and a `Resources/app/out/vs/workbench/contrib/.../media/<font>.woff2` shipment + a `@font-face` rule); not worth the bundle-size cost.

## Gotcha

`editor.fontWeight: "400"` is a string in VS Code's schema (not a number). Same for `terminal.integrated.fontWeight`.
