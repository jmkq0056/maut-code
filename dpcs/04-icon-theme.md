# 04 · Icon Theme (vscode-icons-mac)

## What ships

Bundled the community port **`eddieposey.vscode-icons-mac`** v7.25.3 from Open VSX as a built-in extension. Set as the default icon theme.

## Files added

`extensions/vscode-icons-mac/` (unpacked from the `.vsix` — contains `package.json`, `icons/`, `images/`, `out/`, `LICENSE.txt`, etc.).

## How it became default

`extensions/configuration-editing/package.json` — `configurationDefaults`:

```json
"workbench.iconTheme": "vscode-icons-mac"
```

The theme ID `vscode-icons-mac` is from the extension's `contributes.iconThemes[0].id`.

## How to redo from scratch

```bash
curl -sL -o /tmp/icons.vsix \
  'https://open-vsx.org/api/eddieposey/vscode-icons-mac/7.25.3/file/eddieposey.vscode-icons-mac-7.25.3.vsix'
mkdir -p /tmp/icons-unpack && cd /tmp/icons-unpack
unzip -q /tmp/icons.vsix
cp -R extension /Users/jmkq/Developer/maut-code/extensions/vscode-icons-mac
```

Repeat for newer versions on update. No build hook auto-pulls newer versions — they're frozen at the time of bundling.

## Bonus also bundled

`tomoki1207.pdf` v1.2.2 (the popular VS Code PDF viewer) lives in `extensions/tomoki1207-pdf/`, fetched the same way from Open VSX. See `dpcs/13-maut-file-tools.md` for why we ship it.
