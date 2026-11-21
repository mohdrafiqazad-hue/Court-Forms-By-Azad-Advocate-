/* i Court Forms — Team screen (owner / admins only), inside the app at #/team.
   Everyone who signs in appears under Requests until the owner approves them.
   Approve = access until removed; Remove = locked again. firestore.rules enforces who may do this. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const FOREVER = Date.UTC(2099, 11, 31);
  const p2 = x => String(x).padStart(2, '0');
  const fmtDate = ms => { const d = new Date(ms); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const fmtTime = ms => fmtDate(ms) + ' ' + p2(new Date(ms).getHours()) + ':' + p2(new Date(ms).getMinutes());
  const ms = ts => (ts && ts.toMillis ? ts.toMillis() : 0);

  let db = null, me = null, unsubs = [], users = null, members = null, tab = 'requests', wired = false;

  function start(_db, _me) {
    if (db && me && me.uid === _me.uid) return;
    stop();
    db = _db; me = _me;
    const fail = e => { console.warn('team', e.code); $('#teamList').innerHTML = '<p class="err">Could not load (' + esc(e.code) + '). Check the internet connection.</p>'; };
    unsubs.push(db.collection('users').orderBy('lastLogin', 'desc').limit(1000).onSnapshot(qs => {
      users = qs.docs.map(d => ({ uid: d.id, ...d.data({ serverTimestamps: 'estimate' }) })); draw();
    }, fail));
    unsubs.push(db.collection('members').onSnapshot(qs => {
      members = {}; qs.docs.forEach(d => { members[d.id] = d.data(); }); draw();
    }, fail));
    wire();
  }
  function stop() { unsubs.forEach(u => u()); unsubs = []; db = me = users = members = null; badge(0); }
  const allowed = () => !!db;

  function show() { $('#teamView').hidden = false; document.title = 'Team — i Court Forms'; draw(); window.scrollTo(0, 0); }
  function hide() { $('#teamView').hidden = true; }

  function wire() {
    if (wired) return; wired = true;
    document.querySelectorAll('#teamTabs [data-t]').forEach(b => { b.onclick = () => { tab = b.dataset.t; draw(); }; });
    $('#teamList').addEventListener('click', onAction);
  }

  const stateOf = u => {
    const m = members[u.uid];
    if (m && ms(m.validUntil) > Date.now()) return 'approved';
    return m ? 'removed' : 'waiting';
  };
  let lastCount = 0;
  function badge(n) {
    lastCount = n;
    document.querySelectorAll('[data-team-count]').forEach(el => { el.textContent = n; el.hidden = !n; });
  }

  function draw() {
    if (!users || !members) { if (!$('#teamView').hidden) $('#teamList').innerHTML = '<p class="empty">Loading…</p>'; return; }
    const people = users.filter(u => u.uid !== me.uid).map(u => ({ ...u, state: stateOf(u) }));
    const by = s => people.filter(u => u.state === s);
    const waiting = by('waiting').length;
    badge(waiting);
    if ($('#teamView').hidden) return;
    $('#reqCount').textContent = waiting;
    $('#appCount').textContent = by('approved').length;
    document.querySelectorAll('#teamTabs [data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === tab)));
    $('#teamHint').textContent = {
      requests: 'People who signed in and are waiting. Approve to let them use the app.',
      approved: 'People who can use the app. Remove to stop their access.',
      removed: 'People whose access you removed. Approve to give it back.',
    }[tab];
    const rows = by({ requests: 'waiting', approved: 'approved', removed: 'removed' }[tab]);
    $('#teamList').innerHTML = rows.length ? rows.map(item).join('') : '<p class="empty">Nobody here.</p>';
  }

  function item(u) {
    const m = members[u.uid];
    const since = u.state === 'waiting' ? 'Signed in ' + (u.lastLogin ? fmtTime(ms(u.lastLogin)) : '')
      : (m && m.updatedAt ? (u.state === 'approved' ? 'Approved ' : 'Removed ') + fmtDate(ms(m.updatedAt)) : '');
    const act = u.state === 'approved'
      ? `<button type="button" class="btn sm" data-remove="${esc(u.uid)}">Remove</button>`
      : `<button type="button" class="btn sm primary" data-approve="${esc(u.uid)}">Approve</button>`;
    return `<div class="item"><div class="who"><strong>${esc(u.name || '—')}</strong><span>${esc(u.email)}</span></div>
      <div class="meta"><span class="muted">${esc(since)}</span></div>
      <span class="st ${u.state}">${u.state}</span><div class="acts">${act}</div></div>`;
  }

  async function onAction(e) {
    const b = e.target.closest('button'); if (!b || !db) return;
    const uid = b.dataset.approve || b.dataset.remove; if (!uid) return;
    const u = (users || []).find(x => x.uid === uid) || {};
    const TS = firebase.firestore.Timestamp, FV = firebase.firestore.FieldValue;
    if (b.dataset.remove && CF.confirmBox && !(await CF.confirmBox('Remove access for ' + (u.name || u.email) + '?'))) return;
    b.disabled = true;
    try {
      if (b.dataset.approve) {
        await db.collection('members').doc(uid).set({
          email: u.email || '', name: u.name || '', validUntil: TS.fromMillis(FOREVER), blocked: false,
          updatedAt: FV.serverTimestamp(), updatedBy: me.email,
        }, { merge: true });
        if (CF.toast) CF.toast('Approved: ' + (u.name || u.email));
      } else {
        await db.collection('members').doc(uid).set({
          validUntil: TS.now(), blocked: true, updatedAt: FV.serverTimestamp(), updatedBy: me.email,
        }, { merge: true });
        if (CF.toast) CF.toast('Removed: ' + (u.name || u.email));
      }
    } catch (err) { console.error(err); if (CF.toast) CF.toast('Failed: ' + (err.code || err.message)); b.disabled = false; }
  }

  CF.team = { start, stop, allowed, show, hide, refreshBadge: () => badge(lastCount) };
})();
