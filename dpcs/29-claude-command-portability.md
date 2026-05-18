# 29 · `claude` Command Portability

## Why this matters

Early versions of Maut hard-coded `clsp` as the launch command. `clsp` is a user-defined shell alias (in jmkq's `~/.zshrc`: `alias clsp='claude --dangerously-skip-permissions'`). It works on the dev machine, but on a fresh Maut install on someone else's computer, `clsp` doesn't exist and the auto-launch fails silently.

## The fix

`extensions/maut-claude-images/src/extension.ts`:

```ts
const CLSP_COMMAND = 'claude --dangerously-skip-permissions';
```

Used everywhere — the auto-launch path, the reaper-spawn-button command, the quick-pick "Start new MAUT", and the auto-resume path (`CLSP_COMMAND + ' --continue'`).

## Detection regex stays loose

The `isClaudeCommand(cmd)` regex used by the shell-exec event handlers stays at:

```ts
function isClaudeCommand(cmd: string): boolean {
    const trimmed = cmd.trim();
    return /^(clsp|claude)(\s|$)/.test(trimmed);
}
```

So a user who *does* have a `clsp` alias and types it manually still gets adopted into a Maut terminal (renamed `N -- MAUT`, colored, etc.). The spawn-side always uses the full command for portability; the recognition-side accepts either.

## What this enables

- The DMG download from the release page works out of the box on any Mac that has the Claude Code CLI installed, without any shell config.
- Distributing Maut code to other developers no longer requires "first add this alias to your zshrc."
