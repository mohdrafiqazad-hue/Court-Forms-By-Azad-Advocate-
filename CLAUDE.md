# Court Forms — web app (context for Claude Code)

## What this is
An offline web app (PWA) for filling routine court forms and exporting them as Word (.docx) and PDF in the exact printed format. Users: law interns, students, junior advocates, clerks. Starts with District Courts Jalandhar; other Punjab districts later.
Owner: Mohammad Rafiq Azad, Advocate, Jalandhar.

Forms so far: **Form Nakal** (Form for Copies — application for certified / uncertified copies).

## Files
- `index.html` — page shell: home screen (form list) and form screen (fields, preview, export buttons).
- `css/app.css` — styles. Mobile-first: under 820px the form screen has Fill / Preview tabs and a fixed bottom bar with the export buttons.
- `js/engine.js` — the rendering engine shared by all forms (`CF.engine`: `layout`, `svg`, `pdf`, `docx`) and helpers (`CF.util`: `P`, `linesOf`, `clean`, `cellList`).
- `js/app.js` — app shell: hash routing (`#/` home, `#/f/<id>` a form), field rendering, autosave, export, Web Share.
- `forms/<id>.js` — one file per form. Each calls `CF.register({...})`.
- `lib/jspdf.umd.min.js` (jsPDF 2.x) and `lib/docx.min.js` (docx 9.x browser build) — bundled locally so the app needs no internet. Do not replace them with CDN links.
- `manifest.webmanifest`, `sw.js`, `icons/` — installable PWA that works offline.
- `tests/smoke.js` — Playwright check of every form (see Testing).
- `.nojekyll` — tells GitHub Pages to serve files as they are.

## How a form works (one model → three outputs)
A form config (`forms/nakal.js` is the reference) has:
- `id`, `name`, `desc`, `court`, `docTitle`, `sampleLabel`
- `page` — page size in points, portrait (Legal = `{ w: 612, h: 1008 }`)
- `title` — `{ text, size, top }` (top in points)
- `grid` — `{ left, top, cols: [...], rows: [...] }` in DXA (1/1440 inch). Every grid square must be covered by exactly one cell.
- `orientations` — e.g. `['landscape', 'portrait']`; `defaultOrient`
- `fields` — inputs shown on the left: `{ group }` headings, or `{ key, label, type: 'text'|'area'|'choice', rows, options, hint, placeholder, today }`
- `sample` — demo data for the "Sample case" button
- `build(data)` — returns the cells: use `CF.util.cellList()` → `add(col, row, colSpan, rowSpan, paragraphs, { rot, align, valign, border, gap })`; paragraphs are `P(text, size, { bold, strike })`. `rot: true` = vertical text, bottom-to-top.
- `fileBase(data, orient)` — file name without extension
- optional `docx` — overrides for Word page margins (`titleAfter`, `titleCol`, `portraitMargin`, `landMargin`)

The engine lays the cells out once (`layout`) and the three renderers draw from it, so preview, PDF and Word match. Landscape = the whole portrait form rotated 90° clockwise (title on the right). In Word, landscape is a real rotated table with a title column.

## Adding a new form
1. Ask the owner for the printed format (photo / scan / Word file). **Never invent a format.**
2. Copy `forms/nakal.js` to `forms/<id>.js`, set the grid, fields, sample and `build()`.
3. Add `<script src="forms/<id>.js"></script>` in `index.html` (before `js/app.js`) and `./forms/<id>.js` to `FILES` in `sw.js`.
4. Remove its name from `PLANNED` in `js/app.js` if it was listed there.
5. Bump `VERSION` in `sw.js`, run the tests.

## Format rules (important)
- The layout must stay identical to the printed court form: same boxes, borders, rotated headings, row/column sizes, page size, one page.
- After any change, export Word and PDF in every orientation and check each is one page and matches the preview (`tests/smoke.js` does the export and page checks; also look at the files).
- Only English text works in the PDF right now (jsPDF built-in Times font). Punjabi/Hindi would need an embedded Unicode font (e.g. Noto Sans Gurmukhi).

## Testing
```
python3 -m http.server 8000          # in the repo root
node tests/smoke.js http://localhost:8000/ /tmp/cf-out
```
It fills the sample case of every form, exports Word + PDF in every orientation, checks one page and the page size, checks the phone layout has no sideways scroll, and that the app reloads offline. Screenshots and files go to the out folder.

## Deploy
GitHub Pages: Settings → Pages → Deploy from a branch → branch with these files, folder `/ (root)`. Bump `VERSION` in `sw.js` on every change, or installed apps keep the old copy.

## Next steps (owner's plan)
More Jalandhar forms (Vakalatnama, Memo of appearance, Exemption, Adjournment, Personal bond, Surety bond, …), then other Punjab districts; English + Punjabi; later a ₹100/year membership and Play Store (same code packaged with Capacitor).
