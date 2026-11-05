const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(fs.readFileSync('tests/sim/game_fast.html', 'utf8')); await p.waitForTimeout(300); await p.addScriptTag({ content: fs.readFileSync('tests/sim/bot_inject.js', 'utf8') });
  const base = { react: 0.12, danger: 2.4, err: 0.02, hunt: true, huntRange: 10, frostRange: 12, seeds: true, seedRange: 6, deliverAt: 3 };
  for (const [name, cfg] of [['skilled', base], ['nohunt', { ...base, hunt: false }]]) for (const gid of ['1-1', '4-2', '8-3']) {
    const [g, i] = gid.split('-').map(Number); const res = [];
    for (let n = 0; n < 6; n++) res.push(await p.evaluate(({ g, i, cfg, seed }) => { window.__hits = []; const m = window.__g.meta; m.tutorialDone = true; m.journeyDone = true; m.journey = 6; m.up = { ...m.up, trail: 0, speed: 0, heart: 0, frost: 0 }; const r = window.__bot.play(g, i, cfg, seed); return { won: r.won, hits: r.hits, causes: window.__hits.map(h => (h.shots ? 'shot' : h.lob ? 'lob?' : '') + (h.near ? h.near.t + '@' + h.near.d + h.near.st : '')) }; }, { g, i, cfg, seed: 100 + n * 977 }));
    console.log(name, gid, 'wins', res.filter(r => r.won).length + '/6', 'hits', res.map(r => r.hits).join(','), JSON.stringify(res.flatMap(r => r.causes).slice(0, 8)));
  }
  await b.close(); })();
