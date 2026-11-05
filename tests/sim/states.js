// State-transition tests: exact situations, stepped frame by frame in the real game.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(fs.readFileSync('tests/sim/game_states.html', 'utf8')); await p.waitForTimeout(300);
  const R = await p.evaluate(() => {
    const T = window.__g, m = T.meta; m.tutorialDone = true; m.up = { trail: 0, speed: 0, heart: 0, frost: 0 };
    let now = performance.now();
    const step = (sec) => { for (let k = 0; k < sec * 60; k++) { now += 1000 / 60; T.step(now); if (T.mode() !== 'play') break; } };
    // find a straight horizontal corridor of length n starting at an open tile
    const lane = n => { const { COLS, ROWS } = T.dims(); for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - n; x++) { let ok = true; for (let k = 0; k < n; k++) ok = ok && T.isOpenT(x + k, y); if (ok) return { x, y }; } };
    const place = (o, x, y) => { o.x = o.nx = x; o.y = o.ny = y; o.p = 1; o.dir = [0, 0]; };
    const setup = (G, i, keepBoss, weak) => { T.start(G, i); const run = T.run(); const en = T.enemies(); const boss = en.find(e => e.type === 'boss' && (!weak || e.weak === weak)) || en.find(e => e.type === 'boss');
      en.length = 0; if (keepBoss && boss) en.push(boss); T.pickups().length = 0; const far = T.bubbles().filter(b => !b.locked && !b.gold).slice(-1); T.bubbles().length = 0; far.forEach(b => { b.x = 1; b.y = T.dims().ROWS - 2; T.bubbles().push(b); });
      T.setInv(0); run.hp = 9; return boss; };
    const out = {};
    // S1: snowflake right before a pest that walks into the hero
    { setup(4, 2); const L = lane(5), P = T.player(); place(P, L.x, L.y); P.moving = false; P.want = [1, 0]; P.dir = [1, 0];
      T.pickups().push({ x: L.x + 1, y: L.y, life: 99, type: 'frost' });
      const e = { x: L.x + 2, y: L.y, nx: L.x + 2, ny: L.y, p: 1, dir: [-1, 0], type: 'wander', cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 3, hp: 1, maxHp: 1, denT: 0, frz: 0, hurtT: 0, hitT: 0, tol: 0, val: 1 };
      T.enemies().push(e); const h0 = T.run().hits; step(1.2);
      out.S1_snowflake_next_to_pest = { mode: T.mode(), heroHits: T.run().hits - h0, pestKnockedOut: e.denT > 0 || !T.enemies().includes(e) }; }
    // S2: dizzy boss + snowflake → still bonkable, no hit
    { const bs = setup(1, 8, true); const L = lane(4), P = T.player(); place(P, L.x, L.y); P.moving = false; P.want = null; P.dir = null;
      place(bs, L.x + 2, L.y); bs.stun = 3; bs.cool = 0; bs.hurtT = 0; const b0 = bs.bonks || 0;
      T.freeze(4); const stillDizzy = bs.stun > 0;
      P.want = [1, 0]; P.dir = [1, 0]; const h0 = T.run().hits; step(1);
      out.S2_dizzy_boss_then_freeze = { stayedDizzy: stillDizzy, bonked: (bs.bonks || 0) > b0, heroHits: T.run().hits - h0 }; }
    // S3: after a bonk the boss stays dazed while hero + line sit on it
    { const bs = setup(1, 8, true); const L = lane(4), P = T.player(); place(P, L.x + 1, L.y); P.moving = false; P.want = null; P.dir = null;
      T.setFollowers(4); place(bs, L.x + 1, L.y); bs.stun = 2; bs.hurtT = 0; bs.cool = 0; T.bonkBoss(bs); const f0 = T.followers().length, h0 = T.run().hits;
      step(1.8); const mid = { stun: +bs.stun.toFixed(2) };
      step(1.5);
      out.S3_after_bonk_on_top_of_line = { dazedAt1_8s: mid.stun > 0, heroHits: T.run().hits - h0, followersLost: f0 - T.followers().length }; }
    // S4: Frost twin (only stun works) dizzy + freeze → still bonkable
    { const tw = setup(3, 8, true, 'stun');
      const L = lane(4), P = T.player(); place(P, L.x, L.y); P.moving = false; place(tw, L.x + 2, L.y); tw.stun = 3; tw.hurtT = 0; tw.cool = 0;
      T.freeze(4); P.want = [1, 0]; P.dir = [1, 0]; const b0 = tw.bonks || 0, h0 = T.run().hits; step(1);
      out.S4_stun_only_twin_dizzy_plus_freeze = { weak: tw.weak, bonked: (tw.bonks || 0) > b0, heroHits: T.run().hits - h0 }; }
    // S5: freeze ends while a pest overlaps the hero → no hit
    { setup(4, 2); const L = lane(3), P = T.player(); place(P, L.x + 1, L.y); P.moving = false; P.want = null; P.dir = null;
      const e = { x: L.x + 1, y: L.y, nx: L.x + 1, ny: L.y, p: 1, dir: [0, 0], type: 'wander', cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 1.5, hp: 1, maxHp: 1, denT: 0, frz: 0, hurtT: 3, hitT: 0, tol: 0, val: 1 };
      T.enemies().push(e); T.freeze(0.3); const h0 = T.run().hits; step(2);
      out.S5_freeze_ends_on_hero = { heroHits: T.run().hits - h0 }; }
    // S6: skill-stunned pest (mine/chaser) bumped → knocked out, no hit
    { setup(4, 2); const L = lane(4), P = T.player(); place(P, L.x, L.y); P.moving = false;
      const e = { x: L.x + 2, y: L.y, nx: L.x + 2, ny: L.y, p: 1, dir: [0, 0], type: 'wander', cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 1.5, hp: 1, maxHp: 1, denT: 0, frz: 0, hurtT: 0, hitT: 0, tol: 0, val: 1 };
      T.enemies().push(e); T.skillStun(e, 2); P.want = [1, 0]; P.dir = [1, 0]; const h0 = T.run().hits; step(1);
      out.S6_stunned_pest_bump = { mode: T.mode(), heroHits: T.run().hits - h0, knockedOut: e.denT > 0 }; }
    // S7: rhino crash daze → bump → bonk → stays dazed, then safe
    { const bs = setup(1, 8, true); const L = lane(4), P = T.player(); place(P, L.x, L.y); P.moving = false; place(bs, L.x + 2, L.y);
      bs.stun = 2.4; bs.hurtT = 0; bs.cool = 0; P.want = [1, 0]; P.dir = [1, 0]; const b0 = bs.bonks || 0, h0 = T.run().hits; step(2.5);
      out.S7_rhino_crash_then_bump = { variant: bs.variant, bonked: (bs.bonks || 0) > b0, heroHits: T.run().hits - h0 }; }
    return out;
  });
  console.log(JSON.stringify(R, null, 1), errs); await b.close(); })();
