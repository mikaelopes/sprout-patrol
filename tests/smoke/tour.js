// Screenshot tour of the main screens at phone size, for design reviews. Usage: node tests/smoke/tour.js OUTDIR [lang]
const { chromium } = require('playwright'); const fs = require('fs');
const OUT = process.argv[2] || '/tmp/tour', LANG = process.argv[3] || 'en-US';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const errs = [];
  const page = async () => { const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: LANG }); p.on('pageerror', e => errs.push(e.message));
    let html = fs.readFileSync('dist/sprout-patrol.html', 'utf8').replace("showSplash();\nrequestAnimationFrame(frame);",
      "showSplash();\nwindow.__t={showHub,showMap,showPrelevel,startAdventure,resume,showChars,showNest,showChallenges,showProfile,showRoad,showDaily,startTutorial,pauseGame,get meta(){return meta},get run(){return run},setInv(v){invuln=v}};\nrequestAnimationFrame(frame);");
    await p.setContent(html); await p.waitForTimeout(600); return p; };
  const shot = async (p, n) => { await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${n}.png` }); };
  let p = await page(); await shot(p, '01-splash');
  await p.evaluate(() => window.__t.startTutorial()); await p.waitForTimeout(1500); await shot(p, '02-tutorial'); await p.close();
  p = await page();
  await p.evaluate(() => { const m = window.__t.meta; m.tutorialDone = true; m.journeyDone = true; m.coach = { hub: 1, map: 1, prelevel: 1, chars: 1, nest: 1 }; m.coins = 420; m.adv = {}; for (let g = 1; g <= 5; g++) for (let i = 1; i <= 8; i++) m.adv[g + '-' + i] = 2 + (i % 2); });
  const S = [['03-hub', 'showHub'], ['04-map', 'showMap'], ['05-chars', 'showChars'], ['06-nest', 'showNest'], ['07-challenges', 'showChallenges'], ['08-profile', 'showProfile'], ['09-road', 'showRoad'], ['10-daily', 'showDaily']];
  for (const [n, f] of S) { try { await p.evaluate(f => window.__t[f](), f); await shot(p, n); } catch (e) { errs.push(n + ': ' + e.message); } }
  for (const [n, g, i] of [['11-play-early', 1, 3], ['12-play-mid', 6, 2], ['13-play-late', 10, 5], ['14-play-boss', 8, 8]]) {
    try { await p.evaluate(([g, i]) => { window.__t.startAdventure(g, i, {}); }, [g, i]); await p.waitForTimeout(500); await shot(p, n.replace('play', 'prelevel'));
      await p.evaluate(() => { window.__t.resume(); window.__t.setInv(99); }); await p.waitForTimeout(2500); await shot(p, n);
      await p.evaluate(() => window.__t.pauseGame()); } catch (e) { errs.push(n + ': ' + e.message); } }
  console.log(fs.readdirSync(OUT).join(' ')); console.log('errors', errs); await b.close();
})();
