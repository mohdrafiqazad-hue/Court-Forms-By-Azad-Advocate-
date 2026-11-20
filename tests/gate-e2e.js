/* End-to-end test of sign-in, payment and admin approval against the Firebase emulators.
   Needs:  firebase emulators:start --only auth,firestore --project demo-icf   (repo root)
           python3 -m http.server 8002                                         (repo root)
   Run:    node tests/gate-e2e.js [http://localhost:8002/] [outDir]
   Sign-in uses emulator test accounts (signInWithCredential); the real Google popup is not exercised. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:8002/';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FS = 'http://127.0.0.1:8080/v1/projects/demo-icf/databases/(default)/documents';

const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails.push(msg); };
const visible = (p, sel, t = 8000) => p.waitForSelector(sel + ':not([hidden])', { timeout: t }).then(() => true, () => false);

async function newUser(browser, { mobile } = {}) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }
    : { viewport: { width: 1280, height: 900 } });
  // Test payment settings (the real ones live in js/config.js)
  await ctx.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body:
    "window.ICF_CONFIG={firebase:{},payment:{upiId:'icourtforms@okaxis',payeeName:'i Court Forms',amount:100,days:365,planLabel:'1 year'},supportWhatsApp:'919800000000'};" }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('    pageerror:', e.message));
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Payment not found for this transaction ID' : undefined));
  return { ctx, page };
}
const signIn = (page, sub, email, name) => page.evaluate(([sub, email, name]) =>
  CF_signIn(sub, email, name), [sub, email, name]);
async function addHelpers(page) {
  await page.evaluate(() => {
    window.CF_signIn = (sub, email, name) => {
      const auth = (window.CF && window.CF.fb && window.CF.fb.auth) || firebase.auth();
      return auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true, name })));
    };
    window.CF_try = async fn => { try { await fn(); return 'allowed'; } catch (e) { return e.code; } };
  });
}

(async () => {
  const browser = await chromium.launch();

  // ---------------- user 1 (Android phone)
  console.log('User 1: sign in and pay');
  const u1 = await newUser(browser, { mobile: true });
  await u1.page.goto(BASE + '?emulator');
  check(await visible(u1.page, '#gLogin'), 'login screen shows first');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-1-login.png') });
  await addHelpers(u1.page);
  await signIn(u1.page, 'u1', 'junior.one@example.com', 'Test Junior');
  check(await visible(u1.page, '#gPay'), 'no membership → payment screen');
  check(await u1.page.isHidden('#home') && await u1.page.isHidden('#formView'), 'forms stay hidden before payment');
  const gpay = await u1.page.getAttribute('#btnGpay', 'href');
  check(gpay.startsWith('intent://pay?pa=icourtforms%40okaxis') && gpay.includes('package=com.google.android.apps.nbu.paisa.user') && gpay.includes('am=100.00'), 'Google Pay button opens Google Pay with ₹100');
  check(await u1.page.$('#qr svg') !== null, 'UPI QR code drawn');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-2-pay.png'), fullPage: true });

  await u1.page.fill('#utr', '12345'); await u1.page.click('#btnSubmitUtr');
  check((await u1.page.textContent('#utrMsg')).includes('12 digits'), 'short transaction ID rejected');
  await u1.page.fill('#utr', '412345678901'); await u1.page.click('#btnSubmitUtr');
  check(await visible(u1.page, '#gPending'), 'after submitting → waiting-for-approval screen');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-3-pending.png'), fullPage: true });

  console.log('Security rules (user 1)');
  const uid1 = await u1.page.evaluate(() => CF.fb.auth.currentUser.uid);
  const r = await u1.page.evaluate(async uid => {
    const db = CF.fb.db, TS = firebase.firestore.Timestamp;
    return {
      selfMember: await CF_try(() => db.collection('members').doc(uid).set({ validUntil: TS.fromMillis(Date.now() + 9e10) })),
      selfApprove: await CF_try(() => db.collection('payments').doc('412345678901').update({ status: 'approved' })),
      otherUid: await CF_try(() => db.collection('payments').doc('999999999999').set({ uid: 'someone', email: 'junior.one@example.com', name: '', utr: '999999999999', amount: 100, plan: '1 year', status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp() })),
      approvedStatus: await CF_try(() => db.collection('payments').doc('888888888888').set({ uid, email: 'junior.one@example.com', name: '', utr: '888888888888', amount: 100, plan: '1 year', status: 'approved', createdAt: firebase.firestore.FieldValue.serverTimestamp() })),
      listAdmins: await CF_try(() => db.collection('admins').get()),
      readUsers: await CF_try(() => db.collection('users').get()),
    };
  }, uid1);
  check(r.selfMember === 'permission-denied', 'user cannot give themselves a membership');
  check(r.selfApprove === 'permission-denied', 'user cannot approve their own payment');
  check(r.otherUid === 'permission-denied', 'user cannot submit a payment in someone else\'s name');
  check(r.approvedStatus === 'permission-denied', 'user cannot submit an already-approved payment');
  check(r.listAdmins === 'permission-denied', 'user cannot list admins');
  check(r.readUsers === 'permission-denied', 'user cannot read other users');

  // ---------------- user 2 (desktop)
  console.log('User 2: reuse of a transaction ID');
  const u2 = await newUser(browser);
  await u2.page.goto(BASE + '?emulator'); await visible(u2.page, '#gLogin'); await addHelpers(u2.page);
  await signIn(u2.page, 'u2', 'junior.two@example.com', 'Second Junior');
  await visible(u2.page, '#gPay');
  check(await u2.page.evaluate(() => document.querySelector('#qrWrap').open), 'desktop shows the QR code open');
  await u2.page.fill('#utr', '412345678901'); await u2.page.click('#btnSubmitUtr');
  await u2.page.waitForTimeout(800);
  check((await u2.page.textContent('#utrMsg')).includes('already been submitted'), 'same transaction ID cannot be used twice');
  await u2.page.fill('#utr', '512345678901'); await u2.page.click('#btnSubmitUtr');
  check(await visible(u2.page, '#gPending'), 'user 2 waiting with own transaction ID');

  // ---------------- admin
  console.log('Admin: approve, reject, revoke, give access');
  const ad = await newUser(browser);
  await ad.page.goto(BASE + 'admin.html?emulator'); await visible(ad.page, '#aLogin'); await addHelpers(ad.page);
  await signIn(ad.page, 'adm', 'owner@example.com', 'Owner');
  check(await visible(ad.page, '#aNot'), 'non-admin account is refused and shown its UID');
  const adminUid = (await ad.page.textContent('#myUid')).trim();
  await fetch(`${FS}/admins?documentId=${adminUid}`, { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { name: { stringValue: 'Owner' } } }) });
  await ad.page.reload(); await addHelpers(ad.page);
  check(await visible(ad.page, '#aMain'), 'after adding to admins → admin panel opens');
  await ad.page.waitForFunction(() => document.querySelector('#pendCount').textContent === '2', null, { timeout: 8000 }).catch(() => {});
  check((await ad.page.textContent('#pendCount')) === '2', 'admin sees 2 pending payments');
  await ad.page.screenshot({ path: path.join(OUT, 'admin-1-pending.png'), fullPage: true });

  await ad.page.click('[data-approve="412345678901"]');
  check(await visible(u1.page, '#home', 10000), 'user 1 app opens by itself after approval');
  check((await u1.page.textContent('#acct')).includes('Member till'), 'user 1 sees "Member till …"');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-4-unlocked.png') });

  await ad.page.click('[data-reject="512345678901"]');
  check(await visible(u2.page, '#gPay', 10000) && (await u2.page.textContent('#payNote')).includes('could not be verified'), 'user 2 sees the rejection reason');

  console.log('User 1 offline');
  await u1.page.click('#formList .card'); check(await visible(u1.page, '#formView'), 'member can open a form');
  await u1.ctx.setOffline(true);
  await u1.page.reload();
  check(await visible(u1.page, '#formView', 10000), 'member\'s app opens offline (cached membership)');
  await u1.ctx.setOffline(false);

  await ad.page.click('[data-t="members"]'); await ad.page.waitForSelector('[data-revoke]');
  await ad.page.screenshot({ path: path.join(OUT, 'admin-2-members.png'), fullPage: true });
  await ad.page.click('[data-revoke]');
  await u1.page.reload();
  check(await visible(u1.page, '#gPay', 10000) && (await u1.page.textContent('#payNote')).includes('membership ended'), 'revoked member is locked out and told why');

  await ad.page.click('[data-t="users"]'); await ad.page.waitForSelector('[data-give]');
  const uid2 = await u2.page.evaluate(() => CF.fb.auth.currentUser.uid);
  await ad.page.click(`[data-give="${uid2}"]`);
  check(await visible(u2.page, '#home', 10000), 'free access from Users tab opens user 2\'s app');

  await browser.close();
  console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nAll checks passed');
  process.exit(fails.length ? 1 : 0);
})();
