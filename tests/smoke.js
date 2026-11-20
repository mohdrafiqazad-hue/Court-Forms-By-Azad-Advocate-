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
  await phone.close();

  // offline
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(sw, 'service worker active');
  await ctx.setOffline(true);
  await page.reload();
  check(await page.waitForSelector('#paper svg', { timeout: 5000 }).then(() => true, () => false), 'reload works offline');

  check(errs.length === 0, 'no errors in the page' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
  console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nAll checks passed');
  process.exit(fails.length ? 1 : 0);
})();
