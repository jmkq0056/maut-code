# 25 · Auto-Resume on Launch

## What it does

When Maut code starts and auto-spawns a clsp terminal, it runs `claude --dangerously-skip-permissions --continue` instead of plain `clsp`. The `--continue` flag tells Claude Code to **immediately resume the most recent session in the current working directory** — no session picker, no Enter spam, no manual `/resume`.

## Where

`startClaudeInNewTerminal({ autoResume: true })` is called from the activate handler (`extensions/maut-claude-images/src/extension.ts`). Inside the function:

```ts
const cmd = opts?.autoResume ? `${CLSP_COMMAND} --continue` : CLSP_COMMAND;
t.sendText(cmd, true);
```

Where `CLSP_COMMAND = 'claude --dangerously-skip-permissions'`.

Manual spawn paths (reaper `$(flame)` button, `maut.chat.startClaude` command, switcher's "Start new MAUT") call `startClaudeInNewTerminal()` with **no args** → `autoResume` is undefined → fresh session.

## Why not `/resume`

Earlier attempts used `setTimeout` to send `/resume` + Enter + Enter after the terminal started. Two problems:
1. Timing-fragile — claude takes a variable amount of time to initialize, depending on plugins and shell startup. The 2.2 s delay was either too short (Enters land in zsh) or too long (UX feels broken).
2. `/resume` opens the session picker, which then needs more Enters.

`--continue` is the non-interactive equivalent. Single command, zero timing dependency.

## Setting

`maut.autoResumeOnLaunch` (default `true`) — toggle off if you'd rather start fresh.
