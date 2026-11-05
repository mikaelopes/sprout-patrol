// Firebase (Google) save flow with a mocked SDK: two taps. Tap 1 loads the SDK (no popup yet), tap 2 opens the popup. Each case is asserted.
// Exit 1 on any mismatch or page error.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const PAGE = path.join(__dirname, '..', 'sim', 'game_fb.html');
if (spawnSync('node', [path.join(__dirname, '..', 'sim', 'mkpage.js'), PAGE], { stdio: 'ignore' }).status) { console.error('test build failed'); process.exit(1); }
const REMOTE = { name: 'Remote', coins: 999, tutorialDone: true, journeyDone: true, adv: { '1-1': 3, '1-2': 3, '1-3': 3, '1-4': 3 }, st: { tufts: 500, runs: 5 }, up: { trail: 3, speed: 2, heart: 2, frost: 0 }, owned: { pip: true }, cutsV: 2 };
const mock = ok => remote => `window.__fast = 0; window.__pops=0; window.__fs=${remote ? JSON.stringify({ g1: { json: JSON.stringify(remote), at: 1 } }) : '{}'};
window.__fbMock = { initializeApp: c => ({ c }), getAuth: () => ({ currentUser: null, authStateReady: async () => {} }), getFirestore: () => ({}),
  GoogleAuthProvider: function () {}, signInWithPopup: async (a) => { window.__pops++; if (!${ok}) { const e = new Error('x'); e.code = 'auth/popup-closed-by-user'; throw e; } a.currentUser = { uid: 'g1' }; return { user: a.currentUser }; },
  signOut: async a => { a.currentUser = null; }, doc: (db, c, id) => id, getDoc: async id => ({ exists: () => !!window.__fs[id], data: () => window.__fs[id] }), setDoc: async (id, v) => { window.__fs[id] = v; } };`;
// afterTap1: what the box must show once the SDK is loaded and no popup has opened; after: the result of the second tap.
const AFTER1 = { btn: 'Sign in with Google', pops: 0, state: 'off' };
const CASES = [
  ['fb-ok', mock(true), undefined, { state: 'on', mode: 'tutdone', coins: 40, stored: 'g1', pops: 1 }],
  ['fb-cancel', mock(false), undefined, { state: 'signedOut', mode: 'tutdone', coins: 40, stored: '', pops: 1 }],
  ['fb-pull', mock(true), REMOTE, { state: 'on', mode: 'hub', coins: 999, stored: 'g1', pops: 1 }],
];
const run = async (label, mockFn, remote, want) => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(u => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname), r => r.fulfill({ status: 200, body: '' }));
  await p.setContent('<script>' + mockFn(remote) + '</script>' + fs.readFileSync(PAGE, 'utf8')); await p.waitForTimeout(400);
  await p.evaluate(() => { const T = window.__t; T.startTutorial(); T.finishTutorial(true); }); await p.waitForTimeout(300);
  const bad = [];
  const before = await p.evaluate(() => (document.querySelector('.cloudbox') || {}).innerText || '');
  if (!/Connect account/.test(before) || /Sign in with Google/.test(before)) bad.push('before tap 1 expected "Connect account", got ' + JSON.stringify(before));
  await p.click('[data-act="cloudconnect"]'); await p.waitForTimeout(500);
  const a1 = await p.evaluate(() => ({ btn: (document.querySelector('[data-act="cloudconnect"]') || {}).textContent, pops: window.__pops, state: window.__t.cloud.state }));
  for (const [k, v] of Object.entries(AFTER1)) if (a1[k] !== v) bad.push(`after tap 1 ${k}: expected ${v} got ${a1[k]}`);
  await p.click('[data-act="cloudconnect"]'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ state: window.__t.cloud.state, msg: (document.getElementById('cloudMsg') || {}).textContent, mode: window.__t.mode, coins: window.__t.meta.coins, stored: Object.keys(window.__fs).join(','), pops: window.__pops }));
  for (const [k, v] of Object.entries(want)) if (r[k] !== v) bad.push(`${k}: expected ${v} got ${r[k]}`);
  console.log(label, bad.concat(errs).length ? 'FAIL ' + bad.concat(errs).join('; ') : 'ok', JSON.stringify(r)); await b.close(); return !bad.length && !errs.length; };
(async () => { let ok = true; for (const [l, m, rm, w] of CASES) ok = (await run(l, m, rm, w)) && ok; process.exit(ok ? 0 : 1); })();
