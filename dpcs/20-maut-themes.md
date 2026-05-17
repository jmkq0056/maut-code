# 20 · maut-themes (Light / Dark toggle)

## What it does

One keystroke (**`⇧⌘L`**) — or the color-mode icon in the editor title bar — flips between **Maut Dark** and **Maut Light** color palettes.

## How

Realistic scope: not full token-color themes (that's hundreds of lines of JSON per theme). Instead the extension command writes two things to the **user's `settings.json`**:

1. `workbench.colorTheme` ← `Default Dark Modern` or `Default Light Modern` (VS Code's stock base for syntax)
2. `workbench.colorCustomizations` ← the Maut DARK or LIGHT palette (50+ entries each)

Both palettes share the Maut red accent (`#c62a47`). Dark uses `#0c0c14` bg + `#f0f0f8` fg; light uses `#fafaf5` bg + `#1a1a2e` fg.

## Files

```
extensions/maut-themes/
├── package.json   ← command + keybinding + editor/title contribution
├── tsconfig.json
└── src/extension.ts   ← DARK / LIGHT palette objects + toggleTheme()
```

## Limitations

- Token colors (the actual code-syntax highlighting) come from the VS Code stock themes, not Maut. The Maut palette only re-skins workbench chrome (panels, tabs, status bar, terminal, etc.).
- The toggle writes to **global** user settings. If you have workspace-level overrides, those still win.
- Because the colors live in `workbench.colorCustomizations` (which has higher precedence than themes), the colors persist even when you switch to a non-Maut theme through the standard theme picker. Run the toggle (or clear `workbench.colorCustomizations` manually) to remove.

## Future work if you want real themes

Write two files like `themes/maut-dark-color-theme.json` and `themes/maut-light-color-theme.json` with `tokenColors[]`, contribute them via `package.json`'s `contributes.themes`, then `workbench.colorTheme: "Maut Dark"` would carry syntax colors too. Couple hours of work.
