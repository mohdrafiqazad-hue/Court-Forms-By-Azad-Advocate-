# i Court Forms — web app (context for Claude Code)

## What this is
An offline web app (PWA) for filling routine court forms and exporting them as Word (.docx) and PDF in the exact printed format. Users: law interns, students, junior advocates, clerks. Starts with District Courts Jalandhar; other Punjab districts later. App name: **i Court Forms**.
Owner: Mohammad Rafiq Azad, Advocate, Jalandhar.

Forms so far: **Form Nakal** (Form for Copies — application for certified / uncertified copies).

Access (owner's choice, like his Madhur Ganga Minerals app): Google sign-in (Firebase Auth) → the user is listed under Team → Requests (in the app, owner only) and sees "Waiting for approval" → the owner approves → app unlocks live; Remove locks it again. No payment inside the app. The owner's account always gets in. Owner setup steps are in `SETUP.md` (Hinglish).

## Files
- `index.html` — splash with the logo (`#splash`, hidden ~0.9 s after load), gate screens (`#gate`: loading, setup, login, wait, offline), home (form list, About card), Team screen, form screen. Colours follow the logo: navy (`--accent` #13296b) and gold. About sheet (`showAbout()` in app.js; `[data-about]` links on home and the sign-in screen) shows the app points and the founder from `ICF_CONFIG.about` with Call / WhatsApp.
- `css/app.css` — styles. Mobile-first: under 820px the form screen has Fill / Preview tabs and a fixed bottom bar with the export buttons, and a phone block enlarges text (16.5px body, 18px inputs, 50px+ touch targets). The preview has a Zoom in / Fit to screen button (`#btnZoom`, also tap the page) that shows the page at full size and scrolls inside the preview. Checked at 360px width.
- `js/config.js` — owner settings: Firebase web config, `about` (founder, title, address, phone shown in About), support WhatsApp. Not secret.
- `js/gate.js` — sign-in + approval gate. Sets `CF.gated`/`CF.locked`, calls `CF.showApp()` / `CF.hideApp()` (defined in app.js). Writes `users/{uid}` at sign-in (that is the request), listens live to `members/{uid}`. Caches an approval in localStorage (`icf-member-v1`, at most 30 days) so the app opens offline. Admins (detected by listing `users`, which the rules only allow for admins) always get in.
- `js/i18n.js` — interface language English / हिंदी / ਪੰਜਾਬੀ (`CF.t(key, vars)`, `CF.i18n.ft(form, text)`, `data-i18n*` attributes, choice saved in localStorage `icf-lang`, pickers on the sign-in screen and in the app bar). Every new UI text needs all three languages in its dictionary; every form needs `tr.hi` / `tr.pa` for its name, desc, court, groups, labels, hints and option texts (`tests/smoke.js` checks both). The printed Word/PDF form always stays in English.
- `js/store.js` — data kept on the device only (`CF.store`): `cases` ("My cases": saved forms, localStorage `icf-cases-v1`), `profile` ("My details": values of fields marked `profile: true`, shared by all forms, `icf-profile-v1`), `history` (last 6 values per form field, shown as one-tap suggestions, `icf-history-v1`) `clients` (Client book, `icf-clients-v1`: own details + `cases: [{ id, nature, caseNo, plaintiff, defendant, claim, place, court, decision }]`) and `backup` (download / restore JSON incl. clients and their cases; restore keeps only string values and the newer copy). The form screen has Save (updates the open case; "Save as a new case" in the case chip), My cases (open / copy / delete / search, backup / restore) and My details (fill / save); home lists the latest cases. Clients button: client book (add / edit / delete / search incl. case numbers; each client's cases with **Fill this case** = every case particular into the form via `form.clientCaseMap`, "Save this form's case here", a case editor with "Take from this form"; "Fill in as" per `form.clientTargets` for the client's own details). The owner removed the next-date diary and the signature/stamp feature (see git history if wanted back).
- `js/casetypes.js` — the District Courts case-type list from the owner (`CF.caseTypes.list`, `.code(type)`, `.number(type, no)` → e.g. `COMA/55/2024`), shared by forms. Form Nakal's Nature of Case is a list of these plus an optional `caseNo`; the box prints the type and then `Case No. COMA/55/2024` (nothing when no number). An older typed nature stays as an extra option.
- `js/engine.js` — rendering engine shared by all forms (`CF.engine`: `layout(form, cells, lang)`, `svg`, `pdf`, `docx(form, cells, land, lang)`, `loadFonts`, `PRINT_LANGS` = en/pa/hi) and helpers (`CF.util`: `P`, `linesOf`, `clean`, `cellList`). English prints with Times as a vector PDF (unchanged). Punjabi / Hindi — or any Gurmukhi / Devanagari typed in a field — use the bundled Noto Serif fonts (`lib/fonts`, OFL): measured and drawn on a canvas, and the PDF is one ~290-dpi image of the page; Word uses real text with the complex-script font Raavi (Gurmukhi) / Mangal (Devanagari) and exact line heights.
- `js/app.js` — app shell: hash routing (`#/` home, `#/f/<id>` a form), field rendering, autosave, export, Web Share. Above the preview: orientation and the printed-form language (`#plangSeg`: English / ਪੰਜਾਬੀ / हिंदी, saved with the draft as `plang`; file names get `_Punjabi` / `_Hindi`).
- `forms/<id>.js` — one file per form. Each calls `CF.register({...})`.
- `js/team.js` — Team screen inside the app at `#/team` (owner/admins only; gate.js starts it): Requests / Approved / Removed (live). Approve sets `members/{uid}.validUntil` to 2099-12-31; Remove sets it to now with `blocked: true`. `admin.html` only redirects to `./#/team`.
- `js/activity.js` — usage log only the owner sees (`CF.act.log(e, d)`, `CF.act.who(m)` from gate.js, `CF.act.send()`): app opened (one document per visit, a new visit after 30 min away), screens (`screen`), taps (`tap` = the button's id or first data-* attribute name, never its text), downloads (`word` / `pdf` / `share` with `form · orientation · print language · filled/total`, logged in app.js), interface language. Never anything typed. Queued in localStorage `icf-act-v1`, sent a few seconds later to `activity/{visit}` with `set(merge)` + `arrayUnion`. Off for the owner/admins and from then on on their device (`icf-act-off`) and with `?nogate`.
- `js/activity-view.js` — Team → **Activity** tab (`#actTab`, shown only when the owner can read `activity/`): Today / 7 / 30 days, tiles (opened, people, visits without sign-in, downloads, using now), visits per day, people, each visit's steps. Deletes visits older than 180 days when the owner looks (Privacy Policy says 6 months).
- `firestore.rules` — security. The owner account (email hard-coded in `isOwner()`) is always admin; `admins/{uid}` adds extra admins by hand in console. `users/{uid}` (profile written at sign-in = request), `members/{uid}` (`validUntil`, `blocked`; admin-only writes), `activity/{visit}` (usage log: each visitor writes only their own visit with fixed fields, `''` uid when not signed in; only the owner reads / deletes).
- `firebase.json`, `firestore.indexes.json` — Firebase Hosting (serves the repo root, ignores docs/tests) and emulator ports.
- `terms.html`, `privacy.html` — final Terms of Use and Privacy Policy (owner, chamber, mobile; approval-based access, free for now, data on device, usage record seen only by the owner and kept 6 months, DPDP Act 2023, Jalandhar jurisdiction). Update the "Last updated" date when changing them.
- `lib/` — bundled so the app needs no CDN: jsPDF 2.x, docx 9.x, Firebase compat SDK 13.1.0 (app, auth, firestore), `fonts/` Noto Serif Gurmukhi & Devanagari 400/700 woff2 (from @fontsource, OFL, `OFL.txt`). Do not replace with CDN links.
- `js/install.js` — "Install the app" card (home) / button (sign-in) via `beforeinstallprompt`; iPhone shows Share → Add to Home Screen steps; hidden when running installed. Also shows the "New version available · Refresh" bar on service-worker `controllerchange`.
- `manifest.webmanifest`, `sw.js`, `icons/` (the owner's logo — navy & gold court building with "iCourt Forms": logo-512 for the UI, icon-192/512, maskable-512 on navy, apple-touch-icon on white, favicon-48; corners made transparent, 256-colour PNGs) — installable PWA, offline. `sw.js` precaches with `cache: 'reload'` so a new version never stores stale files. `sw.js` never intercepts cross-origin or `/__/` (Firebase) requests.
- `tests/smoke.js` (format), `tests/gate-e2e.js` (sign-in/approval/admin and the Activity log against emulators; clear the emulators' data before a second run).
- `.github/workflows/pages.yml` — publishes to GitHub Pages on push.
- `.github/workflows/deploy.yml` — deploys Firebase Hosting + Firestore rules on push.
- `.nojekyll` — for GitHub Pages, if used.

## How a form works (one model → three outputs)
A form config (`forms/nakal.js` is the reference) has:
- `id`, `name`, `desc`, `court`, `docTitle`
- `page` — page size in points, portrait (Legal = `{ w: 612, h: 1008 }`)
- `title` — `{ text, size, top }` (top in points)
- `grid` — `{ left, top, cols: [...], rows: [...] }` in DXA (1/1440 inch). Every grid square must be covered by exactly one cell.
- `orientations` — e.g. `['landscape', 'portrait']`; `defaultOrient`
- `fields` — inputs: `{ group }` headings, or `{ key, label, type: 'text'|'area'|'choice'|'pick', rows, options, hint, placeholder, today, profile }` (`pick` = a list to tap plus "Other — type it yourself", which opens a box; the value stored and printed is the chosen English text or what was typed, e.g. Nakal's Purpose) (`profile: true` = the user's own details, filled by "My details"; reuse the same keys across forms, e.g. `aName`, `aDistrict`)
- `caseTitle(data)` — name shown in My cases (e.g. parties and case no.)
- `clientCaseMap` — `{ formKey: caseKey }`: which form fields a client's saved case fills (case keys: nature, caseNo, plaintiff, defendant, claim, place, court, decision)
- `clientTargets` — `[{ label, map: { formKey: clientKey }, fromForm? }]`: where a client's own details can be filled (client keys: name, father, occupation, address, po, ps, tehsil, district)
- `setting: true` on a field = an option, not a printed box (not counted in "filled")
- `tr` — `{ hi: { 'English text': 'हिंदी' }, pa: { … } }` for the app screen (name, desc, court, groups, labels, hints, option texts). `optionsAsIs: true` on a choice field = its options are court terms kept in English (only the first option is translated), e.g. the case types
- `build(data, lang)` — returns the cells (lang = printed-form language; the form's own `PRINT.pa` / `PRINT.hi` translate its headings and fixed words, `title.tr` the title; filled details print as typed): `CF.util.cellList()` → `add(col, row, colSpan, rowSpan, paragraphs, { rot, align, valign, border, gap })`; paragraphs are `P(text, size, { bold, strike })`. `rot: true` = vertical text, bottom-to-top.
- `fileBase(data, orient)` — file name without extension
- optional `docx` — overrides for Word page margins (`titleAfter`, `titleCol`, `portraitMargin`, `landMargin`)

The engine lays the cells out once (`layout`) and the three renderers draw from it, so preview, PDF and Word match. Landscape = the whole portrait form rotated 90° clockwise (title on the right). In Word, landscape is a real rotated table with a title column.

## Adding a new form
1. Ask the owner for the printed format (photo / scan / Word file). **Never invent a format.**
2. Copy `forms/nakal.js` to `forms/<id>.js`, set the grid, fields and `build()`, and add made-up test details for it in `TEST_DATA` in `tests/smoke.js` (the app has no sample case — the owner removed it; never use real names).
3. Add `<script src="forms/<id>.js"></script>` in `index.html` (after `js/engine.js`, before `js/gate.js`) and `./forms/<id>.js` to `FILES` in `sw.js`.
4. Remove its name from `PLANNED` in `js/app.js` if listed there.
5. Bump `VERSION` in `sw.js`, run the tests.

## Format rules (important)
- The layout must stay identical to the printed court form: same boxes, borders, rotated headings, row/column sizes, page size, one page.
- After any change, export Word and PDF in every orientation and check each is one page and matches the preview.
- The printed form comes in English, Punjabi and Hindi (same boxes). The Punjabi / Hindi headings in `forms/nakal.js` `PRINT` were translated by Claude — have the owner check the wording. After a change, check all three languages in both orientations (Word rows have exact heights: long Punjabi/Hindi headings must still fit).

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
