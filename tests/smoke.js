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

// Made-up test details (no real person or case). The app itself has no sample case.
const TEST_DATA = {
  nakal: {
    reqDate: '12.11.2026',
    nature: 'COMA - COMPLAINT ACT', caseNo: '55/2024',
    plaintiff: 'Asha Rani', defendant: 'Raj Kumar',
    claim: 'Complaint under Section 138 of the\nNegotiable Instruments Act, 1881',
    court: 'Sh. A. K. Verma, JMIC, Jalandhar\n(Original)',
    decision: 'Pending\nNext Date: 10.01.2027', purpose: 'Record',
    copies: 'Uncertified copy of the complete court file, i.e. Complaint, Affidavit, all Documents, all Orders of the Court and all Statements',
    seal: 'Through Counsel\nTest Advocate',
    aName: 'Test Advocate,\nAdvocate (Counsel)', aWork: 'Counsel',
    aProfession: 'Advocate,\nChamber No. 1,\nDistrict Courts,\nJalandhar',
    aPO: 'Jalandhar', aTehsil: 'Jalandhar', aDistrict: 'Jalandhar',
  },
  talbana: {
    court: 'IN THE COURT OF THE CIVIL JUDGE (SENIOR DIVISION), JALANDHAR', plaintiff: 'Asha Rani', defendant: 'Raj Kumar',
    subject: 'Suit for Permanent Injunction', tDate: '12.11.2026', tBy: "Plaintiff's", tPurpose: 'FOR THE SERVICE OF SUMMONS UPON DEFENDANT',
    tCount: '1', tFee: 'RS. 25/-', advName: 'Test Advocate', advChamber: 'Chamber No. 1, New Court, Jalandhar', advMobile: '90000-00000',
  },
  listdocs: {
    court: 'IN THE COURT OF CIVIL JUDGE (SENIOR DIVISION), JALANDHAR', plaintiff: 'Asha Rani', defendant: 'Raj Kumar',
    subject: 'Suit for Permanent Injunction', hearing: '10.01.2027',
    docs: 'Copy of Aadhaar Card of the plaintiff.\nFard Jamabandi for the year 2020-21 of Village Test, Khasra No. 1//2/3.\nOriginal site plan of the suit property.',
    advName: 'Test Advocate',
  },
  address: {
    court: 'THE CIVIL JUDGE (SENIOR DIVISION), JALANDHAR', plaintiff: 'Asha Rani', defendant: 'Raj Kumar', suitFor: 'Permanent Injunction', hearing: '10.01.2027',
    adName: 'Asha Rani W/o Sh. Test Kumar', adCaste: 'Test', adResident: 'House No. 1, Test Colony', adPO: 'Test', adTehsil: 'Jalandhar-1', adDistt: 'Jalandhar',
    adRemarks: 'Plaintiff.', signName: 'Asha Rani',
  },
};
// fill an input, or pick an option in a list
const set = async (p, sel, v) => ((await p.$eval(sel, el => el.tagName)) === 'SELECT' ? p.selectOption(sel, v) : p.fill(sel, v));
async function fillTest(p, formId) {
  for (const [k, v] of Object.entries(TEST_DATA[formId] || {})) await set(p, '#f_' + k, v);
  await p.waitForTimeout(150);
}

