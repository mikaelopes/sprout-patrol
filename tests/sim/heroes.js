// Hero parity test: casual bot that USES specials, every hero on the same gardens and seeds, Nest at the grove goal.
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2] || 'tests/sim/heroes.jsonl', N = +(process.argv[3] || 24), ONLY = process.argv[4] ? process.argv[4].split(',') : null, OVR = process.argv[5] ? JSON.parse(process.argv[5]) : null;
const CFG = { react: 0.25, look: 2, flee: true, dodgeShots: false, err: 0.05, hunt: true, huntRange: 6, frostRange: 8, seeds: true, seedRange: 3, deliverAt: 4, specials: true };
const gardens = []; if (process.env.GARDENS) gardens.push(...process.env.GARDENS.split(',')); else for (const G of [3, 5, 7, 9, 11]) gardens.push(G + '-5', G + '-6', G + '-8');
const goal = G => { const r = { trail: 0, speed: 0, heart: 0 }; return r; };
const HEROES = ONLY || ['pip', 'moss', 'bolt', 'ember', 'nova'];
const jobs = []; for (const h of HEROES) for (const gid of gardens) for (let n = 0; n < N; n++) jobs.push({ h, gid, seed: 5000 + n * 7919 });
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync(process.env.PAGE || 'tests/sim/game_fast.html', 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8'); const fd = fs.openSync(out, 'w');
  const open = async () => { const p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot }); if (process.env.C5) await p.evaluate(v => { window.__C5 = v; }, process.env.C5); if (OVR) await p.evaluate(o => { const C = window.__g.hero && null; window.__ovr = o; }, OVR); return p; };
  const worker = async () => { let p = await open(), u = 0;
    while (jobs.length) { const j = jobs.shift(); if (++u > 150) { await p.close(); p = await open(); u = 0; }
      const [g, i] = j.gid.split('-').map(Number);
      const r = await p.evaluate(({ g, i, cfg, seed, h, ovr }) => { const T = window.__g, m = T.meta; m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.log = [];
        const rec = T.NEST_REC(g); m.up = { ...m.up, trail: rec.trail, speed: rec.speed, heart: rec.heart, frost: 0 }; m.owned = { ...m.owned, [h]: true }; m.char = h;
        if (ovr) for (const k in ovr) Object.assign(T.CHARS[k], ovr[k]); window.__c5 = +(window.__C5 || 0);
        return window.__bot.play(g, i, cfg, seed, {}); }, { g, i, cfg: CFG, seed: j.seed, h: j.h, ovr: OVR });
      fs.writeSync(fd, JSON.stringify({ h: j.h, gid: j.gid, ...r }) + '\n'); } };
  await Promise.all([worker(), worker()]); await b.close(); console.log('done');
})();
