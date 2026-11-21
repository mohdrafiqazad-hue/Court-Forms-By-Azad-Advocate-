/* i Court Forms — admin panel: approve / reject payments, manage memberships.
   Access is enforced by firestore.rules (admins/{uid}); this page only shows what the rules allow. */
(function () {
  'use strict';
  const C = window.ICF_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const emu = local && /[?&]emulator\b/.test(location.search);
  const FB = emu ? { apiKey: 'demo-key', authDomain: 'demo-icf.firebaseapp.com', projectId: 'demo-icf', appId: 'demo-app' } : (C.firebase || {});
  const DAYS = (C.payment && C.payment.days) || 365;
  const DAY = 86400000;

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

  let me = null, tab = 'pending', unsubPending = null, pending = [];

  $('#btnIn').onclick = async () => {
    $('#aMsg').textContent = '';
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') $('#aMsg').textContent = 'Sign-in failed: ' + (e.code || e.message); }
  };
  $('#btnOut').onclick = () => auth.signOut();
  $('#btnCopyUid').onclick = () => navigator.clipboard.writeText($('#myUid').textContent).then(() => toast('UID copied'));
  document.querySelectorAll('.atabs [data-t]').forEach(b => { b.onclick = () => { tab = b.dataset.t; draw(); }; });

  auth.onAuthStateChanged(async user => {
    if (unsubPending) { unsubPending(); unsubPending = null; }
    me = user;
    $('#btnOut').hidden = !user; $('#who').textContent = user ? user.email : '';
    if (!user) { only('aLogin'); return; }
    // Admin = the owner's Google account (or an extra admin in admins/). The database rules decide:
    // only an admin may list everyone's pending payments.
    let admin = false;
    try { await db.collection('payments').where('status', '==', 'pending').limit(1).get(); admin = true; }
    catch (e) { if (e.code !== 'permission-denied') console.warn(e); }
    if (!admin) { $('#myUid').textContent = user.uid; only('aNot'); return; }
    only('aMain');
    unsubPending = db.collection('payments').where('status', '==', 'pending').onSnapshot(qs => {
      pending = qs.docs.map(d => d.data({ serverTimestamps: 'estimate' })).sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
      $('#pendCount').textContent = pending.length;
      if (tab === 'pending') draw();
    }, e => toast('Could not load: ' + e.code));
    draw();
  });

  // ------------------------------------------------------------ views
  async function draw() {
    document.querySelectorAll('.atabs [data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === tab)));
    const L = $('#list');
    if (tab === 'pending') {
      $('#hint').textContent = 'Check each transaction ID and amount in your bank / UPI app before approving. Approve gives ' + DAYS + ' days.';
      L.innerHTML = pending.length ? pending.map(payItem).join('') : '<p class="empty">No pending payments.</p>';
      return;
    }
    L.innerHTML = '<p class="empty">Loading…</p>';
    try {
      if (tab === 'payments') {
        $('#hint').textContent = 'Latest 200 payment claims.';
        const qs = await db.collection('payments').orderBy('createdAt', 'desc').limit(200).get();
        const rows = qs.docs.map(d => d.data());
        L.innerHTML = rows.length ? rows.map(payItem).join('') : '<p class="empty">No payments yet.</p>';
      } else if (tab === 'members') {
        $('#hint').textContent = 'Everyone who has (or had) a membership.';
        const qs = await db.collection('members').get();
        const rows = qs.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => ms(b.validUntil) - ms(a.validUntil));
        L.innerHTML = rows.length ? rows.map(memberItem).join('') : '<p class="empty">No members yet.</p>';
      } else if (tab === 'users') {
        $('#hint').textContent = 'Everyone who has signed in (latest 300). "Give access" is for testers and free accounts.';
        const [us, ms_] = await Promise.all([db.collection('users').orderBy('lastLogin', 'desc').limit(300).get(), db.collection('members').get()]);
        const mem = {}; ms_.docs.forEach(d => { mem[d.id] = ms(d.data().validUntil); });
        const rows = us.docs.map(d => ({ uid: d.id, ...d.data(), until: mem[d.id] || 0 }));
        L.innerHTML = rows.length ? rows.map(userItem).join('') : '<p class="empty">No users yet.</p>';
      }
    } catch (e) { console.error(e); L.innerHTML = '<p class="err">Could not load: ' + esc(e.code || e.message) + '</p>'; }
  }

  function payItem(p) {
    const acts = p.status === 'pending'
      ? `<div class="acts"><button class="btn sm primary" data-approve="${esc(p.utr)}">Approve</button><button class="btn sm" data-reject="${esc(p.utr)}">Reject</button></div>` : '';
    return `<div class="item"><div class="who"><strong>${esc(p.name || '—')}</strong><span>${esc(p.email)}</span></div>
      <div class="meta">UTR <b>${esc(p.utr)}</b> · ₹${esc(p.amount)}<br><span class="muted">${p.createdAt ? fmtTime(ms(p.createdAt)) : ''}</span>${p.reason ? '<br><span class="muted">' + esc(p.reason) + '</span>' : ''}</div>
      <span class="st ${esc(p.status)}">${esc(p.status)}</span>${acts}</div>`;
  }
  function memberItem(m) {
    const until = ms(m.validUntil), active = until > Date.now();
    return `<div class="item"><div class="who"><strong>${esc(m.name || '—')}</strong><span>${esc(m.email)}</span></div>
      <div class="meta">Till ${until ? fmtDate(until) : '—'}${m.lastUtr ? '<br><span class="muted">UTR ' + esc(m.lastUtr) + '</span>' : ''}</div>
      <span class="st ${active ? 'active' : 'expired'}">${active ? 'active' : 'expired'}</span>
      <div class="acts"><button class="btn sm" data-extend="${esc(m.uid)}">+${DAYS} days</button>${active ? `<button class="btn sm" data-revoke="${esc(m.uid)}">Revoke</button>` : ''}</div></div>`;
  }
  function userItem(u) {
    const active = u.until > Date.now();
    return `<div class="item"><div class="who"><strong>${esc(u.name || '—')}</strong><span>${esc(u.email)}</span></div>
      <div class="meta"><span class="muted">Last sign-in ${u.lastLogin ? fmtTime(ms(u.lastLogin)) : '—'}</span></div>
      <span class="st ${active ? 'active' : ''}">${active ? 'member till ' + fmtDate(u.until) : 'not a member'}</span>
      <div class="acts"><button class="btn sm" data-give="${esc(u.uid)}">${active ? '+' + DAYS + ' days' : 'Give access'}</button></div></div>`;
  }

  // ------------------------------------------------------------ actions
  async function extend(uid, info, utr) {
    const ref = db.collection('members').doc(uid);
    const cur = await ref.get();
    const from = Math.max(Date.now(), cur.exists ? ms(cur.data().validUntil) : 0);
    return {
      ref,
      data: {
        email: info.email || (cur.exists && cur.data().email) || '', name: info.name || (cur.exists && cur.data().name) || '',
        validUntil: TS.fromMillis(from + DAYS * DAY), lastUtr: utr || 'manual',
        updatedAt: FV.serverTimestamp(), updatedBy: me.email,
      },
    };
  }

  $('#list').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    b.disabled = true;
    try {
      if (b.dataset.approve) {
        const utr = b.dataset.approve;
        const p = (await db.collection('payments').doc(utr).get()).data();
        const m = await extend(p.uid, p, utr);
        const batch = db.batch();
        batch.set(m.ref, m.data, { merge: true });
        batch.update(db.collection('payments').doc(utr), { status: 'approved', decidedAt: FV.serverTimestamp(), decidedBy: me.email });
        await batch.commit();
        toast('Approved: ' + (p.name || p.email) + ' till ' + fmtDate(m.data.validUntil.toMillis()));
      } else if (b.dataset.reject) {
        const reason = window.prompt('Reason (the user will see this):', 'Payment not found for this transaction ID');
        if (reason === null) { b.disabled = false; return; }
        await db.collection('payments').doc(b.dataset.reject).update({ status: 'rejected', reason: reason.slice(0, 200), decidedAt: FV.serverTimestamp(), decidedBy: me.email });
        toast('Rejected');
      } else if (b.dataset.extend || b.dataset.give) {
        const uid = b.dataset.extend || b.dataset.give;
        const u = await db.collection('users').doc(uid).get();
        const m = await extend(uid, u.exists ? u.data() : {}, null);
        await m.ref.set(m.data, { merge: true });
        toast('Access till ' + fmtDate(m.data.validUntil.toMillis()));
        draw();
      } else if (b.dataset.revoke) {
        if (!window.confirm('End this membership now?')) { b.disabled = false; return; }
        await db.collection('members').doc(b.dataset.revoke).update({ validUntil: TS.now(), updatedAt: FV.serverTimestamp(), updatedBy: me.email });
        toast('Membership ended'); draw();
      }
    } catch (err) { console.error(err); toast('Failed: ' + (err.code || err.message)); b.disabled = false; }
  });
})();
