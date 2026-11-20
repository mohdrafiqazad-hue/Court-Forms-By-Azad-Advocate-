/* i Court Forms — sign-in and membership gate.
   Flow: Google sign-in → (no active membership) pay by UPI / Google Pay → enter the 12-digit
   UPI transaction ID → admin approves in admin.html → app unlocks by itself (live listener).
   An active membership is cached on the device so the app also opens offline. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const C = window.ICF_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Local testing switches — only on localhost, never on the live site.
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const emu = local && /[?&]emulator\b/.test(location.search);
  if (local && /[?&]nogate\b/.test(location.search)) { // format tests run without the gate
    document.addEventListener('DOMContentLoaded', () => { $('#gate').hidden = true; });
    return;
  }

  CF.gated = true; CF.locked = true;
  const FB = emu ? { apiKey: 'demo-key', authDomain: 'demo-icf.firebaseapp.com', projectId: 'demo-icf', appId: 'demo-app' } : (C.firebase || {});
  const PAY = Object.assign({ upiId: '', payeeName: 'i Court Forms', amount: 100, days: 365, planLabel: '1 year' }, C.payment || {});
  const CACHE = 'icf-member-v1';
  const SCREENS = ['gLoading', 'gSetup', 'gLogin', 'gPay', 'gPending', 'gOffline'];

  const fmtDate = ms => { const d = new Date(ms); const p = x => String(x).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const fmtTime = ms => fmtDate(ms) + ' ' + new Date(ms).toTimeString().slice(0, 5);
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) { return null; } };
  const writeCache = v => { try { v ? localStorage.setItem(CACHE, JSON.stringify(v)) : localStorage.removeItem(CACHE); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------ screens
  function show(id) {
    $('#gate').hidden = false;
    SCREENS.forEach(s => { $('#' + s).hidden = s !== id; });
    if (!CF.locked) { CF.locked = true; if (CF.hideApp) CF.hideApp(); }
    window.scrollTo(0, 0);
  }
  function unlock(m) {
    renderAcct(m);
    if (!CF.locked) return;
    CF.locked = false;
    $('#gate').hidden = true;
    if (CF.showApp) CF.showApp();
  }
  function renderAcct(m) {
    const el = $('#acct'); if (!el) return;
    el.hidden = false;
    el.innerHTML = `<span>${esc(m.name || m.email)}</span><span class="dot">·</span><span>Member till ${fmtDate(m.validUntil)}</span><button type="button" class="linkbtn" id="btnSignOut2">Sign out</button>`;
    $('#btnSignOut2').onclick = signOut;
  }

  // ------------------------------------------------------------ start
  function start() {
    if (!FB.apiKey || !FB.projectId || typeof firebase === 'undefined') { show('gSetup'); return; }
    firebase.initializeApp(FB);
    const auth = firebase.auth(), db = firebase.firestore();
    if (emu) { auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); db.useEmulator('127.0.0.1', 8080); }
    CF.fb = { auth, db };

    // Fast path: a cached, still-valid membership opens the app at once (also offline).
    const cached = readCache();
    if (cached && cached.validUntil > Date.now()) unlock(cached); else show('gLoading');

    $('#btnGoogle').onclick = signIn;
    document.querySelectorAll('[data-signout]').forEach(b => { b.onclick = signOut; });
    $('#btnRetry').onclick = () => location.reload();
    $('#payForm').addEventListener('submit', submitUtr);
    $('#utr').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12); $('#utrMsg').textContent = ''; });

    auth.getRedirectResult().catch(e => loginError(e));
    auth.onAuthStateChanged(user => {
      stopWatch();
      if (!user) { writeCache(null); show(navigator.onLine === false ? 'gOffline' : 'gLogin'); return; }
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
    $('#loginMsg').textContent = e.code === 'auth/network-request-failed' ? 'No internet connection. Please try again.'
      : e.code === 'auth/unauthorized-domain' ? 'This website address is not allowed in Firebase yet (Authentication → Settings → Authorized domains).'
      : 'Sign-in failed. Please try again.';
  }
  async function signOut() {
    writeCache(null); stopWatch();
    try { await CF.fb.auth.signOut(); } catch (e) { /* ignore */ }
    show('gLogin');
  }

  // ------------------------------------------------------------ membership & payments (live)
  let unsubs = [], expiryTimer = 0, offlineTimer = 0;
  function stopWatch() { unsubs.forEach(u => u()); unsubs = []; clearTimeout(expiryTimer); clearTimeout(offlineTimer); }

  function watch(user) {
    const { db } = CF.fb;
    const me = { uid: user.uid, email: user.email || '', name: user.displayName || '' };
    let member, pays; // undefined until first answer

    db.collection('users').doc(user.uid).set({
      email: me.email, name: me.name, photo: user.photoURL || '', lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }).catch(e => console.warn('profile', e.code));

    const decide = () => {
      if (member === undefined || pays === undefined) return;
      clearTimeout(offlineTimer);
      const until = member && member.validUntil ? member.validUntil.toMillis() : 0;
      if (until > Date.now()) {
        const m = { ...me, validUntil: until };
        writeCache(m); unlock(m);
        clearTimeout(expiryTimer);
        expiryTimer = setTimeout(decide, Math.min(until - Date.now() + 1000, 2 ** 31 - 1));
        return;
      }
      writeCache(null);
      const pending = pays.find(p => p.status === 'pending');
      if (pending) showPending(pending); else showPay(me, pays[0], until);
    };
    const fail = e => {
      console.warn('gate', e.code || e);
      const c = readCache();
      if (!(c && c.uid === user.uid && c.validUntil > Date.now())) show('gOffline');
    };

    unsubs.push(db.collection('members').doc(user.uid).onSnapshot(s => { member = s.exists ? s.data() : null; decide(); }, fail));
    unsubs.push(db.collection('payments').where('uid', '==', user.uid).onSnapshot(qs => {
      pays = qs.docs.map(d => d.data({ serverTimestamps: 'estimate' }))
        .sort((a, b) => (b.createdAt ? b.createdAt.toMillis() : 0) - (a.createdAt ? a.createdAt.toMillis() : 0));
      decide();
    }, fail));
    // No answer for a while and no valid cache → probably offline
    offlineTimer = setTimeout(() => { if (member === undefined || pays === undefined) fail({ code: 'timeout' }); }, 12000);
  }

  // ------------------------------------------------------------ pay screen
  const upiParams = me => 'pa=' + encodeURIComponent(PAY.upiId) + '&pn=' + encodeURIComponent(PAY.payeeName)
    + '&am=' + Number(PAY.amount).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent('i Court Forms ' + noteCode(me));
  const noteCode = me => 'ICF-' + me.uid.slice(0, 6).toUpperCase();

  function showPay(me, last, expiredAt) {
    CF._me = me;
    $('#payHello').textContent = 'Hello' + (me.name ? ', ' + me.name.split(' ')[0] : '') + '!';
    $('#payWho').textContent = me.email;
    $('#payPrice').textContent = '₹' + PAY.amount;
    $('#payPlan').textContent = PAY.planLabel + ' membership';
    let note = '';
    if (expiredAt) note = `Your membership ended on ${fmtDate(expiredAt)}. Pay again to continue.`;
    if (last && last.status === 'rejected') note = `Your last payment (transaction ID ${esc(last.utr)}) could not be verified${last.reason ? ': ' + esc(last.reason) : ''}. Please check and try again.`;
    $('#payNote').innerHTML = note; $('#payNote').hidden = !note;

    const ready = !!PAY.upiId;
    $('#payReady').hidden = !ready; $('#payNotReady').hidden = ready;
    if (ready) {
      const q = upiParams(me);
      const upi = 'upi://pay?' + q;
      const ua = navigator.userAgent;
      const android = /Android/i.test(ua), ios = /iPhone|iPad|iPod/i.test(ua);
      const gpay = android ? 'intent://pay?' + q + '#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end'
        : ios ? 'gpay://upi/pay?' + q : '';
      $('#btnGpay').hidden = !gpay; if (gpay) $('#btnGpay').href = gpay;
      $('#btnUpi').hidden = !(android || ios); $('#btnUpi').href = upi;
      $('#qrWrap').open = !(android || ios);
      $('#payAmount').textContent = '₹' + PAY.amount;
      $('#upiId').textContent = PAY.upiId;
      $('#noteCode').textContent = noteCode(me);
      if (typeof qrcode === 'function') { const qr = qrcode(0, 'M'); qr.addData(upi); qr.make(); $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
      $('#btnCopyUpi').onclick = () => copy(PAY.upiId, $('#btnCopyUpi'));
    }
    show('gPay');
  }

  async function submitUtr(e) {
    e.preventDefault();
    const { db } = CF.fb; const me = CF._me; const msg = $('#utrMsg');
    const utr = $('#utr').value.replace(/\D/g, '');
    if (!/^\d{12}$/.test(utr)) { msg.textContent = 'The UPI transaction ID has 12 digits. You can find it in Google Pay under the payment details.'; return; }
    const btn = $('#btnSubmitUtr'); btn.disabled = true; msg.textContent = '';
    try {
      await db.collection('payments').doc(utr).set({
        uid: me.uid, email: me.email, name: me.name, utr, amount: Number(PAY.amount), plan: PAY.planLabel,
        status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      $('#utr').value = '';
    } catch (err) {
      console.warn(err);
      msg.textContent = err.code === 'permission-denied' ? 'This transaction ID has already been submitted. Please check the number.'
        : err.code === 'unavailable' ? 'No internet connection. Please try again.' : 'Could not submit. Please try again.';
    }
    btn.disabled = false;
  }

  // ------------------------------------------------------------ pending screen
  function showPending(p) {
    $('#pendUtr').textContent = p.utr;
    $('#pendAmt').textContent = '₹' + p.amount;
    $('#pendTime').textContent = p.createdAt ? fmtTime(p.createdAt.toMillis()) : '';
    const wa = String(C.supportWhatsApp || '').replace(/\D/g, '');
    $('#pendWa').hidden = !wa;
    if (wa) $('#pendWa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('i Court Forms payment: transaction ID ' + p.utr + ', ' + (p.email || ''));
    show('gPending');
  }

  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1500); }
    catch (e) { /* ignore */ }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
