// Per-garden tuner: speed fine-tune first, then fewer hearts if speed is capped.
const { chromium } = require('playwright'); const fs = require('fs');
const N = +(process.argv[2] || 16), OUT = 'tests/sim/garden_tuned8.json';
const CASUAL = { react: 0.25, look: 2, flee: true, dodgeShots: false, err: 0.05, hunt: true, huntRange: 6, frostRange: 8, seeds: true, seedRange: 3, deliverAt: 4 };
const goal = G => G <= 6 ? G : Math.min(10, 6 + Math.round((G - 6) * 2 / 3));
const tgt = (G, i) => i === 8 ? 0.42 : (G >= 3 && i === 6) ? 0.32 : G <= 3 ? 0.9 : G <= 8 ? 0.65 : 0.55;
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync('tests/sim/game_econ.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8');
  const pages = []; for (let k = 0; k < 2; k++) { const p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); pages.push(p); }
  let st = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : { gm: Array(96).fill(1), ghp: Array(96).fill(0), log: [] };
  const ev = async (G, i, mult, hp) => { const jobs = []; for (let n = 0; n < N; n++) jobs.push(31337 + n * 104729); let w = 0, t = 0, tot = 0;
    await Promise.all(pages.map(async p => { while (jobs.length) { const seed = jobs.shift();
      const r = await p.evaluate(({ G, i, L, cfg, seed, mult, hp }) => { const T = window.__g, m = T.meta, k = (G - 1) * 8 + i - 1; T.BAL.gm[k] = mult; T.BAL.ghp[k] = hp;
        m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = []; m.char = 'pip'; m.up = { ...m.up, trail: L, speed: Math.ceil(L / 2), heart: L, frost: 0 }; m.gear = {}; m.gearOn = [];
        return window.__bot.play(G, i, cfg, seed); }, { G, i, L: goal(G), cfg: CASUAL, seed, mult, hp });
      tot++; if (r.won) { w++; t += r.t; } } }));
    return { w: w / tot, t: w ? t / w / 60 : 0 }; };
  for (let G = 1; G <= 12; G++) for (let i = 1; i <= 8; i++) {
    const k = (G - 1) * 8 + i - 1; if (st.log.find(x => x.k === k)) continue;
    const T0 = tgt(G, i); let best = null;
    for (let hp = 0; hp >= -3; hp--) {
      let lo = 0.55, hi = 1.6, capped = true;
      for (let it = 0; it < 5; it++) { const mid = (lo + hi) / 2, r = await ev(G, i, mid, hp);
        if (!best || Math.abs(r.w - T0) < Math.abs(best.w - T0)) best = { k, g: G + '-' + i, mult: +mid.toFixed(3), hp, ...r };
        if (Math.abs(r.w - T0) <= 0.07) { capped = false; break; }
        if (r.w > T0) lo = mid; else { hi = mid; capped = false; } }
      if (!capped || Math.abs(best.w - T0) <= 0.1) break; // only remove hearts when speed alone can't make it hard enough
    }
    st.gm[k] = best.mult; st.ghp[k] = best.hp; st.log.push(best); fs.writeFileSync(OUT, JSON.stringify(st));
    console.log(`${best.g} target ${(T0 * 100).toFixed(0)}% -> mult ${best.mult} hp ${best.hp} win ${(best.w * 100).toFixed(0)}% ${best.t.toFixed(2)}min`);
  }
  await b.close();
})();
