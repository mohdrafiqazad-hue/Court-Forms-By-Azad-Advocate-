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
  const ICON_USER = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/></svg>';
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
  // the form data plus the signature / stamp picture for forms that can print it
  const withImg = () => ({ ...data, __img: S.sign.combo() });

  // ------------------------------------------------------------ home
  function showHome() {
    form = null;
    $('#formView').hidden = true; $('#home').hidden = false;
    document.title = 'i Court Forms';
    $('#formList').innerHTML = CF.forms.map(f =>
      `<a class="card" href="#/f/${f.id}"><span class="ic">${ICON_DOC}</span><span class="card-body"><strong>${escH(ft(f, f.name))}</strong><span>${escH(ft(f, f.desc))}</span><em>${escH(ft(f, f.court))}</em></span>${ICON_CHEV}</a>`).join('');
    const have = new Set(CF.forms.map(f => f.name.toLowerCase()));
    $('#planned').innerHTML = PLANNED.filter(n => !have.has(n.toLowerCase())).map(n => `<li>${ICON_DOC}<span>${escH(t(n))}</span><em>${escH(t('soon'))}</em></li>`).join('');
    paintHomeCases(); paintHomeDates();
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
    paintNext();
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
    const ops = E.layout(form, form.build(withImg()));
    $('#paper').innerHTML = E.svg(form, ops, land());
    $('#formView').classList.toggle('portrait', !land());
    document.querySelectorAll('#orientSeg [data-o]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === orient)));
    const keys = form.fields.filter(f => f.key && !f.setting); // settings (e.g. signature on/off) are not form boxes
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

  const makePdf = () => E.pdf(form, E.layout(form, form.build(withImg())), land());
  const makeDocx = () => E.docx(form, form.build(withImg()), land());
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
      <button type="button" class="btn" id="btnSaveMine">${escH(t('saveMine'))}</button></div>${signTiles()}`);
  }

  function wireCases() {
    $('#btnSaveCase').addEventListener('click', () => saveCase(false));
    $('#caseChip').addEventListener('click', e => { if (e.target.closest('#btnSaveNew')) saveCase(true); });
    $('#btnCases').addEventListener('click', () => showCases('form'));
    $('#btnAllCases').addEventListener('click', () => showCases('all'));
    $('#btnMine').addEventListener('click', showMine);
    $('#btnClients').addEventListener('click', showClients);
    $('#btnDiary').addEventListener('click', showDiary);
    $('#dateList').addEventListener('click', e => { const b = e.target.closest('[data-case-open]'); if (b) openCase(b.dataset.caseOpen, false); });
    $('#btnSaveDate').addEventListener('click', () => {
      if (!caseId) return;
      const v = $('#nextDate').value;
      if (!v) { $('#nextDate').focus(); return; }
      S.cases.setNext(caseId, v, $('#nextNote').value.trim()); paintNext(); toast(t('dateSaved'));
    });
    $('#btnClearDate').addEventListener('click', () => { if (!caseId) return; S.cases.setNext(caseId, '', ''); paintNext(); toast(t('dateRemoved')); });
    let signPart = 'sig';
    $('#signFile').addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = '';
      if (!file) return;
      try { await setSignPart(signPart, await cleanPhoto(file)); } catch (err) { console.warn(err); toast(t('photoBad')); }
    });
    $('#sheet').addEventListener('click', async e => {
      if (e.target === $('#sheet') || e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.clientUse) { useClient(b.dataset.clientUse, Number(b.dataset.target)); return; }
      if (b.dataset.clientEdit) { editClient(CL.get(b.dataset.clientEdit)); return; }
      if (b.dataset.clientDel) {
        const c = CL.get(b.dataset.clientDel); if (!c) return;
        if (!(await confirmBox(t('confirmDel', { name: c.name })))) return;
        CL.remove(c.id); toast(t('deleted')); paintClients($('#clientSearch') ? $('#clientSearch').value : ''); return;
      }
      if (b.id === 'btnNewClient') { editClient(null); return; }
      if (b.id === 'btnClientBack') { showClients(); return; }
      if (b.id === 'btnClientFromForm') {
        const tg = (form.clientTargets || []).find(x => x.fromForm);
        for (const [fk, ck] of Object.entries(tg.map)) { const el = $(`#sheetBody [data-ck="${ck}"]`); if (el && String(data[fk] || '').trim()) el.value = data[fk]; }
        return;
      }
      if (b.id === 'btnSaveClient') {
        const vals = {}; document.querySelectorAll('#sheetBody [data-ck]').forEach(el => { vals[el.dataset.ck] = el.value.trim(); });
        if (!vals.name) { toast(t('needName')); $('#sheetBody [data-ck="name"]').focus(); return; }
        if (!CL.put({ ...clientEdit, ...vals })) { toast(t('saveFail')); return; }
        toast(t('clientSaved')); showClients(); return;
      }
      if (b.dataset.signAdd) { signPart = b.dataset.signAdd; $('#signFile').click(); return; }
      if (b.dataset.signDel) { await setSignPart(b.dataset.signDel, ''); return; }
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


  // ------------------------------------------------------------ Client book
  const CL = S.clients;
  const CLIENT_LABEL = { name: 'cName', father: 'cFather', occupation: 'cOccupation', address: 'cAddress', po: 'cPo', ps: 'cPs', tehsil: 'cTehsil', district: 'cDistrict', phone: 'cPhone', notes: 'cNotes' };
  let clientEdit = null; // client being edited in the sheet

  function showClients() {
    clientEdit = null;
    openSheet(t('clientBook'), `<div class="sheet-row top"><input type="search" class="sheet-search" id="clientSearch" placeholder="${escH(t('searchClients'))}" autocomplete="off"><button type="button" class="btn primary sm" id="btnNewClient">+ ${escH(t('newClient'))}</button></div>
      <div id="clientList" class="caselist"></div>
      <p class="small muted sheet-note">${escH(t('deviceNote'))}</p>`);
    paintClients('');
    $('#clientSearch').addEventListener('input', e => paintClients(e.target.value));
  }
  function paintClients(q) {
    const all = CL.all(); const n = q.trim().toLowerCase();
    const list = n ? all.filter(c => CL.KEYS.map(k => c[k]).join(' ').toLowerCase().includes(n)) : all;
    const targets = (form && form.clientTargets) || [];
    $('#clientList').innerHTML = list.length ? list.map(c => {
      const sub = [c.father && (t('cFather') + ': ' + c.father), c.phone].filter(Boolean).join(' · ');
      const use = targets.length ? `<div class="use"><span>${escH(t('useAs'))}</span>${targets.map((tg, i) =>
        `<button type="button" class="chip" data-client-use="${escH(c.id)}" data-target="${i}">${escH(ft(form, tg.label))}</button>`).join('')}</div>` : '';
      return `<div class="caserow client"><span class="ic person">${ICON_USER}</span><span class="cr-body"><strong>${escH(c.name)}</strong><span>${escH(sub || (c.address || '').split('\n')[0])}</span></span>
        ${use}<div class="acts"><button type="button" class="btn sm" data-client-edit="${escH(c.id)}">${escH(t('edit'))}</button><button type="button" class="btn sm danger" data-client-del="${escH(c.id)}">${escH(t('del'))}</button></div></div>`;
    }).join('') : `<p class="empty">${escH(t(all.length ? 'noMatch' : 'noClients'))}</p>`;
  }
  function editClient(c) {
    clientEdit = c || {};
    const from = form && (form.clientTargets || []).find(x => x.fromForm);
    openSheet(c && c.id ? c.name : t('newClient'), `<div class="clientform">${CL.KEYS.map(k => {
      const multi = k === 'address' || k === 'notes';
      const v = escH(clientEdit[k] || '');
      return `<label class="fld"><span>${escH(t(CLIENT_LABEL[k]))}</span>${multi ? `<textarea data-ck="${k}" rows="3">${v}</textarea>` : `<input data-ck="${k}" type="${k === 'phone' ? 'tel' : 'text'}" value="${v}" autocapitalize="words">`}</label>`;
    }).join('')}</div>
      <div class="sheet-row"><button type="button" class="btn primary" id="btnSaveClient">${escH(t('saveClient'))}</button>
      ${from ? `<button type="button" class="btn" id="btnClientFromForm">${escH(t('fromForm'))}</button>` : ''}
      <button type="button" class="btn" id="btnClientBack">${escH(t('back'))}</button></div>`);
  }
  function useClient(id, ti) {
    const c = CL.get(id); const tg = form && (form.clientTargets || [])[ti]; if (!c || !tg) return;
    for (const [fk, ck] of Object.entries(tg.map)) if (String(c[ck] || '').trim()) data[fk] = c[ck];
    save(); fillInputs(); render(); paintRecent(); closeSheet(); toast(t('clientFilled', { name: c.name }));
  }

  // ------------------------------------------------------------ Diary: next dates
  const isoToday = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const isoShow = iso => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '';
  const dayDiff = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(...isoToday().split('-').map((v, i) => i === 1 ? v - 1 : +v))) / 86400000);
  const whenLabel = iso => { const n = dayDiff(iso); return n === 0 ? t('today') : n === 1 ? t('tomorrow') : n > 1 ? t('inDays', { n }) : t('daysAgo', { n: -n }); };
  const calLink = c => {
    const d = c.nextDate.replace(/-/g, '');
    const next = new Date(Date.UTC(+c.nextDate.slice(0, 4), +c.nextDate.slice(5, 7) - 1, +c.nextDate.slice(8, 10) + 1));
    const d2 = next.getUTCFullYear() + p2(next.getUTCMonth() + 1) + p2(next.getUTCDate());
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(c.title)
      + '&dates=' + d + '/' + d2 + '&details=' + encodeURIComponent((c.nextNote ? c.nextNote + ' — ' : '') + 'i Court Forms');
  };
  function dateRow(c) {
    const n = dayDiff(c.nextDate);
    const cls = n === 0 ? 'today' : n === 1 ? 'soon' : n < 0 ? 'past' : '';
    return `<button type="button" class="caserow daterow" data-case-open="${escH(c.id)}"><span class="datebox ${cls}"><b>${escH(c.nextDate.slice(8, 10))}</b><small>${escH(c.nextDate.slice(5, 7))}/${escH(c.nextDate.slice(2, 4))}</small></span>
      <span class="cr-body"><strong>${escH(c.title)}</strong><span>${escH(whenLabel(c.nextDate))}${c.nextNote ? ' · ' + escH(c.nextNote) : ''}</span></span>${ICON_CHEV}</button>`;
  }
  function paintHomeDates() {
    const up = S.cases.dated().filter(c => c.nextDate >= isoToday());
    $('#homeDates').hidden = !S.cases.dated().length;
    $('#dateList').innerHTML = up.length ? up.slice(0, 5).map(dateRow).join('') : `<p class="empty small">${escH(t('noDates'))}</p>`;
  }
  function showDiary() {
    const all = S.cases.dated(); const today = isoToday();
    const up = all.filter(c => c.nextDate >= today), past = all.filter(c => c.nextDate < today).reverse().slice(0, 30);
    openSheet(t('diary'), all.length
      ? `<h3 class="sheet-h">${escH(t('upcoming'))}</h3><div class="caselist">${up.map(dateRow).join('') || `<p class="empty small">—</p>`}</div>
         ${past.length ? `<h3 class="sheet-h">${escH(t('pastDates'))}</h3><div class="caselist">${past.map(dateRow).join('')}</div>` : ''}`
      : `<p class="empty">${escH(t('noDates'))}</p>`);
  }
  function paintNext() {
    const c = caseId && S.cases.get(caseId);
    $('#nextRow').hidden = !c;
    if (!c) return;
    $('#nextDate').value = c.nextDate || '';
    $('#nextNote').value = c.nextNote || '';
    $('#calLink').hidden = !c.nextDate; $('#btnClearDate').hidden = !c.nextDate;
    if (c.nextDate) $('#calLink').href = calLink(c);
    $('#nextWhen').textContent = c.nextDate ? whenLabel(c.nextDate) : '';
  }

  // ------------------------------------------------------------ Signature & stamp photos
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  // White paper → transparent, keep the ink colour, crop to the ink
  async function cleanPhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const im = await loadImg(url);
      const sc = Math.min(1, 700 / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(1, Math.round(im.naturalWidth * sc)), h = Math.max(1, Math.round(im.naturalHeight * sc));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
      const id = cx.getImageData(0, 0, w, h), d = id.data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const a = l >= 200 ? 0 : l <= 120 ? 255 : Math.round((200 - l) / 80 * 255);
        d[i + 3] = Math.min(d[i + 3], a);
        if (d[i + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) throw new Error('empty');
      cx.putImageData(id, 0, 0);
      const m = 4; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
      const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
      out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      return out.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }
  const turn = (cv, ccw) => {
    const o = document.createElement('canvas'); o.width = cv.height; o.height = cv.width;
    const c = o.getContext('2d');
    if (ccw) { c.translate(0, o.height); c.rotate(-Math.PI / 2); } else { c.translate(o.width, 0); c.rotate(Math.PI / 2); }
    c.drawImage(cv, 0, 0); return o.toDataURL('image/png');
  };
  // Stamp and signature side by side, plus copies turned 90° each way for rotated cells / landscape pages
  async function makeCombo(sig, stamp) {
    const srcs = [stamp, sig].filter(Boolean); if (!srcs.length) return null;
    const ims = await Promise.all(srcs.map(loadImg));
    const H = 200, gap = 14;
    const ws = ims.map(i => Math.max(1, Math.round(i.naturalWidth * H / i.naturalHeight)));
    const cv = document.createElement('canvas'); cv.width = ws.reduce((a, b) => a + b, 0) + gap * (ims.length - 1); cv.height = H;
    const cx = cv.getContext('2d'); let x = 0;
    ims.forEach((im, i) => { cx.drawImage(im, x, 0, ws[i], H); x += ws[i] + gap; });
    return { r0: cv.toDataURL('image/png'), r90: turn(cv, true), rm90: turn(cv, false), w: cv.width, h: cv.height };
  }
  async function setSignPart(part, dataUrl) {
    const cur = S.sign.get();
    const next = { sig: cur.sig || '', stamp: cur.stamp || '', [part]: dataUrl };
    next.combo = await makeCombo(next.sig, next.stamp);
    if (!S.sign.set(next)) { toast(t('saveFail')); return; }
    toast(t(dataUrl ? 'photoSaved' : 'deleted'));
    if (form) render();
    if (!$('#sheet').hidden) showMine();
  }
  function signTiles() {
    const sg = S.sign.get();
    const tile = (part, key) => `<div class="signtile"><span class="small muted">${escH(t(key))}</span>
      <div class="signprev">${sg[part] ? `<img src="${sg[part]}" alt="">` : ''}</div>
      <div class="sheet-row"><button type="button" class="btn sm" data-sign-add="${part}">${escH(t(sg[part] ? 'edit' : 'addPhoto'))}</button>${sg[part] ? `<button type="button" class="btn sm danger" data-sign-del="${part}">${escH(t('remove'))}</button>` : ''}</div></div>`;
    return `<h3 class="sheet-h">${escH(t('signTitle'))}</h3><p class="small muted">${escH(t('signHelp'))}</p><div class="signgrid">${tile('sig', 'signature')}${tile('stamp', 'stamp')}</div>`;
  }

  // ------------------------------------------------------------ wiring
  function init() {
    const fields = $('#fields');
    const onEdit = e => {
      const k = e.target.dataset.k; if (!k || !form) return;
      data[k] = e.target.value; save(); schedule();
      if (k === 'useSign' && e.type === 'change' && data[k] === 'yes' && !S.sign.combo()) toast(t('noSign'));
    };
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
    if (!$('#sheet').hidden) closeSheet(); // moving to another screen closes an open sheet
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
