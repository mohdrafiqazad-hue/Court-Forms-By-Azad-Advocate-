/* i Court Forms — Team → Activity: the usage log (js/activity.js), shown only to the owner
   (firestore.rules lets only the owner read activity/). Live: visits, people, downloads,
   visits per day, and each visit's steps. Visits older than KEEP_DAYS are deleted when the owner looks. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const t = (k, v) => CF.i18n.t(k, v);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const p2 = x => String(x).padStart(2, '0');
  const DAY = 86400000, KEEP_DAYS = 180, ONLINE = 5 * 60000, PAGE = 30;
  const ms = ts => (ts && ts.toMillis ? ts.toMillis() : 0);
  const midnight = x => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const hm = x => { const d = new Date(x); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  const dm = x => { const d = new Date(x); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1); };
  const dayLabel = x => new Date(x).toLocaleDateString(CF.i18n.lang === 'en' ? 'en-IN' : CF.i18n.lang + '-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const LANG_NAME = { en: 'English', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ' };

  let db = null, box = null, unsub = null, period = 7, visits = null, who = '', open = {}, shown = PAGE, pruned = false, err = '';

  // Is this the owner? Only the owner may read the log (rules decide).
  function check(_db, cb) { _db.collection('activity').limit(1).get().then(() => cb(true), () => cb(false)); }

  function draw(_db, el) {
    if (db !== _db || !unsub) { stop(); db = _db; listen(); }
    box = el; paint();
  }
  function stop() { if (unsub) unsub(); unsub = null; visits = null; }

  function since() { return midnight(Date.now()) - (period - 1) * DAY; }
  function listen() {
    const TS = firebase.firestore.Timestamp;
    visits = null; err = '';
    unsub = db.collection('activity').where('last', '>=', TS.fromMillis(since())).orderBy('last', 'desc').limit(2000)
      .onSnapshot(qs => { visits = qs.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })); paint(); },
        e => { console.warn('activity', e.code); err = e.code || 'error'; paint(); });
    if (!pruned) { pruned = true; prune(); }
  }
  async function prune() { // keep the log for KEEP_DAYS (as the Privacy Policy says)
    try {
      const qs = await db.collection('activity').where('last', '<', firebase.firestore.Timestamp.fromMillis(Date.now() - KEEP_DAYS * DAY)).limit(400).get();
      if (!qs.empty) { const b = db.batch(); qs.docs.forEach(d => b.delete(d.ref)); await b.commit(); }
    } catch (e) { console.warn('activity prune', e.code); }
  }

  // ------------------------------------------------------------ words for the log
  const TAP = {
    btnGoogle: 'google', btnSaveCase: 'saveCase', btnSaveNew: 'saveAsNew', btnCases: 'myCases', btnMine: 'myDetails',
    btnClients: 'clients', btnClear: 'newForm', btnFillMine: 'fillMine', btnSaveMine: 'saveMine', btnBackup: 'backup',
    btnRestore: 'restore', btnNewClient: 'newClient', btnSaveClient: 'saveClient', btnAddCase: 'addCase', btnZoom: 'zoomIn',
    btnAllCases: 'seeAll', btnReload: 'reload', btnSignOut2: 'signOut', signout: 'signOut', 'case-open': 'open',
    'case-copy': 'copyCase', 'case-del': 'del', 'case-fill': 'fillCase', 'case-save': 'saveFormCase', 'client-use': 'useAs',
    'client-edit': 'edit', 'client-del': 'del', 'ce-edit': 'edit', 'ce-del': 'del', about: 'about', 'install-btn': 'installBtn',
    'tab:preview': 'preview', 'tab:fill': 'fill', 'o:landscape': 'landscape', 'o:portrait': 'portrait', today: 'today',
    chip: 'recent', btnCaseFromForm: 'fromForm', btnClientFromForm: 'fromForm', btnCaseDone: 'done', btnCaseBack: 'back',
    btnClientBack: 'back', btnRetry: 'retry', waitWa: 'waBtn', whatsapp: 'whatsapp', call: 'call', 'sheet-close': 'close',
  };
  const formName = id => { const f = (CF.forms || []).find(x => x.id === id); return f ? CF.i18n.ft(f, f.name) : id; };
  function dlText(d) { // "nakal · landscape · pa · 18/24"
    const [f, o, l, c] = String(d).split(' · ');
    const [n, of] = String(c || '').split('/');
    return [formName(f), o ? t(o) : '', LANG_NAME[l] || l, n ? t('filled', { n, t: of }) : ''].filter(Boolean).join(' · ');
  }
  function evText(v) {
    const d = v.d || '';
    switch (v.e) {
      case 'open': return d === 'app' ? t('evOpen') + ' (' + t('evOpenApp') + ')' : t({ back: 'evBack', signin: 'evSignin', signout: 'evSignout', more: 'evMore' }[d] || 'evOpen');
      case 'screen': return d === 'home' ? t('evHome') : d === 'team' ? t('team') : d === 'login' ? t('evLogin')
        : d === 'wait' ? t('waitTitle') : d === 'offline' ? t('offTitle') : t('evForm', { x: formName(d) });
      case 'word': return t('evDl', { f: 'Word', d: dlText(d) });
      case 'pdf': return t('evDl', { f: 'PDF', d: dlText(d) });
      case 'share': return t('sharePdf') + ': ' + dlText(d);
      case 'lang': return t('language') + ': ' + (LANG_NAME[d] || d);
      case 'tap': {
        const [k, val] = d.split(':');
        if (k === 'pl') return t('printLang') + ': ' + (LANG_NAME[val] || val);
        if (k === 'lang') return t('language') + ': ' + (LANG_NAME[val] || val);
        return t('evTap', { x: TAP[d] ? t(TAP[d]) : TAP[k] ? t(TAP[k]) : d });
      }
      default: return v.e + (d ? ': ' + d : '');
    }
  }
  const isOpen = v => { const o = (v.ev || []).find(e => e.e === 'open'); return !o || !['more', 'signin', 'signout'].includes(o.d); };
  const DL = { word: 1, pdf: 1, share: 1 };
  const kindChip = k => k === 'guest' ? '' : `<span class="st ${k === 'member' ? 'approved' : k === 'guest' ? '' : k}">${esc(t({ member: 'stApproved', waiting: 'stWaiting', removed: 'stRemoved' }[k] || 'visitor'))}</span>`;

  // ------------------------------------------------------------ screen
  function paint() {
    if (!box) return;
    const seg = `<div class="seg actseg" role="group">${[[1, 'today'], [7, 'last7'], [30, 'last30']].map(([n, k]) =>
      `<button type="button" data-period="${n}" aria-pressed="${n === period}">${esc(t(k))}</button>`).join('')}</div>`;
    if (err) { box.innerHTML = seg + '<p class="err">' + esc(t('loadErr', { e: err })) + '</p>'; wire(); return; }
    if (!visits) { box.innerHTML = seg + '<p class="empty">' + esc(t('loading')) + '</p>'; wire(); return; }
    const from = since(), now = Date.now();
    const all = visits.filter(v => Math.max(v.start || 0, ms(v.last)) >= from);
    const evs = all.flatMap(v => (v.ev || []).filter(e => e.t >= from));
    const opens = all.filter(isOpen);
    const people = {};
    all.forEach(v => {
      if (!v.uid) return;
      const p = people[v.uid] = people[v.uid] || { uid: v.uid, name: v.name, email: v.email, kind: v.kind, visits: 0, dl: 0, last: 0 };
      const o = (v.ev || []).find(e => e.e === 'open');
      if (!o || o.d !== 'more') p.visits++;
      p.dl += (v.ev || []).filter(e => DL[e.e]).length;
      if (ms(v.last) > p.last) { p.last = ms(v.last); p.kind = v.kind; }
      if (v.name && (!p.name || ms(v.last) >= p.last)) p.name = v.name;
    });
    const plist = Object.values(people).sort((a, b) => b.last - a.last);
    const dls = evs.filter(e => DL[e.e]);
    const online = new Set(all.filter(v => now - ms(v.last) < ONLINE).map(v => v.uid || v.id)).size;

    const tile = (n, k, sub) => `<div class="tile"><b>${n}</b><span>${esc(t(k))}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    const word = dls.filter(e => e.e === 'word').length, pdf = dls.length - word;
    let html = seg + `<div class="tiles">
      ${tile(opens.length, 'tOpens')}
      ${tile(plist.length, 'tPeople')}
      ${tile(opens.filter(v => !v.uid).length, 'tGuests')}
      ${tile(dls.length, 'tDownloads', dls.length ? 'Word ' + word + ' · PDF ' + pdf : '')}
      ${tile(online, 'tOnline')}
    </div>`;

    if (period > 1) { // visits per day, newest first
      const days = [];
      const first = Math.max(from, midnight(Math.min(...all.map(v => v.start || ms(v.last)), now))); // no empty days before the first visit
      for (let d = midnight(now); d >= first; d -= DAY) days.push({ d, n: opens.filter(v => midnight(v.start || ms(v.last)) === midnight(d)).length });
      const max = Math.max(1, ...days.map(x => x.n));
      html += `<h2 class="list-h">${esc(t('perDay'))}</h2><div class="bars">` + days.map(x =>
        `<div class="bar" title="${esc(dayLabel(x.d) + ': ' + t('nVisits', { n: x.n }))}"><span class="bl">${esc(dayLabel(x.d))}</span><span class="bt"><i style="width:${x.n ? Math.max(2, x.n / max * 100) : 0}%"></i></span><b>${x.n}</b></div>`).join('') + '</div>';
    }

    html += `<h2 class="list-h">${esc(t('people'))}</h2>`;
    html += plist.length ? plist.map(p => `<button type="button" class="item act-person${who === p.uid ? ' on' : ''}" data-who="${esc(p.uid)}">
        <span class="who"><strong>${esc(p.name || p.email)}</strong><span>${esc(p.email)}</span></span>
        <span class="meta muted">${esc(t('nVisits', { n: p.visits }))} · ${esc(t('nDl', { n: p.dl }))} · ${esc(t('lastSeen', { t: dm(p.last) + ' ' + hm(p.last) }))}</span>
        ${kindChip(p.kind)}</button>`).join('') : `<p class="empty">${esc(t('nobody'))}</p>`;

    const list = who ? all.filter(v => (v.uid || '') === (who === '-' ? '' : who)) : all;
    const pname = who === '-' ? t('visitor') : who && people[who] ? (people[who].name || people[who].email) : '';
    html += `<div class="list-h-row"><h2 class="list-h">${esc(who ? t('visitsOf', { name: pname }) : t('visits'))}</h2>
      ${who ? `<button type="button" class="linkbtn" data-who="">${esc(t('showAll'))}</button>` : `<button type="button" class="linkbtn" data-who="-">${esc(t('visitor'))}</button>`}</div>`;
    html += list.length ? list.slice(0, shown).map(visit).join('') : `<p class="empty">${esc(t('noVisits'))}</p>`;
    if (list.length > shown) html += `<p class="center"><button type="button" class="btn sm" data-more>${esc(t('showMore'))}</button></p>`;
    box.innerHTML = html;
    wire();
  }

  function visit(v) {
    const st = v.start || ms(v.last), end = Math.max(ms(v.last), st);
    const mins = Math.max(0, Math.round((end - st) / 60000));
    const ev = (v.ev || []).slice().sort((a, b) => a.t - b.t);
    const dls = ev.filter(e => DL[e.e]).length;
    const isOn = !!open[v.id];
    return `<div class="item act-visit">
      <button type="button" class="act-head" data-visit="${esc(v.id)}" aria-expanded="${isOn}">
        <span class="who"><strong>${esc(v.uid ? (v.name || v.email) : t('visitor'))}</strong>
        <span>${esc(dm(st) + ' ' + hm(st))} · ${esc(v.device || '')}${v.app === 'installed' ? ' · ' + esc(t('evOpenApp')) : ''}</span></span>
        <span class="meta muted">${esc(t('mins', { n: mins }))} · ${esc(t('nActions', { n: ev.length }))}${dls ? ' · ' + esc(t('nDl', { n: dls })) : ''}</span>
        ${kindChip(v.kind)}
      </button>
      ${isOn ? `<ol class="steps">${ev.map(e => `<li><time>${hm(e.t)}</time><span>${esc(evText(e))}</span></li>`).join('')}</ol>` : ''}
    </div>`;
  }

  function wire() {
    box.querySelectorAll('[data-period]').forEach(b => { b.onclick = () => { period = +b.dataset.period; shown = PAGE; stop(); listen(); paint(); }; });
    box.querySelectorAll('[data-who]').forEach(b => { b.onclick = () => { who = who === b.dataset.who ? '' : b.dataset.who; shown = PAGE; paint(); }; });
    box.querySelectorAll('[data-visit]').forEach(b => { b.onclick = () => { open[b.dataset.visit] = !open[b.dataset.visit]; paint(); }; });
    const m = box.querySelector('[data-more]'); if (m) m.onclick = () => { shown += PAGE; paint(); };
  }

  CF.actView = { check, draw, stop, evText };
})();
