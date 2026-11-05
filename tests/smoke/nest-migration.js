// P6 save migration check (design/revamp/gameplay-levels.md): old 10-level Quick Feet saves load into the 5-level Nest
// with no lost speed or seeds, and progressOf() never drops (so saveMeta's "never go down" guard keeps saving).
// Usage: node tests/smoke/nest-migration.js [dist/sprout-patrol.html]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const html = fs.readFileSync(process.argv[2] || 'dist/sprout-patrol.html', 'utf8').replace("showSplash();\nrequestAnimationFrame(frame);",
    "showSplash();\nwindow.__t={applySave,progressOf,NEST,get meta(){return meta}};\nrequestAnimationFrame(frame);");
  await p.setContent(html); await p.waitForTimeout(400);
  const OLD = [200, 240, 290, 345, 415, 500, 595, 715, 860, 1030], sum = (a, n) => a.slice(0, n).reduce((x, y) => x + y, 0);
  const base = { name: 'Old', coins: 100, char: 'pip', owned: { pip: true }, st: { runs: 9, tufts: 50 }, adv: { '1-1': 3, '4-2': 2 }, tutorialDone: true };
  const cases = [ // [label, saved, expected speed, expected coins]
    ['v2 speed 0', { ...base, cutsV: 2, up: { trail: 2, speed: 0, heart: 1 } }, 0, 100],
    ['v2 speed 1', { ...base, cutsV: 2, up: { trail: 2, speed: 1, heart: 1 } }, 1, 100],
    ['v2 speed 3', { ...base, cutsV: 2, up: { trail: 2, speed: 3, heart: 1 } }, 2, 100],
    ['v2 speed 4', { ...base, cutsV: 2, up: { trail: 2, speed: 4, heart: 1 } }, 2, 100],
    ['v2 speed 10', { ...base, cutsV: 2, up: { trail: 9, speed: 10, heart: 9 } }, 5, 100],
    ['v2 speed 12 (corrupt)', { ...base, cutsV: 2, up: { speed: 12 } }, 5, 100],
    ['pre-v98 (no cutsV) speed 2', { ...base, up: { trail: 1, speed: 2 } }, 0, 100 + 90 + 210 + 40],
    ['v3 speed 5 untouched', { ...base, cutsV: 3, up: { speed: 5 } }, 5, 100],
  ];
  let fail = 0;
  for (const [label, saved, sp, coins] of cases) {
    const r = await p.evaluate(s => { const T = window.__t, raw = JSON.parse(JSON.stringify(s)); T.applySave(raw); const m = T.meta;
      const s2 = JSON.parse(JSON.stringify(m)); T.applySave(s2); // loading the migrated save again changes nothing
      return { speed: m.up.speed, coins: m.coins, cutsV: m.cutsV, p0: T.progressOf(s), p1: T.progressOf(m), again: T.meta.up.speed === m.up.speed && T.meta.coins === m.coins, max: T.NEST.find(u => u.k === 'speed').max, adv: Object.keys(m.adv).length }; }, saved);
    // value check: the new levels are worth at least what was paid for the old ones
    const NEW = await p.evaluate(() => window.__t.NEST.find(u => u.k === 'speed').cost);
    const L = Math.min(10, (saved.up || {}).speed || 0), paid = saved.cutsV === 2 ? sum(OLD, L) : 0, worth = sum(NEW, r.speed) + (r.coins - coins);
    const ok = r.speed === sp && r.coins === coins && r.cutsV === 3 && r.again && r.max === 5 && r.speed <= r.max && r.p1 >= r.p0 - (saved.cutsV === 2 && (saved.up.speed || 0) <= 10 ? 0 : 1e9) && worth >= paid && r.adv === 2;
    if (!ok) fail++;
    console.log(ok ? 'ok  ' : 'FAIL', label, JSON.stringify({ ...r, paid, worth }));
  }
  if (errs.length) { console.log('page errors', errs); fail++; }
  await b.close(); console.log(fail ? `nest-migration: ${fail} failing` : 'nest-migration ok'); process.exit(fail ? 1 : 0);
})();
