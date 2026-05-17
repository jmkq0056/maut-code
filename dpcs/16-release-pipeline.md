# 16 · Release Pipeline

## How it ships

- GitHub repo: <https://github.com/jmkq0056/maut-code> (public, orphan-branch main without upstream microsoft/vscode history)
- Tag → release: pushing a tag matching `v*` triggers `.github/workflows/maut-release.yml`
- Manual: `workflow_dispatch` lets you re-run from the Actions tab

## What the workflow does

```yaml
jobs:
  mac-arm64:    runs-on: macos-14   → builds .app, hdiutil DMG, uploads
  mac-x64:      runs-on: macos-13   → same for Intel
  windows-x64:  runs-on: windows-latest → builds win32 tree, zips it
```

Each job: `actions/setup-node@v4` with Node 22.22.1, `npm install`, `npm run gulp vscode-<platform>-<arch>`, then DMG/zip + `softprops/action-gh-release@v2`.

## First release (v0.1.0)

Was created **locally** by:

1. Building the .app via `npm run gulp vscode-darwin-arm64`.
2. Ad-hoc-signing the bundle:
   ```bash
   codesign --force --deep --sign - "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app"
   ```
3. Wrapping it in a DMG:
   ```bash
   hdiutil create -volname "Maut code" \
     -srcfolder "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app" \
     -ov -format UDZO /tmp/Maut-code-arm64.dmg
   ```
4. Creating the release:
   ```bash
   gh release create v0.1.0 /tmp/Maut-code-arm64.dmg \
     --repo jmkq0056/maut-code --title "Maut code v0.1.0" --notes "..."
   ```

## Local install reset (when iterating)

```bash
pkill -9 -f "Maut code"; sleep 2
rm -rf "/Applications/Maut code.app"
cp -R "/Users/jmkq/Developer/VSCode-darwin-arm64/Maut code.app" /Applications/
codesign --force --deep --sign - "/Applications/Maut code.app"
xattr -dr com.apple.quarantine "/Applications/Maut code.app"
open "/Applications/Maut code.app"
```

Both `codesign` and `xattr` are needed:

- **codesign --force --deep --sign -** ad-hoc signs the bundle so the macOS kernel will load the binary. Without this you get "Maut code cannot be opened because of a problem."
- **xattr -dr com.apple.quarantine** strips the quarantine xattr added by Finder/`open` when copying. Without this Gatekeeper blocks the unsigned ad-hoc bundle.

## Limitations / future work

- **Not notarized.** Apple requires a paid Developer ID and going through `xcrun notarytool` to make first-time downloads launch without scary dialogs. The current "right-click → Open" workflow is fine for personal use but not for distribution.
- **Mac x64 + Windows binaries** depend on the GH Actions workflow succeeding. The workflow's first run may need:
  - Node version cache adjustments
  - LibreOffice/Word skipped on CI (the DOCX→PDF code path won't be reachable in CI but the build doesn't need it)
  - Possibly chunked-upload tweaks for the >300 MB DMG (GH release asset uploads are 2 GB cap, but flaky over slow connections)
- **Auto-updater is not wired up.** VS Code's update server is configured per-platform in `product.json`; Maut points at no update server, so the app never self-updates. Users grab a new DMG manually.

## Bumping a release

```bash
git checkout main
# make changes, commit
git tag v0.2.0
git push maut main
git push maut v0.2.0
# Actions builds the artifacts and attaches them
```
