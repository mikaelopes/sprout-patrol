// For the hard gardens that speed alone can't make hard enough: add pests one at a time, re-searching speed each time.
const { chromium } = require('playwright'); const fs = require('fs');
const groves = process.argv[2].split(',').map(Number), N = +(process.argv[3] || 12);
const CASUAL = { react: 0.25, look: 2, flee: true, dodgeShots: false, err: 0.05, hunt: true, huntRange: 6, frostRange: 8, seeds: true, seedRange: 3, deliverAt: 4 };
const goal = G => Math.min(5, Math.floor(G / 2));
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync('tests/sim/game_econ.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8');
  const pages = []; for (let k = 0; k < 2; k++) { const p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); pages.push(p); }
  const ev = async (G, mult, hne) => { const jobs = []; for (let n = 0; n < N; n++) jobs.push(5151 + n * 7919); let w = 0, t = 0, tot = 0;
    await Promise.all(pages.map(async p => { while (jobs.length) { const seed = jobs.shift();
      const r = await p.evaluate(({ G, L, cfg, seed, mult, hne }) => { const T = window.__g, m = T.meta; T.BAL.gs.h[G - 1] = mult; T.BAL.hne[G - 1] = hne;
        m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = []; m.char = 'pip'; m.up = { ...m.up, trail: L, speed: Math.ceil(L / 2), heart: Math.min(L, 3), frost: L }; m.gear = {}; m.gearOn = [];
        return window.__bot.play(G, 4, cfg, seed); }, { G, L: goal(G), cfg: CASUAL, seed, mult, hne });
      tot++; if (r.won) { w++; t += r.t; } } }));
    return { w: w / tot, t: w ? t / w / 60 : 0 }; };
  const out = {};
  for (const G of groves) {
    let best = null;
    for (let hne = 1; hne <= 3 && !(best && Math.abs(best.w - 0.32) <= 0.06); hne++) {
      let lo = 0.6, hi = 1.8;
      for (let it = 0; it < 5; it++) { const mid = (lo + hi) / 2, r = await ev(G, mid, hne);
        if (!best || Math.abs(r.w - 0.32) < Math.abs(best.w - 0.32)) best = { G, hne, mult: +mid.toFixed(3), ...r };
        if (Math.abs(r.w - 0.32) <= 0.05) break; if (r.w > 0.32) lo = mid; else hi = mid; }
    }
    out[G] = best; console.log(JSON.stringify(best));
  }
  fs.writeFileSync('tests/sim/hard_tuned.json', JSON.stringify(out)); await b.close();
})();
