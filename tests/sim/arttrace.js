// Captures every screen of the game at phone size for a UI/UX review. Usage: node uxshots.js <outdir>
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || 'uxshots';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let html = require('fs').readFileSync(process.argv[3] || 'dist/sprout-patrol.html', 'utf8');
  html = html.replace('function spr(name) {', 'function spr(name) { (window.__used = window.__used || {})[name] = 1;').replace("const artGet = k => { try {", "const artGet = k => { (window.__used = window.__used || {})[k] = 1; try {").replace("const artIcon = k => { try {", "const artIcon = k => { (window.__used = window.__used || {})['ic-' + k] = 1; try {");
  html = html.replace("showSplash();\nrequestAnimationFrame(frame);", "showSplash();\nwindow.__noLearn=1;window.__t={flagEnemy,bonkBoss,get cell(){return cell},isOpen,setFreeze(v){freezeT=v},set enemies2(v){enemies=v},showRoad,WEAPONS,get meta(){return meta},showSplash,showHub,showChars,showNest,showChallenges,showBook,showProfile,showClear,showVictory,showCamp,showBossIntro,showPrelevel,showMap,showPause,startRunMap,showRunMap,showDaily,showRoad,dailyResult,startDaily,set roadTab(v){roadTab=v},startGame,startAdventure,resume,openCards,advResult,gameOver,showChest,newGarden,get run(){return run},get sk(){return sk},get wp(){return wp},freeze,get enemies(){return enemies},set followers(v){followers=v},setInv(v){invuln=v},set mode(v){mode=v}};\nrequestAnimationFrame(frame);");
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>');
  await p.waitForTimeout(500);
  await p.evaluate(() => { const m = window.__t.meta; m.tutorialDone = true; m.coins = 640; m.adv = {}; for (let g = 1; g <= 2; g++) for (let i = 1; i <= 5; i++) m.adv[g + '-' + i] = 3; m.adv['3-1'] = 2; m.owned.moss = true; m.st.bestGarden = 9; m.discovered = { blizzard: true }; });
  const issues = {};
  const audit = async (name) => {
    const els = await p.evaluate(() => {
      const out = [];
      const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight; };
      const op = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
      document.querySelectorAll('#overlay *, .hud *, .xprow *, #tip').forEach(el => {
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
        if (!own || !vis(el)) return;
        const cs = getComputedStyle(el); const tn=[...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); const rg=document.createRange(); rg.selectNodeContents(tn); const r = rg.getBoundingClientRect();
        out.push({ kind: 'text', txt: el.textContent.trim().slice(0, 40), color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight, op: op(el), x: r.left, y: r.top, w: r.width, h: r.height, disabled: !!el.closest('[disabled]') });
      });
      document.querySelectorAll('#overlay button, #overlay [data-act], .hud button').forEach(el => {
        if (!vis(el)) return; const r = el.getBoundingClientRect();
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
        out.push({ kind: 'ctl', txt: name.slice(0, 30), w: r.width, h: r.height, noName: !name && !el.querySelector('img[alt]:not([alt=""])'), disabled: el.disabled });
      });
      document.querySelectorAll('#overlay img').forEach(el => { if (vis(el) && el.getAttribute('alt') === null) out.push({ kind: 'img', txt: el.className }); });
      return out;
    });
    issues[name] = els.length;

  };
  const shot = async (name, fn, wait = 350) => { await p.evaluate(fn); await p.waitForTimeout(wait); await audit(name); };
  await shot('01-splash', () => window.__t.showSplash());
  await shot('02-hub', () => window.__t.showHub());
  await shot('03-map', () => window.__t.showMap());
  await shot('04-prelevel', () => window.__t.showPrelevel(3, 2));
  await shot('05-prelevel-boss', () => window.__t.showPrelevel(2, 5));
  await shot('06-play-adventure', () => { const T = window.__t; T.startAdventure(3, 2, {}); T.resume(); T.setInv(99); }, 1500);
  await shot('07-play-frozen', () => { const T = window.__t; T.freeze(6); }, 600);
  await shot('08-adv-result', () => { const T = window.__t; T.run.at = 70; T.run.score = 1840; T.advResult(true); });
  await shot('09-boss-intro', () => { const T = window.__t; T.startAdventure(2, 5, {}); });
  await shot('10-play-endless', () => { const T = window.__t; T.startGame(); T.sk.swift = 2; T.wp.orbit = 1; T.run.garden = 5; T.newGarden(); T.resume(); T.setInv(99); }, 1500);
  await shot('11-level-cards', () => { window.__t.openCards('level'); }, 2600);
  await shot('11b-evo-cards', () => { const T = window.__t; T.mode = 'play'; const W = Object.keys(T.WEAPONS)[0], w = T.WEAPONS[W]; T.wp[W] = w.max; T.sk[w.pair] = 1; T.openCards('level'); }, 7000);
  await shot('12-pause', () => { const T = window.__t; T.mode = 'play'; T.showPause(); T.mode = 'pause'; });
  await shot('13-clear', () => { const T = window.__t; T.run.clearSeeds = 12; T.showClear(); });
  await shot('14-camp', () => window.__t.showCamp());
  await shot('15-victory', () => { const T = window.__t; T.run.garden = 24; T.newGarden(); T.run.won = false; T.showVictory(); });
  await shot('16-game-over', () => { const T = window.__t; T.run.won = true; T.gameOver(false); });
  await shot('17-chest', () => window.__t.showChest('Baú de estrelas', '+40 sementes', 'map'));
  await shot('18-chars', () => window.__t.showChars());
  await shot('19-nest', () => window.__t.showNest());
  await shot('20-challenges', () => window.__t.showChallenges());
  await shot('21-book', () => window.__t.showBook());
  await shot('22-profile', () => window.__t.showProfile());
  await shot('24-daily', () => { const T = window.__t; T.meta.daily = { ring: 3, last: '', best: 0, bestKey: '', pend: 0 }; T.showDaily(); });
  await shot('25-daily-result', () => { const T = window.__t; T.startDaily(); T.run.coins = 14; T.run.score = 1320; T.run.at = 64; T.advResult(true); });
  await shot('26-road', () => { const T = window.__t; T.meta.st.tufts = 420; T.meta.road = 8; T.roadTab = 'road'; T.showRoad(); });
  await shot('27-looks', () => { const T = window.__t; T.meta.road = 22; T.meta.cos = { hat: 'beanie', trail: 'sparkle', portal: 'petals' }; T.roadTab = 'look'; T.showRoad(); });
  await shot('28-nest-endless', () => { const T = window.__t; T.meta.up.frost = 3; T.meta.rep = { rseed: 2 }; T.showNest(); });
  await shot('29-runmap', () => { const T = window.__t; T.startRunMap(); }, 600);
  await shot('30-gear-nest', () => { const T = window.__t; T.meta.gear = { charm: 2, thorn: 1 }; T.meta.gearOn = ['charm', 'thorn']; T.showNest(); });
  await shot('31-boss-melon', () => { const T = window.__t; T.startGame(); T.run.garden = 4; T.newGarden(); T.resume(); T.setInv(99); }, 900);

  // every pest and boss in every state, every grove floor, the den
  for (let G = 1; G <= 12; G++) await shot('g' + G, () => {}, 10), await p.evaluate(G => { const T = window.__t; T.meta.bossSeen = { king: 1, queen: 1, twins: 1, broc: 1, potato: 1 }; T.startAdventure(G, 2, {}); T.resume(); }, G), await p.waitForTimeout(250);
  const types = ['wander', 'hunter', 'shooter', 'mushroom', 'sniper', 'grape', 'minigrape', 'night', 'heavy', 'frosty', 'thief'];
  const states = ['', 'frozen', 'dizzy', 'den', 'chasing', 'sulking', 'aiming', 'leap', 'burst'];
  for (const G of [1, 2, 3, 4, 5]) {
    await p.evaluate(G => { const T = window.__t; T.startAdventure(G, 8, {}); T.resume(); T.resume(); T.setInv(99); }, G); await p.waitForTimeout(200);
    for (const st of ['', 'frozen', 'dizzy', 'tele', 'under', 'pop']) { await p.evaluate(st => { const T = window.__t; T.setFreeze(0); for (const e of T.enemies) { if (e.type !== 'boss') continue; e.stun = 0; e.tele = 0; e.under = false; e.popT = 0; if (st === 'frozen') { T.freeze(20); } if (st === 'dizzy') e.stun = 20; if (st === 'tele') e.tele = 20; if (st === 'under') e.under = true; if (st === 'pop') e.popT = 20; } }, st); await p.waitForTimeout(150); }
  }
  await p.evaluate(() => { const T = window.__t; T.startAdventure(4, 2, {}); T.resume(); T.setInv(99); }); await p.waitForTimeout(200);
  for (const ty of types) for (const st of states) {
    await p.evaluate(({ ty, st }) => { const T = window.__t, P = T.run && window.__t; const pl = T.run; const en = T.enemies; T.setFreeze(0);
      const base = en.find(e => e.type !== 'boss') || en[0]; const e = { x: base.x, y: base.y, nx: base.x, ny: base.y, p: 1, dir: [0, 1], type: ty, cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 0, life: 99 }; T.flagEnemy(e);
      if (st === 'frozen') T.freeze(20); if (st === 'dizzy') e.stun = 20; if (st === 'den') { e.denT = 8; } if (st === 'chasing') e.chaseT = 20; if (st === 'sulking') e.sulkT = 20; if (st === 'aiming') { e.aim = 20; e.aimDir = [1, 0]; } if (st === 'leap') { e.tpT = 0.9; e.tp = { x: e.x, y: e.y }; }
      T.enemies2 = [e]; }, { ty, st }); await p.waitForTimeout(90);
  }
  await shot('looks2', () => { const T = window.__t; T.meta.road = 50; for (const h of ['beanie', 'bow', 'crown', 'flower', 'party', 'wizard']) { T.meta.cos = { hat: h }; } T.roadTab = 'look'; T.showRoad(); });
  for (const h of ['beanie', 'bow', 'crown', 'flower', 'party', 'wizard']) await shot('hat' + h, (h) => { const T = window.__t; T.meta.cos = { ...(T.meta.cos || {}), hat: h }; T.showChars(); }, 200).catch(() => {}), await p.evaluate(h => { window.__t.meta.cos = { hat: h }; window.__t.showChars(); }, h), await p.waitForTimeout(200);
  const used = await p.evaluate(() => Object.keys(window.__used || {}));
  require('fs').writeFileSync(process.argv[4] || 'art_used.json', JSON.stringify(used));
  console.log('screens', Object.keys(issues).length); console.log(Object.keys(issues).length, 'screens'); console.log(errs); await b.close();
})();
