// Per-grove auto-tuner: binary-searches BAL.gs.{n,h,b}[G-1] so the casual bot at the Nest goal hits each garden type's target win rate.
const { chromium } = require('playwright'); const fs = require('fs');
const N = +(process.argv[2] || 12), OUT = process.argv[3] || 'tests/sim/gs_tuned.json';
const CASUAL = { react: 0.25, look: 2, flee: true, dodgeShots: false, err: 0.05, hunt: true, huntRange: 6, frostRange: 8, seeds: true, seedRange: 3, deliverAt: 4 };
const goal = G => Math.min(5, Math.floor(G / 2));
const target = (G, type) => type === 'b' ? 0.42 : type === 'h' ? 0.32 : G <= 3 ? 0.9 : G <= 8 ? 0.65 : 0.55;
const gardensOf = (G, type) => type === 'b' ? [5] : type === 'h' ? [4] : (G >= 3 ? [1, 2, 3] : [1, 2, 3, 4]);
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync('tests/sim/game_econ.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8');
  const pages = []; for (let k = 0; k < 2; k++) { const p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); pages.push(p); }
  const gs = { n: Array(12).fill(1), h: Array(12).fill(1), b: Array(12).fill(1) };
  const evalWin = async (G, type, mult) => {
    const jobs = []; for (const i of gardensOf(G, type)) for (let n = 0; n < N; n++) jobs.push({ i, seed: 4242 + n * 7919 + i * 13 });
    let wins = 0, tot = 0, tsum = 0;
    await Promise.all(pages.map(async p => { while (jobs.length) { const j = jobs.shift();
      const r = await p.evaluate(({ G, i, L, cfg, seed, gs, type, mult }) => { const T = window.__g, m = T.meta;
        T.BAL.gs = JSON.parse(JSON.stringify(gs)); T.BAL.gs[type][G - 1] = mult;
        m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = []; m.char = 'pip'; m.up = { ...m.up, trail: L, speed: Math.ceil(L / 2), heart: Math.min(L, 3), frost: L }; m.gear = {}; m.gearOn = [];
        return window.__bot.play(G, i, cfg, seed); }, { G, i: j.i, L: goal(G), cfg: CASUAL, seed: j.seed, gs, type, mult });
      wins += r.won ? 1 : 0; tot++; if (r.won) tsum += r.t; } }));
    return { w: wins / tot, t: wins ? tsum / wins / 60 : 0 };
  };
  const log = [];
  for (let G = 1; G <= 12; G++) for (const type of ['n', 'h', 'b']) {
    if (type === 'h' && G < 3) continue;
    let lo = 0.5, hi = 1.8, best = null; const tg = target(G, type);
    for (let it = 0; it < 6; it++) {
      const mid = (lo + hi) / 2, r = await evalWin(G, type, mid);
      if (!best || Math.abs(r.w - tg) < Math.abs(best.w - tg)) best = { mult: +mid.toFixed(3), ...r };
      if (Math.abs(r.w - tg) <= 0.05) break;
      if (r.w > tg) lo = mid; else hi = mid; // too easy -> faster pests
    }
    gs[type][G - 1] = best.mult; log.push({ G, type, target: tg, ...best });
    console.log(`G${G} ${type} target ${(tg * 100).toFixed(0)}% -> mult ${best.mult} win ${(best.w * 100).toFixed(0)}% ${best.t.toFixed(2)}min`);
    fs.writeFileSync(OUT, JSON.stringify({ gs, log }, null, 1));
  }
  await b.close();
})();
