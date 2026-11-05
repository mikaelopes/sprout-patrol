// Readability: draw every pest/boss in each state on a real board, crop it, then (in readab.py) compare states
// in normal color, greyscale and two colorblind simulations. Usage: node tests/sim/readab.js [html] [outdir]
const { chromium } = require('playwright'); const fs = require('fs');
const SRC = process.argv[2] || 'dist/sprout-patrol.html', OUT = process.argv[3] || 'readab';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let html = fs.readFileSync(SRC, 'utf8');
  html = html.replace("showSplash();\nrequestAnimationFrame(frame);", "showSplash();\nwindow.__noLearn=1;window.__r={get meta(){return meta},startAdventure,resume,flagEnemy,freeze,bonkBoss,get run(){return run},get enemies(){return enemies},set enemies(v){enemies=v},get player(){return player},get cell(){return cell},get cam(){return cam},get mode(){return mode},setInv(v){invuln=v},setFreeze(v){freezeT=v},isOpen,get pickups(){return pickups},get shots(){return shots},get bubbles(){return bubbles}};\nrequestAnimationFrame(frame);");
  await p.setContent('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + html); await p.waitForTimeout(800);
  const CASES = [
    ['wander', 'awake'], ['wander', 'awake2'], ['wander', 'frozen'], ['wander', 'dizzy'], ['wander', 'waking'],
    ['hunter', 'awake'], ['hunter', 'chasing'], ['hunter', 'frozen'],
    ['shooter', 'awake'], ['shooter', 'aiming'], ['shooter', 'frozen'],
    ['sniper', 'awake'], ['sniper', 'aiming'],
    ['mushroom', 'awake'], ['mushroom', 'leaping'],
    ['grape', 'awake'], ['minigrape', 'awake'], ['night', 'awake'],
    ['boss:king', 'awake'], ['boss:king', 'windup'], ['boss:king', 'dizzy'], ['boss:king', 'frozen'],
    ['boss:queen', 'awake'], ['boss:queen', 'windup'], ['boss:potato', 'under'], ['boss:potato', 'popped'],
    ['boss:twins', 'awake'], ['boss:twins', 'frost'], ['boss:broc', 'awake'],
  ];
  const BG = { king: 1, queen: 2, twins: 3, broc: 4, potato: 5 };
  const meta = [];
  for (const [who, st] of CASES) {
    const boss = who.startsWith('boss:') ? who.slice(5) : null;
    const box = await p.evaluate(({ who, st, boss, BG }) => {
      const R = window.__r, m = R.meta; m.tutorialDone = true; m.journeyDone = true; m.bossSeen = { king: 1, queen: 1, twins: 1, broc: 1, potato: 1 };
      R.startAdventure(boss ? BG[boss] : 4, boss ? 8 : 2, {}); if (R.mode !== 'play') R.resume(); if (R.mode !== 'play') R.resume();
      R.setInv(99); R.setFreeze(0); R.pickups.length = 0; R.shots.length = 0;
      const P = R.player; let e;
      const keep = boss ? R.enemies.find(x => x.type === 'boss' && (st !== 'frost' || x.weak === 'stun')) : null;
      // a free tile 2 to the right of the hero (or anything open near)
      const spot = [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 0], [0, 1]].map(([dx, dy]) => ({ x: P.x + dx, y: P.y + dy })).find(t => R.isOpen(t.x, t.y)) || { x: P.x, y: P.y };
      if (boss) e = keep; else { e = { x: 0, y: 0, nx: 0, ny: 0, p: 1, dir: [0, 1], type: who, cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 0, life: 99 }; R.flagEnemy(e); }
      e.x = e.nx = spot.x; e.y = e.ny = spot.y; e.p = 1; e.dir = [0, 1]; e.speed = 0; e.atkT = 99; e.burT = 99; e.shootT = 99; e.stun = 0; e.tele = 0; e.dash = 0; e.under = false; e.popT = 0;
      R.enemies = [e];
      if (st === 'frozen') { R.freeze(30); }
      if (st === 'waking') { R.freeze(30); R.setFreeze(0.6); }
      if (st === 'dizzy') e.stun = 30;
      if (st === 'chasing') e.chaseT = 30; if (who === 'hunter' && st !== 'chasing') e.chaseCd = 99;
      if (st === 'aiming') { e.aim = 30; e.aimDir = [-1, 0]; }
      if (st === 'leaping') { e.tpT = 0.5; e.tp = { x: spot.x, y: spot.y }; }
      if (st === 'windup') e.tele = 30;
      if (st === 'under') e.under = true;
      if (st === 'popped') e.popT = 30;
      return { x: spot.x, y: spot.y };
    }, { who, st, boss, BG });
    await p.waitForTimeout(160);
    const clip = await p.evaluate(({ x, y }) => { const R = window.__r, c = document.getElementById('cv').getBoundingClientRect(), cl = R.cell;
      return { x: c.left + x * cl - R.cam.x - cl * 0.4, y: c.top + y * cl - R.cam.y - cl * 0.6, width: cl * 1.8, height: cl * 1.8 }; }, box);
    const f = `${OUT}/${who.replace(':', '_')}__${st}.png`;
    await p.screenshot({ path: f, clip }); meta.push({ who, st, f });
  }
  fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(meta)); console.log(meta.length, 'crops', errs.slice(0, 3)); await b.close();
})();
