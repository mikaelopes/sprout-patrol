let sfxs = []; // painted one-shot effects: { n: sprite, x, y (tiles), t, dur, s0, s1 (size in cells), spin, rot }
function spriteFx(n, x, y, dur, s0, s1, spin) { if (sfxs.length > 24) sfxs.shift(); sfxs.push({ n, x, y, t: 0, dur, s0, s1, spin: spin || 0, rot: Math.random() * 0.6 - 0.3 }); }
// Painted beams: an ice spear flies down the corridor leaving snowflakes, or a lightning bolt stretches along it.
function drawBeamFx(fx) {
  const a = fx.life / fx.max, k = 1 - a, x0 = (fx.x0 + .5) * cell, y0 = (fx.y0 + .5) * cell, x1 = (fx.x1 + .5) * cell, y1 = (fx.y1 + .5) * cell;
  const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
  if (fx.bolt) {
    const im = spr('fx-bolt'), flick = Math.floor(time * 16) % 2;
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.6); ctx.translate(x0, y0); ctx.rotate(ang); if (flick) ctx.scale(1, -1);
    ctx.drawImage(im, 0, -cell * 0.45, Math.max(cell, len), cell * 0.9); ctx.restore();
    fxPic(ctx, 'fx-twinkle', x1, y1, cell * (0.6 + 0.5 * k), time * 3, a);
    return;
  }
  const t = Math.min(1, k * 1.8), sx = x0 + (x1 - x0) * t, sy = y0 + (y1 - y0) * t;
  for (let j = 1; j <= 4; j++) { const tj = t * j / 4.5; fxPic(ctx, 'fx-flake', x0 + (x1 - x0) * tj, y0 + (y1 - y0) * tj, cell * 0.38, time * 2 + j, a * 0.8); }
  if (t < 1) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.globalAlpha = a; ctx.drawImage(spr('fx-icespear'), -cell * 0.9, -cell * 0.45, cell * 1.4, cell * 0.9); ctx.restore(); }
  else fxPic(ctx, 'fx-frostburst', x1, y1, cell * (0.7 + 0.6 * (k - 0.55)), time, a * 1.4);
}
function drawSpriteFx(dt) {
  for (let i = sfxs.length - 1; i >= 0; i--) {
    const f = sfxs[i]; f.t += dt; if (f.t >= f.dur) { sfxs.splice(i, 1); continue; }
    const k = f.t / f.dur, pop = k < 0.2 ? 0.6 + 2 * k : 1, size = cell * (f.s0 + (f.s1 - f.s0) * k) * pop;
    fxPic(ctx, f.n, (f.x + .5) * cell, (f.y + .5) * cell, size, f.rot + f.spin * f.t, k < 0.6 ? 1 : (1 - k) / 0.4);
  }
}
function ring(p, R, color) {
  for (let a = 0; a < 28; a++) {
    const ang = a / 28 * Math.PI * 2;
    particles.push({ x: p.x + Math.cos(ang) * R * 0.3, y: p.y + Math.sin(ang) * R * 0.3, vx: Math.cos(ang) * R * 2.2, vy: Math.sin(ang) * R * 2.2, life: .35, max: .35, color });
  }
}
// Weapons fire along the maze's corridors (ahead = the way you roll, or the way you last rolled when stopped),
// so their effect lands where pests can actually be, instead of on hedges.
// Frozen pests ignore every skill (only your bump touches them), so skills never stack on a freeze.
// Each type also has its own resistances and weaknesses:
//   hunter: stuns last half as long
//   night:  immune to freezes and stuns; slowed 40% during a freeze
const iced = e => isFrozen(e) || e.frz > 0;
const STUN_MULT = { boss: 0, night: 0, hunter: 0.5, grape: 1.5, minigrape: 1.5 };
const FRZ_MULT = { boss: 0, night: 0, mushroom: 0.5 };
const stunMult = e => e.type === 'boss' && e.weak === 'stun' ? 1 : e.type in STUN_MULT ? STUN_MULT[e.type] : (e.immStun ? 0 : 1); // the Frost twin is the one boss a stun works on
const frzMult = e => e.type in FRZ_MULT ? FRZ_MULT[e.type] : (e.immFreeze ? 0 : 1);
function immuneFx(e) { if (time - (e.immMsgT || -9) > 2) { e.immMsgT = time; const q = epos(e); floatText(q.x, q.y - 0.4, t('immune'), '#b4bbd9'); } }
function skillStun(e, dur) { // returns true if the stun landed
  if (e.denT > 0 || iced(e) || e.cracked) return false;
  const m = stunMult(e); if (!m) { immuneFx(e); return false; }
  { const q = epos(e); spriteFx('fx-poof', q.x, q.y, 0.45, 0.5, 1.1, 0); }
  e.stun = Math.max(e.stun, dur * m / (1 + 0.35 * (e.stol || 0))); e.stol = (e.stol || 0) + 1; e.aim = 0; return true;
}
function skillFreeze(e, dur) {
  if (e.denT > 0 || iced(e) || e.stun > 0) return false; // one daze at a time: a stunned pest can't also be skill-frozen
  const m = frzMult(e); if (!m) { immuneFx(e); return false; }
  e.frz = Math.max(e.frz, dur * m / (1 + 0.35 * (e.tol || 0))); e.tol = (e.tol || 0) + 1; e.aim = 0; return true;
}
function weaponDirs(n) {
  const f = player.face && (player.face[0] || player.face[1]) ? player.face : [0, 1];
  const back = [-f[0], -f[1]], left = [f[1], -f[0]], right = [-f[1], f[0]];
  return [f, back, left, right].slice(0, n);
}
function corridor(sx, sy, d, maxLen, thru) { // tiles from (sx,sy) going d until a hedge (or through `thru` hedges)
  const out = []; let x = sx, y = sy, walls = thru || 0;
  for (let k = 0; k < maxLen; k++) {
    x += d[0]; y += d[1];
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
    if (!isOpen(x, y)) { if (walls > 0) { walls--; continue; } break; }
    out.push({ x, y });
  }
  return out;
}
const onTiles = (e, tiles) => { const q = epos(e); return tiles.some(t2 => Math.abs(q.x - t2.x) + Math.abs(q.y - t2.y) < 0.75); };
function beamFx(sx, sy, tiles, color, bolt) { if (tiles.length) (run.fx = run.fx || []).push({ x0: sx, y0: sy, x1: tiles[tiles.length - 1].x, y1: tiles[tiles.length - 1].y, color, bolt, life: 0.35, max: 0.35 }); }
const pestTile = e => { const q = epos(e); return { x: Math.round(q.x), y: Math.round(q.y) }; };
const chaseable = e => !(e.denT > 0) && !iced(e) && !(e.stun > 0) && e.type !== 'boss' && e.type !== 'night' && !e.under;
// Walking distance on the maze from (sx,sy), up to maxLen tiles. Returns a map of tile -> previous tile.
function mazeBfs(sx, sy, maxLen) {
  const prev = new Map(), dist0 = new Map(), q = [[sx, sy]]; const key = (x, y) => x + y * COLS;
  dist0.set(key(sx, sy), 0);
  while (q.length) {
    const [x, y] = q.shift(), dd = dist0.get(key(x, y)); if (dd >= maxLen) continue;
    for (const [ax, ay] of FOUR) { const nx = x + ax, ny = y + ay, kk = key(nx, ny); if (!isOpen(nx, ny) || dist0.has(kk)) continue; dist0.set(kk, dd + 1); prev.set(kk, key(x, y)); q.push([nx, ny]); }
  }
  return { dist0, prev, key };
}
function chaseTargets(sx, sy, range, n) {
  const B = mazeBfs(sx, sy, range);
  return enemies.filter(chaseable).map(e => { const t2 = pestTile(e); return { e, d: B.dist0.get(B.key(t2.x, t2.y)) }; })
    .filter(o => o.d != null).sort((a, b) => a.d - b.d).slice(0, n).map(o => o.e);
}
// Moves a chaser seed one bit along the shortest path to its target; returns true when it is spent.
function stepChaser(pr, dt) {
  if (!pr.target || !chaseable(pr.target) || !enemies.includes(pr.target)) { const nt = chaseTargets(Math.round(pr.x), Math.round(pr.y), pr.left, 1)[0]; if (!nt) { burst(pr.x, pr.y, '#ff9a7a', 6); return true; } pr.target = nt; }
  const cx = Math.round(pr.x), cy = Math.round(pr.y);
  if (!pr.next || (Math.abs(pr.x - pr.next.x) < 0.05 && Math.abs(pr.y - pr.next.y) < 0.05)) {
    if (pr.next) { pr.left--; if (pr.left <= 0) { burst(pr.x, pr.y, '#ff9a7a', 6); return true; } }
    const t2 = pestTile(pr.target), B = mazeBfs(t2.x, t2.y, pr.left + 1), here = B.key(cx, cy);
    const pk = B.prev.get(here); // BFS from the target, so prev of our tile is the next step toward it
    if (pk == null) { if (cx === t2.x && cy === t2.y) pr.next = { x: cx, y: cy }; else { pr.target = null; return false; } }
    else pr.next = { x: pk % COLS, y: Math.floor(pk / COLS) };
  }
  const dx = pr.next.x - pr.x, dy = pr.next.y - pr.y, dd = Math.hypot(dx, dy), stp = pr.v * dt;
  if (dd > 0.001) { pr.d = [dx / dd, dy / dd]; }
  if (dd <= stp) { pr.x = pr.next.x; pr.y = pr.next.y; } else { pr.x += dx / dd * stp; pr.y += dy / dd * stp; }
  for (const e of enemies) {
    if (e.denT > 0 || iced(e) || dist(epos(e), pr) > 0.55) continue;
    const q = epos(e); burst(q.x, q.y, '#ff9a7a', 12);
    if (e.maxHp) { e.hurtT = 0; damageEnemy(e, 1); } else skillStun(e, 2);
    return true;
  }
  return false;
}
// Orbit Bubbles: always circling the hero; a bubble that hits a pest pops and grows back after the cooldown.
function updateOrbs(dt) {
  if (!wp.orbit) { run.orbs = []; return; }
  const st = wpStat('orbit'), pp = ppos();
  run.orbs = run.orbs || [];
  while (run.orbs.length < st.n) run.orbs.push({ cd: 0 });
  run.orbs.length = st.n;
  run.orbA = ((run.orbA || 0) + dt * 3.4) % TAU;
  run.orbs.forEach((o, j) => {
    const a = run.orbA + j * TAU / st.n; o.x = pp.x + Math.cos(a) * st.r; o.y = pp.y + Math.sin(a) * st.r;
    if (o.cd > 0) { o.cd -= dt; return; }
    for (const e of enemies) {
      if (e.denT > 0 || iced(e) || e.hitT > 0 || dist(epos(e), o) > 0.5) continue;
      const q = epos(e); burst(q.x, q.y, '#9fe3d4', 10); sfx('bump');
      e.hitT = 1.5;
      if (e.maxHp) { e.hurtT = 0; damageEnemy(e, 1); } else skillStun(e, 1.5);
      o.cd = st.cd; break;
    }
  });
}
function updateWeapons(dt) {
  const pp = ppos(), px = Math.round(pp.x), py = Math.round(pp.y);
  run.proj = run.proj || []; run.fx = run.fx || [];
  for (const k of Object.keys(WEAPONS)) {
    if (!wp[k]) continue;
    const st = wpStat(k);
    if (run.wcd[k] == null) run.wcd[k] = st.cd * 0.5;
    run.wcd[k] -= dt;
    if (run.wcd[k] > 0) continue;
    run.wcd[k] = st.cd;
    if (k === 'aura') { // frost beam: aims at corridors that have a pest in reach, waits when none do
      const len = Math.round(st.len);
      const lanes = FOUR.map(d => ({ d, tiles: corridor(px, py, d, len, st.thru) }))
        .filter(L => st.all || enemies.some(e => !(e.denT > 0) && !iced(e) && frzMult(e) && onTiles(e, L.tiles))).slice(0, st.all ? 4 : st.dirs);
      if (!lanes.length) { run.wcd[k] = 0.25; continue; }
      lanes.forEach(L => { beamFx(px, py, L.tiles, '#7cc8ff'); enemies.forEach(e => { if (onTiles(e, L.tiles)) skillFreeze(e, st.d); }); });
      sfx('freeze');
    } else if (k === 'puff') {
      if (st.bolt) { // Thunder Puff: instant lightning down all 4 corridors
        weaponDirs(4).forEach(d => {
          const tiles = corridor(px, py, d, 99);
          beamFx(px, py, tiles, '#ffe36b', true);
          enemies.forEach(e => { if (onTiles(e, tiles)) skillStun(e, st.d); });
        });
        sfx('shot');
      } else {
        // Chaser Seed: follows the maze paths to the nearest pest in range
        const targets = chaseTargets(px, py, st.range, st.n);
        if (!targets.length) { run.wcd[k] = 0.25; continue; }
        targets.forEach((tg, j) => run.proj.push({ kind: 'puff', chase: true, x: px, y: py, d: [0, 1], v: 8, left: st.range + 2, target: tg, path: null, hit: [], life: 6, delay: j * 0.15 }));
        sfx('shot');
      }
    } else if (k === 'orbit') { // orbit bubbles are always on (updated below); the timer only regrows popped ones
      run.wcd[k] = 0.2;

    }
  }
  // projectiles
  for (let i = run.proj.length - 1; i >= 0; i--) {
    const pr = run.proj[i];
    pr.life -= dt;
    if (pr.delay > 0) { pr.delay -= dt; continue; }
    if (pr.life <= 0) { run.proj.splice(i, 1); continue; }
    if (pr.chase) { if (stepChaser(pr, dt)) run.proj.splice(i, 1); continue; }
    const nx = pr.x + pr.d[0] * pr.v * dt, ny = pr.y + pr.d[1] * pr.v * dt;
    const tx = Math.round(nx + pr.d[0] * 0.45), ty = Math.round(ny + pr.d[1] * 0.45);
    if (!isOpen(tx, ty)) {
      if (pr.kind === 'bubble' && !pr.bounced) { pr.bounced = true; pr.d = [-pr.d[0], -pr.d[1]]; pr.hit = []; burst(pr.x, pr.y, '#9fe3d4', 5); continue; }
      burst(pr.x, pr.y, pr.kind === 'puff' ? '#ff9a7a' : '#9fe3d4', 6); run.proj.splice(i, 1); continue;
    }
    pr.x = nx; pr.y = ny;
    if (pr.kind === 'bubble' && pr.bounced && dist(pr, pp) < 0.4) { run.proj.splice(i, 1); continue; }
    for (const e of enemies) {
      if (e.denT > 0 || pr.hit.includes(e) || dist(epos(e), pr) > 0.55) continue;
      pr.hit.push(e);
      const q = epos(e);
      if (iced(e)) continue; // frozen: projectiles pass through
      if (pr.kind === 'puff') {
        skillStun(e, pr.stun);
        burst(q.x, q.y, '#ff9a7a', 10);
        if (!pr.pierce) { run.proj.splice(i, 1); break; }
      } else if (e.hitT <= 0) {
        if (skillStun(e, pr.stun)) e.cool = Math.max(e.cool, 1);
        e.hitT = 2; damageEnemy(e, 1); burst(q.x, q.y, '#9fe3d4', 8);
      }
    }
  }
  updateOrbs(dt);
  for (let i = run.fx.length - 1; i >= 0; i--) { run.fx[i].life -= dt; if (run.fx[i].life <= 0) run.fx.splice(i, 1); }
}
function updateDirector(dt) {
  const before = Math.floor(run.gt);
  run.gt += dt;
  if (Math.floor(run.gt) !== before) updateHud();
  const pressure = run.kind === 'endless' || (run.adv && run.adv.g >= 8 && !(run.adv.g === 8 && run.adv.i < 3) && !run.daily); // night starts at 8-3, after the Hail Cloud has had 8-1 and 8-2 to itself
  if (pressure && !run.wiltMsg && run.gt > 90) { run.wiltMsg = true; banner(t('wilting'), '#ff9a5c', 'clock'); sfx('hurt'); }
  if (pressure && !run.nightOn && run.gt > 180) {
    run.nightOn = true;
    const pp = ppos();
    const far = freeTiles(t2 => Math.abs(t2.x - Math.round(pp.x)) + Math.abs(t2.y - Math.round(pp.y)) >= 9);
    const sp = far[rnd(far.length)];
    if (sp) {
      const ne2 = { x: sp.x, y: sp.y, nx: sp.x, ny: sp.y, p: 1, dir: [0, 0], type: 'night', cool: 0, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: speedOf(0) * 0.62 };
      flagEnemy(ne2);
      enemies.push(ne2);
    }
    banner(t('nightFalls'), '#6a4be0', 'ghost');
    sfx('hurt');
  }
}
function hurt() {
  const hb = hitBy; hitBy = null;
  if (invuln > 0 || cometT > 0) return;
  const p = ppos();
  if (shieldUp || run.spareShield) {
    if (shieldUp) shieldUp = false; else run.spareShield = false;
    invuln = 1;
    burst(p.x, p.y, '#9fe3d4', 16); floatText(p.x, p.y, t('blocked'), '#9fe3d4'); sfx('shield');
    updateHud();
    return;
  }
  if (run.kind === 'tutorial' && run.hp <= 1) { invuln = 1.5; scatter(); return; }
  noteHit('h', hb); run.hp--; run.mood = 'hurt'; run.moodT = time + 0.8;
  run.hitThisGarden = true;
  run.hits++;
  invuln = ghostT();
  shake = 0.35;
  burst(p.x, p.y, '#ff6f61', 14);
  sfx('hurt');
  updateHud();
  if (run.hp <= 0) { gameOver(); return; }
  const drop = Math.ceil(followers.length * Math.max(0.2, 0.4 - 0.067 * (meta.up.grip || 0)));
  if (drop > 0) dropTail(drop);
  scatter();
  floatText(p.x, p.y, drop ? t('dropped', drop) : t('ouch'), '#ff9a8f');
}

