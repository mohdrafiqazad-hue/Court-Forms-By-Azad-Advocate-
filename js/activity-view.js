/* i Court Forms — Team → Activity: the usage log (js/activity.js), shown only to the owner
   (firestore.rules lets only the owner read activity/). Live: people who came, app opens, approved
   members (all, with their use), forms opened / downloaded, services used (counts and people),
   visits per day and each visit's steps; tap a person to see all of it for them alone. Visits older than KEEP_DAYS are deleted when the owner looks. */
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

  let db = null, box = null, ctx = null, unsub = null, period = 7, visits = null, who = '', open = {}, shown = PAGE, pruned = false, err = '';

  // Is this the owner? Only the owner may read the log (rules decide).
  function check(_db, cb) { _db.collection('activity').limit(1).get().then(() => cb(true), () => cb(false)); }

  // ctx.people = everyone who signed in, from the Team lists: [{ uid, name, email, state: waiting|approved|removed }]
  function draw(_db, el, _ctx) {
    if (db !== _db || !unsub) { stop(); db = _db; listen(); }
    box = el; ctx = _ctx || null; paint();
  }
  function stop() { if (unsub) unsub(); unsub = null; visits = null; }

  function since() { return midnight(Date.now()) - (period - 1) * DAY; }
  function listen() {
    const TS = firebase.firestore.Timestamp;
    visits = null; err = '';
    unsub = db.collection('activity').where('last', '>=', TS.fromMillis(since())).orderBy('last', 'desc').limit(period > 30 ? 5000 : 2000)
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

  // Services (features) used: taps, downloads and language choices, grouped by what was used
  const NOISE = { close: 1, 'sheet-close': 1, back: 1, btnCaseBack: 1, btnClientBack: 1, btnRetry: 1, btnCaseDone: 1, link: 1, btnGoogle: 1, btnSignOut2: 1, signout: 1, waitWa: 1 };
  function featOf(e) {
    const d = e.d || '';
    if (e.e === 'word') return ['word', t('fWord')];
    if (e.e === 'pdf') return ['pdf', t('fPdf')];
    if (e.e === 'share') return ['share', t('sharePdf')];
    if (e.e === 'lang') return ['lang:' + d, t('language') + ': ' + (LANG_NAME[d] || d)];
    if (e.e !== 'tap') return null;
    const [k, val] = d.split(':');
    if (NOISE[d] || NOISE[k] || k === 'go' || k === 'lang') return null;   // navigation; app language is counted from 'lang'
    if (k === 'pl') return [d, t('printLang') + ': ' + (LANG_NAME[val] || val)];
    return [d, TAP[d] ? t(TAP[d]) : TAP[k] ? t(TAP[k]) : d];
  }
  const pk = v => v.uid || v.dev || v.id;                 // one person: account, else device, else the visit
  const NOT_FORM = { home: 1, team: 1, login: 1, wait: 1, offline: 1 };
  const countBars = rows => { // [{ label, n, sub }] → bar rows, biggest first
    const max = Math.max(1, ...rows.map(r => r.n));
    return '<div class="bars">' + rows.map(r => `<div class="bar wide" title="${esc(r.label + ': ' + r.n)}"><span class="bl">${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span><span class="bt"><i style="width:${r.n ? Math.max(2, r.n / max * 100) : 0}%"></i></span><b>${r.n}</b></div>`).join('') + '</div>';
  };

  // ------------------------------------------------------------ screen
  function paint() {
    if (!box) return;
    const seg = `<div class="seg actseg" role="group">${[[1, 'today'], [7, 'last7'], [30, 'last30'], [KEEP_DAYS, 'allTime']].map(([n, k]) =>
      `<button type="button" data-period="${n}" aria-pressed="${n === period}">${esc(t(k))}</button>`).join('')}</div>`;
    if (err) { box.innerHTML = seg + '<p class="err">' + esc(t('loadErr', { e: err })) + '</p>'; wire(); return; }
    if (!visits) { box.innerHTML = seg + '<p class="empty">' + esc(t('loading')) + '</p>'; wire(); return; }
    const from = since(), now = Date.now();
    const inPeriod = visits.filter(v => Math.max(v.start || 0, ms(v.last)) >= from);
    // People of this period (signed in), with their counts
    const people = {};
    inPeriod.forEach(v => {
      if (!v.uid) return;
      const p = people[v.uid] = people[v.uid] || { uid: v.uid, name: v.name, email: v.email, kind: v.kind, visits: 0, dl: 0, last: 0 };
      const o = (v.ev || []).find(e => e.e === 'open');
      if (!o || o.d !== 'more') p.visits++;
      p.dl += (v.ev || []).filter(e => DL[e.e] && e.t >= from).length;
      if (ms(v.last) > p.last) { p.last = ms(v.last); p.kind = v.kind; }
      if (v.name && (!p.name || ms(v.last) >= p.last)) p.name = v.name;
    });
    const team = ctx && ctx.people;                       // everyone who ever signed in (from the Team lists)
    const byUid = {}; (team || []).forEach(u => { byUid[u.uid] = u; });
    const nameOf = uid => (people[uid] && (people[uid].name || people[uid].email)) || (byUid[uid] && (byUid[uid].name || byUid[uid].email)) || uid;

    // "Showing only" one person: every count below is for them
    const all = !who ? inPeriod : inPeriod.filter(v => (who === '-' ? !v.uid : v.uid === who));
    const evs = all.flatMap(v => (v.ev || []).filter(e => e.t >= from));
    const opens = all.filter(isOpen);
    const dls = evs.filter(e => DL[e.e]);
    const word = dls.filter(e => e.e === 'word').length, pdf = dls.filter(e => e.e === 'pdf').length;
    const online = new Set(all.filter(v => now - ms(v.last) < ONLINE).map(pk)).size;
    const approved = (team || []).filter(u => u.state === 'approved');

    const tile = (n, k, sub) => `<div class="tile"><b>${n}</b><span>${esc(t(k))}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    let html = seg;
    if (who) html += `<p class="actfilter">${esc(t('showingOnly', { name: who === '-' ? t('visitor') : nameOf(who) }))} <button type="button" class="linkbtn" data-who="">${esc(t('showAll'))}</button></p>`;
    html += `<div class="tiles">
      ${tile(new Set(all.map(pk)).size, 'tPeopleAll')}
      ${tile(opens.length, 'tOpens')}
      ${!who && team ? tile(approved.length, 'tMembers', t('tMembersSub', { n: approved.filter(u => people[u.uid]).length })) : ''}
      ${!who ? tile(new Set(all.filter(v => !v.uid).map(pk)).size, 'tGuests') : ''}
      ${tile(dls.length, 'tDownloads', dls.length ? 'Word ' + word + ' · PDF ' + pdf + (dls.length - word - pdf ? ' · ' + t('sharePdf') + ' ' + (dls.length - word - pdf) : '') : '')}
      ${tile(online, 'tOnline')}
    </div>`;

    if (period > 1) { // visits per day, newest first
      const days = [];
      const first = Math.max(from, midnight(Math.min(...all.map(v => v.start || ms(v.last)), now))); // no empty days before the first visit
      for (let d = midnight(now); d >= first; d -= DAY) days.push({ d, n: opens.filter(v => midnight(v.start || ms(v.last)) === midnight(d)).length });
      const max = Math.max(1, ...days.map(x => x.n));
      html += `<h2 class="list-h">${esc(t('perDay'))}</h2><div class="bars days">` + days.map(x =>
        `<div class="bar" title="${esc(dayLabel(x.d) + ': ' + t('nVisits', { n: x.n }))}"><span class="bl">${esc(dayLabel(x.d))}</span><span class="bt"><i style="width:${x.n ? Math.max(2, x.n / max * 100) : 0}%"></i></span><b>${x.n}</b></div>`).join('') + '</div>';
    }

    // Forms: how often each form was opened and downloaded, by how many people
    const forms = {};
    const F = id => (forms[id] = forms[id] || { id, open: 0, word: 0, pdf: 0, share: 0, who: new Set() });
    (CF.forms || []).forEach(f => F(f.id));
    all.forEach(v => (v.ev || []).forEach(e => {
      if (e.t < from) return;
      if (e.e === 'screen' && e.d && !NOT_FORM[e.d]) { F(e.d).open++; F(e.d).who.add(pk(v)); }
      if (DL[e.e]) { const f = F(String(e.d).split(' · ')[0]); f[e.e]++; f.who.add(pk(v)); }
    }));
    html += `<h2 class="list-h">${esc(t('formsUsed'))}</h2><div class="ftable">` + Object.values(forms).sort((a, b) => (b.open + b.word + b.pdf) - (a.open + a.word + a.pdf)).map(f =>
      `<div class="frow"><strong>${esc(formName(f.id))}</strong><span class="muted">${esc(t('nPeople', { n: f.who.size }))}</span>
        <div class="fnums"><span><b>${f.open}</b>${esc(t('colOpened'))}</span><span><b>${f.word}</b>Word</span><span><b>${f.pdf}</b>PDF</span>${f.share ? `<span><b>${f.share}</b>${esc(t('sharePdf'))}</span>` : ''}</div></div>`).join('') + '</div>';

    // Services used: each feature, how many times and by how many people
    const feats = {};
    all.forEach(v => (v.ev || []).forEach(e => {
      if (e.t < from) return;
      const f = featOf(e); if (!f) return;
      const x = feats[f[0]] = feats[f[0]] || { label: f[1], n: 0, who: new Set() };
      x.n++; x.who.add(pk(v));
    }));
    const frows = Object.values(feats).sort((a, b) => b.n - a.n).map(x => ({ label: x.label, n: x.n, sub: t('nPeople', { n: x.who.size }) }));
    html += `<h2 class="list-h">${esc(t('services'))}</h2>` + (frows.length ? countBars(frows) : `<p class="empty">${esc(t('noVisits'))}</p>`);

    // Approved members (all of them, also those who did not open the app), then others who signed in
    const row = (uid, u, state) => {
      const p = people[uid];
      const meta = p ? `${t('nVisits', { n: p.visits })} · ${t('nDl', { n: p.dl })} · ${t('lastSeen', { t: dm(p.last) + ' ' + hm(p.last) })}` : t('notUsed');
      return `<button type="button" class="item act-person${who === uid ? ' on' : ''}" data-who="${esc(uid)}">
        <span class="who"><strong>${esc((p && p.name) || (u && u.name) || (p && p.email) || (u && u.email) || '—')}</strong><span>${esc((p && p.email) || (u && u.email) || '')}</span></span>
        <span class="meta${p ? ' muted' : ' warn'}">${esc(meta)}</span>${kindChip(state)}</button>`;
    };
    if (!who) {
      if (team) {
        const ap = approved.slice().sort((a, b) => ((people[b.uid] || {}).last || 0) - ((people[a.uid] || {}).last || 0));
        html += `<h2 class="list-h">${esc(t('approvedMembers'))} · ${ap.length}</h2>` + (ap.length ? ap.map(u => row(u.uid, u, 'member')).join('') : `<p class="empty">${esc(t('nobody'))}</p>`);
      }
      const others = Object.values(people).filter(p => !team || !(byUid[p.uid] && byUid[p.uid].state === 'approved')).sort((a, b) => b.last - a.last);
      if (others.length || !team) html += `<h2 class="list-h">${esc(t(team ? 'othersSigned' : 'people'))}</h2>` + (others.length ? others.map(p => row(p.uid, byUid[p.uid], byUid[p.uid] ? ({ waiting: 'waiting', removed: 'removed' }[byUid[p.uid].state] || 'member') : p.kind)).join('') : `<p class="empty">${esc(t('nobody'))}</p>`);
    }

    html += `<div class="list-h-row"><h2 class="list-h">${esc(who ? t('visitsOf', { name: who === '-' ? t('visitor') : nameOf(who) }) : t('visits'))}</h2>
      ${who ? '' : `<button type="button" class="linkbtn" data-who="-">${esc(t('visitor'))}</button>`}</div>`;
    html += all.length ? all.slice(0, shown).map(visit).join('') : `<p class="empty">${esc(t('noVisits'))}</p>`;
    if (all.length > shown) html += `<p class="center"><button type="button" class="btn sm" data-more>${esc(t('showMore'))}</button></p>`;
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
    box.querySelectorAll('[data-who]').forEach(b => { b.onclick = () => { who = who === b.dataset.who ? '' : b.dataset.who; shown = PAGE; paint(); if (who) box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    box.querySelectorAll('[data-visit]').forEach(b => { b.onclick = () => { open[b.dataset.visit] = !open[b.dataset.visit]; paint(); }; });
    const m = box.querySelector('[data-more]'); if (m) m.onclick = () => { shown += PAGE; paint(); };
  }

  CF.actView = { check, draw, stop, evText };
})();
