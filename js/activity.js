/* i Court Forms — usage log that only the owner sees (Team → Activity).
   Recorded: when the app is opened, which screens are shown, which buttons are pressed (by their
   fixed name, never the text on them or anything typed in a form), downloads (form, orientation,
   language, how many boxes filled), the device type and the signed-in Google account.
   Not recorded: anything typed, case or client details, files.
   Events wait on the device (localStorage icf-act-v1) and are sent to Firestore activity/{session}
   (one document per visit; firestore.rules: anyone may add to their own, only the owner reads).
   Off for the owner and admins — also on their devices afterwards (icf-act-off). */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const KEY = 'icf-act-v1', OFF = 'icf-act-off';
  const MAX_EV = 300;           // events per visit document (rules allow 400)
  const IDLE = 30 * 60000;      // back after 30 min away = a new visit
  const SEND_AFTER = 6000;      // collect for a few seconds, then send in one write
  const KEEP_DAYS = 7;          // unsent events of another account are dropped after this
  const p2 = x => String(x).padStart(2, '0');
  const dayOf = ms => { const d = new Date(ms); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

  function device() {
    const u = navigator.userAgent || '';
    const os = /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone|iPod/.test(u) ? 'iPhone'
      : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS X/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'Other';
    const br = /SamsungBrowser/.test(u) ? 'Samsung' : /Edg\//.test(u) ? 'Edge' : /OPR\/|Opera/.test(u) ? 'Opera' : /Firefox|FxiOS/.test(u) ? 'Firefox'
      : /CriOS|Chrome/.test(u) ? 'Chrome' : /Safari/.test(u) ? 'Safari' : 'Browser';
    return os + ' · ' + br;
  }
  // A random number for this device (no name), so visitors who do not sign in can be counted once each
  const devId = (() => { let v = lsGet('icf-dev-v1'); if (!/^[a-z0-9]{8,24}$/.test(v || '')) { v = rid().slice(0, 20); lsSet('icf-dev-v1', v); } return v; })();
  const installed = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  // ------------------------------------------------------------ queue (kept on the device until sent)
  let off = lsGet(OFF) === '1';
  let Q = (() => { try { const q = JSON.parse(lsGet(KEY) || 'null'); return q && Array.isArray(q.s) ? q : null; } catch (e) { return null; } })() || { s: [] };
  const persist = () => lsSet(KEY, off ? null : JSON.stringify(Q));
  let me = undefined;           // undefined = not known yet; { uid: '' } = not signed in
  let cur = null;               // the current visit
  let hiddenAt = 0, timer = 0, sending = false;

  function newVisit(why) {
    const now = Date.now();
    cur = { sid: rid(), uid: me === undefined ? null : me.uid, start: now, day: dayOf(now), sent: 0, ev: [] };
    Q.s.push(cur);
    log('open', why || '');
  }
  function log(e, d) {
    if (off) return;
    if (!cur || cur.sent + cur.ev.length >= MAX_EV) newVisit(cur ? 'more' : ''); // newVisit logs 'open' first
    cur.ev.push({ t: Date.now(), e: String(e).slice(0, 30), d: String(d == null ? '' : d).slice(0, 80) });
    persist();
    clearTimeout(timer); timer = setTimeout(send, SEND_AFTER);
  }

  // Who is using the app — called by gate.js. m = null (not signed in) or { uid, name, email, kind, admin }.
  function who(m) {
    if (off) return;
    if (m && m.admin) { off = true; lsSet(OFF, '1'); lsSet(KEY, null); Q = { s: [] }; cur = null; clearTimeout(timer); return; }
    const prev = me;
    me = m ? { uid: m.uid, name: String(m.name || '').slice(0, 100), email: m.email || '', kind: m.kind || 'member' } : { uid: '', name: '', email: '', kind: 'guest' };
    if (cur && cur.uid === null) cur.uid = me.uid;           // the visit started before we knew who it was
    else if (cur && cur.uid !== me.uid) newVisit(me.uid ? 'signin' : 'signout');
    if (!prev || prev.uid !== me.uid || prev.kind !== me.kind) { persist(); send(); }
  }

  async function send() {
    clearTimeout(timer);
    if (off || sending || me === undefined || !CF.fb || navigator.onLine === false) return;
    const auth = CF.fb.auth, db = CF.fb.db;
    const uid = auth.currentUser ? auth.currentUser.uid : '';
    if (uid !== me.uid) return;                               // sign-in state still settling; sent later
    sending = true;
    const FV = firebase.firestore.FieldValue;
    try {
      for (const v of Q.s.slice()) {
        if (!v.ev.length) continue;
        if (v.uid !== uid) continue;                          // another account's visit: only that account may send it
        if ((auth.currentUser ? auth.currentUser.uid : '') !== uid) break; // signed in / out meanwhile
        const batch = v.ev.slice(0, 100);
        const doc = {
          uid, name: me.name, email: uid ? (auth.currentUser.email || '') : '', kind: me.kind,
          device: device(), dev: devId, app: installed() ? 'installed' : 'browser', lang: (CF.i18n && CF.i18n.lang) || 'en',
          start: v.start, day: v.day, last: FV.serverTimestamp(), ev: FV.arrayUnion(...batch),
        };
        if (!uid) doc.name = '';
        try {
          // a write can hang when the account changes while it is on its way: give up after a while, try again later
          await Promise.race([db.collection('activity').doc(v.sid).set(doc, { merge: true }),
            new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 15000))]);
        } catch (e) {
          if (e && e.code === 'permission-denied') console.warn('activity', e.code); else throw e;
        }
        v.ev.splice(0, batch.length); v.sent += batch.length;
      }
      const old = Date.now() - KEEP_DAYS * 86400000;
      Q.s = Q.s.filter(v => v === cur || (v.ev.length && v.start > old));
      persist();
    } catch (e) { /* offline or busy — stays on the device, tried again later */ }
    sending = false;
    if (Q.s.some(v => v.ev.length && v.uid === me.uid)) timer = setTimeout(send, 30000);
  }

  // ------------------------------------------------------------ what is recorded
  // A button's fixed name: its id, else its first data-* attribute (values only for these harmless ones).
  const SAFE = { tab: 1, o: 1, pl: 1, lang: 1, t: 1 };
  const SKIP = { btnWord: 1, btnPdf: 1, btnShare: 1 };       // logged by app.js with details
  function nameOf(el) {
    if (el.id) return SKIP[el.id] ? '' : el.id;
    for (const a of el.attributes) {
      if (!a.name.startsWith('data-') || a.name.startsWith('data-i18n')) continue;
      const k = a.name.slice(5);
      return SAFE[k] && a.value ? k + ':' + a.value.slice(0, 20) : k;
    }
    if (el.dataset.i18n) return el.dataset.i18n;
    if (el.tagName === 'A') {
      const h = el.getAttribute('href') || '';
      return h.startsWith('tel:') ? 'call' : /wa\.me/.test(h) ? 'whatsapp' : /^[\w-]+\.html$/.test(h) ? h.replace('.html', '') : /^#/.test(h) ? 'go:' + h.slice(0, 20) : 'link';
    }
    return '';
  }
  document.addEventListener('click', e => {
    if (off || !e.isTrusted) return;                          // only real taps (not the app's own download link)
    const el = e.target.closest && e.target.closest('button, a, [role="button"]');
    if (!el || el.closest('#teamView') || el.hasAttribute('download')) return;
    const k = nameOf(el);
    if (k) log('tap', k);
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); send(); return; }
    if (hiddenAt && Date.now() - hiddenAt > IDLE && !off) newVisit('back');
    hiddenAt = 0;
  });
  window.addEventListener('online', () => send());
  if (CF.i18n) CF.i18n.onChange(l => log('lang', l));

  // localhost format tests (?nogate) record nothing
  const nogate = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]nogate\b/.test(location.search);
  if (nogate) off = true;
  if (!off) newVisit(installed() ? 'app' : '');

  CF.act = { log, who, send, get off() { return off; } };
})();
