// What each of the 96 gardens actually contains (read from the live game, not from notes).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(fs.readFileSync('tests/sim/game_fast.html', 'utf8')); await p.waitForTimeout(300);
  const R = await p.evaluate(() => { const T = window.__g, m = T.meta; m.tutorialDone = true; m.journeyDone = true; m.up = { trail: 0, speed: 0, heart: 0, frost: 0 };
    const out = [];
    for (let G = 1; G <= 12; G++) for (let i = 1; i <= 8; i++) { T.seedRandom(G * 100 + i); T.start(G, i); const run = T.run(), en = T.enemies(), po = T.portals();
      const types = {}; en.forEach(e => { const k = e.type === 'boss' ? 'boss:' + e.variant + (e.weak ? '/' + e.weak : '') : e.type; types[k] = (types[k] || 0) + 1; });
      out.push({ g: G + '-' + i, types, colors: new Set(T.bubbles().filter(b => !b.gold).map(b => b.c)).size, sprouts: T.bubbles().filter(b => !b.gold).length, portals: po.filter(q => !q.rainbow && !q.golden).length,
        dual: po.some(q => q.cs.length === 2 && !q.rainbow), rainbow: po.some(q => q.rainbow), par: run.par, hp: run.hp, shinyPossible: G >= 2 && i !== 8, night: G >= 8, hard: i === 6 && G >= 3, boss: i === 8, speed: +(en.find(e => e.type !== 'boss') || en[0] || { speed: 0 }).speed.toFixed(2) }); }
    return out; });
  fs.writeFileSync('tests/sim/schedule.json', JSON.stringify(R)); await b.close();
  const first = {}; R.forEach(r => { const keys = [...Object.keys(r.types), r.dual ? 'dual portal' : null, r.rainbow ? 'rainbow portal' : null, r.par ? 'par time' : null, r.shinyPossible ? 'shiny' : null, r.night ? 'night (after 3 min)' : null, r.hard ? 'hard garden' : null, 'colors:' + r.colors]; keys.filter(Boolean).forEach(k => { if (!first[k]) first[k] = r.g; }); });
  console.log(first);
})();
