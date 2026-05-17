# 15 · Workbench-level Patches

Things that genuinely couldn't be done from a stable extension API and required modifying VS Code source. Kept minimal and isolated under `src/vs/workbench/contrib/mautcode/`.

## Files in `mautcode/browser/`

```
mautcode.contribution.ts          ← entry: imports + IWorkbenchLayoutService tweaks
mautExplorerInlineAdd.ts          ← inline `@` button on every explorer row
mautTerminalAppearance.ts         ← command to set terminal icon+color programmatically
media/mautcode.css                ← styles the inline button
```

The contribution is loaded by adding the import in `src/vs/workbench/workbench.common.main.ts`:

```ts
import './contrib/mautcode/browser/mautcode.contribution.js';
```

## Patches in upstream files (kept tiny)

### 1. Terminal hover allows raw markdown

`src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts`

```ts
private _getLinkHoverString(uri: string, label: string | undefined): IMarkdownString {
    if (label && label.startsWith('mautImg:')) {
        const body = label.substring('mautImg:'.length);
        const md = new MarkdownString('', true);
        md.supportHtml = true;
        md.appendMarkdown(body);
        return md;
    }
    // …unchanged…
}
```

Allows the `maut-claude-images` extension to ship a markdown tooltip with an embedded image preview for `[Image #N]` link hovers.

### 2. Terminal drag-and-drop fires text-drop event

`src/vs/workbench/contrib/terminal/browser/terminalInstance.ts`

- Added an `_onDropText` emitter to `TerminalInstanceDragAndDropController`.
- In `onDrop`, after the existing path-detection branches, when no file URI is in the drop but `text/plain` is, fire `_onDropText` with the payload.
- In `TerminalInstance._initDragAndDrop`, subscribe to `onDropText`. For Maut-named terminals, branch to insert `@workspace-relative-path:line-range` based on the **currently active editor's selection** (not the dropped text).
- Also: for `onDropFile` on Maut terminals, replace the default shell-quoted path with `@workspace/relative/path `.

### 3. Inline `@` button in the file explorer

`src/vs/workbench/contrib/mautcode/browser/mautExplorerInlineAdd.ts` registers an `IExplorerFileContribution` via the existing `explorerFileContribRegistry` extension point. The registry was already exported by VS Code — no patch to `explorerViewer.ts` was needed.

```ts
explorerFileContribRegistry.register({
    create: (insta, container) => insta.createInstance(MautExplorerInlineAddContribution, container),
});
```

Per-row a small `codicon-mention` anchor is appended to the row container. CSS in `media/mautcode.css` shows it on hover/selection only.

Click → executes the extension command `maut.cli.add` with the row's resource URI.

### 4. Programmatic terminal icon/color

`src/vs/workbench/contrib/mautcode/browser/mautTerminalAppearance.ts` registers `maut.terminal.setAppearance` via `CommandsRegistry`. Uses `ITerminalService` + `ITerminalGroupService` to find the right terminal instance and call `instance.changeIcon({ id })` and `instance.changeColor(colorId, true)` — the existing internal methods, but bypassing their interactive quick-pick.

### 5. Build pipeline patches

These are not really "workbench" patches but they're in the same spirit — minimal source edits to keep the build green after disabling Copilot:

- `build/lib/copilot.ts` — `prepareBuiltInCopilotRipgrepShim` returns early if Copilot is disabled.
- `build/lib/extensions.ts` — `packageCopilotExtensionStream` returns empty stream if Copilot's `package.json` is missing.

## What was attempted and reverted

- **Inline image rendering in the terminal** — patched `terminalInstance.ts._writeProcessData` to transform `[Image #N]` into iTerm2 inline-image escape sequences. The patch worked, but the resulting visual conflicted with Claude Code's TUI redraws. Reverted; image previews live in hover tooltips instead.
- **Removing chat workbench contributions** — tried commenting out `chat.contribution.js` imports in `workbench.common.main.ts`. Broke `taskService`, `debugService`, `notebookBreakpoints`. Reverted; chat services stay registered, UI is hidden via configurationDefaults + the aux-bar hide.

## Discipline

Every workbench patch should:

- Live in `mautcode/` if possible (own file).
- Use a marker prefix like `mautImg:` or a separate command id, not a magic string check on something user-visible.
- Be short. If a patch is >50 lines, it should be a new file under `mautcode/`.