/* ---------- special moves ---------- */
function useAbility() {
  const c = ch();
  if (mode !== 'play' || !c.ability || abilityCd > 0) return;
  if (c.ability === 'warp') {
    if (player.moving) { player.x = player.nx; player.y = player.ny; player.moving = false; player.p = 0; arrive(); if (mode !== 'play') return; }
    const d = player.face;
    let target = null;
    for (let k = 3; k >= 1; k--) { if (isOpen(player.x + d[0] * k, player.y + d[1] * k)) { target = { x: player.x + d[0] * k, y: player.y + d[1] * k }; break; } }
    if (!target) return;
    burst(player.x, player.y, c.fill, 10);
    trail.unshift({ x: player.x, y: player.y });
    if (trail.length > followers.length + 1) trail.length = followers.length + 1;
    player.x = player.nx = target.x; player.y = player.ny = target.y;
    burst(target.x, target.y, c.fill, 12);
    sfx('warp');
    arrive();
  } else if (c.ability === 'puff') {
    const pp = ppos();
    let n = 0;
    const D = playerDistMap(); // Puff follows the maze: it reaches pests up to 3 steps away, never through a hedge
    enemies.forEach(e => { const q = epos(e), d = D[Math.round(q.x) + Math.round(q.y) * COLS]; if (d >= 0 && d <= (c.puffR || 3) && skillStun(e, c.puffS || 3)) n++; });
    for (let a = 0; a < 24; a++) { const ang = a / 24 * Math.PI * 2; particles.push({ x: pp.x, y: pp.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, life: .4, max: .4, color: c.fill }); }
    floatText(pp.x, pp.y, t('stunned', n), c.fill);
    sfx('puff');
  } else if (c.ability === 'recall') {
    scatter();
    const pp = ppos();
    floatText(pp.x, pp.y, t('sentHome'), c.fill);
    sfx('recall');
  }
  abilityCd = c.cd;
}

