# 11 · maut-open-external

## What it does

Type-aware right-click actions on files. Each menu item only shows for the matching extension.

| Right-click on | Shows |
|---|---|
| `.html` `.htm` `.pdf` `.svg` | Open in Firefox |
| `.docx` `.doc` `.odt` `.rtf` | Show in Word |
| `.xlsx` `.xls` `.ods` `.csv` `.tsv` | Show in Excel |
| `.pptx` `.ppt` `.odp` `.key` | Show in PowerPoint |
| `.sh` `.bash` `.zsh` `.command` | Execute Script in Terminal |
| `.tex` | Compile (twice) and Open PDF in Firefox |
| anything | Open With System Default App (catchall, lowest priority) |

The first six options also appear in the **editor tab title bar** for the relevant extensions, so you don't have to right-click a file you've already opened.

## Implementation

Plain `child_process.spawn('open', ['-a', '<App>', path])`. For `.tex`, `vscode.window.createTerminal({ cwd })` followed by a single `sendText`:

```bash
pdflatex -interaction=nonstopmode "<file>"; pdflatex -interaction=nonstopmode "<file>"; rm -f <base>.{aux,log,out,toc,fdb_latexmk,fls,synctex.gz,nav,snm,bbl,blg}; open -a Firefox "<base>.pdf"
```

Uses `;` (not `&&`) so each step runs regardless of pdflatex errors. The terminal is created with `cwd` set to the file's directory and uses basenames — earlier full-path versions hit a `sendText` truncation when paths got long.

## Files

```
extensions/maut-open-external/
├── package.json   ← when-clauses do the file-type gating
├── tsconfig.json
└── src/extension.ts
```

## Why this exists at all

Most of this could be a third-party extension. We ship it bundled so a clean Maut install has these conveniences without any setup. Right-click "Open in Firefox" was one of the user's explicit asks early on, and from there it grew.
