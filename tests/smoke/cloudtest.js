const { chromium } = require('playwright'); const fs = require('fs');
const run = async (mock, label, setup) => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' }); const errs = []; p.on('pageerror', e => errs.push(e.message));

  let html = fs.readFileSync('dist/sprout-patrol.html', 'utf8').replace("showSplash();\nrequestAnimationFrame(frame);", "showSplash();\nwindow.__t={get meta(){return meta},get cloud(){return cloud},startTutorial,finishTutorial,skipTutorial,showProfile,saveMeta,get mode(){return mode}};\nrequestAnimationFrame(frame);");
  if (mock) html = '<script>' + mock + '</script>' + html;
  await p.setContent(html); await p.waitForTimeout(400);
  await p.evaluate(setup || (() => {}));
  await p.evaluate(() => { const T = window.__t; T.startTutorial(); T.finishTutorial(true); }); await p.waitForTimeout(300);
  const box = await p.$('[data-act="cloudconnect"]'); const hasBox = !!box;
  if (box) { await box.click(); await p.waitForTimeout(2500); }
  const r = await p.evaluate(() => ({ state: window.__t.cloud.state, msg: (document.getElementById('cloudMsg') || {}).textContent, mode: window.__t.mode, coins: window.__t.meta.coins, cloudOn: window.__t.meta.cloudOn, stored: window.__store ? Object.keys(window.__store) : null, size: window.__store ? Object.values(window.__store).map(v => v.json.length) : null }));
  await p.screenshot({ path: `/tmp/cloud_${label}.png` });
  console.log(label, hasBox, JSON.stringify(r), errs.slice(0, 2)); await b.close(); };
const mk = (can, remote) => `window.__store = ${remote ? JSON.stringify({ 'data/users/u1/save': { json: JSON.stringify(remote), at: 1 } }) : '{}'};
  const doc = path => ({ get: async () => ({ exists: !!window.__store[path], data: () => window.__store[path] }), set: async v => { if (!${can}) { const e = new Error('no'); e.code = 'invalid_argument'; throw e; } window.__store[path] = v; } });
  window.claude = { use: async n => n === 'user' ? { id: async () => 'u1', can: async () => ${can} } : n === 'db' ? { doc } : null };`;
(async () => {
  await run(null, 'nosdk');
  await run(mk(true, null), 'fresh');
  await run(mk(false, null), 'readonly'); await run(mk(null, null), 'cannull');
  await run(mk(true, { name: 'Remote', coins: 999, tutorialDone: true, journeyDone: true, adv: { '1-1': 3, '1-2': 3, '1-3': 3, '1-4': 3 }, st: { tufts: 500, runs: 5 }, up: { trail: 3, speed: 2, heart: 2, frost: 0 }, owned: { pip: true }, cutsV: 2 }), 'pull');
})();