/* ---------- enemies & shots ---------- */
function epos(e) { return { x: lerp(e.x, e.nx, e.p), y: lerp(e.y, e.ny, e.p) }; }
// Walking distance from the player to every tile (BFS), built at most once per frame and only when a chaser needs it.
// Chasing by straight-line distance made pests orbit single hedge blocks; walking distance always finds the way around.
function playerDistMap() {
  const sx = Math.round(player.x), sy = Math.round(player.y), D = new Int16Array(COLS * ROWS).fill(-1);
  const q = [sx + sy * COLS]; D[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % COLS, cy = (c - cx) / COLS;
    for (const [dx, dy] of FOUR) { const nx = cx + dx, ny = cy + dy, n = nx + ny * COLS; if (isOpen(nx, ny) && D[n] < 0) { D[n] = D[c] + 1; q.push(n); } }
  }
  return D;
}
// Readability: how long each pest has been on screen and dangerous. A hit counts as "telegraphed" only when the pest
// was visible AND dangerous for at least TELL seconds before it landed (otherwise the player had no fair chance to react).
const TELL = 0.4;
function safeWhy(e) { return e.denT > 0 ? 'den' : iced(e) ? 'frozen' : e.stun > 0 ? 'dizzy' : e.wake > 0 ? 'woke' : e.under ? 'under' : e.popT > 0 ? 'popped' : e.tpT > 0 ? 'leap' : ''; }
function trackTell(e, dt) {
  const why = safeWhy(e);
  if (why && why !== 'leap') { e.dangerT = 0; e.lastSafe = why; } else e.dangerT = (e.dangerT || 0) + dt;
  // the black/white "about to wake" ring (last 0.8 s of a freeze or daze) counts as a warning too
  const wakeIn = Math.min(isFrozen(e) ? freezeT : 9, e.frz > 0 ? e.frz : 9, e.stun > 0 && !e.hold ? e.stun : 9, e.popT > 0 ? e.popT : 9);
  if (why) e.flashT = wakeIn < 0.8 ? (e.flashT || 0) + dt : 0;
  if (e.tpT > 0) e.lastSafe = 'leap';
  const q = epos(e), x = (q.x + .5) * cell - cam.x, y = (q.y + .5) * cell - cam.y, m = cell * 0.3;
  e.seenT = x > -m && y > -m && x < viewW + m && y < viewH + m ? (e.seenT || 0) + dt : 0;
}
function hitInfo(e) { // what hit you, in what state, and whether you could have seen it coming
  const who = e.type === 'boss' ? e.variant + (e.weak ? '-' + (e.weak === 'freeze' ? 'sun' : 'frost') : '') : e.type;
  const fresh = (e.dangerT || 0) < TELL;
  const st = fresh && e.lastSafe ? 'after-' + e.lastSafe : e.chaseT > 0 ? 'chasing' : e.dash > 0 ? 'charging' : 'awake';
  return { s: who, st, tel: (e.seenT || 0) >= TELL && (!fresh || (e.flashT || 0) >= TELL) };
}
let hitBy = null; // set right before hurt()/breakAt() so the play log knows the cause
function noteHit(kind, hb) { if (!run || !hb) return; (run.hitLog = run.hitLog || []).push((kind === 'b' ? 'b:' : '') + hb.s + ':' + hb.st + ':' + (hb.tel ? 1 : 0)); if (run.hitLog.length > 24) run.hitLog.shift(); }
function updateEnemies(dt) {
  const pp = ppos();
  let dmap = null;
  for (const e of enemies) {
    trackTell(e, dt);
    e.cool = Math.max(0, e.cool - dt);
    e.hitT = Math.max(0, (e.hitT || 0) - dt);
    e.hurtT = Math.max(0, (e.hurtT || 0) - dt);
    if (e.denT > 0) {
      e.denT -= dt;
      if (e.denT <= 0) {
        if (dist(ppos(), run.den) < 1.6) e.denT = 0.5;
        else { e.hp = e.maxHp; e.cool = 1.5; e.frz = 0; e.frzGen = -1; e.stol = 0; e.tol = 0; e.cracked = false; burst(run.den.x, run.den.y, '#8b90b5', 12); sfx('wake'); }
      }
      continue;
    }
    // Waking up on top of the trail must never break it: the pest stays dizzy a bit longer (max 2s) while the line
    // moves off, and if it is still under the line after that it gets up harmless until it has left the line.
    // Harmless for as long as it is touching the line (no time limit), then a short grace once it steps off.
    if (e.wake > 0) { if (!onLine(e)) { e.wake = 0; e.cool = Math.max(e.cool, 0.8); } else e.wake = 1; }
    if (e.frz > 0) { e.frz -= dt; continue; }
    if (isFrozen(e)) continue;
    if (e.stun > 0) {
      if (e.stun - dt <= 0 && e.type !== 'boss' && (e.hold || 0) < 2 && onLine(e)) { e.hold = (e.hold || 0) + dt; continue; }
      e.stun -= dt; if (e.stun <= 0) { e.cracked = false; e.hold = 0; } continue;
    }
    if (e.type === 'boss' && e.volleyT > 0) { e.volleyT -= dt; if (e.volleyT <= 0) { FOUR.forEach(([dx, dy]) => { if (isOpen(e.x + dx, e.y + dy)) shots.push({ x: e.x, y: e.y, dx, dy, src: e.variant, tel: (e.seenT || 0) >= TELL }); }); sfx('shoot'); } }
    if (e.type === 'boss' && e.variant === 'potato') { // Old Root Potato: walks, burrows toward you as a dirt mound, bursts up and is dazed for a moment
      e.burT = (e.burT == null ? 4 : e.burT) - dt;
      if (e.popT > 0) { e.popT -= dt; continue; }
      if (e.under && e.burT <= 0) { e.under = false; e.popT = 1.4; e.burT = 4.5; const q = epos(e); burst(q.x, q.y, '#8a6232', 22); shake = Math.max(shake, 0.3); sfx('wake'); if (dist(q, ppos()) < 0.9) { hitBy = { s: 'potato', st: 'burst', tel: (e.seenT || 0) >= TELL }; hurt(); } continue; }
      if (!e.under && e.burT <= 0) { e.under = true; e.burT = 3; }
    }
    if (e.type === 'boss' && e.variant !== 'potato') {
      if (e.tele > 0) { e.tele -= dt; if (e.tele <= 0) bossAttack(e); continue; }
      if (e.dash > 0) e.dash -= dt;
      e.atkT = (e.atkT == null ? 3 : e.atkT) - dt;
      if (e.atkT <= 0 && !(e.aim > 0)) { e.tele = 0.7; e.atkT = bossCd(e); continue; }
    }
    if (e.type === 'minigrape') { e.life -= dt; if (e.life <= 0) { const q = epos(e); burst(q.x, q.y, '#9a5cff', 10); enemies.splice(enemies.indexOf(e), 1); continue; } }
    if (e.burstN > 0) { e.burstT -= dt; if (e.burstT <= 0) { shots.push({ x: e.x, y: e.y, dx: e.aimDir[0], dy: e.aimDir[1], pea: true, src: e.type, tel: (e.seenT || 0) >= TELL }); sfx('shoot'); e.burstN--; e.burstT = 0.22; } continue; }
    if (e.aim > 0) {
      e.aim -= dt;
      if (e.aim <= 0) {
        if (e.type === 'sniper') lobKernel(e);
        else { shots.push({ x: e.x, y: e.y, dx: e.aimDir[0], dy: e.aimDir[1], pea: e.type === 'shooter', src: e.type === 'boss' ? e.variant : e.type, tel: (e.seenT || 0) >= TELL }); sfx('shoot'); if (e.type === 'shooter') { e.burstN = 2; e.burstT = 0.22; } }
        e.shootT = e.variant === 'queen' ? 2.2 : 4.5;
      }
      continue;
    }
    if (e.type === 'hunter') { // Chili: chases hard for 6s when you come near, then sulks for 2.5s and takes 5s to cool off
      if (e.sulkT > 0) { e.sulkT -= dt; continue; }
      if (e.chaseT > 0) { e.chaseT -= dt; if (e.chaseT <= 0) { e.sulkT = 2.5; e.chaseCd = 5; continue; } }
      else { e.chaseCd = (e.chaseCd || 0) - dt; if (e.chaseCd <= 0) { if (!dmap) dmap = playerDistMap(); const wd = dmap[e.x + e.y * COLS]; if (wd >= 0 && wd <= 7) { e.chaseT = 6; const q = epos(e); floatText(q.x, q.y - 0.6, '!', '#ff6f61'); } } }
    }
    if (e.type === 'mushroom') { // Mushroom: every few seconds blinks a ring near your trail, then pops out there
      if (e.tpT > 0) { e.tpT -= dt; if (e.tpT <= 0 && e.tp) { burst(e.x, e.y, '#b07aff', 10); e.x = e.nx = e.tp.x; e.y = e.ny = e.tp.y; e.p = 1; e.dir = [0, 0]; e.cool = Math.max(e.cool, 0.5); burst(e.x, e.y, '#b07aff', 14); sfx('warp'); e.tp = null; e.tpCd = 7; } continue; }
      e.tpCd = (e.tpCd == null ? 4 : e.tpCd) - dt;
      if (e.tpCd <= 0) {
        if (!dmap) dmap = playerDistMap();
        const taken = new Set(enemies.map(o => o.x + ',' + o.y));
        const cand = freeTiles(t2 => { const v = dmap[t2.x + t2.y * COLS]; return v >= 2 && v <= 4 && !taken.has(t2.x + ',' + t2.y); });
        if (cand.length) { e.tp = cand[rnd(cand.length)]; e.tpT = 1; } else e.tpCd = 2;
        continue;
      }
    }
    e.p += e.speed * wiltMult() * (e.dash > 0 ? 2.6 : 1) * (e.type === 'boss' && run.bossAngry ? 1.25 : 1) * (e.under ? 1.4 : 1) * (e.immFreeze && freezeT > 0 ? 0.6 : 1) * (e.chaseT > 0 ? 1.2 : 1) * dt;
    while (e.p >= 1) {
      e.p -= 1;
      e.x = e.nx; e.y = e.ny;
      const opts = FOUR.filter(d => isOpen(e.x + d[0], e.y + d[1]) && !(d[0] === -e.dir[0] && d[1] === -e.dir[1] && (e.dir[0] || e.dir[1])));
      let choice;
      if (e.type === 'boss' && e.variant === 'king' && e.dash > 0 && e.dashDir) {
        if (isOpen(e.x + e.dashDir[0], e.y + e.dashDir[1])) choice = e.dashDir;
        else { e.dash = 0; e.stun = 2.4; e.cracked = false; burst(e.x + e.dashDir[0] * 0.5, e.y + e.dashDir[1] * 0.5, '#ffffff', 16); shake = Math.max(shake, 0.3); sfx('bump'); floatText(e.x, e.y - 0.9, t('dizzy'), '#fff1a8'); choice = [0, 0]; }
      }
      else if (!opts.length) choice = [-e.dir[0], -e.dir[1]];
      else if ((e.type === 'hunter' && e.chaseT > 0) || (e.type === 'boss' && (Math.random() < 0.7 || e.under)) || (e.type === 'night' && Math.random() < 0.9) || e.dash > 0) {
        if (!dmap) dmap = playerDistMap();
        const wd = d => { const v = dmap[(e.x + d[0]) + (e.y + d[1]) * COLS]; return v < 0 ? 9999 : v; };
        opts.sort((a, b) => wd(a) - wd(b));
        choice = opts[0];
      } else {
        // Wandering: like to keep going straight and avoid tiles visited a moment ago, so they explore instead of circling a block.
        const memo = e.memo || (e.memo = []);
        let best = -1e9;
        for (const d of opts) {
          const key = (e.x + d[0]) + ',' + (e.y + d[1]);
          const score = Math.random() + (d[0] === e.dir[0] && d[1] === e.dir[1] ? 0.7 : 0) - (memo.includes(key) ? 1.5 : 0);
          if (score > best) { best = score; choice = d; }
        }
      }
      if (e.memo) { e.memo.push(e.x + ',' + e.y); if (e.memo.length > 12) e.memo.shift(); }
      else e.memo = [e.x + ',' + e.y];
      if (!isOpen(e.x + choice[0], e.y + choice[1])) choice = [0, 0];
      e.dir = choice; e.nx = e.x + choice[0]; e.ny = e.y + choice[1];
      if ((e.type === 'shooter' || e.type === 'boss' || e.type === 'sniper') && e.shootT <= 0) {
        const d = aimAt(e);
        if (d) { e.aim = 0.7; e.aimDir = d; e.dir = d; e.nx = e.x; e.ny = e.y; e.p = 0; break; }
      }
    }
    if (e.type === 'shooter' || e.type === 'boss' || e.type === 'sniper') e.shootT -= dt;
  }
}
function aimAt(e) {
  if (e.type === 'sniper') { // Corn Cob: lobs a kernel over the hedges at the end of your trail, up to 5 tiles away
    const pts = followers.length ? [fpos(followers.length - 1)] : [ppos()];
    const q = pts[0], dx = q.x - e.x, dy = q.y - e.y;
    if (Math.hypot(dx, dy) > 5 || Math.hypot(dx, dy) < 1.5) return null;
    e.lobTo = { x: Math.round(q.x), y: Math.round(q.y) };
    return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy) || 1];
  }
  const pp = ppos();
  return aimLine(e, Math.round(pp.x), Math.round(pp.y));
}
function aimLine(e, px, py) {
  let dx = 0, dy = 0;
  if (e.x === px && e.y !== py) dy = Math.sign(py - e.y);
  else if (e.y === py && e.x !== px) dx = Math.sign(px - e.x);
  else return null;
  const len = Math.abs(px - e.x) + Math.abs(py - e.y);
  if (len > 6) return null;
  for (let k = 1; k < len; k++) if (!isOpen(e.x + dx * k, e.y + dy * k)) return null;
  return [dx, dy];
}
function lobKernel(e) {
  if (!e.lobTo) return;
  (run.lobs = run.lobs || []).push({ x0: e.x, y0: e.y, tx: e.lobTo.x, ty: e.lobTo.y, t: 0, dur: 0.8 });
  sfx('shoot');
}
function updateLobs(dt) {
  if (!run.lobs) return;
  for (let k = run.lobs.length - 1; k >= 0; k--) {
    const L2 = run.lobs[k]; L2.t += dt;
    if (L2.t < L2.dur) continue;
    run.lobs.splice(k, 1);
    burst(L2.tx, L2.ty, '#ffd84a', 10);
    if (dist(ppos(), { x: L2.tx, y: L2.ty }) < 0.55) { hitBy = { s: 'sniper', st: 'kernel', tel: true }; hurt(); if (mode !== 'play') return; continue; }
    for (let i = 0; i < followers.length; i++) if (dist(fpos(i), { x: L2.tx, y: L2.ty }) < 0.7) { hitBy = { s: 'sniper', st: 'kernel', tel: true }; breakAt(i, 1); break; }
  }
}
function updateShots(dt) {
  const pp = ppos();
  for (let s = shots.length - 1; s >= 0; s--) {
    const sh = shots[s];
    if (!sh) continue;
    sh.x += sh.dx * 4.5 * dt; sh.y += sh.dy * 4.5 * dt;
    { const x = (sh.x + .5) * cell - cam.x, y = (sh.y + .5) * cell - cam.y; if (x > 0 && y > 0 && x < viewW && y < viewH) sh.vis = (sh.vis || 0) + dt; }
    if (!isOpen(Math.round(sh.x), Math.round(sh.y))) { burst(sh.x, sh.y, '#ffd6f0', 4); shots.splice(s, 1); continue; }
    if (dist(sh, pp) < 0.5) { shots.splice(s, 1); hitBy = { s: sh.src || 'shot', st: 'shot', tel: sh.tel !== false || (sh.vis || 0) >= TELL }; hurt(); if (mode !== 'play') return; s = Math.min(s, shots.length); continue; } // a hit scatters (clears) the shots
    for (let i = 0; i < followers.length; i++) {
      if (dist(sh, fpos(i)) < 0.5) { hitBy = { s: sh.src || 'shot', st: 'shot', tel: sh.tel !== false || (sh.vis || 0) >= TELL }; breakAt(i); shots.splice(s, 1); break; }
    }
  }
}
function onLine(e) { // is this pest touching the hero or the trail?
  const ep = epos(e); if (dist(ep, ppos()) < 0.8) return true;
  for (let i = 0; i < followers.length; i++) if (dist(ep, fpos(i)) < 0.7) return true;
  return false;
}
function collide() {
  if (run.kind !== 'tutorial') grabPickups(false);
  const pp = ppos();
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    if (!e) continue; // the list can shrink mid-loop (a beaten boss takes its minions with it)
    if (e.denT > 0) { e.wasStill = false; continue; }
    const still = e.frz > 0 || isFrozen(e) || e.stun > 0; // see updateEnemies: a pest that wakes up under the line can't break it
    if (e.wasStill && !still && onLine(e)) { e.wake = 1; e.hold = 0; }
    e.wasStill = still;
    if (e.type === 'boss') {
      const ep0 = epos(e), near = dist(ep0, pp) < 0.95;
      if (e.under) continue; // a dirt mound can't hurt you
      const canBonk = e.variant !== 'broc' && e.hurtT <= 0 && ((isFrozen(e) && e.weak !== 'stun') || (e.stun > 0 && e.weak !== 'freeze') || e.popT > 0);
      if (canBonk && near) { bonkBoss(e); ei = Math.min(ei, enemies.length); continue; }
      if (isFrozen(e) || e.stun > 0 || e.popT > 0 || e.wake > 0) continue;
    }
    if (e.stun > 0 || e.frz > 0 || isFrozen(e)) {
      if (e.type !== 'boss' && e.type !== 'night' && dist(epos(e), pp) < 0.65) popEnemy(e);
      continue;
    }
    const ep = epos(e), big = e.type === 'boss';
    if (e.wake > 0) continue; // just woke up under the line: harmless until it leaves it
    if (e.cool <= 0 && dist(ep, pp) < (big ? 0.95 : 0.62)) { e.cool = 2; hitBy = hitInfo(e); hurt(); if (mode !== 'play') return; break; }
    if (e.cool <= 0 && !evo.wall) {
      for (let i = 0; i < followers.length; i++) {
        if (dist(ep, fpos(i)) < (big ? 0.85 : 0.55)) { hitBy = hitInfo(e); breakAt(i, e.type === 'minigrape' ? 1 : 0); e.cool = 0.9; break; }
      }
    }
  }
}
function bossKeySafety(dt) {
  if (!run.boss || run.bossDone) return;
  run.keySafeT = (run.keySafeT || 0) - dt;
  if (run.keySafeT > 0) return;
  run.keySafeT = 1;
  for (const p of portals) {
    if (p.rainbow || p.golden || p.covered) continue;
    const has = bubbles.some(b => !b.gold && p.cs.includes(b.c)) || followers.some(f => !f.gold && p.cs.includes(f.c));
    if (has) continue;
    const occ = new Set(bubbles.map(b => b.x + ',' + b.y));
    const free = freeTiles(t2 => !occ.has(t2.x + ',' + t2.y) && Math.abs(t2.x - player.x) + Math.abs(t2.y - player.y) >= 4);
    if (free.length) { const sp = free[rnd(free.length)]; bubbles.push({ x: sp.x, y: sp.y, c: p.cs[0], bob: Math.random() * 6 }); burst(sp.x, sp.y, COLORS[p.cs[0]].fill, 12); }
  }
}
function updatePickups(dt) {
  if (run.kind === 'tutorial') return;
  bossKeySafety(dt);
  frostSpawnT -= dt; seedSpawnT -= dt;
  for (let i = pickups.length - 1; i >= 0; i--) { pickups[i].life -= dt; if (pickups[i].life <= 0) pickups.splice(i, 1); }
  const spawn = type => {
    const occ = new Set(bubbles.map(b => b.x + ',' + b.y).concat(pickups.map(k => k.x + ',' + k.y)));
    const free = freeTiles(t => !occ.has(t.x + ',' + t.y) && !(t.x === player.x && t.y === player.y) && !(run.den && t.x === run.den.x && t.y === run.den.y) && !portals.some(p => p.x === t.x && p.y === t.y));
    if (free.length) { const t = free[rnd(free.length)]; pickups.push({ x: t.x, y: t.y, life: pickupLife(type), type }); }
  };
  if (frostSpawnT <= 0 && freezeT <= 0) { frostSpawnT = frostEvery(); if (!pickups.some(k => k.type === 'frost')) spawn('frost'); }
  if (seedSpawnT <= 0 && !(run.kind === 'adv' && run.par && run.at > run.par)) { seedSpawnT = 16; if (!pickups.some(k => k.type === 'seed')) spawn('seed'); }
  // rainbow portal: visible 10s, hidden 25s, then pops up somewhere new
  for (const p of portals) {
    if (!p.rainbow) continue;
    p.timer -= dt;
    if (p.timer > 0) continue;
    if (p.active) {
      if (player.x === p.x && player.y === p.y) { p.timer = 0.5; continue; }
      p.active = false; p.timer = 25; burst(p.x, p.y, '#ffffff', 10);
    } else {
      const sp = rainbowSpot();
      if (sp) { p.x = sp.x; p.y = sp.y; }
      p.active = true; p.timer = rainbowLife(); burst(p.x, p.y, '#ffffff', 14);
      banner(t('rainbowHere'), '#b993ff', 'star');
    }
  }
}

