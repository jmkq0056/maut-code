# 28 · Landing Page + Distribution

## Landing page

Lives at `docs/index.html` and `docs/icon.svg`. Served by GitHub Pages from the `main` branch's `/docs` directory.

**Live**: <https://jmkq0056.github.io/maut-code/>

Single page, no build step, no JS framework. Vanilla HTML + CSS + tiny inline JS that:
1. Fades sections in on scroll via `IntersectionObserver`.
2. Fetches `GET /repos/jmkq0056/maut-code/releases/latest` from the GitHub API at load and rewrites the three download-button URLs to the latest release assets (`Maut-code-arm64.dmg`, `Maut-code-x64.dmg`, `Maut-code-win-x64.zip`).

Palette matches `dpcs/02-color-palette.md` — flat grey-red `#2a181c`, red accent `#c62a47`, JetBrains Mono for code, `Inter` / system sans for prose.

## Enabling GH Pages

Done once via:

```bash
echo '{"source":{"branch":"main","path":"/docs"}}' \
  | gh api -X POST /repos/jmkq0056/maut-code/pages --input -
```

(Idempotent — returns 409 if Pages is already enabled, in which case use `gh api -X PUT` with the same body to change the source path.)

## Releases & tagging

Public releases live at <https://github.com/jmkq0056/maut-code/releases>.

The `.github/workflows/maut-release.yml` workflow triggers on `tags: ['v*']` and builds:
- `mac-arm64` (macOS 14 runner) → `Maut-code-arm64.dmg`
- `mac-x64` (macOS 13 runner) → `Maut-code-x64.dmg`
- `windows-x64` (windows-latest) → `Maut-code-win-x64.zip`

Each job runs `npm install` + `npm run gulp vscode-<platform>-<arch>` and uploads the artifact via `softprops/action-gh-release@v2` (appends to the release matching the tag).

## Manual release flow (when iterating locally)

```bash
# build .app locally (ARM64 only on dev mac)
npm run gulp vscode-darwin-arm64

# ad-hoc sign + DMG-wrap
codesign --force --deep --sign - "../VSCode-darwin-arm64/Maut code.app"
hdiutil create -volname "Maut code" \
  -srcfolder "../VSCode-darwin-arm64/Maut code.app" \
  -ov -format UDZO /tmp/Maut-code-arm64.dmg

# delete old release+tag (if redoing the same version)
gh release delete vX.Y.Z --repo jmkq0056/maut-code --yes
git push --delete maut vX.Y.Z
git tag -d vX.Y.Z

# re-tag + push + release
git tag vX.Y.Z
git push maut vX.Y.Z
gh release create vX.Y.Z /tmp/Maut-code-arm64.dmg \
  --repo jmkq0056/maut-code --title "Maut code X.Y.Z" --notes "..."
```

The Pages site auto-points to the latest release via the API fetch, so users always see the right download link without manual edits.

## Signing limitations

The .app is **ad-hoc signed**, not notarized. macOS Gatekeeper still scare-warns on first open ("cannot be verified"). User has to right-click → Open → confirm once. To fix permanently, a paid Apple Developer ID + notarization step (via `xcrun notarytool`) in the workflow would be needed.