// Read one file out of a .docx (zip) without extra packages
const zipText = (buf, name) => {
  for (let i = 0; i < buf.length - 30; i++) {
    if (buf.readUInt32LE(i) !== 0x04034b50) continue;
    const method = buf.readUInt16LE(i + 8), size = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), xl = buf.readUInt16LE(i + 28);
    const fname = buf.slice(i + 30, i + 30 + nl).toString();
    const start = i + 30 + nl + xl;
    if (fname === name) { const raw = buf.slice(start, start + size); return (method === 8 ? require('zlib').inflateRawSync(raw) : raw).toString('utf8'); }
    i = start + size - 1;
  }
  return '';
};
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
    await fillTest(page, f.id);
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

  // Forms written like a Word page: one Legal page in Word and PDF, filled or blank, long lists too
  console.log('Talbana, List of Documents, Address Form');
  const dl = async (btn) => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click(btn)]); const f = path.join(OUT, 'x-' + d.suggestedFilename()); await d.saveAs(f); return { name: d.suggestedFilename(), buf: fs.readFileSync(f) }; };
  for (const id of ['talbana', 'listdocs', 'address']) {
    await page.goto(APP + '#/f/' + id); await page.waitForSelector('#paper svg');
    await page.click('#btnClear'); await page.click('#confirm [data-yes]'); await page.waitForTimeout(200);
    check(await page.isHidden('#orientSeg') && await page.isHidden('#plangSeg'), `${id}: one page format, no orientation or language switch`);
    const bw = await dl('#btnWord'), bp = await dl('#btnPdf');
    const bx = zipText(bw.buf, 'word/document.xml'), bi = pdfInfo(bp.buf);
    check(bi.pages === 1 && Math.round(bi.w) === 612 && Math.round(bi.h) === 1008, `${id}: blank form PDF is one Legal page`);
    check(/<w:pgSz w:w="12240" w:h="20160"/.test(bx) && !/hRule="atLeast"/.test(bx) && (bx.match(/<w:sectPr/g) || []).length === 1, `${id}: blank form Word is one Legal page with fixed row heights`);
    const vals = Object.values(TEST_DATA[id]).flatMap(v => v.split('\n')).filter(v => v.length > 3);
    check(!vals.some(v => bx.includes(v.replace(/&/g, '&amp;').replace(/'/g, '&apos;'))), `${id}: blank form has no particulars`);
    await fillTest(page, id); await page.waitForTimeout(300);
    const fw = await dl('#btnWord'), fp = await dl('#btnPdf');
    const fx = zipText(fw.buf, 'word/document.xml'), fi = pdfInfo(fp.buf);
    const esc = v => v.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
    const missing = vals.filter(v => !fx.includes(esc(v)) && !fx.includes(esc(v.toUpperCase())));
    check(fi.pages === 1 && Math.round(fi.w) === 612 && Math.round(fi.h) === 1008 && /^[A-Z][A-Za-z_]+_Asha_Rani_vs_Raj_Kumar\.pdf$/.test(fp.name), `${id}: filled PDF is one Legal page (${fp.name})`);
    check(!missing.length, `${id}: every particular is in the Word file` + (missing.length ? ': missing ' + missing.join(' | ') : ''));
    check(!/⚠/.test(await page.textContent('#count')), `${id}: fits on one page (no warning)`);
    if (id !== 'address') check(/w:ascii="Nirmala UI"/.test(fx) && /ਫ/.test(fx), `${id}: Punjabi headings in Nirmala UI, as in the owner's file`);
    else check(/w:ascii="Times New Roman"/.test(fx) && /ADDRESS FORM/.test(fx) && fp.buf.toString('latin1').includes('/Times-BoldItalic'), 'address: Times New Roman, "ADDRESS FORM" in bold italics, vector PDF');
  }
  // List of Documents: numbers are added, and 30 long documents still make one page
  await page.goto(APP + '#/f/listdocs'); await page.waitForSelector('#paper svg');
  check(/>1\.<\/text>/.test(await page.innerHTML('#paper')) && /Copy of Aadhaar Card/.test(await page.innerHTML('#paper')), 'list: documents are numbered 1., 2., …');
  await page.fill('#f_docs', Array.from({ length: 30 }, (_, i) => `Certified copy of the test document number ${i + 1} dated 01.01.2026 about the suit land, Village Test.`).join('\n'));
  await page.waitForTimeout(400);
  const lw = await dl('#btnWord'), lp = await dl('#btnPdf');
  check(pdfInfo(lp.buf).pages === 1 && !/⚠/.test(await page.textContent('#count')) && /document number 30 /.test(zipText(lw.buf, 'word/document.xml')), 'list: 30 documents still fit on one page (smaller text)');
  // Address: the top heading can be left out; "Other" in a list prints what is typed
  await page.goto(APP + '#/f/address'); await page.waitForSelector('#paper svg');
  await page.selectOption('#f_topHead', 'no'); await page.waitForTimeout(300);
  check(!/Important Forms/.test(await page.innerHTML('#paper')), 'address: "Important Forms" heading can be left out');
  await page.selectOption('#f_suitFor', { index: (await page.$$eval('#f_suitFor option', o => o.length)) - 1 });
  await page.fill('#f_suitFor_own', 'Recovery of Rs. 50,000'); await page.waitForTimeout(400);
  check(/Recovery of Rs. 50,000/.test(await page.innerHTML('#paper')), 'address: "Other" kind of suit prints what is typed');
  await page.selectOption('#f_topHead', ''); await page.click('#btnClear'); await page.click('#confirm [data-yes]');

  // languages: English / हिंदी / ਪੰਜਾਬੀ
  console.log('Languages');
  const dictOk = await page.evaluate(() => Object.entries(CF.i18n.dict).filter(([k, v]) => k !== 'typeEnglish' && (v.length !== 3 || v.some(x => !x))).map(([k]) => k));
  check(dictOk.length === 0, 'every interface text has English, Hindi and Punjabi' + (dictOk.length ? ': missing ' + dictOk.join(', ') : ''));
  const formTr = await page.evaluate(() => CF.forms.map(f => {
    const need = new Set([f.name, f.desc, f.court]);
    f.fields.forEach(x => { if (x.group) need.add(x.group); if (x.label) need.add(x.label); if (x.hint) need.add(x.hint); (x.options || []).slice(0, x.optionsAsIs ? 1 : undefined).forEach(o => need.add(o[1])); });
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
  // Nature of Case: list of case types + optional case number
  console.log('Case type list');
  const paper = () => page.$$eval('#paper text', els => els.map(e => e.textContent).join(' | '));
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#fields textarea');
  await page.click('#btnClear'); await yes();
  const nOpts = await page.$$eval('#f_nature option', o => o.length);
  check(nOpts === 66, 'Nature of Case is a list of all case types (' + (nOpts - 1) + ')');
  await page.selectOption('#f_nature', 'BA - BAIL APPLICATION'); await page.waitForTimeout(250);
  check((await paper()).includes('BAIL') && !(await paper()).includes('Case No.'), 'type only: just the type is printed');
  await page.fill('#f_caseNo', '12/2026'); await page.waitForTimeout(250);
  check((await paper()).includes('Case No. BA/12/2026'), 'type + number: “Case No. BA/12/2026” printed');
  await page.fill('#f_caseNo', 'BA/12/2026'); await page.waitForTimeout(250);
  check((await paper()).includes('Case No. BA/12/2026') && !(await paper()).includes('BA/BA'), 'code typed with the number is not doubled');
  await page.selectOption('#f_nature', 'TRAFFIC'); await page.fill('#f_caseNo', '7/2026'); await page.waitForTimeout(250);
  check((await paper()).includes('Case No. 7/2026'), 'type without a code: number printed as typed');
  await page.evaluate(() => localStorage.setItem('cf-form-nakal-v1', JSON.stringify({ data: { nature: 'Civil Suit\nCase No. CS/1/2020', purpose: 'For filing appeal' }, orient: 'landscape' })));
  await page.reload(); await page.waitForSelector('#paper svg');
  check((await val('nature')) === 'Civil Suit\nCase No. CS/1/2020' && (await paper()).includes('CS/1/2020'), 'a nature typed before the list is kept and printed');
  // Purpose: list + Other (type it yourself)
  check((await val('purpose')) !== 'For filing appeal' && await page.isVisible('#f_purpose_own') && (await page.inputValue('#f_purpose_own')) === 'For filing appeal', 'Purpose typed before shows under Other');
  const pOpts = await page.$$eval('#f_purpose option', o => o.map(x => x.textContent));
  check(pOpts.length === 12 && pOpts.includes('Personal Record') && pOpts.includes('Office Use') && pOpts[11].startsWith('Other'), 'Purpose is a list of 10 purposes + Other');
  await page.selectOption('#f_purpose', 'High Court'); await page.waitForTimeout(250);
  check(!(await page.isVisible('#f_purpose_own')) && (await paper()).includes('High Court') && !(await paper()).includes('For filing appeal'), 'picking a purpose prints it, the typing box hides');
  await page.selectOption('#f_purpose', { index: 11 });
  check(await page.isVisible('#f_purpose_own') && await page.evaluate(() => document.activeElement.id) === 'f_purpose_own', 'Other opens a box to type');
  await page.fill('#f_purpose_own', 'For Supreme Court'); await page.waitForTimeout(250);
  check((await paper()).includes('For Supreme Court') && !(await paper()).includes('High Court'), 'typed purpose is printed');
  await page.reload(); await page.waitForSelector('#paper svg');
  check((await page.inputValue('#f_purpose_own')) === 'For Supreme Court' && await page.isVisible('#f_purpose_own'), 'typed purpose is kept after reopening');

  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#fields textarea');
  await page.click('#btnClear'); await yes();
  await fillTest(page, 'nakal');
  await page.click('#btnSaveCase'); await page.waitForTimeout(150);
  check((await page.textContent('#caseChip')).includes('Asha Rani vs Raj Kumar'), 'Save: case saved with a name from the parties and case no.');
  await page.selectOption('#f_purpose', 'Appeal'); await page.click('#btnSaveCase');
  check(await page.evaluate(() => CF.store.cases.all().length) === 1, 'Save again updates the same case');
  await page.click('#btnClear'); await yes();
  check(await page.isHidden('#caseChip') && (await val('plaintiff')) === '', 'New form: empty, not tied to the case');
  const chip = await page.$('[data-recent="court"] .chip');
  check(!!chip, 'suggestions of earlier values appear under fields');
  if (chip) { await chip.click(); check((await val('court')).startsWith('Sh. A. K. Verma'), 'tapping a suggestion fills the field'); }
  await page.click('#btnCases'); await page.waitForSelector('#sheet:not([hidden]) .caserow');
  check((await page.$$('#caseList .caserow')).length === 1, 'My cases lists the saved case');
  await page.click('#caseList [data-case-open]'); await yes();
  check((await val('plaintiff')) === 'Asha Rani' && (await val('purpose')) === 'Appeal', 'Open brings back every detail');
  await page.click('#btnCases'); await page.click('#caseList [data-case-copy]'); await yes();
  check(await page.isHidden('#caseChip') && (await val('plaintiff')) === 'Asha Rani', 'Copy: same details as a new, unsaved case');
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
  // The printed form in Punjabi / Hindi
  console.log('Printed form in Punjabi / Hindi');
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#paper svg');
  await page.click('#btnClear'); await yes(); await fillTest(page, 'nakal');
  check((await page.$$eval('#plangSeg [data-pl]', b => b.map(x => x.textContent).join(' '))) === 'English ਪੰਜਾਬੀ हिंदी', 'form language buttons: English, ਪੰਜਾਬੀ, हिंदी');
  for (const [l, word, cs, name, purpose] of [['pa', 'ਕੋਰਟ ਫ਼ੀਸ', 'Raavi', 'Punjabi', 'ਰਿਕਾਰਡ'], ['hi', 'कोर्ट फ़ीस', 'Mangal', 'Hindi', 'रिकॉर्ड']]) {
    await page.click(`#plangSeg [data-pl="${l}"]`); await page.waitForTimeout(700);
    const pv = await paper();
    check(pv.includes(word) && pv.includes('Asha Rani') && pv.includes(purpose) && !pv.includes('Court Fee'), `${name}: preview headings in ${name}, details as typed, purpose word translated`);
    check(await page.evaluate(() => [...document.fonts].some(f => f.family.includes('Noto Serif') && f.status === 'loaded')), `${name}: bundled font loaded`);
    for (const o of ['landscape', 'portrait']) {
      await page.click(`#orientSeg [data-o="${o}"]`); await page.waitForTimeout(250);
      const [dp] = await Promise.all([page.waitForEvent('download'), page.click('#btnPdf')]);
      const pb = fs.readFileSync(await dp.path()); const i = pdfInfo(pb);
      const land = o === 'landscape';
      check(i.pages === 1 && Math.round(i.w) === (land ? 1008 : 612) && /\/Subtype\s*\/Image/.test(pb.toString('latin1')) && dp.suggestedFilename().endsWith('_' + name + '.pdf'),
        `${name} ${o} PDF: 1 page ${i.w}×${i.h}, page drawn with the ${name} font (${dp.suggestedFilename()})`);
      const [dw] = await Promise.all([page.waitForEvent('download'), page.click('#btnWord')]);
      const xml = zipText(fs.readFileSync(await dw.path()), 'word/document.xml');
      check(xml.includes(word) && xml.includes('w:cs="' + cs + '"') && dw.suggestedFilename().endsWith('_' + name + '.docx'), `${name} ${o} Word: ${name} text with the ${cs} font`);
    }
  }
  await page.reload(); await page.waitForSelector('#paper svg');
  check(await page.getAttribute('#plangSeg [data-pl="hi"]', 'aria-pressed') === 'true', 'form language is remembered');
  await page.click('#plangSeg [data-pl="en"]'); await page.waitForTimeout(250);
  check((await paper()).includes('Court Fee') && (await paper()).includes('FORM FOR COPIES'), 'English again: English form');
  const [de] = await Promise.all([page.waitForEvent('download'), page.click('#btnPdf')]);
  const eb = fs.readFileSync(await de.path());
  check(!/\/Subtype\s*\/Image/.test(eb.toString('latin1')) && !de.suggestedFilename().includes('Punjabi'), 'English PDF stays vector text, as before');
  await page.fill('#f_plaintiff', 'ਆਸ਼ਾ ਰਾਣੀ'); await page.waitForTimeout(250);
  const [dg] = await Promise.all([page.waitForEvent('download'), page.click('#btnPdf')]);
  check(/\/Subtype\s*\/Image/.test(fs.readFileSync(await dg.path()).toString('latin1')), 'English form with a name typed in Punjabi: printed correctly');
  await page.fill('#f_plaintiff', 'Asha Rani');

  console.log('My details');
  await page.click('#btnMine'); await page.click('#btnSaveMine');
  check((await page.textContent('#sheetBody')).includes('Test Advocate'), 'Save these as my details shows what was saved'); await page.click('[data-sheet-close]');
  await page.click('#btnClear'); await yes();
  await page.click('#btnMine'); await page.click('#btnFillMine');
  check((await val('aName')).startsWith('Test Advocate') && (await val('aDistrict')) === 'Jalandhar' && (await val('plaintiff')) === '', 'Fill my details fills only your own details');
  console.log('Home and backup');
  await page.goto(APP + '#/'); await page.waitForSelector('#formList .card');
  check(await page.isVisible('#recentCases') && (await page.$$('#recentList .caserow')).length === 1, 'home shows My cases');
  await page.click('#recentList .caserow'); await yes(); await page.waitForSelector('#formView:not([hidden])');
  check((await val('plaintiff')) === 'Asha Rani', 'a case opens from the home screen');
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

  // Client book
  console.log('Client book');
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#fields textarea');
  await page.click('#btnClear'); await yes();
  await page.click('#btnClients'); await page.waitForSelector('#sheet:not([hidden])');
  check((await page.textContent('#clientList')).includes('No clients yet'), 'empty client book says how to start');
  await page.click('#btnNewClient');
  await page.click('#btnSaveClient');
  check((await page.textContent('#toast')).includes('client’s name'), 'a client needs a name');
  const cf = { name: 'Gurpreet Singh', father: 'Harbans Singh', occupation: 'Farmer', address: 'H.No. 12, Model Town\nJalandhar', po: 'Model Town', ps: 'Division No. 6', tehsil: 'Jalandhar-I', district: 'Jalandhar', phone: '9800000001' };
  for (const [k, v] of Object.entries(cf)) await page.fill(`#sheetBody [data-ck="${k}"]`, v);
  await page.click('#btnSaveClient');
  check((await page.$$('#clientList .caserow')).length === 1, 'client saved in the client book');
  await page.click('#clientList [data-client-use][data-target="0"]');
  check((await val('plaintiff')) === 'Gurpreet Singh', 'client fills Plaintiff in one tap');
  await page.click('#btnClients'); await page.click('#clientList [data-client-use][data-target="2"]');
  check((await val('aName')) === 'Gurpreet Singh' && (await val('aFather')) === 'Harbans Singh' && (await val('aPS')) === 'Division No. 6' && (await val('aProfession')).includes('Model Town'), 'client fills the applicant address block');
  await page.click('#btnClients'); await page.click('#clientList [data-client-edit]');
  await page.fill('#sheetBody [data-ck="phone"]', '9800000002'); await page.click('#btnSaveClient');
  check(await page.evaluate(() => CF.store.clients.all()[0].phone) === '9800000002' && await page.evaluate(() => CF.store.clients.all().length) === 1, 'Edit updates the same client');
  await page.click('#btnNewClient'); await page.click('#btnClientFromForm');
  check((await page.inputValue('#sheetBody [data-ck="name"]')) === 'Gurpreet Singh', '“Take from this form” copies the applicant into a new client');
  await page.click('#btnClientBack');
  await page.fill('#clientSearch', 'zzz'); await page.waitForTimeout(80);
  check((await page.textContent('#clientList')).includes('No case matches') || (await page.$$('#clientList .caserow')).length === 0, 'client search filters');
  await page.fill('#clientSearch', ''); await page.click('#clientList [data-client-del]'); await yes();
  check(await page.evaluate(() => CF.store.clients.all().length) === 0, 'Delete removes the client');
  await page.click('[data-sheet-close]');

  // Client's cases → one tap fills the form
  console.log("Client's cases");
  await page.click('#btnClear'); await yes();
  await fillTest(page, 'nakal');
  await page.click('#btnClients'); await page.click('#btnNewClient');
  await page.fill('#sheetBody [data-ck="name"]', 'Asha Rani'); await page.fill('#sheetBody [data-ck="father"]', 'Mohan Lal');
  await page.click('#btnAddCase'); await page.click('#btnCaseFromForm');
  check((await page.inputValue('#sheetBody [data-kk="nature"]')) === 'COMA - COMPLAINT ACT' && (await page.inputValue('#sheetBody [data-kk="caseNo"]')) === '55/2024', 'case editor takes the case particulars from the form');
  await page.click('#btnCaseDone');
  check((await page.$$('#sheetBody .ccases.edit .ccase')).length === 1, 'case added to the client');
  await page.click('#btnAddCase');
  await page.selectOption('#sheetBody [data-kk="nature"]', 'CS - CIVIL SUIT'); await page.fill('#sheetBody [data-kk="caseNo"]', '77/2025'); await page.fill('#sheetBody [data-kk="plaintiff"]', 'Asha Rani');
  await page.fill('#sheetBody [data-kk="defendant"]', 'Kamal Kumar'); await page.fill('#sheetBody [data-kk="court"]', 'Sh. Amit Sharma, Civil Judge (Jr. Div.), Jalandhar');
  await page.fill('#sheetBody [data-kk="decision"]', 'Decided on 05.10.2026'); await page.click('#btnCaseDone');
  await page.click('#btnSaveClient');
  check(await page.evaluate(() => CF.store.clients.all()[0].cases.length) === 2, 'client saved with 2 cases');
  await page.click('[data-sheet-close]');
  await page.click('#btnClear'); await yes();
  await page.click('#btnClients');
  check((await page.$$('#clientList [data-case-fill]')).length === 2, 'client book shows the client’s cases with “Fill this case”');
  await page.click('#clientList [data-case-fill] >> nth=0');
  check((await val('nature')) === 'COMA - COMPLAINT ACT' && (await val('caseNo')) === '55/2024' && (await val('plaintiff')) === 'Asha Rani' && (await val('defendant')) === 'Raj Kumar'
    && (await val('court')).startsWith('Sh. A. K. Verma') && (await val('decision')).startsWith('Pending'), 'one tap fills every case particular');
  await page.click('#btnClients'); await page.click('#clientList [data-case-fill] >> nth=1');
  check((await val('nature')) === 'CS - CIVIL SUIT' && (await val('caseNo')) === '77/2025' && (await val('defendant')) === 'Kamal Kumar' && (await val('claim')) === '' && (await val('decision')) === 'Decided on 05.10.2026',
    'filling another case replaces the old particulars (empty ones cleared)');
  await page.selectOption('#f_nature', 'CRM - CRIMINAL MISC APPLICATION'); await page.fill('#f_caseNo', '9/2026'); await page.fill('#f_defendant', 'State of Punjab');
  await page.click('#btnClients'); await page.click('#clientList [data-case-save]');
  check(await page.evaluate(() => CF.store.clients.all()[0].cases.length) === 3, '“Save this form’s case here” adds the form’s case');
  await page.fill('#clientSearch', 'CRM/9/2026'); await page.waitForTimeout(80);
  check((await page.$$('#clientList .caserow')).length === 1, 'search finds a client by case number');
  await page.fill('#clientSearch', '');
  await page.click('#clientList [data-client-edit]'); await page.click('#sheetBody [data-ce-edit="2"]');
  await page.fill('#sheetBody [data-kk="place"]', 'Jalandhar'); await page.click('#btnCaseDone');
  await page.click('#sheetBody [data-ce-del="1"]'); await yes();
  await page.click('#btnSaveClient');
  const cc = await page.evaluate(() => CF.store.clients.all()[0].cases);
  check(cc.length === 2 && cc[1].place === 'Jalandhar', 'cases can be edited and deleted');
  check(await page.evaluate(() => CF.store.backup.make().clients[0].cases.length) === 2, 'backup keeps the client’s cases');
  check(await page.evaluate(() => !('sign' in CF.store) && !CF.store.cases.dated) && await page.$('#nextRow') === null && await page.$('#homeDates') === null, 'next date and signature features are gone');
  await page.click('[data-sheet-close]');

  // Logo, splash and About
  console.log('Logo and About');
  await page.goto(APP + '#/'); await page.reload({ waitUntil: 'domcontentloaded' });
  check(await page.$('#splash img[src="icons/logo-512.png"]') !== null, 'splash with the logo shows while the app opens');
  await page.waitForSelector('#splash', { state: 'detached', timeout: 5000 }).catch(() => {});
  check(await page.$('#splash') === null, 'splash goes away by itself');
  check(await page.getAttribute('#home .brand-sm img', 'src') === 'icons/logo-512.png', 'logo in the top bar');
  await page.click('#home .aboutcard'); await page.waitForSelector('#sheet:not([hidden]) .founder');
  const ab = await page.textContent('#sheetBody');
  check(ab.includes('Mohammad Rafiq Azad, Advocate') && ab.includes('Chamber No. 786 & 92, District & Sessions Court, Jalandhar, Punjab') && ab.includes('7009646869'), 'About shows the founder, chamber and mobile');
  check(await page.getAttribute('#sheetBody .founder a[href^="tel:"]', 'href') === 'tel:+917009646869', 'tap-to-call link');
  await page.click('[data-sheet-close]');
  await page.goto(APP + '#/f/nakal'); await page.waitForSelector('#paper svg');

  // Old "Sample case" left on a phone is cleaned once
  console.log('Sample removed');
  check(await page.$('#btnSample') === null, 'no Sample case button');
  const old = await browser.newContext(); const op = await old.newPage();
  await op.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    const d = { nature: 'Criminal (Misc.) - Domestic Violence Complaint\nCase No. COMA/102/2022', plaintiff: 'Rinki', defendant: 'Surinder Singh' };
    localStorage.setItem('cf-form-nakal-v1', JSON.stringify({ data: d, orient: 'landscape' }));
    localStorage.setItem('icf-cases-v1', JSON.stringify([{ id: 's1', formId: 'nakal', title: 'old sample', data: d }, { id: 'u1', formId: 'nakal', title: 'mine', data: { plaintiff: 'Somebody' } }]));
    localStorage.setItem('icf-history-v1', JSON.stringify({ nakal: { plaintiff: ['Rinki'] } }));
    localStorage.setItem('seeded', '1');
  });
  await op.goto(APP + '#/f/nakal'); await op.waitForSelector('#fields textarea');
  const left = await op.evaluate(() => ({ draft: localStorage.getItem('cf-form-nakal-v1'), cases: JSON.parse(localStorage.getItem('icf-cases-v1')).map(c => c.id), hist: localStorage.getItem('icf-history-v1') }));
  check(!(left.draft || '').includes('Rinki') && left.cases.join() === 'u1' && !left.hist, 'old sample draft, saved copy and suggestions removed; own cases kept');
  check((await op.inputValue('#f_plaintiff')) === '', 'form opens empty');
  await old.close();

  // phone layout
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pp = await phone.newPage();
  await pp.goto(APP); await pp.waitForSelector('#formList .card');
  await pp.screenshot({ path: path.join(OUT, 'phone-home.png') });
  await pp.click('#formList .card'); await pp.waitForSelector('#fields textarea');
  await fillTest(pp, 'nakal');
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
