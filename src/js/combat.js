function deliver(pt) {
  const ok = c => pt.cs.includes(c);
  const golds = followers.filter(f => f.gold).length;
  if (golds > 0 && pt.golden) { // every Golden Tuft in the trail goes through the gate together
    followers.forEach((f, i) => { if (f.gold) { const gp = fpos(i); burst(gp.x, gp.y, '#fff1a8', 30); } });
    followers = followers.filter(f => !f.gold);
    if (trail.length > followers.length + 1) trail.length = followers.length + 1;
    run.goldSaved += golds;
    if (run.bossType === 'twins') enemies.forEach(b => { if (b.type === 'boss') b.speed *= Math.pow(1.3, golds); });
    if (run.goldSaved >= run.goldNeed) { run.bossDone = true; run.bossesBeaten++; }
    const gb = Math.round(10 * grove() * coinMult() * golds / run.goldNeed);
    run.coins += gb;
    floatText(pt.x, pt.y - 0.7, t('rescued'), '#fff1a8');
    floatText(pt.x, pt.y, t('seeds', gb), '#ffcd4a');
    sfx('streak');
    updateHud();
    checkClear();
    return;
  }
  if (!followers.some(f => ok(f.c))) return;
  const groups = []; let streak = 0, prev = -1, count = 0;
  followers.forEach(f => {
    if (ok(f.c)) {
      count++;
      if (f.c === prev) streak++; else { if (streak) groups.push(streak); streak = 1; }
      prev = f.c;
    } else { if (streak) groups.push(streak); streak = 0; prev = -1; }
  });
  if (streak) groups.push(streak);
  let gain = 0;
  groups.forEach(g => gain += 100 * g * g);
  const top = Math.max(...groups);
  let hopIdx = 0;
  const shinyIn = followers.filter(f => ok(f.c) && f.shiny);
  if (shinyIn.length) {
    meta.shinies = meta.shinies || {};
    shinyIn.forEach(f => { meta.shinies[f.c] = (meta.shinies[f.c] || 0) + 1; });
    const sp = Math.round(shinyIn.length * (10 + 3 * grove()) * coinMult()); run.coins += sp;
    floatText(pt.x, pt.y - 2, (LANG === 'pt' ? 'Brilhante! ' : 'Shiny! ') + t('seeds', sp), '#ffd970');
    for (let a = 0; a < 26; a++) { const ang = a / 26 * TAU; particles.push({ x: pt.x, y: pt.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, life: .8, max: .8, color: a % 2 ? '#ffd970' : '#ffffff' }); }
    saveMeta();
  }
  followers.forEach((f, i) => { if (ok(f.c)) { if (run.gotC) run.gotC[f.c] = (run.gotC[f.c] || 0) + 1; const p = fpos(i); burst(p.x, p.y, COLORS[f.c].fill, 6); (run.homeTufts = run.homeTufts || []).push({ x0: p.x, y0: p.y, x1: pt.x, y1: pt.y, c: f.c, t: -0.08 * hopIdx, dur: 0.55, n: count, first: !hopIdx++ }); } });
  followers = followers.filter(f => !ok(f.c));
  if (trail.length > followers.length + 1) trail.length = followers.length + 1;
  if (run.boss && !pt.golden) { const br = enemies.find(o => o.type === 'boss' && o.variant === 'broc'); if (br && br.hurtT <= 0) bonkBoss(br); }
  if (run.boss && !pt.golden && count) enemies.forEach(o => { if (o.type === 'boss' && o.weak === 'stun' && o.hurtT <= 0 && !isFrozen(o)) { o.stun = Math.max(o.stun || 0, 2.5); o.dash = 0; o.tele = 0; o.aim = 0; const q = epos(o); floatText(q.x, q.y - 0.9, t('dizzy'), '#fff1a8'); } }); // the sprouts' warmth dazes the Frost twin
  if (run.boss && !pt.rainbow && !pt.golden && !pt.covered) {
    pt.covered = true; run.keys++;
    const need = portals.filter(q => !q.rainbow && !q.golden).length;
    if (run.keys < need) banner(t('keyGot', run.keys, need), '#f5b82e', 'key');
    else {
      bubbles.forEach(b => { if (b.locked) { b.locked = false; burst(b.x, b.y, '#fff1a8', 20); } });
      portals.forEach(q => { if (q.golden) { q.active = true; burst(q.x, q.y, '#fff1a8', 20); } });
      run.bossAngry = true; // the boss glows red; no extra message
      banners = []; floats = [];
      banner(t('cageOpen'), '#5cbf3a', 'lock', true);
      sfx('level');
    }
  }
  const trailPts = 25 * count * count; // a longer trail delivered at once is worth much more
  if (run.chal && run.chal.k === 'big' && count >= run.chal.n && !run.chalDone) { run.chalDone = true; banner(t('chalWon'), '#5cc6ff', 'trophy'); sfx('streak'); }
  const ptsGain = Math.round((gain + trailPts) * (1 + repLv('rscore') * 0.01));
  run.score += ptsGain; if (count) { run.mood = 'cheer'; run.moodT = time + 0.7; }
  floatText(pt.x, pt.y - 1.35, '+' + fmt(ptsGain), '#f5efe3');
  run.tufts += count;
  run.bestCombo = Math.max(run.bestCombo, top);
  if (pt.rainbow) run.rainbow++;
  // streak bonus: every run of 3+ same-color tufts pays (g-1)·g/2 extra seeds (3 → +3, 4 → +6, 5 → +10, 6 → +15)
  let bonus = 0;
  groups.forEach(g => { if (g >= 3) { bonus += (g - 1) * g / 2; run.streaks++; } });
  const base = Math.round(count * coinMult());
  const extra = Math.round(bonus * coinMult());
  run.coins += base + extra;
  floatText(pt.x, pt.y, t('seeds', base + extra) + (extra ? t('inRow', top) : ''), extra ? '#ffcd4a' : pt.rainbow ? '#ffffff' : COLORS[pt.cs[0]].fill); // one seed line (art-feel P2)
  if (extra) {
    const pc = { x: pt.x, y: pt.y };
    for (let a = 0; a < 20; a++) { const ang = a / 20 * Math.PI * 2; particles.push({ x: pc.x, y: pc.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, life: .6, max: .6, color: '#ffcd4a' }); }
    sfx('streak');
  }
  deliverFeel(pt, count); // sound + home reaction scaled by the trail (fx.js)
  if (evo.comet) cometT = 4;
  if (run.kind === 'endless') {
    run.xp += count;
    while (run.xp >= xpNeed()) { run.xp -= xpNeed(); run.level++; pendingUps++; }
  }
  updateHud();
  if (pendingUps > 0 && mode === 'play') openCards('level');
}
function checkClear() {
  if (run.kind === 'tutorial') return;
  if (clearPending) return;
  if (run.boss ? run.bossDone : (bubbles.length === 0 && followers.length === 0)) {
    clearPending = true;
    run.clearSeeds = Math.round((BAL.eco.clearBase + grove() * BAL.eco.clearG) * coinMult());
    run.coins += run.clearSeeds;
    run.hp = Math.min(maxHp(), run.hp + 1);
    if (!run.hitThisGarden) run.noHit++;
    chestPending = run.kind === 'endless' && gardenInGrove() === PER_GROVE;
    if (chestPending && run.mode === 'oneheart') run.oneHeartGrove = 1;
    updateHud();
    if (mode === 'play') showClear();
  }
}
function findSpot(x, y, occ) {
  const seen = new Set([x + ',' + y]);
  const q = [{ x, y }];
  while (q.length) {
    const t = q.shift();
    const key = t.x + ',' + t.y;
    const onPlayer = (t.x === player.x && t.y === player.y) || (t.x === player.nx && t.y === player.ny);
    if (isOpen(t.x, t.y) && !occ.has(key) && !isPortal(t.x, t.y) && !onPlayer) return t;
    for (const [dx, dy] of FOUR) {
      const n = { x: t.x + dx, y: t.y + dy }, k = n.x + ',' + n.y;
      if (!seen.has(k) && isOpen(n.x, n.y)) { seen.add(k); q.push(n); }
    }
  }
  return null;
}
function breakAt(i, cap) {
  const hb = hitBy; hitBy = null;
  if (i >= followers.length) return;
  if (run.charmLeft > 0) { run.charmLeft--; const gp = fpos(i); burst(gp.x, gp.y, '#9fe3d4', 14); sfx('shield'); floatText(gp.x, gp.y - 0.5, LANG === 'pt' ? 'Guarda!' : 'Guard!', '#9fe3d4'); return; }
  noteHit('b', hb);
  const occ = new Set(bubbles.map(b => b.x + ',' + b.y));
  const lost = Math.min(followers.length - i, cap || Infinity);
  const at = fpos(i);
  for (let j = i; j < i + lost; j++) {
    const p = fpos(j);
    const spot = findSpot(Math.round(p.x), Math.round(p.y), occ);
    if (spot) {
      bubbles.push({ x: spot.x, y: spot.y, c: followers[j].c, gold: followers[j].gold, bob: Math.random() * 6, ...shinyOf(followers[j]) });
      occ.add(spot.x + ',' + spot.y);
    }
    burst(p.x, p.y, '#ffffff', 5);
  }
  followers.splice(i, lost);
  if (trail.length > followers.length + 1) trail.length = followers.length + 1;
  while (trail.length < followers.length + 1) trail.push({ ...trail[trail.length - 1] });
  floatText(at.x, at.y, t('broken', lost), '#ffd6f0');
  shake = Math.max(shake, 0.2);
  sfx('break');
  updateHud();
}
function scatter() {
  const pp = ppos();
  const far = shuffle(freeTiles(t => Math.abs(t.x - Math.round(pp.x)) + Math.abs(t.y - Math.round(pp.y)) >= 7));
  enemies.forEach((e, i) => {
    if (e.immHome || e.denT > 0) return;
    const t = far[i % far.length] || { x: e.x, y: e.y };
    burst(epos(e).x, epos(e).y, '#8b90b5', 6);
    e.x = e.nx = t.x; e.y = e.ny = t.y; e.p = 1; e.dir = [0, 0]; e.aim = 0; e.cool = 1;
  });
  shots = [];
}
function popEnemy(e) {
  if (e.hurtT > 0 || !e.maxHp) return;
  if (e.cracked && e.stun > 0) return; // already hit during this freeze or stun: rolling past it again does nothing
  const q = epos(e);
  e.hurtT = 0.8;
  const wasIced = isFrozen(e) || e.frz > 0;
  e.hp = 0; // no health on basic pests: any bump knocks it out
  burst(q.x, q.y, '#ffffff', 8);
  if (!wasIced && e.hp > 0) sfx('bump');
  if (e.hp > 0) {
    floatText(q.x, q.y, t('hitN', e.hp), '#ffffff');
    // The hit cracks the ice: it is no longer frozen, but stays stunned (harmless, not moving) for the rest of the freeze.
    if (isFrozen(e) || e.frz > 0) {
      e.stun = Math.max(e.stun || 0, freezeT, e.frz || 0); e.frzGen = -1; e.frz = 0; e.cracked = true;
      burst(q.x, q.y, '#bfe8ff', 12); sfx('crack');
    } else if (e.stun > 0) e.cracked = true; // one hit per stun as well
    return;
  }
  knockOut(e);
}
function damageEnemy(e, n) {
  if (!e.maxHp || e.denT > 0 || e.hurtT > 0 || iced(e)) return;
  e.hurtT = 0.8;
  e.hp -= n;
  if (e.hp <= 0) knockOut(e);
}
// Grape Bunch: when knocked out it sends 3 small grapes running. Each small grape knocks off only 1 tuft and pops after 14s.
// If the bunch was frozen, the small grapes land frozen too.
function splitGrape(e, q) {
  const frozen = freezeT > 0 && e.frzGen === freezeGen;
  let near = []; for (let R = 2; R <= 5 && near.length < 3; R++) near = shuffle(freeTiles(t2 => Math.abs(t2.x - Math.round(q.x)) + Math.abs(t2.y - Math.round(q.y)) <= R)).slice(0, 3);
  near.forEach(t2 => {
    const m = { x: t2.x, y: t2.y, nx: t2.x, ny: t2.y, p: 1, dir: [0, 0], type: 'minigrape', minion: true, cool: 0.8, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: e.speed * 1.3, life: 14 };
    flagEnemy(m); if (frozen) m.frzGen = freezeGen; enemies.push(m);
  });
  burst(q.x, q.y, '#9a5cff', 18);
}
function knockOut(e) {
  const q = epos(e);
  const v = Math.round(((e.val || e.maxHp) + 1) * coinMult());
  // Freeze combo: the 2nd, 3rd... Pest sent to the den during the same freeze pays x2, x3...
  let combo = 1;
  if (freezeT > 0) {
    if (run.koGen !== freezeGen) { run.koGen = freezeGen; run.koCount = 0; }
    combo = ++run.koCount;
  }
  const gain = v * combo;
  run.coins += gain; run.pops = (run.pops || 0) + 1;
  burst(q.x, q.y, '#ffffff', 20);
  floatText(q.x, q.y, t('knocked', gain), '#ffffff'); sfx('knock');
  if (combo > 1) { floatText(q.x, q.y - 0.7, t('koCombo', combo), '#bfe8ff'); burst(q.x, q.y, '#bfe8ff', 14); sfx('streak'); }
  if (e.minion) { enemies.splice(enemies.indexOf(e), 1); updateHud(); return; }
  if (e.type === 'grape') splitGrape(e, q);
  e.denT = run.boss ? 10 : 12;
  e.flyFrom = { x: q.x, y: q.y }; e.flyStart = time; run.denPing = time; // fly home in an arc, then nap
  e.x = e.nx = run.den.x; e.y = e.ny = run.den.y; e.p = 1; e.dir = [0, 0]; e.stun = 0; e.frz = 0; e.aim = 0;
  updateHud();
}
function dropTail(n) {
  const occ = new Set(bubbles.map(b => b.x + ',' + b.y));
  const start = followers.length - n;
  for (let j = start; j < followers.length; j++) {
    const q = fpos(j);
    const spot = findSpot(Math.round(q.x), Math.round(q.y), occ);
    if (spot) { bubbles.push({ x: spot.x, y: spot.y, c: followers[j].c, gold: followers[j].gold, bob: Math.random() * 6, ...shinyOf(followers[j]) }); occ.add(spot.x + ',' + spot.y); }
    burst(q.x, q.y, '#ffffff', 5);
  }
  followers.length = start;
  if (trail.length > followers.length + 1) trail.length = followers.length + 1;
  updateHud();
}
function bossCd(e) {
  const base = { king: 6, queen: 5, twins: 12, broc: 8, potato: 99 }[e.variant] || 6;
  return Math.max(3, base - 0.6 * Math.floor((grove() - 1) / 3) - 0.8 * (e.bonks || 0));
}
function bossAttack(e) {
  if (e.variant === 'queen') { // Pineapple Queen: 4-way volley; after one bonk a second volley follows, after two she also aims at you
    const volley = () => FOUR.forEach(([dx, dy]) => { if (isOpen(e.x + dx, e.y + dy)) shots.push({ x: e.x, y: e.y, dx, dy, src: 'queen', tel: (e.seenT || 0) >= TELL }); });
    volley(); sfx('shoot');
    if (e.bonks >= 1) e.volleyT = 0.5;
    if (e.bonks >= 2) { const d = aimLine(e, Math.round(ppos().x), Math.round(ppos().y)); if (d) shots.push({ x: e.x, y: e.y, dx: d[0], dy: d[1], src: 'queen', tel: (e.seenT || 0) >= TELL }); }
  } else if (e.variant === 'broc') {
    growSprouts(e, 2 + (e.bonks || 0));
  } else if (e.variant === 'twins') {
    if (enemies.filter(m => m.minion).length < 2) {
      const m = { x: e.x, y: e.y, nx: e.x, ny: e.y, p: 1, dir: [0, 0], type: 'wander', minion: true, cool: 1, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: e.speed * 1.1 };
      flagEnemy(m); enemies.push(m); burst(e.x, e.y, '#7fb8c9', 12);
    }
  } else if (e.variant === 'king') { // Watermelon King: charges in a straight line; hitting a hedge leaves him dizzy (bonk him!)
    const pp = ppos(), dx = pp.x - e.x, dy = pp.y - e.y;
    e.dashDir = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy) || 1];
    if (!isOpen(e.x + e.dashDir[0], e.y + e.dashDir[1])) e.dashDir = FOUR.find(d => isOpen(e.x + d[0], e.y + d[1])) || [0, 0];
    e.dash = 3;
    sfx('puff');
  }
}
// Broccoli Treant: grows short-lived hedge sprouts on the tiles between you and it. A sprout is only placed if every portal stays reachable.
function growSprouts(e, n) {
  run.sprouts = run.sprouts || [];
  const D = playerDistMap(), ed = D[e.x + e.y * COLS];
  const busy = new Set([...bubbles, ...enemies, ...portals, ...followers.map((f, i) => { const q = fpos(i); return { x: Math.round(q.x), y: Math.round(q.y) }; })].map(o => o.x + ',' + o.y));
  const cand = shuffle(freeTiles(t2 => { const v = D[t2.x + t2.y * COLS]; return v >= 2 && v <= Math.max(3, ed - 1) && !busy.has(t2.x + ',' + t2.y) && !(run.den && t2.x === run.den.x && t2.y === run.den.y); }));
  let placed = 0;
  for (const t2 of cand) {
    if (placed >= n) break;
    grid[t2.y][t2.x] = 1;
    const D2 = playerDistMap();
    if (portals.some(q => D2[q.x + q.y * COLS] < 0) || bubbles.some(b => D2[b.x + b.y * COLS] < 0)) { grid[t2.y][t2.x] = 0; continue; }
    run.sprouts.push({ x: t2.x, y: t2.y, life: 6 }); placed++; burst(t2.x, t2.y, '#4fa84f', 8);
  }
  if (placed) { buildMaze(); sfx('wake'); }
}
function updateSprouts(dt) {
  if (!run.sprouts || !run.sprouts.length) return;
  let changed = false;
  for (let k = run.sprouts.length - 1; k >= 0; k--) { const sp = run.sprouts[k]; sp.life -= dt; if (sp.life <= 0) { grid[sp.y][sp.x] = 0; run.sprouts.splice(k, 1); changed = true; burst(sp.x, sp.y, '#4fa84f', 6); } }
  if (changed) buildMaze();
}
// A bonk on a boss: frozen (or dizzy) boss + bump. Each bonk makes it angrier; the last one sends it packing and opens the cages.
const BOSS_DAZE = 2;
function bonkBoss(e) {
  const q = epos(e);
  // After a bonk the boss stays dazed (harmless, not moving) long enough for the hero and the trail to get clear.
  e.bonks = (e.bonks || 0) + 1; e.frzGen = -1; e.popT = 0; e.stun = BOSS_DAZE; e.hurtT = BOSS_DAZE + 0.4; e.cool = BOSS_DAZE + 0.6; e.dash = 0; e.tele = 0; e.aim = 0;
  e.speed *= 1.1;
  burst(q.x, q.y, '#ffffff', 22); shake = Math.max(shake, 0.35); sfx('knock');
  floatText(q.x, q.y - 0.9, t('bonk', e.bonks, e.bonkMax), '#fff1a8');
  if (e.bonks < e.bonkMax) return;
  const v = Math.round(25 * coinMult());
  run.coins += v; banner(t('bossBeaten', v), '#f5b82e', 'crown'); burst(q.x, q.y, '#ffcd4a', 30); sfx('level');
  enemies.splice(enemies.indexOf(e), 1);
  if (!enemies.some(o => o.type === 'boss')) {
    enemies = enemies.filter(o => !o.minion);
    bubbles.forEach(b => { if (b.locked) { b.locked = false; burst(b.x, b.y, '#fff1a8', 20); } });
    portals.forEach(p2 => { if (p2.golden) { p2.active = true; burst(p2.x, p2.y, '#fff1a8', 20); } });
    banner(t('cageOpen'), '#5cbf3a', 'lock');
  }
  updateHud();
}
function sendHome(list) {
  const pp = ppos();
  const far = shuffle(freeTiles(t2 => Math.abs(t2.x - Math.round(pp.x)) + Math.abs(t2.y - Math.round(pp.y)) >= 7));
  list.forEach((e, i) => {
    const sp = far[i % far.length];
    if (!sp) return;
    burst(epos(e).x, epos(e).y, '#8b90b5', 6);
    e.x = e.nx = sp.x; e.y = e.ny = sp.y; e.p = 1; e.dir = [0, 0]; e.aim = 0; e.cool = 1;
  });
}
