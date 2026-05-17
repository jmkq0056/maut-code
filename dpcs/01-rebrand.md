# 01 · Rebrand

## What changed

- App name: **Maut code** (menus, dock, About panel)
- Bundle identifier: `ai.maut.code`
- URL scheme: `maut-code://`
- Application name (CLI): `maut-code` (so `EDITOR=maut-code --wait` works from Maut terminals)
- Linux icon name: `maut-code`
- Win32 dir / reg key / mutex / app user-model id: all reworked to Maut

## Files touched

| File | What |
|---|---|
| `product.json` | `nameShort`, `nameLong`, `applicationName`, `dataFolderName`, `darwinBundleIdentifier`, `urlProtocol`, win32 keys |
| `package.json` | `"name": "maut-code-dev"` |
| `resources/darwin/code.icns` | Reaper icon converted from `~/Downloads/maut-v6.0/icon.svg` via rsvg-convert → iconset → iconutil |
| `resources/linux/code.png` | 512-px PNG of the same reaper icon |

## How the icon was generated

```bash
mkdir -p /tmp/maut-iconset/maut.iconset
for sz in 16 32 64 128 256 512 1024; do
  rsvg-convert -w $sz -h $sz ~/Downloads/maut-v6.0/icon.svg \
    -o /tmp/maut-iconset/maut.iconset/icon_${sz}x${sz}.png
done
# also dupe to @2x variants as iconutil expects:
# icon_16x16@2x.png, icon_32x32@2x.png, icon_128x128@2x.png,
# icon_256x256@2x.png, icon_512x512@2x.png
iconutil -c icns /tmp/maut-iconset/maut.iconset -o /tmp/maut-iconset/maut.icns
cp /tmp/maut-iconset/maut.icns resources/darwin/code.icns
cp /tmp/maut-iconset/maut.iconset/icon_512x512.png resources/linux/code.png
```

## Gotchas

- VS Code's build always reads `code.icns` from `resources/darwin/`. You can't rename the file. Just overwrite.
- The dock icon was wrong in the first build because we forgot to ad-hoc-sign the app, which caused the cached icon to flicker. `codesign --force --deep --sign - "<app>"` plus `xattr -dr com.apple.quarantine` fixes both icon caching and "cannot be opened" errors.
- Onboarding requires `defaultChatAgent` to be set in `product.json` (it's referenced unconditionally by `welcomeOnboarding/browser/onboardingVariationA.ts`). Don't delete that key or the workbench crashes to a blank window. Keep the full Copilot block — Copilot doesn't load because its extension is disabled.
