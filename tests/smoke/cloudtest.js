// Claude-account save flow (window.claude mock): each case is asserted. Exit 1 on any mismatch or page error.
// Screenshots go to the OS temp dir.
const { chromium } = require('playwright'); const fs = require('fs'), os = require('os'), path = require('path'); const { spawnSync } = require('child_process');
const PAGE = path.join(__dirname, '..', 'sim', 'game_cloud.html');
if (spawnSync('node', [path.join(__dirname, '..', 'sim', 'mkpage.js'), PAGE], { stdio: 'ignore' }).status) { console.error('test build failed'); process.exit(1); }
const REMOTE = { name: 'Remote', coins: 999, tutorialDone: true, journeyDone: true, adv: { '1-1': 3, '1-2': 3, '1-3': 3, '1-4': 3 }, st: { tufts: 500, runs: 5 }, up: { trail: 3, speed: 2, heart: 2, frost: 0 }, owned: { pip: true }, cutsV: 2 };
const mk = (can, remote) => `window.__fast = 0; window.__store = ${remote ? JSON.stringify({ 'data/users/u1/save': { json: JSON.stringify(remote), at: 1 } }) : '{}'};
  const doc = path => ({ get: async () => ({ exists: !!window.__store[path], data: () => window.__store[path] }), set: async v => { if (!${can}) { const e = new Error('no'); e.code = 'invalid_argument'; throw e; } window.__store[path] = v; } });
  window.claude = { use: async n => n === 'user' ? { id: async () => 'u1', can: async () => ${can} } : n === 'db' ? { doc } : null };`;
// label: [mock, expected subset of {hasBox, state, mode, coins, cloudOn, stored (number of keys)}]
const CASES = [
  // outside Claude (Firebase host) with the SDK unreachable: the box shows, the first tap fails to load it and says to try again
  ['nosdk', null, { hasBox: true, state: 'signedOut', mode: 'tutdone', coins: 40, stored: null }],
  ['fresh', mk(true, null), { hasBox: true, state: 'on', mode: 'tutdone', coins: 40, cloudOn: true, stored: 1 }],
  ['readonly', mk(false, null), { hasBox: false, state: 'off', mode: 'tutdone', stored: 0 }],
  ['cannull', mk(null, null), { hasBox: true, state: 'readonly', mode: 'tutdone', cloudOn: false, stored: 0 }],
  ['pull', mk(true, REMOTE), { hasBox: true, state: 'on', mode: 'hub', coins: 999, cloudOn: true, stored: 1 }],
];
const run = async (label, mock, want) => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(u => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname), r => r.fulfill({ status: 200, body: '' }));
  await p.route(u => u.hostname === 'www.gstatic.com', r => r.abort()); // never reach the real Firebase SDK
  let html = fs.readFileSync(PAGE, 'utf8'); if (mock) html = '<script>' + mock + '</script>' + html;
  await p.setContent(html); await p.waitForTimeout(400);
  await p.evaluate(() => { const T = window.__t; T.startTutorial(); T.finishTutorial(true); }); await p.waitForTimeout(300);
  const box = await p.$('[data-act="cloudconnect"]'); const hasBox = !!box;
  if (box) { await box.click(); await p.waitForTimeout(2500); }
  const r = await p.evaluate(() => ({ state: window.__t.cloud.state, msg: (document.getElementById('cloudMsg') || {}).textContent, mode: window.__t.mode, coins: window.__t.meta.coins, cloudOn: window.__t.meta.cloudOn, stored: window.__store ? Object.keys(window.__store).length : null }));
  r.hasBox = hasBox; await p.screenshot({ path: path.join(os.tmpdir(), `cloud_${label}.png`) });
  const bad = Object.entries(want).filter(([k, v]) => r[k] !== v).map(([k, v]) => `${k}: expected ${v} got ${r[k]}`).concat(errs);
  console.log(label, bad.length ? 'FAIL ' + bad.join('; ') : 'ok', JSON.stringify(r)); await b.close(); return !bad.length; };
(async () => { let ok = true; for (const [l, m, w] of CASES) ok = (await run(l, m, w)) && ok; process.exit(ok ? 0 : 1); })();
