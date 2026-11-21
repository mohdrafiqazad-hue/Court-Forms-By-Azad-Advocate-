/* i Court Forms — admin panel: approve or remove the people who sign in.
   Everyone who signs in appears under Requests until approved. Access is enforced by
   firestore.rules (owner account / admins/{uid}); this page only shows what the rules allow. */
(function () {
  'use strict';
  const C = window.ICF_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const emu = local && /[?&]emulator\b/.test(location.search);
  const FB = emu ? { apiKey: 'demo-key', authDomain: 'demo-icf.firebaseapp.com', projectId: 'demo-icf', appId: 'demo-app' } : (C.firebase || {});
  const FOREVER = Date.UTC(2099, 11, 31); // approval lasts until the owner removes it

  const p2 = x => String(x).padStart(2, '0');
  const fmtDate = ms => { const d = new Date(ms); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const fmtTime = ms => fmtDate(ms) + ' ' + p2(new Date(ms).getHours()) + ':' + p2(new Date(ms).getMinutes());
  const ms = ts => (ts && ts.toMillis ? ts.toMillis() : 0);
  let tt = 0;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };
  const only = id => ['aSetup', 'aLogin', 'aNot', 'aMain'].forEach(s => { $('#' + s).hidden = s !== id; });

  if (!FB.apiKey || !FB.projectId) { only('aSetup'); return; }
  firebase.initializeApp(FB);
  const auth = firebase.auth(), db = firebase.firestore();
  if (emu) { auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); db.useEmulator('127.0.0.1', 8080); }
  const TS = firebase.firestore.Timestamp, FV = firebase.firestore.FieldValue;

  let me = null, tab = 'requests', unsubs = [], users = null, members = null;

  $('#btnIn').onclick = async () => {
    $('#aMsg').textContent = '';
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') $('#aMsg').textContent = 'Sign-in failed: ' + (e.code || e.message); }
  };
  $('#btnOut').onclick = () => auth.signOut();
  $('#btnCopyUid').onclick = () => navigator.clipboard.writeText($('#myUid').textContent).then(() => toast('UID copied'));
  document.querySelectorAll('.atabs [data-t]').forEach(b => { b.onclick = () => { tab = b.dataset.t; draw(); }; });

  auth.onAuthStateChanged(async user => {
    unsubs.forEach(u => u()); unsubs = []; users = members = null;
    me = user;
    $('#btnOut').hidden = !user; $('#who').textContent = user ? user.email : '';
    if (!user) { only('aLogin'); return; }
    // Admin = the owner's Google account (or an extra admin in admins/). The rules decide:
    // only an admin may list everyone's profiles.
    let admin = false;
    try { await db.collection('users').limit(1).get(); admin = true; }
    catch (e) { if (e.code !== 'permission-denied') console.warn(e); }
    if (!admin) { $('#myUid').textContent = user.uid; only('aNot'); return; }
    only('aMain');
    const fail = e => toast('Could not load: ' + e.code);
    unsubs.push(db.collection('users').orderBy('lastLogin', 'desc').limit(1000).onSnapshot(qs => {
      users = qs.docs.map(d => ({ uid: d.id, ...d.data({ serverTimestamps: 'estimate' }) })); draw();
    }, fail));
    unsubs.push(db.collection('members').onSnapshot(qs => {
      members = {}; qs.docs.forEach(d => { members[d.id] = d.data(); }); draw();
    }, fail));
  });

  // ------------------------------------------------------------ views
  const stateOf = u => {
    const m = members[u.uid];
    if (m && ms(m.validUntil) > Date.now()) return 'approved';
    if (m) return 'removed';
    return 'waiting';
  };

  function draw() {
    document.querySelectorAll('.atabs [data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === tab)));
    const L = $('#list');
    if (!users || !members) { L.innerHTML = '<p class="empty">Loading…</p>'; return; }
    const people = users.filter(u => u.uid !== me.uid).map(u => ({ ...u, state: stateOf(u) }));
    const by = s => people.filter(u => u.state === s);
    $('#reqCount').textContent = by('waiting').length;
    $('#appCount').textContent = by('approved').length;
    const hints = {
      requests: 'People who signed in and are waiting. Approve to let them use the app.',
      approved: 'People who can use the app. Remove to stop their access.',
      removed: 'People whose access you removed. Approve to give it back.',
    };
    $('#hint').textContent = hints[tab];
    const rows = by({ requests: 'waiting', approved: 'approved', removed: 'removed' }[tab]);
    L.innerHTML = rows.length ? rows.map(item).join('') : '<p class="empty">Nobody here.</p>';
  }

  function item(u) {
    const m = members[u.uid];
    const label = { waiting: 'waiting', approved: 'approved', removed: 'removed' }[u.state];
    const since = u.state === 'waiting' ? 'Signed in ' + (u.lastLogin ? fmtTime(ms(u.lastLogin)) : '')
      : (m && m.updatedAt ? (u.state === 'approved' ? 'Approved ' : 'Removed ') + fmtDate(ms(m.updatedAt)) : '');
    const act = u.state === 'approved'
      ? `<button class="btn sm" data-remove="${esc(u.uid)}">Remove</button>`
      : `<button class="btn sm primary" data-approve="${esc(u.uid)}">Approve</button>`;
    return `<div class="item"><div class="who"><strong>${esc(u.name || '—')}</strong><span>${esc(u.email)}</span></div>
      <div class="meta"><span class="muted">${esc(since)}</span></div>
      <span class="st ${label}">${label}</span><div class="acts">${act}</div></div>`;
  }

  // ------------------------------------------------------------ actions
  $('#list').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const uid = b.dataset.approve || b.dataset.remove;
    const u = (users || []).find(x => x.uid === uid) || {};
    b.disabled = true;
    try {
      if (b.dataset.approve) {
        await db.collection('members').doc(uid).set({
          email: u.email || '', name: u.name || '', validUntil: TS.fromMillis(FOREVER), blocked: false,
          updatedAt: FV.serverTimestamp(), updatedBy: me.email,
        }, { merge: true });
        toast('Approved: ' + (u.name || u.email));
      } else {
        if (!window.confirm('Remove access for ' + (u.name || u.email) + '?')) { b.disabled = false; return; }
        await db.collection('members').doc(uid).set({
          validUntil: TS.now(), blocked: true, updatedAt: FV.serverTimestamp(), updatedBy: me.email,
        }, { merge: true });
        toast('Removed: ' + (u.name || u.email));
      }
    } catch (err) { console.error(err); toast('Failed: ' + (err.code || err.message)); b.disabled = false; }
  });
})();
