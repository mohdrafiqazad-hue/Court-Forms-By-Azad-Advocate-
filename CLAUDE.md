# i Court Forms — web app (context for Claude Code)

## What this is
An offline web app (PWA) for filling routine court forms and exporting them as Word (.docx) and PDF in the exact printed format. Users: law interns, students, junior advocates, clerks. Starts with District Courts Jalandhar; other Punjab districts later. App name: **i Court Forms**.
Owner: Mohammad Rafiq Azad, Advocate, Jalandhar.

Forms so far: **Form Nakal** (Form for Copies — application for certified / uncertified copies).

Access (owner's choice, like his Madhur Ganga Minerals app): Google sign-in (Firebase Auth) → the user is listed under Team → Requests (in the app, owner only) and sees "Waiting for approval" → the owner approves → app unlocks live; Remove locks it again. No payment inside the app. The owner's account always gets in. Owner setup steps are in `SETUP.md` (Hinglish).

## Files
- `index.html` — gate screens (`#gate`: loading, setup, login, wait, offline), home (form list), Team screen, form screen.
- `css/app.css` — styles. Mobile-first: under 820px the form screen has Fill / Preview tabs and a fixed bottom bar with the export buttons.
- `js/config.js` — owner settings: Firebase web config, support WhatsApp. Not secret.
- `js/gate.js` — sign-in + approval gate. Sets `CF.gated`/`CF.locked`, calls `CF.showApp()` / `CF.hideApp()` (defined in app.js). Writes `users/{uid}` at sign-in (that is the request), listens live to `members/{uid}`. Caches an approval in localStorage (`icf-member-v1`, at most 30 days) so the app opens offline. Admins (detected by listing `users`, which the rules only allow for admins) always get in.
- `js/i18n.js` — interface language English / हिंदी / ਪੰਜਾਬੀ (`CF.t(key, vars)`, `CF.i18n.ft(form, text)`, `data-i18n*` attributes, choice saved in localStorage `icf-lang`, pickers on the sign-in screen and in the app bar). Every new UI text needs all three languages in its dictionary; every form needs `tr.hi` / `tr.pa` for its name, desc, court, groups, labels, hints and option texts (`tests/smoke.js` checks both). The printed Word/PDF form always stays in English.
- `js/engine.js` — rendering engine shared by all forms (`CF.engine`: `layout`, `svg`, `pdf`, `docx`) and helpers (`CF.util`: `P`, `linesOf`, `clean`, `cellList`).
- `js/app.js` — app shell: hash routing (`#/` home, `#/f/<id>` a form), field rendering, autosave, export, Web Share.
- `forms/<id>.js` — one file per form. Each calls `CF.register({...})`.
- `js/team.js` — Team screen inside the app at `#/team` (owner/admins only; gate.js starts it): Requests / Approved / Removed (live). Approve sets `members/{uid}.validUntil` to 2099-12-31; Remove sets it to now with `blocked: true`. `admin.html` only redirects to `./#/team`.
- `firestore.rules` — security. The owner account (email hard-coded in `isOwner()`) is always admin; `admins/{uid}` adds extra admins by hand in console. `users/{uid}` (profile written at sign-in = request), `members/{uid}` (`validUntil`, `blocked`; admin-only writes).
- `firebase.json`, `firestore.indexes.json` — Firebase Hosting (serves the repo root, ignores docs/tests) and emulator ports.
- `terms.html`, `privacy.html` — drafts with [placeholders]; the owner must complete them.
- `lib/` — bundled so the app needs no CDN: jsPDF 2.x, docx 9.x, Firebase compat SDK 13.1.0 (app, auth, firestore). Do not replace with CDN links.
- `js/install.js` — "Install the app" card (home) / button (sign-in) via `beforeinstallprompt`; iPhone shows Share → Add to Home Screen steps; hidden when running installed. Also shows the "New version available · Refresh" bar on service-worker `controllerchange`.
- `manifest.webmanifest`, `sw.js`, `icons/` (icon-192/512, maskable-512, apple-touch-icon, favicon-48; drawn by a script, maroon page + gold "i" seal) — installable PWA, offline. `sw.js` precaches with `cache: 'reload'` so a new version never stores stale files. `sw.js` never intercepts cross-origin or `/__/` (Firebase) requests.
- `tests/smoke.js` (format), `tests/gate-e2e.js` (sign-in/approval/admin against emulators).
- `.github/workflows/pages.yml` — publishes to GitHub Pages on push.
- `.github/workflows/deploy.yml` — deploys Firebase Hosting + Firestore rules on push.
- `.nojekyll` — for GitHub Pages, if used.

## How a form works (one model → three outputs)
A form config (`forms/nakal.js` is the reference) has:
- `id`, `name`, `desc`, `court`, `docTitle`, `sampleLabel`
- `page` — page size in points, portrait (Legal = `{ w: 612, h: 1008 }`)
- `title` — `{ text, size, top }` (top in points)
- `grid` — `{ left, top, cols: [...], rows: [...] }` in DXA (1/1440 inch). Every grid square must be covered by exactly one cell.
- `orientations` — e.g. `['landscape', 'portrait']`; `defaultOrient`
- `fields` — inputs: `{ group }` headings, or `{ key, label, type: 'text'|'area'|'choice', rows, options, hint, placeholder, today }`
- `sample` — demo data for the "Sample case" button
- `tr` — `{ hi: { 'English text': 'हिंदी' }, pa: { … } }` for the app screen (name, desc, court, groups, labels, hints, option texts)
- `build(data)` — returns the cells: `CF.util.cellList()` → `add(col, row, colSpan, rowSpan, paragraphs, { rot, align, valign, border, gap })`; paragraphs are `P(text, size, { bold, strike })`. `rot: true` = vertical text, bottom-to-top.
- `fileBase(data, orient)` — file name without extension
- optional `docx` — overrides for Word page margins (`titleAfter`, `titleCol`, `portraitMargin`, `landMargin`)

The engine lays the cells out once (`layout`) and the three renderers draw from it, so preview, PDF and Word match. Landscape = the whole portrait form rotated 90° clockwise (title on the right). In Word, landscape is a real rotated table with a title column.

## Adding a new form
1. Ask the owner for the printed format (photo / scan / Word file). **Never invent a format.**
2. Copy `forms/nakal.js` to `forms/<id>.js`, set the grid, fields, sample and `build()`.
3. Add `<script src="forms/<id>.js"></script>` in `index.html` (after `js/engine.js`, before `js/gate.js`) and `./forms/<id>.js` to `FILES` in `sw.js`.
4. Remove its name from `PLANNED` in `js/app.js` if listed there.
5. Bump `VERSION` in `sw.js`, run the tests.

## Format rules (important)
- The layout must stay identical to the printed court form: same boxes, borders, rotated headings, row/column sizes, page size, one page.
- After any change, export Word and PDF in every orientation and check each is one page and matches the preview.
- Only English text works in the PDF right now (jsPDF built-in Times font). Punjabi/Hindi would need an embedded Unicode font (e.g. Noto Sans Gurmukhi).

## Testing
Localhost-only switches (ignored on the live site): `?nogate` skips the gate; `?emulator` uses the Firebase emulators with project `demo-icf`.
```
firebase emulators:start --only auth,firestore --project demo-icf   # needs Java
python3 -m http.server 8002
node tests/smoke.js http://localhost:8002/ /tmp/cf-out              # format: exports, 1 page, size, phone, offline
node tests/gate-e2e.js http://localhost:8002/ /tmp/cf-e2e           # login → wait → rules → owner approve/remove → unlock, offline
```
`gate-e2e.js` signs in with emulator test credentials (the real Google popup needs apis.google.com).

## Deploy
Main link (owner's choice): **https://mohdrafiqazad-hue.github.io/Court-Forms-By-Azad-Advocate-/** — `.github/workflows/pages.yml` publishes an allow-list of app files (`index.html admin.html terms.html privacy.html manifest.webmanifest sw.js css js forms lib icons`; add new top-level files there) to GitHub Pages on every push, stamping `VERSION` in `sw.js`. Needs Settings → Pages → Source: GitHub Actions, and `mohdrafiqazad-hue.github.io` in Firebase Auth → Authorized domains. All paths are relative, so the app works under the repo sub-path.
Also live at https://i-court-forms.web.app (Firebase project `i-court-forms`, see `.firebaserc`).
`.github/workflows/deploy.yml` deploys hosting and then `firestore.rules` on every push to `main` / `ccr-1ddb94dd-s0x9y0` (or by hand: Actions → Deploy to Firebase → Run workflow). It stamps `VERSION` in `sw.js` with the commit SHA, so installed apps update. Needs the repo secret `FIREBASE_SERVICE_ACCOUNT` (service account JSON with roles Firebase Admin, Service Usage Consumer and Firebase Rules Admin — the first alone gets 403s); without it the job skips. Manual alternative: `firebase deploy`.

## Known limits / next steps
- No in-app payment (owner's choice). An earlier version had UPI payment + transaction-ID claims (see git history) if it is wanted back.
- The gate is client-side: form code ships to every browser, so a technical user could bypass it. Stronger: serve paid form configs from Firestore/Storage readable only by members.
- More Jalandhar forms, then other Punjab districts; English + Punjabi; Play Store later (same code packaged with Capacitor; Play Billing there).
