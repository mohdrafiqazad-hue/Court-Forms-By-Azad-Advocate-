/* End-to-end test of sign-in and owner approval against the Firebase emulators.
   Needs:  firebase emulators:start --only auth,firestore --project demo-icf   (repo root)
           python3 -m http.server 8002                                         (repo root)
   Run:    node tests/gate-e2e.js [http://localhost:8002/] [outDir]
   Sign-in uses emulator test accounts (signInWithCredential); the real Google popup is not exercised.
   The owner is the email in isOwner() in firestore.rules. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:8002/';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const OWNER = (fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').match(/token\.email == '([^']+)'/) || [])[1];

const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails.push(msg); };
const visible = (p, sel, t = 8000) => p.waitForSelector(sel + ':not([hidden])', { timeout: t }).then(() => true, () => false);

async function open(browser, url, { mobile } = {}) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 } });
  await ctx.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.ICF_CONFIG={firebase:{},supportWhatsApp:'919800000000'};" }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('    pageerror:', e.message));
  page.on('dialog', d => d.accept());
  await page.goto(url);
  return { ctx, page };
}
const signIn = (page, sub, email, name) => page.evaluate(([sub, email, name]) => {
  const auth = (window.CF && window.CF.fb && window.CF.fb.auth) || firebase.auth();
  return auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true, name })));
}, [sub, email, name]);
const tryWrite = (page, fn) => page.evaluate(`(async () => { try { await (${fn})(CF.fb.db, firebase); return 'allowed'; } catch (e) { return e.code; } })()`);

(async () => {
  const browser = await chromium.launch();

  console.log('User 1 (phone): sign in → waits for approval');
  const u1 = await open(browser, BASE + '?emulator', { mobile: true });
  check(await visible(u1.page, '#gLogin'), 'login screen shows first');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-1-login.png') });
  await signIn(u1.page, 'u1', 'junior.one@example.com', 'Test Junior');
  check(await visible(u1.page, '#gWait'), 'after sign-in → "Waiting for approval"');
  check((await u1.page.textContent('#waitTitle')).includes('Waiting'), 'waiting title shown');
  check(await u1.page.isHidden('#home') && await u1.page.isHidden('#formView'), 'forms stay hidden before approval');
  check((await u1.page.getAttribute('#waitWa', 'href')).startsWith('https://wa.me/919800000000'), 'WhatsApp button to message the owner');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-2-waiting.png') });

  console.log('Security rules (user 1)');
  const uid1 = await u1.page.evaluate(() => CF.fb.auth.currentUser.uid);
  check(await tryWrite(u1.page, `(db, fb) => db.collection('members').doc('${uid1}').set({ validUntil: fb.firestore.Timestamp.fromMillis(Date.now() + 9e10) })`) === 'permission-denied', 'user cannot approve themselves');
  check(await tryWrite(u1.page, `(db) => db.collection('users').get()`) === 'permission-denied', 'user cannot see other users');
  check(await tryWrite(u1.page, `(db) => db.collection('admins').get()`) === 'permission-denied', 'user cannot list admins');
  check(await tryWrite(u1.page, `(db) => db.collection('users').doc('${uid1}').set({ email: 'someone@else.com', name: '', photo: '', lastLogin: firebase.firestore.FieldValue.serverTimestamp() })`) === 'permission-denied', 'user cannot fake their email');

  console.log('User 2 (desktop)');
  const u2 = await open(browser, BASE + '?emulator');
  await visible(u2.page, '#gLogin');
  await signIn(u2.page, 'u2', 'junior.two@example.com', 'Second Junior');
  check(await visible(u2.page, '#gWait'), 'user 2 also waiting');

  console.log('Owner');
  const ad = await open(browser, BASE + '?emulator');
  await visible(ad.page, '#gLogin');
  await signIn(ad.page, 'own', OWNER, 'Owner');
  check(await visible(ad.page, '#home'), 'owner: app opens with no approval');
  check((await ad.page.textContent('#acct')).includes('Team'), 'owner: "Owner · Team" link on home');
  await ad.page.waitForFunction(() => { const b = document.querySelector('#acct [data-team-count]'); return b && !b.hidden && b.textContent === '2'; }, null, { timeout: 8000 }).catch(() => {});
  check(await ad.page.evaluate(() => { const b = document.querySelector('#acct [data-team-count]'); return b && !b.hidden && b.textContent; }) === '2', 'owner: Team badge shows 2 waiting');
  await ad.page.click('#acct a.teamlink');
  check(await visible(ad.page, '#teamView'), 'owner: Team screen opens inside the app');
  await ad.page.waitForFunction(() => document.querySelector('#reqCount').textContent === '2', null, { timeout: 8000 }).catch(() => {});
  check((await ad.page.textContent('#reqCount')) === '2', 'owner sees the 2 sign-ins under Requests (not themself)');
  await ad.page.screenshot({ path: path.join(OUT, 'team-1-requests.png'), fullPage: true });

  await ad.page.click(`[data-approve="${uid1}"]`);
  check(await visible(u1.page, '#home', 10000), 'user 1 app opens by itself after Approve');
  check((await u1.page.textContent('#acct')).includes('Approved'), 'user 1 sees "Approved"');
  await u1.page.screenshot({ path: path.join(OUT, 'gate-3-approved.png') });
  check((await ad.page.textContent('#reqCount')) === '1' && (await ad.page.textContent('#appCount')) === '1', 'counts update: 1 request, 1 approved');

  await u1.page.goto(BASE + '?emulator#/team'); await u1.page.waitForTimeout(1500);
  check(await u1.page.isHidden('#teamView'), 'approved (non-owner) user cannot open the Team screen');
  await u1.page.goto(BASE + '?emulator#/');

  console.log('User 1 offline');
  await u1.page.click('#formList .card'); check(await visible(u1.page, '#formView'), 'approved user can open a form');
  await u1.ctx.setOffline(true); await u1.page.reload();
  check(await visible(u1.page, '#formView', 10000), 'approved user\'s app opens offline');
  await u1.ctx.setOffline(false);

  console.log('Remove and approve again');
  await ad.page.click('#teamTabs [data-t="approved"]');
  await ad.page.click(`[data-remove="${uid1}"]`);
  await ad.page.click('#confirm [data-yes]');
  await u1.page.reload();
  check(await visible(u1.page, '#gWait', 10000) && (await u1.page.textContent('#waitTitle')).includes('removed'), 'removed user is locked out and told');
  await ad.page.click('#teamTabs [data-t="removed"]');
  await ad.page.click(`[data-approve="${uid1}"]`);
  check(await visible(u1.page, '#formView', 10000), 'approve again → app opens again (back on the form they had open)');

  await browser.close();
  console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nAll checks passed');
  process.exit(fails.length ? 1 : 0);
})();
