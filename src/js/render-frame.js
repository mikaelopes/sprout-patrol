function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#10152a'; ctx.fillRect(0, 0, viewW, viewH);
  if (!grid) return;
  let sx = 0, sy = 0;
  if (shake > 0 && !reduceMotion) { sx = (Math.random() - .5) * 8 * shake; sy = (Math.random() - .5) * 8 * shake; }
  ctx.save();
  ctx.translate(-cam.x + sx, -cam.y + sy);
  if (mazeCanvas) ctx.drawImage(mazeCanvas, 0, 0, COLS * cell, ROWS * cell);
  drawAmbient();

  for (const p of portals) if (!p.rainbow || p.active || p.golden) drawPortal(p);
  drawDen();

  for (const k of pickups) {
    if (k.life < 2.5 && Math.floor(time * 8) % 2) continue;
    const cx = (k.x + .5) * cell, cy = (k.y + .5) * cell + (reduceMotion ? 0 : Math.sin(time * 2 + k.x) * cell * 0.04);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.42);
    const gc = k.type === 'frost' ? '191,232,255' : '255,205,74';
    glow.addColorStop(0, `rgba(${gc},.6)`); glow.addColorStop(0.5, `rgba(${gc},.22)`); glow.addColorStop(1, `rgba(${gc},0)`);
    ctx.fillStyle = glow; circ(ctx, cx, cy, cell * 0.42); ctx.fill();
    ctx.fillStyle = 'rgba(4,7,18,.3)'; ctx.beginPath(); ctx.ellipse(cx, (k.y + .5) * cell + cell * 0.3, cell * 0.16, cell * 0.05, 0, 0, TAU); ctx.fill();
    if (k.type === 'frost') { if (!obj('ob-flake', cx, cy, cell * 0.62, null, reduceMotion ? 0 : Math.sin(time * 1.5 + k.x) * 0.15)) drawFlake(cx, cy, cell * 0.3); }
    else if (!obj('ic-seed', cx, cy, cell * 0.5, null, reduceMotion ? 0 : Math.sin(time * 2.5 + k.x) * 0.12)) drawSeed(cx, cy, cell * 0.28); // same seed coin as the wallet
  }
  for (const b of bubbles) {
    const cx = (b.x + .5) * cell, cy = (b.y + .5) * cell + Math.sin(time * 2 + b.bob) * cell * 0.04, col = COLORS[b.c], R = cell * 0.42;
    drawTuft(ctx, cx, cy, cell * 0.27, b.c, b.bob, time, 0, 0, { glint: true, mood: 'sad' });
    disc(cx, cy, R, '#cfe6ff', 0.12);
    strokeRing(cx, cy, R, '#d9ecff', Math.max(1.5, cell * 0.04), 0.8);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, cell * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.75, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
    if (b.shiny) drawShinyFx(cx, cy, R, b.shinyT ? b.shinyT / (b.shinyMax || SHINY_T) : null);
    if (b.gold) for (let k = 0; k < 3; k++) { const a = time * 2 + k * 2.1; disc(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2, Math.max(1.5, cell * 0.05), '#fff1a8'); }
    if (b.locked && obj('ob-cage', cx, cy - R * 0.08, R * 2.35)) { /* painted twig cage */ }
    else if (b.locked) {
      ctx.strokeStyle = '#c9cde6'; ctx.lineWidth = Math.max(1.5, cell * 0.05);
      ctx.save(); circ(ctx, cx, cy, R); ctx.clip();
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx + k * R * 0.4, cy - R); ctx.lineTo(cx + k * R * 0.4, cy + R); ctx.stroke(); }
      ctx.restore();
    }
  }

  // Movement: a simple stretch along the direction of travel, back to round between tiles; eyes look where you go.
  const squish = player.moving && !reduceMotion ? Math.sin(Math.min(1, player.p) * Math.PI) : 0;
  const hopOn = false, hp0 = 0, hopH = () => 0, hopSq = () => squish;
  const sqAng = Math.atan2(player.face[1], player.face[0]);
  const fdt = Math.min(0.1, Math.max(0, time - (draw.lastT || time))); draw.lastT = time;
  const tskin = cosState().trail;
  if (tskin === 'ribbon' && followers.length && followers[0].rx != null) { const pp0 = ppos(); drawRibbon(ctx, [{ x: (pp0.x + .5) * cell, y: (pp0.y + .5) * cell }].concat(followers.filter(f => f.rx != null).map(f => ({ x: (f.rx + .5) * cell, y: (f.ry + .5) * cell }))), cell * 0.2, ch().fill); }
  for (let i = followers.length - 1; i >= 0; i--) {
    const f = followers[i], tp = fpos(i), col = COLORS[f.c];
    if (f.rx == null || reduceMotion) { f.rx = tp.x; f.ry = tp.y; }
    else { const dx = tp.x - f.rx, dy = tp.y - f.ry, dd = Math.hypot(dx, dy), step = Math.max(2, speed() * 1.2) * fdt; /* never faster than the hero (plus a little catch-up), so tufts don't dash at walls or turns */ if (dd <= step || dd > 6) { f.rx = tp.x; f.ry = tp.y; } else { f.rx += dx / dd * step; f.ry += dy / dd * step; } }
    const p = { x: f.rx, y: f.ry };
    const fph = (i + 1) * 0.18, cx = (p.x + .5) * cell, cy = (p.y + .5) * cell - hopH(fph) * cell * 0.1;
    const grow = Math.min(1, (time - f.born) / 0.2);
    if (tskin !== 'none' && tskin !== 'ribbon') drawTrailSkin(ctx, cx, cy, cell * 0.28, tskin, i, reduceMotion ? 0 : time);
    drawTuft(ctx, cx, cy, cell * 0.28 * (0.5 + 0.5 * grow), f.c, i, time, squish, sqAng, { ring: true, hop: !player.moving, glint: true, lx: player.face[0], ly: player.face[1], mood: time - f.born < 1.2 ? 'happy' : '' });
    if (f.shiny) drawShinyFx(cx, cy, cell * 0.3, f.shinyT / (f.shinyMax || SHINY_T));
  }

  const pp = ppos();
  const pcx = (pp.x + .5) * cell, pcy = (pp.y + .5) * cell;
  drawTutorialHints();
  const blinkOut = invuln > 0 && mode === 'play' && !reduceMotion && Math.floor(time * 6) % 2;
  if (blinkOut) ctx.globalAlpha = 0.45;
  {
    const c = ch();
    const lift = hopH(0), cy = pcy - lift * cell * 0.2;
    if (cometT > 0 && !fxPic(ctx, 'fx-comet', pcx - player.face[0] * cell * 0.35, cy - player.face[1] * cell * 0.35, cell * 1.3, Math.atan2(player.face[1], player.face[0]) - Math.PI * 0.75, 0.85)) disc(pcx, cy, cell * 0.6, '#ffcd4a', 0.25);
    ctx.fillStyle = 'rgba(4,7,18,.35)'; ctx.beginPath(); ctx.ellipse(pcx, pcy + cell * 0.4, cell * 0.3 * (1 - 0.3 * lift), cell * 0.08 * (1 - 0.3 * lift), 0, 0, TAU); ctx.fill();
    const hatId = cosState().hat;
    drawHero.phase = hopOn ? hp0 : -1;
    drawHero.mood = run.moodT > time ? run.mood : '';
    const breathe = 0, shakeX = drawHero.mood === 'hurt' && !reduceMotion ? Math.sin(time * 60) * cell * 0.04 : 0;
    drawHero(ctx, run.char || meta.char, pcx + shakeX, cy, cell * 0.34, player.face[0], player.face[1], 9, time, hopSq(0) + breathe, sqAng, hatId === 'leaf');
    drawHero.phase = -1; drawHero.mood = '';
    if (hatId !== 'leaf') drawHat(ctx, pcx, cy, cell * 0.34, hatId, reduceMotion ? 0 : time, run.char || meta.char);
    if (shieldUp || run.spareShield) { if (!(shieldBubble(pcx, cy, cell * (0.52 + 0.02 * Math.sin(time * 3))))) strokeRing(pcx, cy, cell * 0.5, '#9fe3d4', Math.max(2, cell * 0.06), 0.9); }
  }
  ctx.globalAlpha = 1;
  for (const fx of (run.fx || [])) { // beams: frost or lightning running down a corridor
    if (spr('fx-icespear') && spr('fx-bolt')) { drawBeamFx(fx); continue; }
    const a = fx.life / fx.max, x0 = (fx.x0 + .5) * cell, y0 = (fx.y0 + .5) * cell, x1 = (fx.x1 + .5) * cell, y1 = (fx.y1 + .5) * cell;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0);
    if (fx.bolt) { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (cell * 0.5))); for (let k = 1; k < n; k++) { const t2 = k / n, j = (k % 2 ? 1 : -1) * cell * 0.15; ctx.lineTo(x0 + (x1 - x0) * t2 + (y1 - y0 ? j : 0), y0 + (y1 - y0) * t2 + (x1 - x0 ? j : 0)); } }
    ctx.lineTo(x1, y1);
    const w = cell * (fx.bolt ? 0.2 : 0.5) * (0.6 + 0.4 * a);
    ctx.globalAlpha = a * 0.35; ctx.strokeStyle = fx.color; ctx.lineWidth = w * 1.9; ctx.stroke();
    ctx.globalAlpha = a; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = cell * 0.09; ctx.stroke();
    ctx.globalAlpha = a; disc(x0, y0, cell * 0.3 * (1.4 - 0.4 * a), fx.color, 0.55 * a); // puff at the hero
    disc(x1, y1, cell * 0.26 * (1.6 - 0.6 * a), fx.color, 0.7 * a); disc(x1, y1, cell * 0.11, '#ffffff', 0.9 * a); // splash at the far end
    ctx.restore();
  }
  for (const o of (run.orbs || [])) { // orbit bubbles
    if (o.x == null) continue;
    const x = (o.x + .5) * cell, y = (o.y + .5) * cell;
    if (o.cd > 0) { const g = Math.max(0, 1 - o.cd / (wpStat('orbit').cd)); if (g > 0.15) shieldBubble(x, y, cell * 0.24 * g); continue; }
    if (!shieldBubble(x, y, cell * 0.26)) { disc(x, y, cell * 0.24, '#7fd9c4', 0.55); strokeRing(x, y, cell * 0.24, '#e6fff8', Math.max(2, cell * 0.05)); }
  }
  for (const pr of (run.proj || [])) {
    if (pr.delay > 0) continue;
    const x = (pr.x + .5) * cell, y = (pr.y + .5) * cell;
    const puff = pr.kind === 'puff', col = puff ? '#ff9a7a' : '#7fd9c4', dx = pr.d[0] * cell, dy = pr.d[1] * cell;
    const pim = spr(puff ? 'fx-puff' : 'fx-bubble');
    if (pim && pim.naturalWidth) { // painted projectile facing its way, with a fading echo trail and a little wobble
      const ang = Math.atan2(pr.d[1], pr.d[0]), wob = 1 + 0.08 * Math.sin(time * 18 + pr.x * 3);
      for (let k = 2; k >= 1; k--) fxPic(ctx, puff ? 'fx-puff' : 'fx-bubble', x - dx * 0.28 * k, y - dy * 0.28 * k, cell * (0.62 - 0.14 * k), ang, 0.35 / k);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (Math.abs(ang) > Math.PI / 2) ctx.scale(1, -1); ctx.scale(wob, 1 / wob);
      ctx.drawImage(pim, -cell * 0.36, -cell * 0.36, cell * 0.72, cell * 0.72); ctx.restore();
      continue;
    }
    for (let k = 3; k >= 1; k--) disc(x - dx * 0.24 * k, y - dy * 0.24 * k, cell * (0.2 - 0.045 * k), col, 0.5 - 0.12 * k); // tapered trail
    disc(x, y, cell * 0.3, col, 0.25);
    if (puff) { disc(x, y, cell * 0.24, col); strokeRing(x, y, cell * 0.24, '#fff1e8', Math.max(2, cell * 0.05)); disc(x - cell * 0.07, y - cell * 0.07, cell * 0.08, '#fff1e8'); }
    else { disc(x, y, cell * 0.24, col, 0.55); strokeRing(x, y, cell * 0.24, '#e6fff8', Math.max(2, cell * 0.05)); disc(x - cell * 0.08, y - cell * 0.08, cell * 0.06, '#ffffff'); }
  }
  for (const e of enemies) if (!(e.denT > 0)) drawGrumble(e);
  if (run.homeTufts && run.homeTufts.length) { // delivered tufts hop happily into their portal and shrink away
    for (let k = run.homeTufts.length - 1; k >= 0; k--) {
      const h = run.homeTufts[k]; h.t += 1 / 60; if (h.t >= h.dur) { run.homeTufts.splice(k, 1); continue; } if (h.t < 0) continue;
      const q = h.t / h.dur, x = lerp(h.x0, h.x1, q), y = lerp(h.y0, h.y1, q) - Math.sin(q * Math.PI) * 0.9;
      drawTuft(ctx, (x + .5) * cell, (y + .5) * cell, cell * 0.28 * (1 - 0.6 * q), h.c, k, time, 0, 0, { mood: 'happy' });
    }
  }
  for (const L2 of (run.lobs || [])) { // kernel in flight + where it lands
    const k = L2.t / L2.dur, x = lerp(L2.x0, L2.tx, k), y = lerp(L2.y0, L2.ty, k) - Math.sin(k * Math.PI) * 1.6;
    const hail = !!spr('ob-hail');
    strokeRing((L2.tx + .5) * cell, (L2.ty + .5) * cell, cell * (0.38 - 0.12 * k), hail ? '#bfe8ff' : '#ffd84a', 2, 0.5 + 0.4 * k);
    if (hail) { obj('ob-hail', (x + .5) * cell, (y + .5) * cell, cell * (0.34 + 0.12 * Math.sin(k * Math.PI)), null, k * 5); continue; }
    disc((x + .5) * cell, (y + .5) * cell, cell * 0.12, '#ffd84a'); disc((x + .5) * cell - cell * 0.03, (y + .5) * cell - cell * 0.03, cell * 0.04, '#fff6c9');
  }
  for (const e of enemies) if (e.type === 'sniper' && e.aim > 0 && e.lobTo && !(e.denT > 0)) {
    const x0 = (e.x + .5) * cell, y0 = (e.y + .5) * cell, x1 = (e.lobTo.x + .5) * cell, y1 = (e.lobTo.y + .5) * cell;
    ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = spr('ob-hail') ? 'rgba(191,232,255,.75)' : 'rgba(255,216,74,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - cell * 1.6, x1, y1); ctx.stroke(); ctx.restore();
    strokeRing(x1, y1, cell * 0.38, spr('ob-hail') ? '#bfe8ff' : '#ffd84a', 2, 0.6);
  }
  const lane = (e, d) => { const tiles = corridor(e.x, e.y, d, 6); if (!tiles.length) return; const x0 = (e.x + .5 + d[0] * 0.5) * cell, y0 = (e.y + .5 + d[1] * 0.5) * cell, L = tiles[tiles.length - 1];
    ctx.save(); ctx.setLineDash([cell * 0.16, cell * 0.14]); ctx.lineCap = 'round'; ctx.lineDashOffset = reduceMotion ? 0 : -time * cell * 1.2;
    for (const [w, c] of [[Math.max(4, cell * 0.14), 'rgba(27,21,48,.75)'], [Math.max(2, cell * 0.07), 'rgba(255,255,255,.9)']]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo((L.x + .5) * cell, (L.y + .5) * cell); ctx.stroke(); }
    ctx.restore(); };
  for (const e of enemies) { if (e.denT > 0 || iced(e) || e.stun > 0) continue;
    if ((e.type === 'shooter' || e.type === 'boss') && (e.aim > 0 || e.burstN > 0) && e.aimDir) lane(e, e.aimDir);
    if (e.type === 'boss' && e.variant === 'queen' && e.tele > 0) FOUR.forEach(d => lane(e, d)); }
  for (const s of shots) {
    const cx = (s.x + .5) * cell, cy = (s.y + .5) * cell;
    if (s.pea && obj('ob-drop', cx, cy, cell * 0.36, null, Math.atan2(s.dy, s.dx) - Math.PI / 2)) continue;
    if (s.pea) { disc(cx, cy, cell * 0.17, '#4f9a3a'); disc(cx, cy, cell * 0.14, '#9be36f'); disc(cx - cell * 0.04, cy - cell * 0.04, cell * 0.04, '#ffffff'); continue; }
    disc(cx, cy, cell * 0.2, '#ffd6f0', 0.3); disc(cx, cy, cell * 0.12, '#ffd6f0'); disc(cx - cell * 0.03, cy - cell * 0.03, cell * 0.05, '#ffffff');
  }
  drawSpriteFx(fdt);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color; circ(ctx, (p.x + .5) * cell, (p.y + .5) * cell, cell * 0.06 * (0.5 + p.life / p.max)); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const vg = ctx.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.45, viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,8,20,0.3)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, viewW, viewH);

  if (!displayFont) displayFont = getComputedStyle(document.documentElement).getPropertyValue('--display');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = Math.max(14, Math.round(cell * 0.42));
  ctx.font = `600 ${fs}px ${displayFont}`;
  for (const f of floats) {
    const age = 1.2 - f.life, pop = reduceMotion ? 1 : age < 0.12 ? 0.5 + age / 0.12 * 0.7 : age < 0.24 ? 1.2 - (age - 0.12) / 0.12 * 0.2 : 1; // pop in, settle
    ctx.globalAlpha = Math.min(1, f.life * 2);
    const tw = ctx.measureText(f.text).width / 2 + 4;
    const x = Math.min(viewW - tw, Math.max(tw, (f.x + .5) * cell - cam.x)), y = (f.y + .2) * cell - cam.y;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
    ctx.lineWidth = 5; ctx.strokeStyle = '#2a1a10'; ctx.lineJoin = 'round'; ctx.strokeText(f.text, 0, 0);
    ctx.fillStyle = f.color; ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  drawBanners(fs);

  if (mode !== 'splash' && mode !== 'hub') drawEdgeMarkers();
  if (freezeT > 0 && mode === 'play') {
    ctx.fillStyle = '#0d1122'; rr(ctx, 6, viewH - 10, viewW - 12, 6, 3); ctx.fill();
    ctx.fillStyle = freezeT < 0.8 && (reduceMotion || Math.floor(time * 6) % 2) ? '#ffffff' : '#bfe8ff'; rr(ctx, 6, viewH - 10, Math.max(6, (viewW - 12) * Math.min(1, freezeT / freezeDur())), 6, 3); ctx.fill();
  }
}

