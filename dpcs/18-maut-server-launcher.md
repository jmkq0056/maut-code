# 18 · maut-server-launcher

## What it does

Right-click any folder in the explorer → **Start Server**. The extension scans the folder, detects what kind of project it is, offers a quick-pick if multiple options match, and spawns the command in a `Maut · server · <folder>` terminal.

## Detection

| Found in folder | Suggested command |
|---|---|
| `package.json` with `scripts.dev` / `start` / `serve` / `server` / `watch` | `npm run <script>` (or `pnpm` / `yarn` / `bun` depending on the lockfile) |
| Any other script in `package.json` | listed too, lower priority |
| `manage.py` | `python manage.py runserver` |
| `main.py` / `app.py` / `server.py` / `run.py` / `__main__.py` | `python <file>` |
| `pyproject.toml` with `[tool.uv]` | `uv run` |
| `pyproject.toml` with `[tool.poetry.scripts]` | `poetry run` |
| `Cargo.toml` | `cargo run` |
| `go.mod` | `go run .` |
| `index.html` (no `package.json`) | `python -m http.server 8000` |
| `Makefile` with target `dev` / `serve` / `run` / `start` | `make <target>` |
| `docker-compose.yml` / `compose.yml` | `docker compose up` |

Multi-match → quick-pick. Single match → just runs.

## Files

```
extensions/maut-server-launcher/
├── package.json
├── tsconfig.json
└── src/extension.ts
```

## Why this is useful for vibecoders

Switching projects? Right-click → Start Server. Don't have to remember "is it `npm run dev` or `npm run start`?" or "this one uses bun, not npm." The detection covers ~95% of project shapes.

## Gotcha

The Makefile target detection is line-anchored regex (`^<target>:`). Works for standard Makefiles, may miss exotic forms (.PHONY blocks, recursive includes).
