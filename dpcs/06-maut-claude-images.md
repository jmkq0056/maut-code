# 06 · maut-claude-images

## What it does

1. **Terminal link provider** for the pattern `[Image #N]` that Claude Code CLI prints when a user pastes an image. Cmd+click → opens the actual image file from `~/.claude/image-cache/<session>/<N>.png` in a Maut editor tab.
2. **Rich hover preview** — hovering the link shows the image inline (480 px wide) via a markdown image with a `vscode-file://vscode-app/<path>` URI. This required a workbench-level patch (see below).
3. **Spawn + adopt Maut Claude terminals** — see `dpcs/14-terminal-naming.md`.

## Files

```
extensions/maut-claude-images/
├── package.json
├── tsconfig.json
└── src/extension.ts          ← the whole thing in one file
```

Plus a workbench patch in `src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts`:

```ts
// _getLinkHoverString: if label starts with `mautImg:`, treat the rest as raw markdown.
if (label && label.startsWith('mautImg:')) {
    const body = label.substring('mautImg:'.length);
    const md = new MarkdownString('', true);
    md.supportHtml = true;
    md.appendMarkdown(body);
    return md;
}
```

The extension emits a tooltip like:
```
mautImg:![preview](vscode-file://vscode-app/Users/.../image.png|width=480)

**Image #3** · 3.png

cmd + click to open in editor
```

## Why `vscode-file://`, not `file://` or data URIs

- `file://` is filtered by VS Code's hover sanitizer in some builds.
- `data:image/...;base64,…` works **only for small images** — large screenshots overflow the markdown parser's token-length limit and the hover dumps the raw markdown text instead of rendering.
- `vscode-file://vscode-app/<absolute-path>` is the blessed scheme for local files in trusted markdown. No size limit, works in every build path tested.

## What was tried and reverted

- **Inline image rendering** (xterm.js image addon + intercepting `[Image #N]` writes and injecting iTerm2-protocol escapes) was implemented twice and reverted both times because xterm's image cells conflict with Claude Code's TUI redraws — the image shows briefly then gets overwritten by Claude's next paint, producing visual chaos. **Do not retry without solving the alt-screen / cursor-positioning conflict.**

## Session detection

`getActiveSessionDir()` finds the most-recently-modified subdir under `~/.claude/image-cache/`. Claude Code creates a new subdir per session (the GUID). The heuristic is "newest = active". Imperfect for concurrent sessions but reliable enough.
