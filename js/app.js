/* i Court Forms — app shell: home list, form screen, autosave, export. */
(function () {
  'use strict';
  const CF = window.CF, E = CF.engine;
  const $ = s => document.querySelector(s);
  const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Forms the owner plans to add (names only — formats come from the printed forms).
  const PLANNED = ['Vakalatnama', 'Memo of Appearance', 'Exemption Application', 'Adjournment Application', 'Personal Bond', 'Surety Bond'];

  let form = null, data = {}, orient = 'portrait';
  const storeKey = f => 'cf-form-' + f.id + '-v1';
  const land = () => orient === 'landscape';

  function load(f) {
    data = {}; orient = f.defaultOrient || f.orientations[0];
    try {
      const s = JSON.parse(localStorage.getItem(storeKey(f)) || 'null');
      if (s) { data = s.data || {}; if (f.orientations.includes(s.orient)) orient = s.orient; }
    } catch (e) { /* storage unavailable */ }
  }
  const save = () => { try { localStorage.setItem(storeKey(form), JSON.stringify({ data, orient })); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------ home
  function showHome() {
    form = null;
    $('#formView').hidden = true; $('#home').hidden = false;
    document.title = 'i Court Forms';
    $('#formList').innerHTML = CF.forms.map(f =>
      `<a class="card" href="#/f/${f.id}"><strong>${escH(f.name)}</strong><span>${escH(f.desc)}</span><em>${escH(f.court)}</em></a>`).join('');
    const have = new Set(CF.forms.map(f => f.name.toLowerCase()));
    $('#planned').innerHTML = PLANNED.filter(n => !have.has(n.toLowerCase())).map(n => `<li>${escH(n)}</li>`).join('');
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ form screen
  function openForm(f) {
    form = f; load(f);
    $('#home').hidden = true; $('#formView').hidden = false;
    document.title = f.name + ' — i Court Forms';
    $('#fTitle').textContent = f.name;
    $('#fSub').textContent = f.desc + ' · ' + f.court;
    $('#orientSeg').innerHTML = f.orientations.map(o => `<button type="button" data-o="${o}">${o[0].toUpperCase() + o.slice(1)}</button>`).join('');
    $('#orientSeg').hidden = f.orientations.length < 2;
    buildFields(); fillInputs(); setTab('fill'); render();
    window.scrollTo(0, 0);
  }

  function buildFields() {
    let html = '';
    for (const f of form.fields) {
      if (f.group) { html += `<h3>${escH(f.group)}</h3>`; continue; }
      const id = 'f_' + f.key;
      const today = f.today ? `<button type="button" class="linkbtn" data-today="${f.key}">Today</button>` : '';
      html += `<label class="fld" for="${id}"><span>${escH(f.label)}${today}</span>`;
      if (f.type === 'choice') html += `<select id="${id}" data-k="${f.key}">${f.options.map(o => `<option value="${escH(o[0])}">${escH(o[1])}</option>`).join('')}</select>`;
      else if (f.type === 'area') html += `<textarea id="${id}" data-k="${f.key}" rows="${f.rows || 2}" autocapitalize="sentences"></textarea>`;
      else html += `<input id="${id}" data-k="${f.key}" type="text" placeholder="${escH(f.placeholder || '')}" autocapitalize="words">`;
      if (f.hint) html += `<small>${escH(f.hint)}</small>`;
      html += `</label>`;
    }
    $('#fields').innerHTML = html;
  }
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
    $('#count').textContent = keys.filter(f => String(data[f.key] || '').trim()).length + ' of ' + keys.length + ' filled';
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
      try { await dlCap.save({ filename: name, data: blob }); toast('Saved: ' + name); }
      catch (e) { toast(e && e.code === 'declined' ? 'Download cancelled' : 'Could not save the file here'); }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Saved: ' + name);
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
    document.querySelectorAll('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => { setTab(b.dataset.tab); window.scrollTo(0, 0); }));

    $('#btnWord').addEventListener('click', e => busy(e.currentTarget, async () => saveFile(base() + '.docx', await makeDocx()), 'Word export failed'));
    $('#btnPdf').addEventListener('click', e => busy(e.currentTarget, async () => saveFile(base() + '.pdf', makePdf()), 'PDF export failed'));
    $('#btnShare').hidden = !canShareFiles;
    $('#btnShare').addEventListener('click', e => busy(e.currentTarget, async () => {
      const file = new File([makePdf()], base() + '.pdf', { type: 'application/pdf' });
      await navigator.share({ files: [file], title: form.name });
    }, 'Could not share the PDF'));

    $('#btnSample').addEventListener('click', async () => {
      if (Object.values(data).some(v => String(v || '').trim()) && !(await confirmBox('Replace what you have typed with the sample case (' + form.sampleLabel + ')?'))) return;
      data = { ...form.sample }; save(); fillInputs(); render();
    });
    $('#btnClear').addEventListener('click', async () => {
      if (!(await confirmBox('Clear every field and start a new form?'))) return;
      data = {}; save(); fillInputs(); render();
    });

    window.addEventListener('hashchange', route);
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
