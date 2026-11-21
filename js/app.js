/* i Court Forms — app shell: home list, form screen, autosave, export. */
(function () {
  'use strict';
  const CF = window.CF, E = CF.engine;
  const $ = s => document.querySelector(s);
  const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const t = (k, v) => CF.i18n.t(k, v);
  const ft = (f, s) => CF.i18n.ft(f, s); // a form's own words in the chosen language

  // Forms the owner plans to add (names only — formats come from the printed forms).
  const PLANNED = ['Vakalatnama', 'Memo of Appearance', 'Exemption Application', 'Adjournment Application', 'Personal Bond', 'Surety Bond'];

  const ICON_DOC = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M6 2.8h8.2L19 7.6v13.6H6z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M14 2.8v5h5M9 12h7M9 15.5h7M9 19h4"/></svg>';
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';

  let form = null, data = {}, orient = 'portrait', caseId = null, pendingCase = null;
  const storeKey = f => 'cf-form-' + f.id + '-v1';
  const land = () => orient === 'landscape';
  const S = CF.store;
  const p2 = x => String(x).padStart(2, '0');
  const fmtDate = ms => { const d = new Date(ms); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); };

  function load(f) {
    data = {}; orient = f.defaultOrient || f.orientations[0]; caseId = null;
    try {
      const s = JSON.parse(localStorage.getItem(storeKey(f)) || 'null');
      if (s) { data = s.data || {}; if (f.orientations.includes(s.orient)) orient = s.orient; caseId = s.caseId || null; }
    } catch (e) { /* storage unavailable */ }
    if (caseId && !S.cases.get(caseId)) caseId = null; // case was deleted
  }
  const save = () => { try { localStorage.setItem(storeKey(form), JSON.stringify({ data, orient, caseId })); } catch (e) { /* ignore */ } };
  const keysOf = f => f.fields.filter(x => x.key).map(x => x.key);
  const hasData = () => Object.values(data).some(v => String(v || '').trim());

  // ------------------------------------------------------------ home
  function showHome() {
    form = null;
    $('#formView').hidden = true; $('#home').hidden = false;
    document.title = 'i Court Forms';
    $('#formList').innerHTML = CF.forms.map(f =>
      `<a class="card" href="#/f/${f.id}"><span class="ic">${ICON_DOC}</span><span class="card-body"><strong>${escH(ft(f, f.name))}</strong><span>${escH(ft(f, f.desc))}</span><em>${escH(ft(f, f.court))}</em></span>${ICON_CHEV}</a>`).join('');
    const have = new Set(CF.forms.map(f => f.name.toLowerCase()));
    $('#planned').innerHTML = PLANNED.filter(n => !have.has(n.toLowerCase())).map(n => `<li>${ICON_DOC}<span>${escH(t(n))}</span><em>${escH(t('soon'))}</em></li>`).join('');
    paintHomeCases();
    window.scrollTo(0, 0);
  }

  function paintHomeCases() {
    const recent = S.cases.all();
    $('#recentCases').hidden = !recent.length;
    $('#recentList').innerHTML = recent.slice(0, 4).map(c => caseRow(c)).join('');
  }

  // ------------------------------------------------------------ form screen
  function openForm(f) {
    form = f; load(f);
    if (pendingCase && pendingCase.c.formId === f.id) { useCase(pendingCase.c, pendingCase.copy, true); }
    pendingCase = null;
    $('#home').hidden = true; $('#formView').hidden = false;
    setTab('fill'); paintForm();
    window.scrollTo(0, 0);
  }

  // Titles, orientation buttons and fields in the chosen language (values are kept)
  function paintForm() {
    const f = form;
    document.title = ft(f, f.name) + ' — i Court Forms';
    $('#fTitle').textContent = ft(f, f.name);
    $('#fSub').textContent = ft(f, f.desc) + ' · ' + ft(f, f.court);
    $('#orientSeg').innerHTML = f.orientations.map(o => `<button type="button" data-o="${o}">${escH(t(o))}</button>`).join('');
    $('#orientSeg').hidden = f.orientations.length < 2;
    const note = t('typeEnglish');
    $('#typeEn').textContent = note; $('#typeEn').hidden = !note;
    buildFields(); fillInputs(); render(); paintChip();
  }
  function paintChip() {
    const c = caseId && S.cases.get(caseId);
    $('#caseChip').hidden = !c;
    if (c) $('#caseChip').innerHTML = `<span>${escH(t('editingCase', { name: c.title }))}</span><button type="button" class="linkbtn" id="btnSaveNew">${escH(t('saveAsNew'))}</button>`;
  }

  function buildFields() {
    let html = '';
    const en = CF.i18n.lang === 'en';
    for (const f of form.fields) {
      if (f.group) { html += `<h3>${escH(ft(form, f.group))}</h3>`; continue; }
      const id = 'f_' + f.key;
      const today = f.today ? `<button type="button" class="linkbtn" data-today="${f.key}">${escH(t('today'))}</button>` : '';
      const label = ft(form, f.label);
      const orig = !en && label !== f.label ? `<small class="en-label">${escH(f.label)}</small>` : '';
      html += `<label class="fld" for="${id}"><span>${escH(label)}${today}</span>${orig}`;
      if (f.type === 'choice') html += `<select id="${id}" data-k="${f.key}">${f.options.map(o => `<option value="${escH(o[0])}">${escH(ft(form, o[1]))}</option>`).join('')}</select>`;
      else if (f.type === 'area') html += `<textarea id="${id}" data-k="${f.key}" rows="${f.rows || 2}" autocapitalize="sentences"></textarea>`;
      else html += `<input id="${id}" data-k="${f.key}" type="text" placeholder="${escH(f.placeholder || '')}" autocapitalize="words">`;
      if (f.hint) html += `<small>${escH(ft(form, f.hint))}</small>`;
      html += `</label>`;
      if (f.type !== 'choice') html += `<div class="recent" data-recent="${f.key}" hidden></div>`;
    }
    $('#fields').innerHTML = html;
    paintRecent();
  }
  // One-tap suggestions: values used before in this field (from saved cases and exports)
  function paintRecent() {
    document.querySelectorAll('#fields [data-recent]').forEach(el => {
      const k = el.dataset.recent;
      const cur = String(data[k] || '').trim();
      const vals = S.history.get(form.id, k).filter(v => v !== cur).slice(0, 4);
      el.hidden = !vals.length;
      el.innerHTML = vals.length ? `<span>${escH(t('recent'))}</span>` + vals.map((v, i) =>
        `<button type="button" class="chip" data-chip="${escH(k)}" data-i="${i}" title="${escH(v)}">${escH(v.replace(/\s*\n\s*/g, ' · ').slice(0, 42))}${v.length > 42 ? '…' : ''}</button>`).join('') : '';
    });
  }
  const remember = () => S.history.add(form.id, data, keysOf(form).filter(k => (form.fields.find(x => x.key === k) || {}).type !== 'choice'));
  function fillInputs() {
    for (const f of form.fields) if (f.key) { const el = document.getElementById('f_' + f.key); if (el) el.value = data[f.key] || ''; }
  }

  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(render, 120); };
  function render() {
    if (!form) return;
    const ops = E.layout(form, form.build(data));
    $('#paper').innerHTML = E.svg(form, ops, land());
    $('#formView').classList.toggle('portrait', !land());
    document.querySelectorAll('#orientSeg [data-o]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === orient)));
    const keys = form.fields.filter(f => f.key);
    $('#count').textContent = t('filled', { n: keys.filter(f => String(data[f.key] || '').trim()).length, t: keys.length });
  }

  function setTab(t) {
    $('#formView').dataset.tab = t;
    document.querySelectorAll('.tabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
  }

  // ------------------------------------------------------------ files
  let dlCap; // optional host download capability (e.g. when embedded); null = plain browser download
  const dlReady = (window.claude && typeof window.claude.use === 'function')
    ? window.claude.use('downloads').then(n => (dlCap = n), () => (dlCap = null))
    : Promise.resolve(dlCap = null);

  async function saveFile(name, blob) {
    await dlReady;
    if (dlCap) {
      try { await dlCap.save({ filename: name, data: blob }); toast(t('saved', { f: name })); }
      catch (e) { toast(t(e && e.code === 'declined' ? 'dlCancel' : 'dlFail')); }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t('saved', { f: name }));
  }

  const makePdf = () => E.pdf(form, E.layout(form, form.build(data)), land());
  const makeDocx = () => E.docx(form, form.build(data), land());
  const base = () => form.fileBase(data, orient);

  async function busy(btn, fn, failMsg) {
    btn.disabled = true;
    try { await fn(); } catch (e) { if (!(e && e.name === 'AbortError')) { console.error(e); toast(failMsg); } }
    btn.disabled = false;
  }

  // Web Share with files (Android Chrome, iOS Safari) — send the PDF straight to WhatsApp etc.
  const canShareFiles = (() => {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] })); }
    catch (e) { return false; }
  })();

  // ------------------------------------------------------------ small UI helpers
  let tt = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }
  function confirmBox(msg) {
    return new Promise(res => {
      const d = $('#confirm'); d.querySelector('p').textContent = msg; d.hidden = false;
      const done = v => { d.hidden = true; res(v); };
      d.querySelector('[data-yes]').onclick = () => done(true);
      d.querySelector('[data-no]').onclick = () => done(false);
    });
  }
  const todayStr = () => { const n = new Date(); const p = x => String(x).padStart(2, '0'); return p(n.getDate()) + '.' + p(n.getMonth() + 1) + '.' + n.getFullYear(); };


  // ------------------------------------------------------------ My cases, My details, backup
  function caseRow(c, opts = {}) {
    const f = CF.forms.find(x => x.id === c.formId);
    const meta = (f ? ft(f, f.name) + ' · ' : '') + t('savedOn', { d: fmtDate(c.updatedAt) });
    const acts = opts.actions
      ? `<div class="acts"><button type="button" class="btn sm primary" data-case-open="${escH(c.id)}">${escH(t('open'))}</button><button type="button" class="btn sm" data-case-copy="${escH(c.id)}">${escH(t('copyCase'))}</button><button type="button" class="btn sm danger" data-case-del="${escH(c.id)}">${escH(t('del'))}</button></div>`
      : '';
    const tag = opts.actions ? 'div' : 'button type="button"';
    const end = opts.actions ? 'div' : 'button';
    return `<${tag} class="caserow" ${opts.actions ? '' : `data-case-open="${escH(c.id)}"`}><span class="ic">${ICON_DOC}</span><span class="cr-body"><strong>${escH(c.title)}</strong><span>${escH(meta)}</span></span>${opts.actions ? '' : ICON_CHEV}${acts}</${end}>`;
  }

  function useCase(c, copy, quiet) {
    data = { ...c.data };
    if (c.orient && form.orientations.includes(c.orient)) orient = c.orient;
    caseId = copy ? null : c.id;
    save();
    if (!quiet) { fillInputs(); render(); paintRecent(); paintChip(); }
    if (copy) toast(t('copied'));
  }
  async function openCase(id, copy) {
    const c = S.cases.get(id); if (!c) return;
    closeSheet();
    if (form && form.id === c.formId) {
      if (caseId !== c.id && hasData() && !(await confirmBox(t('confirmReplace')))) return;
      useCase(c, copy); window.scrollTo(0, 0); return;
    }
    pendingCase = { c, copy };
    if (location.hash === '#/f/' + c.formId) route(); else location.hash = '#/f/' + c.formId;
  }

  function saveCase(asNew) {
    if (asNew === true) caseId = null;
    const title = (form.caseTitle && form.caseTitle(data)) || t('untitled', { d: fmtDate(Date.now()) });
    const existing = caseId && S.cases.get(caseId);
    const rec = S.cases.put({ id: existing ? caseId : undefined, formId: form.id, title, data, orient });
    if (!rec) { toast(t('saveFail')); return; }
    caseId = rec.id; save(); remember(); paintRecent(); paintChip();
    toast(t(existing ? 'caseUpdated' : 'caseSaved'));
  }

  // Bottom sheet (phone) / dialog (computer)
  function openSheet(title, html) {
    $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; $('#sheet').hidden = false;
    document.body.classList.add('sheet-open');
  }
  function closeSheet() { $('#sheet').hidden = true; document.body.classList.remove('sheet-open'); }

  let sheetMode = null; // 'form' = this form's cases, 'all' = every case
  function showCases(mode) {
    sheetMode = mode;
    openSheet(t('myCases'), `<input type="search" class="sheet-search" id="caseSearch" placeholder="${escH(t('search'))}" autocomplete="off">
      <div id="caseList" class="caselist"></div>
      <p class="small muted sheet-note">${escH(t('deviceNote'))}</p>
      <div class="sheet-row"><button type="button" class="btn sm" id="btnBackup">${escH(t('backup'))}</button><button type="button" class="btn sm" id="btnRestore">${escH(t('restore'))}</button></div>`);
    paintCases('');
    $('#caseSearch').addEventListener('input', e => paintCases(e.target.value));
  }
  function paintCases(q) {
    const all = sheetMode === 'form' && form ? S.cases.forForm(form.id) : S.cases.all();
    const needle = q.trim().toLowerCase();
    const list = needle ? all.filter(c => (c.title + ' ' + Object.values(c.data).join(' ')).toLowerCase().includes(needle)) : all;
    $('#caseList').innerHTML = list.length ? list.map(c => caseRow(c, { actions: true })).join('')
      : `<p class="empty">${escH(t(all.length ? 'noMatch' : 'noCases'))}</p>`;
  }

  function showMine() {
    const prof = S.profile.get();
    const pf = form.fields.filter(x => x.profile);
    const saved = pf.filter(x => String(prof[x.key] || '').trim());
    const list = saved.length
      ? `<dl class="mine">${saved.map(x => `<dt>${escH(ft(form, x.label))}</dt><dd>${escH(prof[x.key]).replace(/\n/g, '<br>')}</dd>`).join('')}</dl>`
      : `<p class="note">${escH(t('mineEmpty'))}</p>`;
    openSheet(t('myDetails'), `<p class="small muted">${escH(t('mineHelp'))}</p>${list}
      <div class="sheet-row"><button type="button" class="btn primary" id="btnFillMine" ${saved.length ? '' : 'disabled'}>${escH(t('fillMine'))}</button>
      <button type="button" class="btn" id="btnSaveMine">${escH(t('saveMine'))}</button></div>`);
  }

  function wireCases() {
    $('#btnSaveCase').addEventListener('click', () => saveCase(false));
    $('#caseChip').addEventListener('click', e => { if (e.target.closest('#btnSaveNew')) saveCase(true); });
    $('#btnCases').addEventListener('click', () => showCases('form'));
    $('#btnAllCases').addEventListener('click', () => showCases('all'));
    $('#btnMine').addEventListener('click', showMine);
    $('#sheet').addEventListener('click', async e => {
      if (e.target === $('#sheet') || e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.caseOpen) openCase(b.dataset.caseOpen, false);
      else if (b.dataset.caseCopy) openCase(b.dataset.caseCopy, true);
      else if (b.dataset.caseDel) {
        const c = S.cases.get(b.dataset.caseDel); if (!c) return;
        if (!(await confirmBox(t('confirmDel', { name: c.title })))) return;
        S.cases.remove(c.id);
        if (caseId === c.id) { caseId = null; save(); paintChip(); }
        toast(t('deleted')); paintCases($('#caseSearch').value);
        if (!$('#home').hidden) paintHomeCases();
      } else if (b.id === 'btnFillMine') {
        const prof = S.profile.get();
        for (const x of form.fields.filter(x => x.profile)) if (String(prof[x.key] || '').trim()) data[x.key] = prof[x.key];
        save(); fillInputs(); render(); paintRecent(); closeSheet(); toast(t('mineFilled'));
      } else if (b.id === 'btnSaveMine') {
        const pf = form.fields.filter(x => x.profile);
        const vals = {}; pf.forEach(x => { if (String(data[x.key] || '').trim()) vals[x.key] = data[x.key]; });
        if (!Object.keys(vals).length) { toast(t('mineNone', { fields: pf.slice(0, 3).map(x => ft(form, x.label)).join(', ') })); return; }
        S.profile.set({ ...S.profile.get(), ...vals }); toast(t('mineSaved')); showMine();
      } else if (b.id === 'btnBackup') {
        const blob = new Blob([JSON.stringify(S.backup.make(), null, 1)], { type: 'application/json' });
        const d = new Date(); saveFile('i-court-forms-backup-' + d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + '.json', blob);
      } else if (b.id === 'btnRestore') $('#restoreFile').click();
    });
    $('#restoreFile').addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = '';
      if (!file) return;
      try {
        const n = S.backup.restore(JSON.parse(await file.text()));
        toast(t('restored', { n }));
        if (!$('#sheet').hidden) paintCases($('#caseSearch') ? $('#caseSearch').value : '');
        if (!$('#home').hidden) paintHomeCases();
      } catch (err) { console.warn(err); toast(t('badBackup')); }
    });
    $('#fields').addEventListener('click', e => {
      const c = e.target.closest('[data-chip]'); if (!c) return;
      const k = c.dataset.chip; const cur = String(data[k] || '').trim();
      const v = S.history.get(form.id, k).filter(x => x !== cur)[Number(c.dataset.i)];
      if (v == null) return;
      data[k] = v; save(); fillInputs(); render(); paintRecent();
    });
    $('#recentList').addEventListener('click', e => { const b = e.target.closest('[data-case-open]'); if (b) openCase(b.dataset.caseOpen, false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });
    CF.i18n.onChange(() => { if (!$('#sheet').hidden) closeSheet(); });
  }

  // ------------------------------------------------------------ wiring
  function init() {
    const fields = $('#fields');
    const onEdit = e => { const k = e.target.dataset.k; if (!k || !form) return; data[k] = e.target.value; save(); schedule(); };
    fields.addEventListener('input', onEdit);
    fields.addEventListener('change', onEdit);
    fields.addEventListener('click', e => {
      const k = e.target.dataset && e.target.dataset.today; if (!k) return;
      e.preventDefault(); data[k] = todayStr(); save(); fillInputs(); render();
    });
    $('#orientSeg').addEventListener('click', e => { const o = e.target.dataset.o; if (!o) return; orient = o; save(); render(); });
    // Preview zoom (mainly for phones): bigger page, scroll with a finger; tap the page to switch too
    const setZoom = on => {
      $('#stage').classList.toggle('zoomed', on);
      $('#btnZoom').setAttribute('aria-pressed', String(on));
      $('#btnZoom [data-zoom-label]').textContent = t(on ? 'zoomFit' : 'zoomIn');
    };
    $('#btnZoom').addEventListener('click', () => setZoom(!$('#stage').classList.contains('zoomed')));
    $('#paper').addEventListener('click', () => { if (!$('#stage').classList.contains('zoomed')) setZoom(true); });
    CF.i18n.onChange(() => setZoom($('#stage').classList.contains('zoomed')));
    setZoom(false);
    document.querySelectorAll('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => { setTab(b.dataset.tab); window.scrollTo(0, 0); }));

    $('#btnWord').addEventListener('click', e => busy(e.currentTarget, async () => { remember(); return saveFile(base() + '.docx', await makeDocx()); }, t('wordFail')));
    $('#btnPdf').addEventListener('click', e => busy(e.currentTarget, async () => { remember(); return saveFile(base() + '.pdf', makePdf()); }, t('pdfFail')));
    $('#btnShare').hidden = !canShareFiles;
    $('#btnShare').addEventListener('click', e => busy(e.currentTarget, async () => {
      const file = new File([makePdf()], base() + '.pdf', { type: 'application/pdf' });
      await navigator.share({ files: [file], title: form.name });
    }, t('shareFail')));

    $('#btnSample').addEventListener('click', async () => {
      if (Object.values(data).some(v => String(v || '').trim()) && !(await confirmBox(t('confirmSample', { label: form.sampleLabel })))) return;
      data = { ...form.sample }; caseId = null; save(); fillInputs(); render(); paintRecent(); paintChip();
    });
    $('#btnClear').addEventListener('click', async () => {
      if (!(await confirmBox(t('confirmClear')))) return;
      data = {}; caseId = null; save(); fillInputs(); render(); paintRecent(); paintChip();
    });
    wireCases();

    window.addEventListener('hashchange', route);
    CF.i18n.onChange(() => { // language switched: redraw what is on screen
      if (form) paintForm(); else if (!$('#home').hidden) showHome();
    });
    route();
  }

  function route() {
    if (CF.locked) return; // the sign-in / approval gate is showing
    if (/^#\/team\b/.test(location.hash) && CF.team && CF.team.allowed()) {
      form = null; $('#home').hidden = true; $('#formView').hidden = true; CF.team.show(); return;
    }
    if (CF.team) CF.team.hide();
    const m = location.hash.match(/^#\/f\/([\w-]+)/);
    const f = m && CF.forms.find(x => x.id === m[1]);
    if (f) { if (f !== form) openForm(f); } else showHome();
  }

  // The gate (js/gate.js) calls showApp() once the user is signed in with an active membership.
  let started = false;
  CF.showApp = () => { if (!started) { started = true; init(); } else { form = null; route(); } };
  CF.hideApp = () => { form = null; $('#home').hidden = true; $('#formView').hidden = true; if (CF.team) CF.team.hide(); };
  CF.toast = toast; CF.confirmBox = confirmBox;
  CF.route = () => route();
  const boot = () => { if (!CF.gated) CF.showApp(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
