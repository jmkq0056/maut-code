# 12 · maut-activity

## What it does

Sidebar view (under the new **Maut** activity-bar container) that lists every file Claude has Edit/Write/MultiEdit'd in the current session, with diff + undo + redo per file or per individual edit.

## Why file-centric, not action-centric

First version was a flat chronological list of every tool call. It was unusable — bash and read calls drowned the few edits. User killed it. v2 groups by file, hiding bash, read, grep, etc. entirely.

## Data source

Claude Code writes a JSONL transcript per session at:

```
~/.claude/projects/<workspace-slug>/<session-id>.jsonl
```

Where `<workspace-slug>` is the absolute workspace path with `/` replaced by `-`. Each line is a JSON object — `permission-mode`, `file-history-snapshot`, `user`, `assistant`, `attachment`, `system`.

For our purposes the important entries are:

- `assistant` messages with `message.content[]` containing `{type: "tool_use", name, input: { file_path, ... }, id}`.
- `file-history-snapshot` events whose `snapshot.trackedFileBackups[absPath] = { backupFileName, version, backupTime }`.

The backup files themselves live at `~/.claude/file-history/<session-id>/<hash>@v<N>` — **raw pre-edit file content**. Claude Code does the snapshotting for us; undo is just `fs.copyFileSync(backupPath, livePath)`.

## How undo works

- **Undo file** = restore version 1 (the state at the very start of the session). The hash is parsed from any `trackedFileBackups` entry for that file; the suffix is replaced with `@v1`.
- **Undo single action** = restore the backup that was active immediately before that action's message — captured per-action while tailing the transcript.
- **Redo** = before any undo, capture the current file bytes into an in-memory `Map<filePath, Buffer>`; after undo, the file group's row sprouts a redo button that writes those bytes back. Lost on extension restart.

## UI shape

```
MAUT · ACTIVITY                                      ⟳
─────────────────────────────────────────────────────
📝 build_topic2.py                       3 edits · 2m ago     [↶ open] [⌫ undo]
   ├ 02:43:07 · Edit                                          [diff] [undo]
   ├ 02:42:59 · Edit
   └ 02:34:08 · Write
📄 docs/new-file.md   (new)              1 write · 12m ago    [↶ open] [⌫ undo]
```

Bash, Read, Grep, Glob, TodoWrite, Task entries are **filtered out at parse time**. Files outside the workspace folder are also filtered.

## Files

```
extensions/maut-activity/
├── package.json     ← view container, tree view, viewWelcome, commands, menus
├── tsconfig.json
└── src/extension.ts ← SessionWatcher + ActivityProvider + commands
```

## Edge cases

- New file (Write with no prior content): undo offers to delete the file rather than restore a non-existent v1 backup.
- File watcher reads the JSONL incrementally with a 100 ms debounce on the `fs.watch` events.
- If the user edits the file themselves after a Claude edit, undo overwrites their changes too — a warning in the confirmation message says so.
