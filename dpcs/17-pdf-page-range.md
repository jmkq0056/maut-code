# 17 · PDF Page Range Input

## What it does

The PDF page picker (see `dpcs/13-maut-file-tools.md`) now has an inline range input next to the All / None / Add buttons. Type a range like:

```
3-15, 20, 22-25
```

and press Enter (or click **Apply**) → those pages get selected. Existing selection is replaced. Out-of-range or invalid numbers are silently ignored.

## Why

Click-each-thumbnail is painful for 40-page PDFs. A typed range gets you to your selection in one keystroke.

## Files

`extensions/maut-file-tools/src/pdfPagePicker.ts` — the webview HTML/JS got:

- An `<input id="range">` field in the header `actions` row
- An `Apply` button
- A `parseRange(text, max)` helper that splits on `,` or whitespace and accepts `N` or `N-M`
- Enter-key handler on the input field

## Acceptable input formats

- `3` — single page
- `3-7` — range inclusive
- `3, 5, 9` — multiple singles
- `3-7, 10, 15-20` — mixed
- `3, 5,9,15-20` — commas and whitespace both work as separators
- `0`, `999`, negative → ignored silently if out of range
