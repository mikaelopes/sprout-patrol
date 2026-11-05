// Plays Season 1 in order like a real player: retries after a loss, buys Nest upgrades whenever affordable, opens star chests.
// node tests/sim/campaign.js <tier> <runs> <out.json> [page]
const { chromium } = require('playwright'); const fs = require('fs');
const [tier, RUNS, out, page] = [process.argv[2], +process.argv[3], process.argv[4], 'tests/sim/game_econ.html']; const OVER = JSON.parse(process.argv[5] || '{}');
const TIERS = {
  novice:  { react: 0.40, look: 1, flee: false, dodgeShots: false, err: 0.10, hunt: true, huntRange: 4,  frostRange: 5,  seeds: false, seedRange: 0, deliverAt: 99 },
  casual:  { react: 0.25, look: 2, flee: true,  dodgeShots: false, err: 0.05, hunt: true, huntRange: 6,  frostRange: 8,  seeds: true,  seedRange: 3, deliverAt: 4 },
  skilled: { react: 0.12, look: 3, flee: true,  dodgeShots: true,  err: 0.01, hunt: true, huntRange: 10, frostRange: 12, seeds: true,  seedRange: 6, deliverAt: 3 },
};
(async () => {
  const b = await chromium.launch(); const html = fs.readFileSync(page, 'utf8'), bot = fs.readFileSync('tests/sim/bot_inject.js', 'utf8'); const all = [];
  for (let r = 0; r < RUNS; r++) {
    const p = await b.newPage(); await p.setContent(html); await p.waitForTimeout(300); await p.addScriptTag({ content: bot });
    const res = await p.evaluate(({ cfg, r, OVER }) => {
      const T = window.__g, m = T.meta;
      if (OVER.eco) Object.assign(T.BAL.eco, OVER.eco); if (OVER.costMul) T.NEST.forEach(u => { u.cost = u.cost.map((c, n) => n === 0 && u.k === 'trail' ? c : Math.round(c * OVER.costMul / 5) * 5); }); if (OVER.growth) T.NEST.forEach(u => { u.cost = u.cost.map((c, n) => n === 0 && u.k === 'trail' ? c : Math.round(OVER.base[u.k] * Math.pow(OVER.growth, n) / 5) * 5); });
      Object.assign(m, { tutorialDone: true, journeyDone: true, journey: 6, tutReward: true, coins: 40, cutsV: 2, adv: {}, up: { trail: 0, speed: 0, heart: 0, frost: 0 }, log: [], tries: {}, fails: {}, starChests: 0, gear: {}, gearOn: [] }); window.LOG_BIG = 1;
      const buy = () => { // spend like a casual player: the upgrade furthest below the grove's Nest goal first, else the cheapest available
        for (let guard = 0; guard < 30; guard++) {
          const G = T.groveReached(), rec = T.NEST_REC(G), opts = T.NEST.filter(u => m.up[u.k] < u.max && u.gate[m.up[u.k]] <= G && m.coins >= u.cost[m.up[u.k]]);
          if (!opts.length) return;
          opts.sort((a, b) => ((m.up[a.k] - (rec[a.k] ?? 1)) - (m.up[b.k] - (rec[b.k] ?? 1))) || (a.cost[m.up[a.k]] - b.cost[m.up[b.k]]));
          const u = opts[0]; m.coins -= u.cost[m.up[u.k]]; m.up[u.k]++; (m.buys = m.buys || []).push({ k: u.k, lv: m.up[u.k], at: T.groveReached() });
        }
      };
      const gardens = []; let seed = 77 + r * 1000003, totalT = 0; let earnedTotal = 0;
      for (let G = 1; G <= 12; G++) for (let i = 1; i <= 8; i++) {
        let tries = 0, won = false, attT = 0; const coins0 = m.coins, rec = T.NEST_REC(G), upAt = { ...m.up };
        while (!won && tries < 25) {
          tries++; const o = window.__bot.play(G, i, cfg, seed++, {}, true); won = o.won; attT += (o.t || 0) + 15; // +15 s menus
          T.setMode('hub'); if (T.starChestsReady() > 0) { T.openStarChest(true, 'map'); T.setMode('hub'); }
          buy();
        }
        totalT += attT; earnedTotal += 0;
        gardens.push({ g: G + '-' + i, tries, minutes: +(attT / 60).toFixed(2), seedsGained: m.coins - coins0, coins: m.coins, up: upAt, rec, behind: ['speed', 'trail', 'heart'].reduce((a, k) => a + Math.max(0, (rec[k] || 0) - (upAt[k] || 0)), 0), stars: m.adv[G + '-' + i] || 0 });
      }
      return { gardens, hours: totalT / 3600, buys: m.buys, endCoins: m.coins, up: m.up, log: m.log.filter(e => e.a) };
    }, { cfg: TIERS[tier], r, OVER });
    all.push(res); console.log(tier, 'run', r, 'hours', res.hours.toFixed(2), 'endCoins', res.endCoins, JSON.stringify(res.up)); await p.close();
  }
  fs.writeFileSync(out, JSON.stringify(all)); await b.close();
})();
