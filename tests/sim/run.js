// Usage: node tests/sim/run.js <out.jsonl> <N> <tiers csv> <nest levels csv> [gardens csv]
const { chromium } = require('playwright'); const fs = require('fs');
const [out, N, tiersArg, nestArg, gArg] = process.argv.slice(2);
const TIERS = {
  novice:  { react: 0.40, look: 1, flee: false, dodgeShots: false, err: 0.10, hunt: true, huntRange: 4,  frostRange: 5,  seeds: false, seedRange: 0, deliverAt: 99 },
  casual:  { react: 0.25, look: 2, flee: true,  dodgeShots: false, err: 0.05, hunt: true, huntRange: 6,  frostRange: 8,  seeds: true,  seedRange: 3, deliverAt: 4 },
  skilled: { react: 0.12, look: 3, flee: true,  dodgeShots: true,  err: 0.01, hunt: true, huntRange: 10, frostRange: 12, seeds: true,  seedRange: 6, deliverAt: 3 },
};
const gardens = gArg ? gArg.split(',') : [].concat(...Array.from({ length: 12 }, (_, g) => [1, 2, 3, 4, 5, 6, 7, 8].map(i => (g + 1) + '-' + i)));
const jobs = [];
for (const tier of tiersArg.split(',')) for (const L of nestArg.split(',').map(Number)) for (const gid of gardens) for (let n = 0; n < +N; n++) jobs.push({ tier, L, gid, seed: 1000 + n * 7919 + L * 31 });
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync('tests/sim/game_fast.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8');
  const fd = fs.openSync(out, 'a'); let done = 0; const t0 = Date.now();
  const worker = async () => {
    let p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); let uses = 0;
    while (jobs.length) {
      const j = jobs.shift();
      if (++uses > 150) { await p.close(); p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); uses = 0; }
      const [g, i] = j.gid.split('-').map(Number);
      let r;
      try { r = await p.evaluate(({ g, i, L, cfg, seed }) => { const m = window.__g.meta; m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = []; m.up = { ...m.up, trail: L, speed: Math.ceil(L / 2), heart: L, frost: 0 }; return window.__bot.play(g, i, cfg, seed); }, { g, i, L: j.L, cfg: TIERS[j.tier], seed: j.seed }); }
      catch (e) { r = { error: String(e).slice(0, 120) }; }
      fs.writeSync(fd, JSON.stringify({ ...j, ...r }) + '\n'); done++;
      if (done % 200 === 0) console.log(done, 'done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
  };
  await Promise.all([worker(), worker()]); await b.close(); console.log('finished', done, ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
