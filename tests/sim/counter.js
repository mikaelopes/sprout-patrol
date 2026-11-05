// Counter table as automated tests: every pest/boss state × every tool the player has in the season.
// Each cell sets up the exact situation in the real game, applies the tool, steps frame by frame and checks the result.
// Usage: node tests/sim/counter.js [page] [out.json]
const { chromium } = require('playwright'); const fs = require('fs');
const PAGE = process.argv[2] || 'tests/sim/game_fast.html', OUT = process.argv[3] || 'tests/sim/counter.json';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(fs.readFileSync(PAGE, 'utf8')); await p.waitForTimeout(300);
  const R = await p.evaluate(() => {
    const T = window.__g, m = T.meta; m.tutorialDone = true; m.journeyDone = true; m.up = { trail: 0, speed: 0, heart: 0, frost: 0 };
    let now = performance.now();
    const step = sec => { for (let k = 0; k < sec * 60; k++) { now += 1000 / 60; T.step(now); if (T.mode() !== 'play') break; } };
    const lane = n => { const { COLS, ROWS } = T.dims(); for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - n; x++) { let ok = true; for (let k = 0; k < n; k++) ok = ok && T.isOpenT(x + k, y); if (ok) return { x, y }; } };
    const place = (o, x, y) => { o.x = o.nx = x; o.y = o.ny = y; o.p = 1; o.dir = [0, 0]; };
    const BOSS_G = { king: 1, queen: 2, twins: 3, broc: 4, potato: 5 };
    // fresh garden with only what the test needs
    function setup(foe, hero) {
      m.char = hero || 'pip'; m.owned[m.char] = true;
      const boss = foe.boss; T.seedRandom(777); T.start(boss ? BOSS_G[boss] : 4, boss ? 8 : 2);
      const run = T.run(), en = T.enemies();
      const keep = boss ? en.find(e => e.type === 'boss' && (!foe.weak || e.weak === foe.weak)) : null;
      en.length = 0; T.pickups().length = 0; T.shots().length = 0; if (run.lobs) run.lobs.length = 0;
      const far = T.bubbles().filter(x => !x.locked && !x.gold).slice(-1); T.bubbles().length = 0; far.forEach(x => { x.x = 1; x.y = T.dims().ROWS - 2; T.bubbles().push(x); });
      T.setInv(0); T.setAbCd(0); T.setShield(false); run.hp = 9; run.charmLeft = 0; run.spareShield = false;
      const L = lane(7), P = T.player(); place(P, L.x, L.y); P.moving = false; P.want = null; P.dir = null; P.face = [1, 0];
      let e;
      if (boss) { e = keep; e.cool = 0; e.hurtT = 0; e.stun = 0; e.tele = 0; e.dash = 0; e.atkT = 99; e.burT = 99; e.under = false; e.popT = 0; e.aim = 0; e.shootT = 99; e.speed = 0.01; }
      else { e = { x: 0, y: 0, nx: 0, ny: 0, p: 1, dir: [0, 0], type: foe.type, cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 0.01, life: 99 }; T.flagEnemy(e); if (foe.type === 'minigrape') e.minion = true; }
      place(e, L.x + (foe.at || 2), L.y); if (!boss) en.push(e); else en.push(e);
      return { e, L, P, run };
    }
    // states: put the foe in the situation
    const STATE = {
      awake: () => {},
      chasing: (e) => { e.chaseT = 4; },
      aiming: (e) => { e.aim = 0.5; e.aimDir = [-1, 0]; },
      ring: (e, c) => { e.tpT = 0.8; e.tp = { x: 1, y: T.dims().ROWS - 2 }; },
      frozen: (e) => { T.freeze(4); },
      stunned: (e) => { e.stun = 3; },
      den: (e, c) => { e.denT = 6; place(e, c.run.den.x, c.run.den.y); },
      wakeOnHero: (e, c) => { place(e, c.L.x, c.L.y); e.wake = 1; },
      telegraph: (e) => { e.tele = 0.6; },
      crashed: (e) => { e.stun = 2.4; },
      dazed: (e) => { e.stun = 1.2; T.bonkBoss(e); },
      under: (e) => { e.under = true; e.burT = 99; },
      popped: (e) => { e.popT = 1.2; },
    };
    // tools: what the player does; returns nothing, outcome is read after
    const TOOL = {
      bump: c => { c.P.want = [1, 0]; c.P.dir = [1, 0]; step(1.1); },
      snowflake: c => { T.pickups().push({ x: c.L.x + 1, y: c.L.y, life: 99, type: 'frost' }); c.P.want = [1, 0]; c.P.dir = [1, 0]; step(1.3); },
      puff: c => { T.ability(); step(0.2); c.after = { stun: c.e.stun }; c.P.want = [1, 0]; c.P.dir = [1, 0]; step(1.1); },
      recall: c => { const q = T.epos(c.e); T.ability(); step(0.1); const q2 = T.epos(c.e); c.after = { moved: Math.abs(q2.x - q.x) + Math.abs(q2.y - q.y) }; },
      warp: c => { T.ability(); step(0.4); },
      bubble: c => { T.setShield(true); c.e.speed = 2.5; c.e.dir = [-1, 0]; step(1.2); c.after = { shieldLeft: T.shield() }; },
      guard: c => { T.setFollowers(4); c.run.charmLeft = 1; const tr = T.trail(); for (let k = 0; k < tr.length; k++) { tr[k].x = c.L.x - k; tr[k].y = c.L.y; } place(c.e, c.L.x - 2, c.L.y); c.e.speed = 0.01; c.f0 = T.followers().length; step(0.6); c.after = { guardLeft: c.run.charmLeft, lost: c.f0 - T.followers().length }; },
      deliver: c => { T.setFollowers(2); const pi = T.portals().findIndex(q => !q.rainbow && !q.golden); T.followers().forEach(f => { f.c = T.portals()[pi].cs[0]; }); T.deliverAt(pi); step(0.2); c.after = { stun: c.e.stun }; },
    };
    const HERO = { puff: 'ember', recall: 'nova', warp: 'bolt' };
    function cell(foe, state, tool) {
      const c = setup(foe, HERO[tool]); c.e.speed = 0.01; STATE[state](c.e, c);
      const pp0 = c.run.pops || 0, h0 = c.run.hits, b0 = c.e.bonks || 0, en0 = T.enemies().length;
      TOOL[tool](c);
      const e = c.e;
      return { hits: c.run.hits - h0, ko: e.denT > 0 || (!!e.minion && !T.enemies().includes(e)), frozen: T.isFrozen(e) || e.frz > 0, stunned: e.stun > 0, bonk: (e.bonks || 0) - b0,
        popsGained: (c.run.pops || 0) - pp0, minis: T.enemies().filter(x => x.type === 'minigrape').length, minisFrozen: T.enemies().filter(x => x.type === 'minigrape' && T.isFrozen(x)).length, ...(c.after || {}) };
    }
    // The table: [foe, state, tool, expected (subset of outcome), why]
    const P = ['wander', 'hunter', 'shooter', 'mushroom', 'sniper', 'grape', 'minigrape'];
    const rows = [];
    for (const ty of P) {
      const f = { type: ty };
      rows.push([f, 'awake', 'bump', { hits: 1, ko: false }, 'touching an awake pest costs a heart']);
      rows.push([f, 'awake', 'snowflake', { hits: 0, ko: true }, 'snowflake freezes, the bump that follows knocks it out']);
      rows.push([f, 'awake', 'puff', { hits: 0, ko: true }, 'Puff stuns pests within reach, bump knocks out']);
      rows.push([f, 'awake', 'recall', { hits: 0 }, 'Recall sends it far away', o => o.moved >= 5]);
      rows.push([f, 'awake', 'warp', { hits: 0 }, 'Warp jumps past it']);
      rows.push([f, 'awake', 'bubble', { hits: 0, shieldLeft: false }, 'bubble blocks the hit']);
      rows.push([f, 'awake', 'guard', { guardLeft: 0, lost: 0 }, 'line guard blocks the trail break']);
      rows.push([f, 'frozen', 'bump', { hits: 0, ko: true }, 'frozen pests are knocked out by a bump']);
      rows.push([f, 'frozen', 'puff', { hits: 0, ko: true }, 'Puff on a frozen pest changes nothing; bump still knocks out']);
      rows.push([f, 'stunned', 'bump', { hits: 0, ko: true }, 'dizzy pests are knocked out by a bump']);
      rows.push([f, 'stunned', 'snowflake', { hits: 0, ko: true }, 'a snowflake on a dizzy pest keeps it harmless']);
      rows.push([f, 'den', 'bump', { hits: 0, ko: true }, 'napping pests can\'t be touched and stay in the den']);
      rows.push([f, 'den', 'recall', { hits: 0, ko: true }, 'Recall does not wake napping pests']);
      rows.push([f, 'wakeOnHero', 'bump', { hits: 0 }, 'a pest that wakes up on you is harmless until it leaves']);
    }
    rows.push([{ type: 'grape' }, 'frozen', 'bump', { hits: 0, ko: true }, 'Ant Hill knocked out while frozen: its 3 ants land frozen (ants you roll into right away count)', o => o.minis + o.popsGained - 1 === 3 && o.minisFrozen === o.minis]);
    rows.push([{ type: 'hunter' }, 'chasing', 'snowflake', { hits: 0, ko: true }, 'a chasing Beetle still freezes']);
    rows.push([{ type: 'hunter' }, 'chasing', 'puff', { hits: 0, ko: true }, 'a chasing Beetle can be puffed (shorter stun)']);
    rows.push([{ type: 'shooter' }, 'aiming', 'snowflake', { hits: 0, ko: true }, 'freezing a Rain Cloud mid-aim cancels the volley']);
    rows.push([{ type: 'mushroom', at: 3 }, 'ring', 'snowflake', { hits: 0, ko: true }, 'freezing a Grasshopper mid-leap keeps it in place']);
    rows.push([{ type: 'night' }, 'awake', 'snowflake', { frozen: false }, 'Night Moth can\'t be frozen']);
    rows.push([{ type: 'night' }, 'awake', 'puff', { stunned: false }, 'Night Moth can\'t be stunned']);
    rows.push([{ type: 'night' }, 'awake', 'bubble', { hits: 0, shieldLeft: false }, 'bubble still blocks the Moth']);
    // bosses
    for (const bs of ['king', 'queen', 'potato']) {
      const f = { boss: bs };
      rows.push([f, 'awake', 'bump', { hits: 1, bonk: 0 }, 'touching an awake boss costs a heart']);
      rows.push([f, 'frozen', 'bump', { hits: 0, bonk: 1 }, 'frozen boss + bump = bonk']);
      rows.push([f, 'dazed', 'bump', { hits: 0, bonk: 0 }, 'after a bonk the boss is dazed: harmless, no double bonk']);
      rows.push([f, 'dazed', 'snowflake', { hits: 0, stunned: true }, 'a snowflake does not wake a dazed boss']);
      rows.push([f, 'awake', 'puff', { stunned: false }, 'bosses shrug off Puff']);
      rows.push([f, 'awake', 'recall', { hits: 0 }, 'Recall does not move bosses', o => o.moved < 0.5]);
      rows.push([f, 'awake', 'bubble', { hits: 0, shieldLeft: false }, 'bubble blocks a boss hit']);
    }
    rows.push([{ boss: 'king' }, 'crashed', 'bump', { hits: 0, bonk: 1 }, 'Rhino crashed into a hedge: dizzy, bump = bonk']);
    rows.push([{ boss: 'king' }, 'crashed', 'snowflake', { hits: 0, bonk: 1 }, 'dizzy Rhino + snowflake: still bonkable']);
    rows.push([{ boss: 'king' }, 'telegraph', 'bump', { hits: 1 }, 'glowing red Rhino is dangerous']);
    rows.push([{ boss: 'king' }, 'telegraph', 'snowflake', { hits: 0, bonk: 1 }, 'freezing the Rhino mid-wind-up stops the charge']);
    rows.push([{ boss: 'potato' }, 'under', 'bump', { hits: 0 }, 'a dirt mound can\'t hurt you']);
    rows.push([{ boss: 'potato' }, 'popped', 'bump', { hits: 0, bonk: 1 }, 'Mole just popped up: dazed, bump = bonk']);
    rows.push([{ boss: 'broc' }, 'frozen', 'bump', { hits: 0, bonk: 0 }, 'Bramble can\'t be bonked, but frozen it is harmless']);
    rows.push([{ boss: 'broc' }, 'awake', 'deliver', { bonk: 1 }, 'every delivery withers a Bramble root']);
    rows.push([{ boss: 'twins', weak: 'freeze' }, 'frozen', 'bump', { hits: 0, bonk: 1 }, 'Sun twin: frozen + bump = bonk']);
    rows.push([{ boss: 'twins', weak: 'freeze' }, 'awake', 'puff', { stunned: false }, 'Sun twin shrugs off Puff']);
    rows.push([{ boss: 'twins', weak: 'stun' }, 'frozen', 'bump', { hits: 0, bonk: 0 }, 'Frost twin: a freeze doesn\'t open her up, but she is harmless while frozen']);
    rows.push([{ boss: 'twins', weak: 'stun' }, 'awake', 'puff', { hits: 0, bonk: 1 }, 'Frost twin: Puff makes her dizzy, bump = bonk']);
    rows.push([{ boss: 'twins', weak: 'stun' }, 'awake', 'deliver', { stunned: true }, 'Frost twin: any delivery dazes her (every hero can bonk her)']);
    const out = [];
    for (const [foe, state, tool, exp, why, extra] of rows) {
      let got; try { got = cell(foe, state, tool); } catch (err) { got = { error: String(err) }; }
      const pass = !got.error && Object.entries(exp).every(([k, v]) => got[k] === v) && (!extra || extra(got));
      out.push({ foe: foe.boss ? 'boss:' + foe.boss + (foe.weak ? '/' + foe.weak : '') : foe.type, state, tool, exp, got, pass, why });
    }
    return out;
  });
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  const fail = R.filter(r => !r.pass);
  console.log(R.length, 'cells,', fail.length, 'failing'); fail.forEach(r => console.log('FAIL', r.foe, r.state, r.tool, JSON.stringify(r.exp), '→', JSON.stringify(r.got)));
  console.log(errs.slice(0, 5)); await b.close();
})();
