// Boot network check: before the player opts in, the shipped pages (index.html and dist/) may request nothing from the network
// except the game font (fonts.googleapis.com / fonts.gstatic.com). Anything else, e.g. www.gstatic.com/firebasejs, fails (exit 1).
// Also pins the opt-in rule: a player who connected before (meta.cloudOn) may reconnect silently, so the SDK is requested then.
// Usage: node tests/smoke/netcheck.js
const { chromium } = require('playwright'); const { pathToFileURL } = require('url'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'), ALLOWED = ['fonts.googleapis.com', 'fonts.gstatic.com'], SKIP = ['file:', 'data:', 'blob:', 'about:'];
async function seen(file, seed) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const urls = [], errs = [];
  if (seed) await ctx.addInitScript(s => { try { localStorage.setItem('tufttrail-v2', s); } catch (e) {} }, seed);
  await ctx.route(u => !SKIP.includes(u.protocol), r => { urls.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(path.join(ROOT, file)).href); await p.waitForTimeout(1500);
  await b.close(); return { urls, errs };
}
(async () => {
  let bad = 0;
  const fresh = JSON.stringify({ name: 'T', coins: 5, tutorialDone: true, cutsV: 2, adv: { '1-1': 3 }, st: { tufts: 50, runs: 3 }, up: {}, owned: { pip: true } });
  for (const file of ['index.html', 'dist/sprout-patrol.html']) {
    for (const [label, seed] of [['new player', null], ['returning, not opted in', fresh]]) {
      const { urls, errs } = await seen(file, seed); const off = urls.filter(u => !ALLOWED.includes(new URL(u).hostname));
      console.log(file, label + ':', urls.length, 'requests,', off.length ? 'FAIL ' + off.join(' ') : 'only fonts');
      if (off.length || errs.length) { bad++; if (errs.length) console.log(errs.slice(0, 3)); }
    }
  }
  const { urls } = await seen('index.html', JSON.stringify({ ...JSON.parse(fresh), cloudOn: true }));
  const sdk = urls.some(u => u.includes('www.gstatic.com/firebasejs'));
  console.log('index.html opted in (cloudOn): SDK requested =', sdk); if (!sdk) bad++;
  process.exit(bad ? 1 : 0);
})();
