# 19 · Maut Markdown Preview

## What it does

`.md` and `.markdown` files **open in a custom rendered HTML preview by default**, not the raw source. The preview has a sticky table-of-contents sidebar, code blocks with `highlight.js` syntax colors, JetBrains Mono for code + system sans for prose, theme-aware colors that follow `⇧⌘L`.

Toggle to source via `⇧⌘V` or the editor-title button. Save in source → preview live-renders.

## Renderer stack

- **`markdown-it`** as the parser
- **`markdown-it-anchor`** auto-assigns slug IDs to every heading and inserts `#` permalink anchors
- **`markdown-it-task-lists`** for GitHub-style `- [ ] task` checkboxes
- **`highlight.js`** loaded from `cdn.jsdelivr.net` inside the webview (so the bundle stays small) for code-block syntax highlighting

## Layout

Two-column CSS Grid (`260px sidebar` + `1fr content`):

- **Sidebar** is `position: sticky; top: 0; height: 100vh; overflow-y: auto`. Lists every H1–H6 from the doc with indent reflecting nesting. Active section is highlighted via `IntersectionObserver` and auto-scrolled into view in the TOC.
- **Content** is `max-width: 760px; margin: 0 auto`. Generous line-height (1.7) for prose. H1 in accent red with a bottom border, H2 with thinner border, H3+ no border. Tables, blockquotes, code, images, task lists, kbd, dt/dd all styled in the Maut palette.

## Theme awareness

The webview body class is `maut-dark` or `maut-light` depending on `vscode.window.activeColorTheme.kind`. CSS variables swap based on the class. When `onDidChangeActiveColorTheme` fires, every open preview re-renders (so flipping `⇧⌘L` instantly reflects).

## Files

`extensions/maut-markdown-preview/`:
- `package.json` — adds `markdown-it`, `markdown-it-anchor`, `markdown-it-task-lists` as dependencies
- `src/extension.ts` — webview panel provider + activation event + open/save/theme listeners

## Toggle flow

`maut.markdown.toggle` command:
- Active editor is a markdown source → call `openPreview(uri)` and close the source tab.
- Active tab is our preview (`viewType === 'mainThreadWebview-maut.markdownPreview'`) → dispose the preview and `showTextDocument(uri)`.

The `recentlyOpened` Set guards against re-entry loops (preview opens, listener fires again, etc.) with a 1.5 s TTL.

## Scroll position preserved

Webview script persists `window.scrollY` via `vscode.setState({ scrollY })`. On re-render (save, theme change), `vscode.getState().scrollY` is restored — you don't lose your place when you save mid-doc.

## Security / URIs

`localResourceRoots: [vscode.Uri.file(path.dirname(uri.fsPath))]` so relative-path images in the markdown work via `<base href="${webview.asWebviewUri(dir)}/">`. CSP allows `https:` for images so remote images and the CDN-hosted highlight.js styles work.
