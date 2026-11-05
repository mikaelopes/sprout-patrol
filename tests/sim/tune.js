// node tests/sim/tune.js '<BAL json override>' N  -> scores a balance setting against the locked targets
const { chromium } = require('playwright'); const fs = require('fs');
const over = JSON.parse(process.argv[2] || '{}'), N = +(process.argv[3] || 8), full = process.argv[4] === 'full';
const TIERS = {
  novice:  { react: 0.40, look: 1, flee: false, dodgeShots: false, err: 0.10, hunt: true, huntRange: 4,  frostRange: 5,  seeds: false, seedRange: 0, deliverAt: 99 },
  casual:  { react: 0.25, look: 2, flee: true,  dodgeShots: false, err: 0.05, hunt: true, huntRange: 6,  frostRange: 8,  seeds: true,  seedRange: 3, deliverAt: 4 },
  skilled: { react: 0.12, look: 3, flee: true,  dodgeShots: true,  err: 0.01, hunt: true, huntRange: 10, frostRange: 12, seeds: true,  seedRange: 6, deliverAt: 3 },
};
const goal = G => G <= 6 ? G : Math.min(10, 6 + Math.round((G - 6) * 2 / 3));
const gardens = []; for (let G = 1; G <= 12; G++) for (const i of full ? [1, 2, 3, 4, 5, 6, 7, 8] : [2, 4, 6, 8]) gardens.push([G, i]);
const jobs = [];
for (const [G, i] of gardens) {
  for (let n = 0; n < N; n++) jobs.push({ tier: 'casual', L: goal(G), G, i, seed: 900 + n * 7919 });
  for (let n = 0; n < Math.ceil(N / 2); n++) { jobs.push({ tier: 'novice', L: goal(G), G, i, seed: 300 + n * 7919 }); jobs.push({ tier: 'skilled', L: goal(G), G, i, seed: 600 + n * 7919 }); jobs.push({ tier: 'casual', L: 0, G, i, seed: 1200 + n * 7919, l0: 1 }); }
}
const typ = (G, i) => i === 8 ? 'boss' : (G >= 3 && i === 6) ? 'hard' : 'normal';
const band = G => G <= 3 ? 'a' : G <= 8 ? 'b' : 'c';
const TW = { 'normal-a': [.85, .95], 'normal-b': [.55, .75], 'normal-c': [.45, .65], hard: [.15, .50], boss: [.25, .60] }; // targets ±10pt
const TD = { normal: [1.35, 2.75], hard: [0.9, 1.65], boss: [2.25, 3.85] }; // minutes ±10%
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync('tests/sim/game_fast.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8'); const res = [];
  const worker = async () => { let p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); let u = 0;
    while (jobs.length) { const j = jobs.shift(); if (++u > 150) { await p.close(); p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); u = 0; }
      const r = await p.evaluate(({ j, cfg, over }) => { const T = window.__g, m = T.meta; for (const k in over) { if (typeof over[k] === 'object') Object.assign(T.BAL[k], over[k]); else T.BAL[k] = over[k]; }
        m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = []; m.char = 'pip'; m.up = { ...m.up, trail: j.L, speed: j.L, heart: j.L, frost: 0 }; m.gear = {}; m.gearOn = [];
        return window.__bot.play(j.G, j.i, cfg, j.seed); }, { j, cfg: TIERS[j.tier], over });
      res.push({ ...j, ...r }); } };
  await Promise.all([worker(), worker()]); await b.close();
  const grp = {}; const add = (k, r) => (grp[k] = grp[k] || []).push(r);
  for (const r of res) { const t = typ(r.G, r.i), key = t === 'normal' ? 'normal-' + band(r.G) : t; add((r.l0 ? 'L0:' : r.tier + ':') + key, r); add((r.l0 ? 'L0' : r.tier) + ':all', r); }
  const wr = v => v ? v.filter(r => r.won).length / v.length : NaN, mt = v => { const w = v.filter(r => r.won); return w.length ? w.reduce((a, r) => a + r.t, 0) / w.length / 60 : NaN; };
  let score = 0; const lines = [];
  for (const key of ['normal-a', 'normal-b', 'normal-c', 'hard', 'boss']) {
    const v = grp['casual:' + key] || [], w = wr(v), d = mt(v), [lo, hi] = TW[key], [dl, dh] = TD[key.split('-')[0]];
    const okW = w >= lo && w <= hi, okD = d >= dl && d <= dh; score += (okW ? 0 : Math.min(Math.abs(w - lo), Math.abs(w - hi))) + (okD ? 0 : 0.2 * Math.min(Math.abs(d - dl), Math.abs(d - dh)));
    lines.push(`${key.padEnd(9)} win ${(w * 100).toFixed(0).padStart(3)}% [${lo * 100}-${hi * 100}] ${okW ? '✓' : '✗'}  ${d.toFixed(2)} min [${dl}-${dh}] ${okD ? '✓' : '✗'}  (novice ${(wr(grp['novice:' + key]) * 100).toFixed(0)}% skilled ${(wr(grp['skilled:' + key]) * 100).toFixed(0)}% L0 ${(wr(grp['L0:' + key]) * 100).toFixed(0)}%)`);
  }
  const skill = wr(grp['skilled:all']) - wr(grp['novice:all']), nest = wr(grp['casual:all']) - wr(grp['L0:all']);
  const share = skill / Math.max(0.001, skill + Math.max(0, nest));
  lines.push(`skill effect ${(skill * 100).toFixed(0)}pt · Nest effect ${(nest * 100).toFixed(0)}pt · skill share ${(share * 100).toFixed(0)}% [60-80] ${share >= 0.6 && share <= 0.8 ? '✓' : '✗'}`);
  score += share >= 0.6 && share <= 0.8 ? 0 : Math.min(Math.abs(share - 0.6), Math.abs(share - 0.8));
  console.log(lines.join('\n')); console.log('SCORE', score.toFixed(3), JSON.stringify(over));
  fs.appendFileSync('tests/sim/tune_log.txt', JSON.stringify({ over, score, lines }) + '\n');
})();
