/* ---------- player ---------- */
function ppos() {
  if (!player.moving) return { x: player.x, y: player.y };
  return { x: lerp(player.x, player.nx, player.p), y: lerp(player.y, player.ny, player.p) };
}
function fpos(i) {
  const b = trail[i] || trail[trail.length - 1];
  const a = trail[i + 1] || b;
  const t2 = player.moving ? player.p : player.cp;
  if (t2 == null) return { x: b.x, y: b.y };
  return { x: lerp(a.x, b.x, t2), y: lerp(a.y, b.y, t2) };
}
function tryStep(d) {
  if (!d) return false;
  const nx = player.x + d[0], ny = player.y + d[1];
  if (!isOpen(nx, ny)) return false;
  trail.unshift({ x: player.x, y: player.y });
  if (trail.length > followers.length + 1) trail.length = followers.length + 1;
  player.nx = nx; player.ny = ny; player.dir = d; player.face = d; player.moving = true; player.cp = null;
  return true;
}
// When the tuft stops against a hedge, the trail keeps walking its own path into it, one tile at a time at the hero's speed.
const trailHome = () => trail.every(q => q.x === player.x && q.y === player.y);
function trailAdvance() { trail.unshift({ x: player.x, y: player.y }); trail.length = Math.min(trail.length, followers.length + 1); }
function collapseTrail(dt) {
  if (player.cp == null) { if (trailHome()) return; trailAdvance(); player.cp = 0; }
  player.cp += speed() * (dt || 0);
  while (player.cp >= 1) { if (trailHome()) { player.cp = null; return; } trailAdvance(); player.cp -= 1; }
}
function updatePlayer(dt) {
  if (!player.moving) {
    if (!tryStep(player.want) && !tryStep(player.dir)) { collapseTrail(dt); return; }
    player.p = 0;
  }
  player.p += speed() * dt;
  while (player.p >= 1) {
    const left = player.p - 1;
    player.x = player.nx; player.y = player.ny; player.moving = false; player.p = 0; player.hopN = (player.hopN || 0) + 1;
    arrive();
    if (mode !== 'play') return;
    if (run.kind === 'tutorial') { tutTick(); if (run.kind !== 'tutorial' || mode !== 'play' || tutGate()) { player.cp = null; return; } }
    if (!tryStep(player.want) && !tryStep(player.dir)) { player.cp = null; collapseTrail(left / Math.max(0.01, speed())); return; }
    player.p = left;
  }
}
function collectBubble(bi) {
  const b = bubbles[bi];
  if (b.locked) {
    if (time - (run.keysMsgT || -99) > 6) { run.keysMsgT = time; floatText(b.x, b.y, t('needKeys'), '#fff1a8'); }
    return false;
  }
  if (followers.length >= cap() && !b.gold) {
    // once per full trail (the HUD's 4/4 already shows it), and never more than every 10 s
    if (!run.fullShown && time - lastFullMsg > 10) { lastFullMsg = time; run.fullShown = true; floatText(player.x, player.y, t('trailFull'), '#ffcd4a'); }
    return false;
  }
  bubbles.splice(bi, 1); run.fullShown = false;
  followers.push({ c: b.c, born: time, gold: !!b.gold, shiny: !!b.shiny, shinyT: b.shiny ? (b.shinyT || SHINY_T * mapF()) : 0, shinyMax: b.shinyMax || SHINY_T * mapF() });
  if (b.shiny && !b.shinyT) { banner(LANG === 'pt' ? 'Brilhante! Entregue antes do brilho sumir.' : 'Shiny! Deliver it before the glow fades.', '#ffd970', 'star'); sfx('streak'); }
  while (trail.length < followers.length + 1) trail.push({ ...trail[trail.length - 1] });
  burst(b.x, b.y, COLORS[b.c].fill, 10);
  sfx('pop');
  updateHud();
  return true;
}
function arrive() {
  const { x, y } = player;
  const bi = bubbles.findIndex(b => b.x === x && b.y === y);
  if (bi >= 0) collectBubble(bi);
  const pt = isPortal(x, y);
  if (pt) deliver(pt);
  grabPickups(true);
  checkClear();
}
// Pickups are taken as soon as the hero is close (not only at the tile centre), and this runs before any bump is
// judged, so a snowflake grabbed right next to a pest freezes it before it can hit you.
function grabPickups(atCentre) {
  const pp = atCentre ? { x: player.x, y: player.y } : ppos();
  for (let k = pickups.length - 1; k >= 0; k--) {
    const pk = pickups[k], x = pk.x, y = pk.y;
    if (atCentre ? (pk.x !== player.x || pk.y !== player.y) : Math.abs(pp.x - pk.x) + Math.abs(pp.y - pk.y) > 0.55) continue;
    pickups.splice(k, 1);
    if (pk.type === 'frost') { freeze(freezeDur()); frostSpawnT = Math.max(frostSpawnT, freezeDur() + FROST_COOLDOWN); floatText(x, y, t('freeze'), '#bfe8ff'); burst(x, y, '#bfe8ff', 16); sfx('freeze'); }
    else { const v = Math.round(3 * coinMult()); run.coins += v; floatText(x, y, t('seeds', v), '#ffcd4a'); burst(x, y, '#ffcd4a', 8); sfx('coin'); updateHud(); }
  }
}
// A freeze only catches the pests that are out on the board when it starts. Ones napping in the den,
// or arriving later, stay awake, so a pest that leaves the den mid-freeze is not frozen.
let freezeGen = 0;
function freeze(t) {
  freezeGen++;
  // A snowflake always starts a fresh daze: earlier stuns (and the "already bumped" mark) are cleared, so it is never wasted.
  // (a boss keeps its dizziness, so a dizzy boss stays bonkable even if it can't be bonked while frozen)
  for (const e of enemies) if (!(e.denT > 0)) { e.frzGen = freezeGen; if (e.type !== 'boss') e.stun = 0; e.cracked = false; }
  freezeT = Math.max(freezeT, t * (1 + repLv('rfrost') * 0.01));
}
const isFrozen = e => freezeT > 0 && !e.immFreeze && e.frzGen === freezeGen;
const FROST_COOLDOWN = 10; // seconds after a freeze ends before another snowflake can appear
const SHINY_T = 25;
const shinyOf = f => f.shiny ? { shiny: true, shinyT: Math.max(1, f.shinyT), shinyMax: f.shinyMax } : {};
const shinyChance = () => run.kind === 'endless' ? 0.15 : (run.adv && (run.adv.g > 2 || (run.adv.g === 2 && run.adv.i >= 3)) ? 0.18 : 0);
function updateShiny(dt) {
  for (const f of followers) if (f.shiny) { f.shinyT -= dt; if (f.shinyT <= 0) { f.shiny = false; const i = followers.indexOf(f), q = fpos(i); floatText(q.x, q.y - 0.5, LANG === 'pt' ? 'O brilho sumiu' : 'The glow faded', '#b4bbd9'); } }
}
function drawShinyFx(cx, cy, R, frac) {
  const a = time * 2.4;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  disc(cx, cy, R * 1.25, '#ffd970', 0.12 + 0.06 * Math.sin(time * 6));
  ctx.restore();
  for (let k = 0; k < 4; k++) { const ang = a + k * TAU / 4; if (!fxPic(ctx, 'fx-twinkle', cx + Math.cos(ang) * R * 1.15, cy + Math.sin(ang) * R * 1.15, R * 0.6, ang, 0.9)) disc(cx + Math.cos(ang) * R * 1.15, cy + Math.sin(ang) * R * 1.15, Math.max(1.5, R * 0.1), '#fff1a8'); }
  if (frac == null) strokeRing(cx, cy, R, '#ffd970', Math.max(2, R * 0.12), 0.95);
  if (frac != null) { ctx.save(); ctx.strokeStyle = frac > 0.3 ? '#ffd970' : '#ff6f61'; ctx.lineWidth = Math.max(2, R * 0.14); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, frac)); ctx.stroke(); ctx.restore(); }
}
