/* Smoke test (format): for every form, fill the sample case and export Word + PDF in every
   orientation; check each file is one page of the right size, and the app works offline.
   Usage:  python3 -m http.server 8000   (in the repo root, another terminal)
           node tests/smoke.js [http://localhost:8000/] [outDir]                         */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL_ = process.argv[2] || 'http://localhost:8000/';
const APP = URL_ + '?nogate'; // localhost-only switch: skip sign-in for format tests
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const pdfInfo = buf => {
  const s = buf.toString('latin1');
  const pages = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const mb = s.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
  return { pages, w: mb ? +mb[3] : 0, h: mb ? +mb[4] : 0 };
};

(async () => {
  const fails = [];
  const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails.push(msg); };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await page.goto(APP);
  await page.waitForSelector('#formList .card');
  const forms = await page.evaluate(() => window.CF.forms.map(f => ({ id: f.id, page: f.page, orientations: f.orientations })));
  for (const f of forms) {
    console.log('Form:', f.id);
    await page.goto(APP + '#/f/' + f.id);
    await page.waitForSelector('#paper svg');
    await page.click('#btnClear'); await page.click('#confirm [data-yes]');
    await page.click('#btnSample'); await page.waitForTimeout(200);
    for (const o of f.orientations) {
      if (f.orientations.length > 1) { await page.click(`#orientSeg [data-o="${o}"]`); await page.waitForTimeout(200); }
      await page.screenshot({ path: path.join(OUT, `${f.id}-${o}-screen.png`) });
      const land = o === 'landscape';
      for (const [btn, ext] of [['#btnWord', 'docx'], ['#btnPdf', 'pdf']]) {
        const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click(btn)]);
        const file = path.join(OUT, dl.suggestedFilename());
        await dl.saveAs(file);
        const buf = fs.readFileSync(file);
        if (ext === 'pdf') {
          const i = pdfInfo(buf);
          const [ew, eh] = land ? [f.page.h, f.page.w] : [f.page.w, f.page.h];
          check(i.pages === 1 && Math.round(i.w) === ew && Math.round(i.h) === eh, `${o} PDF: ${i.pages} page, ${i.w}×${i.h} (${path.basename(file)})`);
        } else {
          check(buf.slice(0, 2).toString() === 'PK' && buf.length > 3000, `${o} Word: ${buf.length} bytes (${path.basename(file)})`);
        }
      }
    }
  }

  // languages: English / हिंदी / ਪੰਜਾਬੀ
  console.log('Languages');
  const dictOk = await page.evaluate(() => Object.entries(CF.i18n.dict).filter(([k, v]) => k !== 'typeEnglish' && (v.length !== 3 || v.some(x => !x))).map(([k]) => k));
  check(dictOk.length === 0, 'every interface text has English, Hindi and Punjabi' + (dictOk.length ? ': missing ' + dictOk.join(', ') : ''));
  const formTr = await page.evaluate(() => CF.forms.map(f => {
    const need = new Set([f.name, f.desc, f.court]);
    f.fields.forEach(x => { if (x.group) need.add(x.group); if (x.label) need.add(x.label); if (x.hint) need.add(x.hint); (x.options || []).forEach(o => need.add(o[1])); });
    return ['hi', 'pa'].flatMap(l => [...need].filter(k => !(f.tr && f.tr[l] && f.tr[l][k])).map(k => f.id + '/' + l + ': ' + k));
  }).flat());
  check(formTr.length === 0, 'every form field has Hindi and Punjabi names' + (formTr.length ? ': ' + formTr.slice(0, 5).join(' | ') : ''));
  for (const [lang, idx] of [['pa', 2], ['hi', 1]]) {
    await page.goto(APP + '#/'); await page.waitForSelector('#formList .card');
    await page.selectOption('#home select.langsel', lang); await page.waitForTimeout(200);
    const want = await page.evaluate(i => CF.i18n.dict.heroTitle[i], idx);
    check((await page.textContent('#home .hero h1')) === want, lang + ': home screen in the chosen language');
    await page.reload(); await page.waitForSelector('#formList .card');
    check((await page.textContent('#home .hero h1')) === want && (await page.getAttribute('html', 'lang')) === lang, lang + ': choice remembered after reload');
    await page.click('#formList .card'); await page.waitForSelector('#fields h3');
    const h3 = await page.textContent('#fields h3');
    const enLabels = await page.$$eval('#fields .en-label', els => els.length);
    check(h3 !== 'Top of form' && enLabels > 10, lang + ': form fields translated, English name shown under each (' + enLabels + ')');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnPdf')]);
    const buf = fs.readFileSync(await dl.path()); const i = pdfInfo(buf);
    check(i.pages === 1, lang + ': PDF still exports (1 page, printed form stays English)');
  }
  await page.goto(APP + '#/'); await page.waitForSelector('#formList .card');
  await page.selectOption('#home select.langsel', 'en');
  await page.click('#formList .card'); await page.waitForSelector('#paper svg');

  // My cases, My details, suggestions, backup
  console.log('Saved cases');
  const yes = async () => { if (await page.isVisible('#confirm')) await page.click('#confirm [data-yes]'); };
  const val = k => page.inputValue('#f_' + k);
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#fields textarea');
  await page.click('#btnClear'); await yes();
  await page.click('#btnSample'); await yes();
  await page.click('#btnSaveCase'); await page.waitForTimeout(150);
  check((await page.textContent('#caseChip')).includes('Rinki vs Surinder Singh'), 'Save: case saved with a name from the parties and case no.');
  await page.fill('#f_purpose', 'For filing appeal'); await page.click('#btnSaveCase');
  check(await page.evaluate(() => CF.store.cases.all().length) === 1, 'Save again updates the same case');
  await page.click('#btnClear'); await yes();
  check(await page.isHidden('#caseChip') && (await val('plaintiff')) === '', 'New form: empty, not tied to the case');
  const chip = await page.$('[data-recent="court"] .chip');
  check(!!chip, 'suggestions of earlier values appear under fields');
  if (chip) { await chip.click(); check((await val('court')).startsWith('Sh. Parteek Gupta'), 'tapping a suggestion fills the field'); }
  await page.click('#btnCases'); await page.waitForSelector('#sheet:not([hidden]) .caserow');
  check((await page.$$('#caseList .caserow')).length === 1, 'My cases lists the saved case');
  await page.click('#caseList [data-case-open]'); await yes();
  check((await val('plaintiff')) === 'Rinki' && (await val('purpose')) === 'For filing appeal', 'Open brings back every detail');
  await page.click('#btnCases'); await page.click('#caseList [data-case-copy]'); await yes();
  check(await page.isHidden('#caseChip') && (await val('plaintiff')) === 'Rinki', 'Copy: same details as a new, unsaved case');
  await page.fill('#f_reqDate', '01.01.2027'); await page.click('#btnSaveCase');
  check(await page.evaluate(() => CF.store.cases.all().length) === 2, 'the copy saves as a second case');
  await page.click('#btnCases'); await page.fill('#caseSearch', '01.01.2027'); await page.waitForTimeout(100);
  check((await page.$$('#caseList .caserow')).length === 1, 'search finds a case by any detail');
  await page.click('#caseList [data-case-del]'); await yes();
  check(await page.evaluate(() => CF.store.cases.all().length) === 1, 'Delete removes a case');
  await page.click('[data-sheet-close]'); await page.click('#btnCases'); await page.click('#caseList [data-case-open]'); await yes();
  await page.click('#btnSaveNew');
  check(await page.evaluate(() => CF.store.cases.all().length) === 2, 'Save as a new case keeps the old case and adds a new one');
  await page.evaluate(() => { const c = CF.store.cases.all()[0]; CF.store.cases.remove(c.id); });
  await page.click('#btnCases');
  await page.click('[data-sheet-close]');
  console.log('My details');
  await page.click('#btnMine'); await page.click('#btnSaveMine');
  check((await page.textContent('#sheetBody')).includes('Mohammad Rafiq Azad'), 'Save these as my details shows what was saved'); await page.click('[data-sheet-close]');
  await page.click('#btnClear'); await yes();
  await page.click('#btnMine'); await page.click('#btnFillMine');
  check((await val('aName')).startsWith('Mohammad Rafiq Azad') && (await val('aDistrict')) === 'Jalandhar' && (await val('plaintiff')) === '', 'Fill my details fills only your own details');
  console.log('Home and backup');
  await page.goto(APP + '#/'); await page.waitForSelector('#formList .card');
  check(await page.isVisible('#recentCases') && (await page.$$('#recentList .caserow')).length === 1, 'home shows My cases');
  await page.click('#recentList .caserow'); await yes(); await page.waitForSelector('#formView:not([hidden])');
  check((await val('plaintiff')) === 'Rinki', 'a case opens from the home screen');
  await page.goto(APP + '#/'); await page.click('#btnAllCases');
  const [bk] = await Promise.all([page.waitForEvent('download'), page.click('#btnBackup')]);
  const bkFile = path.join(OUT, bk.suggestedFilename()); await bk.saveAs(bkFile);
  const bkJson = JSON.parse(fs.readFileSync(bkFile, 'utf8'));
  check(bkJson.app === 'i Court Forms' && bkJson.cases.length === 1 && !!bkJson.profile.aName, 'backup file has the cases and my details');
  const fresh = await browser.newContext(); const fp = await fresh.newPage();
  await fp.goto(APP + '#/f/nakal'); await fp.waitForSelector('#fields textarea');
  await fp.click('#btnCases'); await fp.setInputFiles('#restoreFile', bkFile); await fp.waitForTimeout(300);
  check((await fp.$$('#caseList .caserow')).length === 1 && await fp.evaluate(() => !!CF.store.profile.get().aName), 'Restore on another phone brings everything back');
  await fp.setInputFiles('#restoreFile', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') }); await fp.waitForTimeout(200);
  check((await fp.textContent('#toast')).includes('not an i Court Forms backup'), 'a wrong file is refused');
  await fresh.close();
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#paper svg');

  // phone layout
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pp = await phone.newPage();
  await pp.goto(APP); await pp.waitForSelector('#formList .card');
  await pp.screenshot({ path: path.join(OUT, 'phone-home.png') });
  await pp.click('#formList .card'); await pp.waitForSelector('#fields textarea');
  await pp.click('#btnSample'); await pp.waitForTimeout(200);
  await pp.screenshot({ path: path.join(OUT, 'phone-fill.png') });
  await pp.click('.tabs [data-tab="preview"]'); await pp.waitForTimeout(200);
  await pp.screenshot({ path: path.join(OUT, 'phone-preview.png') });
  const overflow = await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, 'phone: no sideways scrolling');
  await pp.click('#btnZoom'); await pp.waitForTimeout(200);
  const z = await pp.evaluate(() => ({ page: document.documentElement.scrollWidth > window.innerWidth + 1, paper: document.querySelector('#paper').getBoundingClientRect().width }));
  check(!z.page && z.paper > 900, 'phone: Zoom in makes the page readable (' + Math.round(z.paper) + 'px) and scrolls inside the preview only');
  const fz = await pp.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.actions .btn')).fontSize));
  check(fz >= 17, 'phone: big buttons (' + fz + 'px)');
  await phone.close();

  // offline
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(sw, 'service worker active');
  const cdp = await ctx.newCDPSession(page);
  const man = await cdp.send('Page.getAppManifest');
  check(man.errors.length === 0, 'app manifest has no errors' + (man.errors.length ? ': ' + JSON.stringify(man.errors) : ''));
  const inst = await cdp.send('Page.getInstallabilityErrors');
  check(inst.installabilityErrors.length === 0, 'browser says the web app is installable' + (inst.installabilityErrors.length ? ': ' + JSON.stringify(inst.installabilityErrors) : ''));
  await ctx.setOffline(true);
  await page.reload();
  check(await page.waitForSelector('#paper svg', { timeout: 5000 }).then(() => true, () => false), 'reload works offline');

  check(errs.length === 0, 'no errors in the page' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
  console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nAll checks passed');
  process.exit(fails.length ? 1 : 0);
})();
