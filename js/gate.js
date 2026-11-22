/* i Court Forms — sign-in and approval gate.
   Flow: Google sign-in → the user appears in the owner's Team → Requests list (in the app) and sees
   "waiting for approval" → the owner approves → the app opens by itself (live listener).
   The owner removes someone the same way. The owner's own account always gets in.
   An approval is cached on the device (re-checked online at least every 30 days) so the app
   also opens offline. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const C = window.ICF_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const t = (k, v) => (CF.i18n ? CF.i18n.t(k, v) : k);
  const OUT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/></svg>';
  let lastAcct = null, lastWait = null;

  // Local testing switches — only on localhost, never on the live site.
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const emu = local && /[?&]emulator\b/.test(location.search);
  if (local && /[?&]nogate\b/.test(location.search)) { // format tests run without the gate
    document.addEventListener('DOMContentLoaded', () => { $('#gate').hidden = true; });
    return;
  }

  CF.gated = true; CF.locked = true;
  const FB = emu ? { apiKey: 'demo-key', authDomain: 'demo-icf.firebaseapp.com', projectId: 'demo-icf', appId: 'demo-app' } : (C.firebase || {});
  const CACHE = 'icf-member-v1';
  const OFFLINE_DAYS = 30;
  const SCREENS = ['gLoading', 'gSetup', 'gLogin', 'gWait', 'gOffline'];

  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) { return null; } };
  const writeCache = v => { try { v ? localStorage.setItem(CACHE, JSON.stringify(v)) : localStorage.removeItem(CACHE); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------ screens
  function show(id) {
    if (CF.act && ['gLogin', 'gWait', 'gOffline'].includes(id) && $('#' + id).hidden) CF.act.log('screen', id.slice(1).toLowerCase());
    $('#gate').hidden = false;
    SCREENS.forEach(s => { $('#' + s).hidden = s !== id; });
    if (!CF.locked) { CF.locked = true; if (CF.hideApp) CF.hideApp(); }
    window.scrollTo(0, 0);
  }
  function unlock(m) {
    if (CF.act) CF.act.who({ ...m, kind: 'member' });
    renderAcct(m);
    if (!CF.locked) return;
    CF.locked = false;
    $('#gate').hidden = true;
    if (CF.showApp) CF.showApp();
  }
  function renderAcct(m) {
    lastAcct = m;
    const el = $('#acct'); if (!el) return;
    el.hidden = false;
    const first = String(m.name || m.email || '').split(/[\s@]/)[0];
    const face = m.photo ? `<img src="${esc(m.photo)}" alt="" referrerpolicy="no-referrer">` : esc(first.charAt(0).toUpperCase());
    const role = m.admin ? `${esc(t('owner'))} · <a href="#/team" class="teamlink">${esc(t('team'))}</a> <span class="badge" data-team-count hidden>0</span>` : esc(t('approvedRole'));
    el.innerHTML = `<span class="avatar">${face}</span><span class="who"><b>${esc(m.name || m.email)}</b><small>${role}</small></span><button type="button" class="out" id="btnSignOut2" title="${esc(t('signOut'))}">${OUT_ICON}<span>${esc(t('signOut'))}</span></button>`;
    $('#btnSignOut2').onclick = signOut;
    if ($('#hello')) $('#hello').textContent = first ? t('greet', { name: first }) : t('welcome');
    if ($('#teamCard')) $('#teamCard').hidden = !m.admin;
    if (m.admin && CF.team) CF.team.refreshBadge();
  }

  // ------------------------------------------------------------ start
  function start() {
    if (!FB.apiKey || !FB.projectId || typeof firebase === 'undefined') { show('gSetup'); return; }
    firebase.initializeApp(FB);
    const auth = firebase.auth(), db = firebase.firestore();
    if (emu) { auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); db.useEmulator('127.0.0.1', 8080); }
    CF.fb = { auth, db };

    // Fast path: a cached approval opens the app at once (also offline).
    const cached = readCache();
    if (cached && cached.validUntil > Date.now()) unlock(cached); else show('gLoading');

    $('#btnGoogle').onclick = signIn;
    document.querySelectorAll('[data-signout]').forEach(b => { b.onclick = signOut; });
    $('#btnRetry').onclick = () => location.reload();

    auth.getRedirectResult().catch(e => loginError(e));
    auth.onAuthStateChanged(user => {
      stopWatch();
      if (!user) { if (CF.act) CF.act.who(null); writeCache(null); show(navigator.onLine === false ? 'gOffline' : 'gLogin'); return; }
      const c = readCache();
      if (c && c.uid !== user.uid) { writeCache(null); show('gLoading'); }
      watch(user);
    });
  }

  // ------------------------------------------------------------ auth
  async function signIn() {
    const { auth } = CF.fb;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    $('#loginMsg').textContent = '';
    const btn = $('#btnGoogle'); btn.disabled = true;
    try { await auth.signInWithPopup(provider); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(e.code)) {
        try { await auth.signInWithRedirect(provider); } catch (e2) { loginError(e2); }
      } else loginError(e);
    }
    btn.disabled = false;
  }
  function loginError(e) {
    if (!e || ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) return;
    console.error(e);
    $('#loginMsg').textContent = t(e.code === 'auth/network-request-failed' ? 'errNet' : e.code === 'auth/unauthorized-domain' ? 'errDomain' : 'errSignin');
  }
  async function signOut() {
    writeCache(null); stopWatch();
    if (CF.team) CF.team.stop();
    if (/^#\/team\b/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    try { await CF.fb.auth.signOut(); } catch (e) { /* ignore */ }
    show('gLogin');
  }

  // ------------------------------------------------------------ approval (live)
  let unsubs = [], expiryTimer = 0, offlineTimer = 0;
  function stopWatch() { unsubs.forEach(u => u()); unsubs = []; clearTimeout(expiryTimer); clearTimeout(offlineTimer); }

  function watch(user) {
    const { db } = CF.fb;
    const me = { uid: user.uid, email: user.email || '', name: user.displayName || '', photo: user.photoURL || '' };
    let member, admin; // undefined until first answer

    // Signing in is the request: the owner sees this profile in the Requests list.
    db.collection('users').doc(user.uid).set({
      email: me.email, name: me.name, photo: me.photo, lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }).catch(e => console.warn('profile', e.code));

    const decide = () => {
      if (member === undefined || admin === undefined) return;
      clearTimeout(offlineTimer);
      const cacheUntil = Date.now() + OFFLINE_DAYS * 86400000;
      if (admin) { // the owner (or an extra admin) always gets in, and manages the Team
        const m = { ...me, validUntil: cacheUntil, admin: true };
        writeCache(m);
        if (CF.team) CF.team.start(db, me);
        unlock(m);
        if (CF.route && /^#\/team\b/.test(location.hash)) CF.route();
        return;
      }
      if (CF.team) CF.team.stop();
      const until = member && member.validUntil ? member.validUntil.toMillis() : 0;
      if (until > Date.now()) {
        const m = { ...me, validUntil: Math.min(until, cacheUntil) };
        writeCache(m); unlock(m);
        clearTimeout(expiryTimer);
        expiryTimer = setTimeout(decide, Math.min(until - Date.now() + 1000, 2 ** 31 - 1));
        return;
      }
      writeCache(null);
      showWait(me, !!member); // member doc but not valid = access removed
    };
    const fail = e => {
      console.warn('gate', e.code || e);
      const c = readCache();
      if (!(c && c.uid === user.uid && c.validUntil > Date.now())) show('gOffline');
    };

    unsubs.push(db.collection('members').doc(user.uid).onSnapshot(s => { member = s.exists ? s.data() : null; decide(); }, fail));
    // Admin check: only an admin may list everyone's profiles (firestore.rules decides).
    db.collection('users').limit(1).get()
      .then(() => { admin = true; decide(); }, e => { admin = false; if (e.code !== 'permission-denied') console.warn('admin check', e.code); decide(); });
    // No answer for a while and no valid cache → probably offline
    offlineTimer = setTimeout(() => { if (member === undefined || admin === undefined) fail({ code: 'timeout' }); }, 12000);
  }

  // ------------------------------------------------------------ waiting screen
  function showWait(me, removed) {
    if (CF.act) CF.act.who({ ...me, kind: removed ? 'removed' : 'waiting' });
    lastWait = [me, removed];
    paintWait();
    show('gWait');
  }
  function paintWait() {
    const [me, removed] = lastWait;
    $('#waitHello').textContent = me.name ? t('hello', { name: me.name.split(' ')[0] }) : t('helloNoName');
    $('#waitWho').textContent = me.email;
    $('#waitTitle').textContent = t(removed ? 'removedTitle' : 'waitTitle');
    $('#waitText').textContent = t(removed ? 'removedText' : 'waitText');
    const wa = String(C.supportWhatsApp || '').replace(/\D/g, '');
    $('#waitWa').hidden = !wa;
    if (wa) $('#waitWa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(t('waMsg', { who: me.name + ' (' + me.email + ')' }));
  }
  if (CF.i18n) CF.i18n.onChange(() => { if (lastAcct && !$('#acct').hidden) renderAcct(lastAcct); if (lastWait) paintWait(); });

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
