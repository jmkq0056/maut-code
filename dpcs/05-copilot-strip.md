# 05 · Copilot / Chat Strip

## Goal

Disable Copilot + the chat UI without breaking the workbench. The chat services are wired so deeply into VS Code that simply removing the contribution imports breaks task service, debug service, notebook breakpoints, etc.

## Strategy that survived

1. **Leave the chat contributions enabled in `workbench.common.main.ts`** — `chat.contribution.js`, `inlineChat.contribution.js`, `mcp.contribution.js`, etc. all stay imported. Services register, deps are happy.
2. **Disable the actual Copilot extensions** by renaming their `package.json` to `package.json.disabled` so the extension scanner skips them at startup:
   - `extensions/copilot/package.json.disabled`
   - `extensions/mermaid-chat-features/package.json.disabled`
3. **Patch the gulp build** so it doesn't fail when these are absent:
   - `build/lib/copilot.ts` — `prepareBuiltInCopilotRipgrepShim` returns early if the dir doesn't have a `package.json`.
   - `build/lib/extensions.ts` — `packageCopilotExtensionStream` returns empty stream if no `package.json`.
4. **Hide the chat UI by default**:
   - `chat.commandCenter.enabled: false`
   - `chat.experimental.offerSetup: false`
   - `chat.setupFromDialog: false`
   - `github.copilot.enable: { "*": false }`
   - `editor.inlineSuggest.enabled: false`
   - `editor.inlineSuggest.suppressSuggestions: true`
   - `editor.suggest.preview: false`
   - `github.copilot.editor.enableAutoCompletions: false`
5. **Hide the auxiliary bar at startup** (the right-side panel where chat lives) via `mautcode.contribution.ts`:
   - `IWorkbenchLayoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART)`

## Dead ends (do not retry)

- Commenting out `chat.contribution.js` imports — crashes the workbench because `taskService` depends on `IChatService`.
- Setting `defaultChatAgent: {}` in `product.json` — `welcomeOnboarding/browser/onboardingVariationA.ts` reads `.extensionId` unconditionally and trips an `assertDefined`, killing the workbench to a blank window. Keep the full Copilot config block.

## Files touched

| File | Change |
|---|---|
| `extensions/copilot/package.json` | Renamed to `package.json.disabled` |
| `extensions/mermaid-chat-features/package.json` | Renamed to `package.json.disabled` |
| `build/lib/copilot.ts` | Soft-skip if Copilot dir is missing/empty |
| `build/lib/extensions.ts` | Soft-skip Copilot stream if no `package.json` |
| `extensions/configuration-editing/package.json` | All the `chat.*` / `github.copilot.*` defaults |
| `src/vs/workbench/contrib/mautcode/browser/mautcode.contribution.ts` | Hide aux bar at startup |
