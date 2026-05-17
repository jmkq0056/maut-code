# 02 · Color Palette

## Design language

Dark **#0c0c14** background, **#c62a47** red accent, **#1a1a2e** secondary, **#101020** input bg, **#f0f0f8** foreground, **#6868a0** muted, **#a8a8bb** subtle. Lifted from the reaper logo source at `~/Downloads/maut-v6.0/`.

## How it ships

Not a real theme. Just a fat `workbench.colorCustomizations` block shipped as a `configurationDefaults` contribution from the (otherwise upstream) `extensions/configuration-editing/package.json`.

### Why `configuration-editing` and not a new extension

`configurationDefaults` only takes effect when the extension is **always loaded** — which the built-in `configuration-editing` is. A new extension would need an activation event, and defaults set during activation arrive too late for some workbench colors (they snap during workbench init).

## Files touched

`extensions/configuration-editing/package.json` — `contributes.configurationDefaults` covers:

- All workbench surfaces: titleBar, activityBar, sideBar, statusBar, panel, tabs
- Editor: bg, selection, gutter, cursor, bracket matching, line numbers
- Terminal: bg, ansi colors (red mapped to Maut red)
- Lists, menus, quick-pick, buttons, badges, scrollbars, breadcrumbs
- `workbench.colorTheme`: `"Default Dark Modern"` (base)

## Menu fix

A separate config tweak (commit history will show it) bumped these to full opacity so the hover highlight is visible against dark menus:

```json
"menu.selectionBackground": "#c62a47",
"menu.selectionForeground": "#ffffff",
"menubar.selectionBackground": "#c62a47",
"quickInputList.focusBackground": "#c62a47"
```

## Gotcha

`configurationDefaults` does not register as a real theme. The user can override every value in their personal `settings.json`. To turn Maut palette off entirely, delete `workbench.colorCustomizations` in their settings.
