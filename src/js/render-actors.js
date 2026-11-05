const SPR = {};
function spr(name) {
  if (!ART[name]) return null;
  let im = SPR[name];
  if (!im) { im = SPR[name] = new Image(); if (/^w\d-(hedge|floor)$/.test(name)) im.onload = () => buildMaze(); im.src = ART[name]; }
  return im.complete && im.naturalWidth ? im : null;
}
// Draws a sprite centered at (x, y) so the character's body is about 2r wide. sq/sqAng add squash, flip mirrors it.
function drawSpr(g, im, x, y, r, flip, sq, sqAng, alpha, scale) {
  const s = r * (scale || 2.9);
  g.save(); g.translate(x, y);
  if (sq) { g.rotate(sqAng || 0); g.scale(1 + 0.11 * sq, 1 - 0.09 * sq); g.rotate(-(sqAng || 0)); }
  if (flip) g.scale(-1, 1);
  if (alpha != null) g.globalAlpha = alpha;
  g.drawImage(im, -s / 2, -s / 2, s, s);
  g.restore();
}
const blinkNow = seed => seed >= 0 && ((time + seed * 1.7) % 3.6) < 0.12;

// Heroes (look book H4): smooth plush blobs with feet and blush, in colors tufts never use, with a light rim.
function heroEyes(g, x, y, r, lx, ly, seed) {
  const er = r * 0.3, bl = seed < 0 ? 1 : blinkNow(seed) ? 0.15 : 1;
  for (const s of [-1, 1]) {
    g.save(); g.translate(x + s * r * 0.32, y - r * 0.06); g.scale(1, bl);
    g.fillStyle = '#fff'; circ(g, 0, 0, er); g.fill();
    g.fillStyle = '#151a30'; circ(g, lx * er * 0.35, ly * er * 0.3 + er * 0.06, er * 0.6); g.fill();
    g.fillStyle = '#fff'; circ(g, lx * er * 0.35 - er * 0.2, ly * er * 0.3 - er * 0.14, er * 0.2); g.fill();
    circ(g, lx * er * 0.35 + er * 0.18, ly * er * 0.3 + er * 0.2, er * 0.09); g.fill();
    g.restore();
  }
}
function heroBlush(g, x, y, r) { g.fillStyle = 'rgba(255,120,140,.45)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.5, y + r * 0.22, r * 0.14, r * 0.08, 0, 0, TAU); g.fill(); } }
function heroSmile(g, x, y, r) { g.strokeStyle = '#3a1f1a'; g.lineWidth = Math.max(1.2, r * 0.07); g.lineCap = 'round'; g.beginPath(); g.arc(x, y + r * 0.18, r * 0.14, 0.2, Math.PI - 0.2); g.stroke(); }
function heroShape(g, x, y, rx, ry, up) {
  g.beginPath();
  if (up) { g.moveTo(x, y - ry * 1.45); g.bezierCurveTo(x + rx * 0.6, y - ry * 0.9, x + rx * 1.05, y - ry * 0.3, x + rx, y + ry * 0.2); g.bezierCurveTo(x + rx * 0.95, y + ry * 0.95, x - rx * 0.95, y + ry * 0.95, x - rx, y + ry * 0.2); g.bezierCurveTo(x - rx * 1.05, y - ry * 0.3, x - rx * 0.6, y - ry * 0.9, x, y - ry * 1.45); }
  else g.ellipse(x, y, rx, ry, 0, 0, TAU);
}
function heroBody(g, x, y, rx, ry, fill, dark, up) {
  heroShape(g, x, y, rx, ry, up); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(3, rx * 0.26); g.stroke(); // light rim keeps the hero readable on dark floors
  heroShape(g, x, y, rx, ry, up); g.fillStyle = fill; g.fill(); g.strokeStyle = dark; g.lineWidth = Math.max(2, rx * 0.12); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(x - rx * 0.38, y - ry * 0.45, rx * 0.22, ry * 0.14, -0.5, 0, TAU); g.fill();
}
const HERO_CLASSIC = true; // round-blob heroes (look book H4) stay in the code, switched off until the new art is ready
// Shield: only the round bubble from the bubble sprite (the sprite also has small trailing bubbles for projectiles), centered on the hero.
function shieldBubble(x, y, r) {
  const im = spr('fx-bubble'); if (!im || !im.naturalWidth) return false;
  const k = im.naturalWidth / 128;
  ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(im, 40 * k, 21 * k, 84 * k, 84 * k, x - r, y - r, r * 2, r * 2); ctx.restore();
  return true;
}
function drawHero(g, k, x, y, r, lx, ly, seed, t, sq, sqAng, gear) {
  const c = CHARS[k] || CHARS.pip;
  // Painted frames: crouch at take-off, land at touch-down, idle (or blink) in between; the code adds the squash, stretch and arc.
  const ph = drawHero.phase, mood = drawHero.mood || '', pose = mood ? '-' + mood : '';
  const im = (pose && spr(k + pose)) || spr(k + (blinkNow(seed) ? '-blink' : '-idle')) || spr(k + '-idle');
  if (im) {
    if (k === 'nova') { const gl = g.createRadialGradient(x, y, r * 0.4, x, y, r * 1.45); gl.addColorStop(0, 'rgba(190,170,255,0.45)'); gl.addColorStop(1, 'rgba(190,170,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 1.45, 0, TAU); g.fill(); } // Nova is dark: a soft lavender glow keeps her visible on the night maze
    drawSpr(g, im, x, y, r, lx < -0.2, pose ? sq * 0.4 : sq, sqAng); return;
  }
  if (HERO_CLASSIC) {
    furBall(g, x, y, r, 0, c.fill, c.dark, lx, ly, seed, t, sq, sqAng);
    if (gear !== false) { g.fillStyle = '#6fe08a'; g.beginPath(); g.ellipse(x + r * 0.18, y - r * 1.24, r * 0.3, r * 0.15, -0.5, 0, TAU); g.fill(); }
    return;
  }
  if (sq) { g.save(); g.translate(x, y); g.rotate(sqAng || 0); g.scale(1 + 0.11 * sq, 1 - 0.09 * sq); g.rotate(-(sqAng || 0)); x = 0; y = 0; }
  const fill = c.fill, dark = c.dark, headgear = gear !== false;
  for (const s of [-1, 1]) { const st = reduceMotion ? 0 : Math.sin(t * 8 + s) * r * 0.06; g.fillStyle = dark; g.beginPath(); g.ellipse(x + s * r * 0.45, y + r * 0.92 + st, r * 0.26, r * 0.14, 0, 0, TAU); g.fill(); }
  if (k === 'moss') {
    heroBody(g, x, y + r * 0.08, r * 1.22, r * 0.92, fill, dark);
    if (headgear) for (const [ox, rot, cc] of [[-0.42, -0.5, '#4f9a3a'], [0.42, 0.5, '#4f9a3a'], [0, 0, '#6fbf4f']]) { g.save(); g.translate(x + ox * r, y - r * 0.78); g.rotate(rot); g.fillStyle = cc; g.beginPath(); g.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, TAU); g.fill(); g.restore(); }
    heroEyes(g, x, y + r * 0.02, r, lx, ly + 0.15, seed);
    g.fillStyle = fill; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.32, y - r * 0.2, r * 0.32, r * 0.17, 0, 0, TAU); g.fill(); }
    heroBlush(g, x, y + r * 0.06, r); heroSmile(g, x, y + r * 0.04, r);
  } else if (k === 'bolt') {
    heroBody(g, x, y - r * 0.05, r * 0.92, r * 1.1, fill, dark);
    if (headgear) { g.strokeStyle = '#e6a800'; g.lineWidth = Math.max(2, r * 0.1); g.lineJoin = 'round'; g.beginPath(); g.moveTo(x, y - r * 1.1); g.lineTo(x + r * 0.18, y - r * 1.35); g.lineTo(x - r * 0.08, y - r * 1.5); g.lineTo(x + r * 0.12, y - r * 1.75); g.stroke(); g.fillStyle = '#ffcd4a'; circ(g, x + r * 0.12, y - r * 1.8, r * 0.14); g.fill(); }
    g.fillStyle = '#ffcd4a'; g.beginPath(); g.moveTo(x + r * 0.55, y - r * 0.6); g.lineTo(x + r * 0.25, y + r * 0.05); g.lineTo(x + r * 0.5, y + r * 0.05); g.lineTo(x + r * 0.25, y + r * 0.7); g.lineTo(x + r * 0.8, y - r * 0.1); g.lineTo(x + r * 0.55, y - r * 0.1); g.closePath(); g.fill();
    heroEyes(g, x, y - r * 0.15, r * 1.05, lx, ly, seed); heroBlush(g, x, y, r); heroSmile(g, x, y, r);
  } else if (k === 'ember') {
    heroBody(g, x, y + r * 0.1, r, r * 0.95, fill, dark, true);
    const fl = reduceMotion ? 0 : Math.sin(t * 9) * r * 0.08;
    g.fillStyle = '#ffcd4a'; g.beginPath(); g.moveTo(x + fl, y - r * 1.25); g.quadraticCurveTo(x + r * 0.25, y - r * 0.85, x, y - r * 0.7); g.quadraticCurveTo(x - r * 0.25, y - r * 0.85, x + fl, y - r * 1.25); g.fill();
    heroEyes(g, x, y + r * 0.05, r, lx, ly, seed); heroBlush(g, x, y + r * 0.12, r); heroSmile(g, x, y + r * 0.1, r);
  } else if (k === 'nova') {
    heroBody(g, x, y, r * 1.02, r, fill, dark);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#ffcd4a'; circ(g, x + Math.cos(i * 2.4) * r * 0.6, y + r * 0.2 + Math.sin(i * 2.4) * r * 0.45, r * 0.05); g.fill(); }
    if (headgear) { g.fillStyle = '#ffcd4a'; g.beginPath(); g.arc(x, y - r * 0.95, r * 0.32, Math.PI * 0.15, Math.PI * 1.85); g.arc(x + r * 0.12, y - r * 0.98, r * 0.26, Math.PI * 1.8, Math.PI * 0.2, true); g.closePath(); g.fill(); }
    for (let i = 0; i < 3; i++) { const a = (reduceMotion ? 0 : t * 1.5) + i * TAU / 3; heroStar(g, x + Math.cos(a) * r * 1.35, y - r * 0.2 + Math.sin(a) * r * 0.45, r * 0.13); }
    heroEyes(g, x, y, r, lx, ly, seed); heroBlush(g, x, y, r); heroSmile(g, x, y, r);
  } else {
    heroBody(g, x, y, r * 1.06, r, fill, dark);
    if (headgear) { g.strokeStyle = dark; g.lineWidth = Math.max(2, r * 0.1); g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 0.05, y - r * 0.95); g.bezierCurveTo(x - r * 0.1, y - r * 1.5, x + r * 0.45, y - r * 1.45, x + r * 0.25, y - r * 1.15); g.stroke(); }
    const sw = reduceMotion ? 0 : Math.sin(t * 6) * r * 0.08;
    g.fillStyle = '#5cbf68'; g.beginPath(); g.ellipse(x, y + r * 0.55, r * 0.92, r * 0.17, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - r * 0.65, y + r * 0.55); g.lineTo(x - r * 1.35, y + r * 0.45 + sw); g.lineTo(x - r * 1.3, y + r * 0.8 + sw); g.lineTo(x - r * 0.55, y + r * 0.72); g.closePath(); g.fill();
    heroEyes(g, x, y - r * 0.05, r, lx, ly, seed); heroBlush(g, x, y, r); heroSmile(g, x, y, r);
  }
  if (sq) g.restore();
}
function heroStar(g, x, y, s) { g.fillStyle = '#fff3a0'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? s * 0.45 : s; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } g.closePath(); g.fill(); }

// Tuft moods: sad while stuck in a bubble, happy right after being freed and when jumping into a portal.
// Painted face kit (Scenario sticker sheet, sliced into parts). Every part shares one scale: 160px = one sheet cell.
function facePart(g, name, x, y, r, k = 1, alpha = 1) {
  const im = spr(name); if (!im) return false;
  const w = im.naturalWidth / 160 * r * 1.25 * k, h = w * im.naturalHeight / im.naturalWidth;
  if (alpha !== 1) { g.save(); g.globalAlpha *= alpha; }
  g.drawImage(im, x - w / 2, y - h / 2, w, h);
  if (alpha !== 1) g.restore();
  return true;
}
function babyFace(g, x, y, r, mood, lx, ly, seed) {
  if (!spr('f-eyes')) return false;
  if (mood === 'happy') { facePart(g, 'f-happy', x, y - r * 0.04, r); facePart(g, 'f-blush', x, y + r * 0.2, r, 0.7, 0.55); facePart(g, 'm-open', x, y + r * 0.34, r, 0.7); return true; }
  if (mood === 'sad') {
    facePart(g, 'f-teary', x, y, r); facePart(g, 'm-sad', x, y + r * 0.4, r, 0.85);
    if (!reduceMotion) { const ph = ((time * 0.5 + seed * 0.3) % 1); facePart(g, 'f-tear', x - r * 0.42, y + r * 0.2 + ph * r * 0.35, r, 0.7, 1 - ph); }
    return true;
  }
  if (mood === 'dazed') { facePart(g, 'f-x', x, y, r); facePart(g, 'm-tongue', x, y + r * 0.36, r, 0.8); return true; }
  if (mood === 'wow') { facePart(g, 'f-wow', x, y, r); facePart(g, 'm-open', x, y + r * 0.36, r, 0.5); return true; }
  const blink = seed >= 0 && ((time + seed * 1.3) % 4.2) < 0.13;
  if (blink) facePart(g, 'f-blink', x, y + r * 0.02, r);
  else facePart(g, 'f-eyes', x + (lx || 0) * r * 0.09, y + (ly || 0) * r * 0.07, r);
  facePart(g, 'm-smile', x, y + r * 0.36, r, 0.85);
  return true;
}
function tuftFace(g, x, y, r, mood, lx, ly, seed, line) {
  if (babyFace(g, x, y, r, mood, lx, ly, seed)) return;
  const ink = '#151a30', soft = line || '#3a2a40'; // brows and mouths use a darker shade of the tuft's own color
  if (mood === 'happy') {
    g.strokeStyle = soft; g.lineWidth = Math.max(1.3, r * 0.1); g.lineCap = 'round';
    for (const s2 of [-1, 1]) { g.beginPath(); g.arc(x + s2 * r * 0.3, y - r * 0.02, r * 0.14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.fillStyle = soft; g.beginPath(); g.arc(x, y + r * 0.2, r * 0.17, 0, Math.PI); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,120,150,.55)'; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(x + s2 * r * 0.52, y + r * 0.18, r * 0.12, r * 0.07, 0, 0, TAU); g.fill(); }
    return;
  }
  if (mood === 'sad') {
    const er = r * 0.22;
    for (const s2 of [-1, 1]) {
      g.fillStyle = '#fff'; circ(g, x + s2 * r * 0.3, y, er); g.fill();
      g.fillStyle = ink; circ(g, x + s2 * r * 0.3, y + er * 0.3, er * 0.55); g.fill();
      g.fillStyle = '#fff'; circ(g, x + s2 * r * 0.3 - er * 0.18, y + er * 0.12, er * 0.17); g.fill();
      g.strokeStyle = soft; g.lineWidth = Math.max(1, r * 0.06); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + s2 * r * 0.18, y - r * 0.37); g.quadraticCurveTo(x + s2 * r * 0.3, y - r * 0.4, x + s2 * r * 0.42, y - r * 0.34); g.stroke(); // soft, nearly flat brows
    }
    g.beginPath(); g.arc(x, y + r * 0.42, r * 0.12, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); // little frown
    if (!reduceMotion) { const ph = ((time * 0.5 + seed * 0.3) % 1); g.globalAlpha = 1 - ph; g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(x - r * 0.42, y + r * 0.18 + ph * r * 0.35, r * 0.06, r * 0.09, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
    return;
  }
  eyes(g, x, y, r, lx, ly, seed);
}
// Tufts (look book T2): the only spiky things in the game, with a baby face, a little hop and a glint.
const TUFT_ART = ['tuftbody-green', 'tuftbody-blue', 'tuftbody-purple', 'tuftbody-pink', 'tuftbody-gold']; // each color is also a fruit shape: pea pod, blueberry, eggplant, strawberry, golden fruit
const TUFT_FACE_Y = [0.22, 0.12, 0.3, 0.16, 0.16]; // pea pod, blueberry, eggplant, strawberry, pumpkin: where each face sits
function drawTuft(g, x, y, r, c, seed, t, sq, sqAng, opts = {}) {
  const col = COLORS[c] || COLORS[0];
  if (opts.ring && !HERO_CLASSIC) { g.save(); g.globalAlpha = 0.35; g.strokeStyle = col.fill; g.lineWidth = Math.max(1.5, r * 0.14); circ(g, x, y + r * 0.1, r * 1.3); g.stroke(); g.restore(); }
  const hop = opts.hop && !HERO_CLASSIC && !reduceMotion ? -Math.abs(Math.sin(t * 6 + seed)) * r * 0.16 : 0;
  y += hop;
  // Painted eyeless body + eyes drawn in code, so tufts keep looking where the trail is heading.
  const body = spr('tuftbody-' + ['green', 'blue', 'purple', 'pink', 'gold'][c]);
  if (body) {
    drawSpr(g, body, x, y, r, false, sq, sqAng, null, 2.45);
    if (sq) { g.save(); g.translate(x, y); g.rotate(sqAng || 0); g.scale(1 + 0.11 * sq, 1 - 0.09 * sq); g.rotate(-(sqAng || 0)); tuftFace(g, 0, r * TUFT_FACE_Y[c], r, opts.mood, opts.lx || 0, opts.ly != null ? opts.ly : 0.2, seed, col.dark); g.restore(); }
    else tuftFace(g, x, y + r * TUFT_FACE_Y[c], r, opts.mood, opts.lx || 0, opts.ly != null ? opts.ly : 0.2, seed, col.dark);
    return;
  }
  if (HERO_CLASSIC) {
    if (!opts.mood) { furBall(g, x, y, r, 0, col.fill, col.dark, opts.lx || 0, opts.ly != null ? opts.ly : 0.2, seed, t, sq, sqAng); return; }
    furBall.noEyes = true; furBall(g, x, y, r, 0, col.fill, col.dark, 0, 0, seed, t, sq, sqAng); furBall.noEyes = false;
    tuftFace(g, x, y, r, opts.mood, 0, 0, seed, col.dark); return;
  }
  if (sq) { g.save(); g.translate(x, y); g.rotate(sqAng || 0); g.scale(1 + 0.11 * sq, 1 - 0.09 * sq); g.rotate(-(sqAng || 0)); x = 0; y = 0; }
  const n = 13; g.beginPath();
  for (let i = 0; i <= n * 2; i++) { const a = i * Math.PI / n, q = i % 2 ? r * 0.86 : r * (1.12 + 0.05 * Math.sin(t * 3 + i + seed)); i ? g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : g.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  g.closePath(); g.lineJoin = 'round'; g.fillStyle = col.fill; g.fill(); g.strokeStyle = col.dark; g.lineWidth = Math.max(1, r * 0.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.22)'; circ(g, x - r * 0.35, y - r * 0.45, r * 0.22); g.fill();
  const bl = seed >= 0 && ((t + seed * 1.3) % 4.2) < 0.12;
  for (const s of [-1, 1]) {
    if (bl) { g.strokeStyle = '#151a30'; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.moveTo(x + s * r * 0.28 - r * 0.1, y - r * 0.04); g.lineTo(x + s * r * 0.28 + r * 0.1, y - r * 0.04); g.stroke(); }
    else { g.fillStyle = '#151a30'; circ(g, x + s * r * 0.28, y - r * 0.05, r * 0.13); g.fill(); g.fillStyle = '#fff'; circ(g, x + s * r * 0.28 - r * 0.04, y - r * 0.1, r * 0.045); g.fill(); }
  }
  g.strokeStyle = '#151a30'; g.lineWidth = Math.max(1, r * 0.08); circ(g, x, y + r * 0.25, r * 0.08); g.stroke();
  if (opts.glint && !reduceMotion && ((t * 0.5 + seed * 0.37) % 2) < 0.15) { g.fillStyle = '#fff'; g.beginPath(); const sx = x + r * 0.6, sy = y - r * 0.7, s2 = r * 0.25; g.moveTo(sx, sy - s2); g.lineTo(sx + s2 * 0.25, sy); g.lineTo(sx, sy + s2); g.lineTo(sx - s2 * 0.25, sy); g.closePath(); g.fill(); }
  if (sq) g.restore();
}

const sprCache = {};
function tuftSpr(fill, dark) {
  const key = 't' + fill + dark;
  if (sprCache[key]) return sprCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d');
  furBall(g, 48, 48, 36, 0, fill, dark, 0.3, 0.2, -1, 0);
  return sprCache[key] = c;
}
function coldFace(g, x, y, r, seed, night) {
  const ink = '#1b1530', sh = reduceMotion ? 0 : Math.sin(time * 38 + seed) * r * 0.03; // shiver
  x += sh;
  const er = r * 0.21;
  for (const s of [-1, 1]) {
    g.fillStyle = night ? '#2a0d12' : '#fff'; circ(g, x + s * r * 0.3, y, er); g.fill();
    g.fillStyle = night ? '#ff4d4d' : ink; circ(g, x + s * r * 0.3, y - er * 0.25, er * 0.32); g.fill(); // tiny pupils looking up
    g.strokeStyle = ink; g.lineWidth = r * 0.08; g.lineCap = 'round'; // worried brows: inner ends up
    g.beginPath(); g.moveTo(x + s * r * 0.48, y - r * 0.26); g.lineTo(x + s * r * 0.16, y - r * 0.38); g.stroke();
  }
  // chattering teeth: a white grin with a zigzag line between the rows, rimmed in icy blue
  const mw = r * 0.48, mh = r * 0.22, my = y + r * 0.3;
  g.fillStyle = '#ffffff'; g.strokeStyle = '#5a8fd0'; g.lineWidth = Math.max(1, r * 0.06);
  g.beginPath(); g.roundRect(x - mw / 2, my, mw, mh, r * 0.08); g.fill(); g.stroke();
  const chat = reduceMotion ? 0 : (Math.floor(time * 14) % 2) * r * 0.025;
  g.strokeStyle = '#8a96b8'; g.lineWidth = Math.max(1, r * 0.035); g.beginPath();
  for (let k = 0; k <= 6; k++) g.lineTo(x - mw / 2 + r * 0.03 + k * (mw - r * 0.06) / 6, my + mh / 2 + (k % 2 ? -1 : 1) * (mh * 0.22 + chat));
  g.stroke();
}
function crownPath(g, x, y, w, col, gem) {
  g.fillStyle = col; g.strokeStyle = shade(col, -0.6); g.lineWidth = Math.max(1, w * 0.06); g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - w * 0.45); g.lineTo(x - w / 4, y - w * 0.2); g.lineTo(x, y - w * 0.55); g.lineTo(x + w / 4, y - w * 0.2); g.lineTo(x + w / 2, y - w * 0.45); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = gem; circ(g, x, y - w * 0.15, w * 0.08); g.fill();
}
const BOSS_ORDER = ['king', 'queen', 'twins', 'broc', 'potato'];
const DEN_FLY = 0.8;
// D2: sleepers lie in the burrow, each with a pie clock that fills back up until it wakes.
function drawDenGrumble(e) {
  const sleepers = enemies.filter(d => d.denT > 0);
  const k = sleepers.indexOf(e), n = sleepers.length;
  const spread = Math.min(cell * 0.34, cell * 0.72 / Math.max(1, n - 1));
  const cx = (run.den.x + .5) * cell + (k - (n - 1) / 2) * spread, cy = (run.den.y + .5) * cell + cell * 0.06;
  const r = cell * 0.2;
  const fk = e.flyStart != null && !reduceMotion ? (time - e.flyStart) / DEN_FLY : 1;
  if (fk < 1) { // tumbling flight from where it was bumped to the den
    const sx = (e.flyFrom.x + .5) * cell, sy = (e.flyFrom.y + .5) * cell, ease = 1 - Math.pow(1 - fk, 2);
    const fx = sx + (cx - sx) * ease, fy = sy + (cy - sy) * ease - Math.sin(fk * Math.PI) * cell * 1.6, fr = cell * (0.34 - 0.14 * fk);
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(fk * Math.PI * 4);
    if (PEST[e.type] || e.type === 'minigrape') foodPic(ctx, e.type, 0, 0, fr, true);
    ctx.restore();
    for (let j = 0; j < 3; j++) { const a = time * 9 + j * 2.1; disc(fx + Math.cos(a) * fr * 1.3, fy - fr * 1.1 + Math.sin(a) * fr * 0.35, Math.max(1.5, fr * 0.14), '#ffcd4a'); }
    return;
  }
  if (PEST[e.type] || e.type === 'minigrape') foodPic(ctx, e.type, cx, cy, r, true);
  const f = 1 - Math.max(0, e.denT) / (run.boss ? 10 : 12);
  const pr = Math.max(4.5, Math.min(cell * 0.12, n > 1 ? spread * 0.42 : cell)), px2 = cx, py2 = cy - r * 1.3 - pr;
  ctx.fillStyle = '#1b1530'; circ(ctx, px2, py2, pr + 2); ctx.fill();
  ctx.fillStyle = '#3a4270'; circ(ctx, px2, py2, pr); ctx.fill();
  ctx.fillStyle = f > 0.8 ? '#ff9f43' : '#ffcd4a'; ctx.beginPath(); ctx.moveTo(px2, py2); ctx.arc(px2, py2, pr, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.closePath(); ctx.fill();
}
function drawDen() {
  if (!run.den || !['play', 'pause', 'cards', 'clear', 'camp', 'bossintro', 'over', 'advresult', 'tutdone'].includes(mode)) return;
  const x = (run.den.x + .5) * cell, y = (run.den.y + .5) * cell;
  const pingFor = run.kind === 'tutorial' ? 7 : 1.6, since = run.denPing != null ? time - run.denPing : 99;
  if (since < pingFor) {
    const ph = (since * 1.4) % 1;
    strokeRing(x, y, cell * (0.5 + ph * 0.6), '#ffcd4a', Math.max(2, cell * 0.06), (1 - ph) * 0.9);
    if (run.kind === 'tutorial') { // bouncing arrow pointing at the den
      const ay = y - cell * (1.05 + 0.12 * Math.sin(time * 5));
      ctx.fillStyle = '#ffcd4a'; ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x, ay + cell * 0.32); ctx.lineTo(x - cell * 0.22, ay); ctx.lineTo(x - cell * 0.08, ay); ctx.lineTo(x - cell * 0.08, ay - cell * 0.25); ctx.lineTo(x + cell * 0.08, ay - cell * 0.25); ctx.lineTo(x + cell * 0.08, ay); ctx.lineTo(x + cell * 0.22, ay); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
  }
  if (!obj('ob-den', x, y + cell * 0.04, cell * 1.05)) {
    ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.ellipse(x, y + cell * 0.06, cell * 0.46, cell * 0.36, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x, y + cell * 0.08, cell * 0.36, cell * 0.26, 0, 0, TAU); ctx.fill();
  }
  if (enemies.some(d => d.denT > 0) && !reduceMotion) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const ph = (time * 0.6 + k / 3) % 1;
      ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = '#e6ebff';
      ctx.font = `600 ${Math.round(cell * 0.25 * (0.7 + ph * 0.5))}px ${displayFont || 'sans-serif'}`;
      ctx.fillText('z', x - cell * 0.3 + ph * cell * 0.3, y - cell * 0.3 - ph * cell * 0.5);
    }
    ctx.globalAlpha = 1;
  }
  for (const e of enemies) if (e.denT > 0) drawDenGrumble(e);
}
/* ---------- Food pests (look book round 6): each type is a fruit or vegetable with one job and one visible tell ---------- */


function foodPic(g, type, x, y, r, sleep) {
  if (drawPest(g, type, x, y, r, sleep ? 'sleep' : '')) return;
  pestStub(g, x, y, r);
}
/* Pests and weather (Scenario bodies) wear faces from the enemy face kit, so every mood is one body + parts. */
const PEST = {
  wander:   { body: 'pest-aphid', fk: 1.4,   fy: 0.1,  fs: 1.15, fw: 1.55, ffy: 0.14 }, hunter: { body: 'pest-beetle', fy: 0.05, fs: 1.15, fw: 1.35, ffy: 0.12 },
  shooter:  { body: 'pest-cloud', fk: 1.35,   fy: 0.0,  fs: 1.2, fw: 1.2, ffy: 0.0 },  mushroom: { body: 'pest-hopper', fy: -0.05, fs: 1.1, fw: 1.05, ffy: -0.12 },
  grape:    { body: 'pest-anthill', fk: 1.3, fy: 0.2,  fs: 1.1, fw: 1.15, ffy: 0.22 },  sniper: { body: 'pest-hail', fk: 1.35,   fy: 0.0,  fs: 1.2, fw: 1.2, ffy: 0.02 },
  night:    { body: 'pest-moth',    fy: 0.1,  fs: 1.05 }, minigrape: { body: 'pest-ant', fy: -0.12, fs: 1.15 },
  king:     { body: 'pest-rhino',   fx: 0.15, fy: 0.05, fs: 0.66, fw: 1.05, ffy: 0.06 },  queen: { body: 'pest-storm', fk: 1.3,  fy: 0.08, fs: 1.15 },
  sun:      { body: 'pest-sun', fk: 1.25,     fy: 0.06, fs: 1.1 },  frost: { body: 'pest-frost', fk: 1.25,  fy: 0.08, fs: 1.1 },
  broc:     { body: 'pest-bramble', fy: 0.02, fs: 0.85 }, potato: { body: 'pest-mole',  fy: -0.02, fs: 0.95, eyesUp: 0.32 },
};
const FACE_MAP = {"pest-ant":[0.5,0.31,0.38],"pest-anthill":[0.497,0.525,0.465],"pest-aphid":[0.496,0.516,0.443],"pest-beetle":[0.49,0.487,0.459],"pest-bramble":[0.494,0.5,0.32],"pest-cloud":[0.496,0.425,0.468],"pest-frost":[0.497,0.53,0.458],"pest-hail":[0.497,0.457,0.468],"pest-hopper":[0.5,0.36,0.33],"pest-mole":[0.5,0.49,0.44],"pest-moth":[0.497,0.589,0.332],"pest-rhino":[0.577,0.55,0.316],"pest-storm":[0.498,0.528,0.468],"pest-sun":[0.497,0.535,0.468]}; // measured from each body by art/facemap.py: face center x, y and width, 0..1 of the sprite
const PF_MOOD = { '': 'grump', dizzy: 'dizzy', cold: 'cold', sleep: 'sleep', chasing: 'angry', firing: 'angry', lobbing: 'angry', tell: 'angry', sulking: 'sulk', vanishing: 'sulk', glowing: 'grump' };
const ICY = new Map();
function icySpr(im) { // frozen look: the sprite itself turns icy blue, no bubble
  let c = ICY.get(im); if (c) return c;
  c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(140,205,255,0.55)'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, c.width, c.height);
  c.naturalWidth = c.width; c.naturalHeight = c.height; ICY.set(im, c); return c;
}
function drawPest(g, key, x, y, r, mood, flip, alpha) {
  const P = PEST[key], body = P && spr(P.body);
  if (!body) return false;
  drawSpr(g, mood === 'cold' ? icySpr(body) : body, x, y, r * 0.95, flip, 0, 0, alpha);
  const fkey = P.body.slice(5), own = spr('pf-' + fkey + '-' + (PF_MOOD[mood] || 'grump'));
  if (own && own.naturalWidth) { // a face set painted for this exact body (one group per mood), centered on its face spot
    const S = r * 0.95 * 2.9, fm = FACE_MAP[P.body] || [0.5, 0.5, 0.45]; // same box drawSpr uses for the body
    const fw = S * fm[2] * (P.fk || 1.15), fx = x + (flip ? -1 : 1) * (fm[0] - 0.5) * S, fy = y + (fm[1] - 0.5) * S;
    if (alpha != null) { g.save(); g.globalAlpha = alpha; }
    g.drawImage(own, fx - fw / 2, fy - fw / 2, fw, fw);
    if (alpha != null) g.restore();
    return true;
  }
  return true;
}
function pestStub(g, x, y, r) { g.fillStyle = 'rgba(139,144,181,.55)'; g.beginPath(); g.arc(x, y, r * 0.8, 0, TAU); g.fill(); }
function drawFood(e, cx, cy, r, d) {
  const cold = isFrozen(e) || e.frz > 0, dizzy = e.stun > 0 && !cold;
  const mood = dizzy ? 'dizzy' : e.type === 'hunter' ? (e.chaseT > 0 ? 'chasing' : e.sulkT > 0 ? 'sulking' : '') : e.type === 'shooter' && (e.aim > 0 || e.burstN > 0) ? 'firing'
    : e.type === 'mushroom' && e.tpT > 0 ? 'vanishing' : e.type === 'sniper' && e.aim > 0 ? 'lobbing' : e.type === 'night' && dist(epos(e), ppos()) < 4 ? 'glowing' : '';
  if (drawPest(ctx, e.type, cx, cy, r, cold ? 'cold' : mood, d[0] < 0, e.type === 'mushroom' && e.tpT > 0 ? 0.45 + 0.55 * e.tpT : e.wake > 0 ? 0.55 : null)) { if (mood === 'sulking') { ctx.fillStyle = '#d0d4e6'; ctx.font = `700 ${Math.round(r * 0.5)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText('…', cx + r * 0.5, cy - r * 0.6); } return; }
  pestStub(ctx, cx, cy, e.type === 'minigrape' ? r * 0.6 : r);
  if (cold) iceTint(cx, cy, r);
}

function drawBoss(e, cx, cy, r, d) {
  const cold = isFrozen(e), dizzy = e.stun > 0 || e.popT > 0;
  if (e.under) { // dirt mound travelling toward you
    ctx.fillStyle = '#5a4630'; ctx.strokeStyle = '#e8d2a8'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.5, r * 0.75, r * 0.32, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = time * 6 + k * 1.6; disc(cx + Math.cos(a) * r * 0.6, cy + r * 0.35 - Math.abs(Math.sin(a)) * r * 0.3, r * 0.09, '#d9b98a'); }
    crownPath(ctx, cx, cy + r * 0.2, r * 0.4, '#ffcd4a', '#ff6f61'); return;
  }
  const mood = dizzy ? 'dizzy' : (e.tele > 0 || (e.variant === 'king' && e.dash > 0)) ? 'tell' : '';
  const pk = e.variant === 'twins' ? (e.weak === 'freeze' ? 'sun' : 'frost') : e.variant;
  if (drawPest(ctx, pk, cx, cy, r * 1.05, cold ? 'cold' : mood, d[0] < 0)) { drawBossPips(e, cx, cy, r); return; }
  pestStub(ctx, cx, cy, r);
  if (cold) iceTint(cx, cy, r);
  drawBossPips(e, cx, cy, r);
}
function drawBossPips(e, cx, cy, r) {
  // bonk pips: how many more bonks this boss can take
  const n = e.bonkMax || 3, w = r * 0.32;
  ctx.fillStyle = 'rgba(27,21,48,.85)'; rr(ctx, cx - (n * w * 1.25) / 2 - w * 0.2, cy - r * 1.35 - w * 0.65, n * w * 1.25 + w * 0.4, w * 1.3, w * 0.65); ctx.fill();
  for (let k = 0; k < n; k++) { const px = cx + (k - (n - 1) / 2) * w * 1.25, py = cy - r * 1.35, left = k < n - (e.bonks || 0); disc(px, py, w * 0.5, '#1b1530'); if (left) { disc(px, py, w * 0.42, '#ffffff'); disc(px, py, w * 0.32, '#ff6f61'); } else strokeRing(px, py, w * 0.3, '#8b90b5', Math.max(1, w * 0.1), 0.9); }
}
// A round sign over a pest: dark disc, white rim, white glyph. Reads the same in greyscale and for colorblind players.
function badge(x, y, r, glyph) {
  disc(x, y, r + Math.max(1.5, r * 0.18), '#ffffff'); disc(x, y, r, '#1b1530');
  if (glyph === 'dizzy') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k <= 22; k++) { const a = k * 0.55 + (reduceMotion ? 0 : time * 5), rad = r * 0.7 * k / 22; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } ctx.stroke(); return; }
  if (glyph === 'flake') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, dx = Math.cos(a) * r * 0.62, dy = Math.sin(a) * r * 0.62; ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke(); } return; }
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.round(r * 1.45)}px ${displayFont || 'sans-serif'}`; ctx.fillText(glyph, x, y + r * 0.06);
}
function drawGrumble(e) {
  if (e.denT > 0) { drawDenGrumble(e); return; }
  const p = epos(e), cx = (p.x + .5) * cell, cy0 = (p.y + .5) * cell;
  const boss = e.type === 'boss';
  const r = cell * (boss ? (e.variant === 'twins' ? 0.56 : 0.62) : 0.38);
  const still = isFrozen(e) || e.stun > 0 || e.frz > 0;
  const bob = still ? 0 : -Math.abs(Math.sin(time * 2.2 + e.x * 1.7)) * r * 0.12;
  const cy = cy0 - r * 0.1 + bob;
  const aimD = e.aim > 0 && e.aimDir ? e.aimDir : null;
  const d = aimD || ((e.dir[0] || e.dir[1]) ? e.dir : [0, 1]);
  ctx.fillStyle = 'rgba(4,7,18,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy0 + r * 0.95, r * 0.6, r * 0.18, 0, 0, TAU); ctx.fill();
  if (e.type === 'night') disc(cx, cy, r * 1.8, '#ff4d4d', 0.12 + 0.08 * Math.sin(time * 4));
  if (e.type === 'mushroom' && e.tpT > 0 && e.tp) { const tx = (e.tp.x + .5) * cell, ty = (e.tp.y + .5) * cell, k = 1 - e.tpT; strokeRing(tx, ty, cell * (0.45 - 0.15 * k), '#b07aff', 3, reduceMotion ? 0.9 : 0.6 + 0.4 * Math.sin(time * 18)); disc(tx, ty, cell * 0.3 * k, '#b07aff', 0.25); }
  if (e.type === 'hunter' && e.chaseT > 0) disc(cx, cy, r * 1.35, '#ff6f61', 0.18);
  if (e.tele > 0 || e.dash > 0) disc(cx, cy, r * 1.45, '#ff6f61', e.tele > 0 ? 0.3 + (reduceMotion ? 0.15 : 0.25 * Math.sin(time * 18)) : 0.25);
  if (e.aim > 0) disc(cx, cy, r * 1.45, '#ffd6f0', 0.25 + (reduceMotion ? 0.12 : 0.2 * Math.sin(time * 18)));
  // about to wake: the last 0.8 s of a freeze or a daze flash a black-and-white ring, readable without color
  const wakeIn = Math.min(isFrozen(e) ? freezeT : 9, e.frz > 0 ? e.frz : 9, e.stun > 0 && !e.hold ? e.stun : 9, e.popT > 0 ? e.popT : 9);
  if (wakeIn < 0.8 && !(e.denT > 0) && mode !== 'pause') { const on = reduceMotion ? 1 : Math.floor(time * 6) % 2; strokeRing(cx, cy, r * 1.3, on ? '#ffffff' : '#1b1530', Math.max(3, r * 0.16), 0.95); }
  if (boss) drawBoss(e, cx, cy, r, d);
  else drawFood(e, cx, cy, e.type === 'minigrape' ? r * 0.6 : r, d);
  if (isFrozen(e) || e.frz > 0) badge(cx + r * 0.85, cy - r * 0.95, r * (boss ? 0.3 : 0.36), 'flake');
  else if ((e.stun > 0 || e.popT > 0) && !boss) badge(cx + r * 0.85, cy - r * 0.95, r * 0.36, 'dizzy');
  else if (e.type === 'hunter' && e.chaseT > 0 && !(e.stun > 0)) badge(cx + r * 0.85, cy - r * 0.95, r * 0.36, '!');
  if (e.maxHp > 1) { // H2: pill bar under the pest, green → yellow → red
    const w = Math.max(cell * 0.62, r * 1.7), h = Math.max(5, cell * 0.12), x0 = cx - w / 2, y0 = cy0 + r * 1.08;
    ctx.fillStyle = '#1b1530'; rr(ctx, x0 - 2, y0 - 2, w + 4, h + 4, (h + 4) / 2); ctx.fill();
    const f = Math.max(0, e.hp) / e.maxHp;
    if (f > 0) { ctx.fillStyle = f > 0.6 ? '#7be08a' : f > 0.34 ? '#ffcd4a' : '#ff6f61'; rr(ctx, x0, y0, Math.max(h, w * f), h, h / 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(27,21,48,.85)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < e.maxHp; k++) { ctx.beginPath(); ctx.moveTo(x0 + w * k / e.maxHp, y0); ctx.lineTo(x0 + w * k / e.maxHp, y0 + h); ctx.stroke(); }
  }
  if (e.stun > 0) { if (!fxPic(ctx, 'fx-stars', cx, cy - r * 1.05, r * 1.5, time * 3)) for (let k = 0; k < 3; k++) { const a = time * 5 + k * 2.1; disc(cx + Math.cos(a) * r * 0.9, cy - r * 0.9 + Math.sin(a) * r * 0.25, Math.max(2, r * 0.12), '#ffcd4a'); } }
}
// Frozen status: the pest itself turns icy (blue tint, frost on top, icicles hanging under it) instead of sitting in a bubble.
function iceTint(cx, cy, r) {
  ctx.save();
  circ(ctx, cx, cy, r * 0.96); ctx.clip();
  ctx.fillStyle = 'rgba(191,232,255,.36)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy - r * 0.2); ctx.lineTo(cx - r * 0.35, cy - r * 0.75); ctx.lineTo(cx - r * 0.2, cy - r * 0.55); ctx.lineTo(cx - r * 0.55, cy - r * 0.05); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawBanners(fs) {
  for (const b of banners.slice(0, 1)) {
    const k = b.t, ease = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2); // ease-out-back
    const sc = reduceMotion ? 1 : k < 0.35 ? Math.max(0.01, ease(k / 0.35)) : 1;
    const out = Math.max(0, (k - (b.dur - 0.35)) / 0.35);
    const fsz = Math.round(fs * 1.25);
    ctx.font = `700 ${fsz}px ${displayFont}`;
    const iw = b.icon && artIcon(b.icon) ? fsz * 1.3 : 0, tw = ctx.measureText(b.text).width, w = tw + iw + fsz * 1.4, h = fsz * 2;
    const cx = viewW / 2, cy = viewH * 0.2 - out * 30;
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(cx, cy); ctx.scale(sc, sc);
    if (!reduceMotion && k < 0.9) for (let i = 0; i < 12; i++) { // sparkle burst
      const a = i / 12 * TAU, r = w * 0.35 + k * w * 0.45;
      ctx.globalAlpha = (1 - out) * Math.max(0, 1 - k / 0.9); ctx.fillStyle = i % 2 ? '#fff1a8' : b.color;
      circ(ctx, Math.cos(a) * r, Math.sin(a) * r * 0.55, fsz * 0.12); ctx.fill();
    }
    ctx.globalAlpha = 1 - out;
    ctx.fillStyle = 'rgba(40,24,10,.35)'; rr(ctx, -w / 2, -h / 2 + 5, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#fff7e8'; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    ctx.lineWidth = Math.max(3, fsz * 0.16); ctx.strokeStyle = b.color; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.stroke();
    if (iw) { const im = spr('ic-' + b.icon); if (im && im.naturalWidth) ctx.drawImage(im, -w / 2 + fsz * 0.55, -fsz * 0.65, fsz * 1.3, fsz * 1.3); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#4a3426';
    ctx.fillText(b.text, iw / 2 + 2, 1);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function obj(name, cx, cy, w, alpha, rot) { // painted in-game object, centered, w = drawn width
  const im = spr(name); if (!im || !im.naturalWidth) return false;
  const h = w * im.naturalHeight / im.naturalWidth;
  if (alpha != null || rot) { ctx.save(); if (alpha != null) ctx.globalAlpha *= alpha; if (rot) { ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy); } }
  ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  if (alpha != null || rot) ctx.restore();
  return true;
}
function drawPortal(p) {
  if (p.golden && !p.active) { ctx.globalAlpha = 0.45; drawPortalInner(p); ctx.globalAlpha = 1; return; }
  drawPortalInner(p);
}
function drawPortalInner(p) {
  const cx = (p.x + .5) * cell, cy = (p.y + .5) * cell;
  const cols = p.rainbow ? COLORS.slice(0, 4).map(c => c.fill) : p.golden ? ['#ffcd4a'] : p.cs.map(c => COLORS[c].fill);
  const hasWreath = !p.golden && spr('ob-wreath'), spin = reduceMotion ? 0 : time * (p.rainbow ? 0.6 : 0.35);
  const seg = TAU / Math.max(1, cols.length);
  if (hasWreath) { // leafy wreath with light welling up from the middle in the portal's color(s)
    const tt = reduceMotion ? 0 : time;
    cols.forEach((col, i) => {
      const ph = tt * 2.4 + i * TAU / cols.length, R = cell * (0.4 + 0.05 * Math.sin(ph)), ox = cols.length > 1 ? Math.cos(tt * 0.9 + i * seg) * cell * 0.06 : 0, oy = cols.length > 1 ? Math.sin(tt * 0.9 + i * seg) * cell * 0.06 : 0;
      const gl = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, R);
      gl.addColorStop(0, '#ffffffee'); gl.addColorStop(0.25, col + 'dd'); gl.addColorStop(0.6, col + '55'); gl.addColorStop(1, col + '00');
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = cols.length > 1 ? 0.7 : 0.85; ctx.fillStyle = gl; circ(ctx, cx + ox, cy + oy, R); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!reduceMotion) for (let k = 0; k < 4; k++) { // motes drifting up out of the light
      const ph = (time * 0.5 + k / 4 + (p.x * 0.13)) % 1, a = k * 2.1 + p.y;
      disc(cx + Math.cos(a) * cell * 0.12 * (1 - ph), cy - ph * cell * 0.42, cell * 0.035 * (1 - ph * 0.5), '#ffffff', Math.sin(ph * Math.PI) * 0.9);
    }
    obj('ob-wreath', cx, cy, cell * 1.04);
  } else {
    ctx.fillStyle = p.rainbow ? 'rgba(255,255,255,0.14)' : cols[0] + '30';
    circ(ctx, cx, cy, cell * .45); ctx.fill();
    ctx.lineWidth = cell * .08; ctx.lineCap = 'butt';
    if (cols.length === 1) { ctx.strokeStyle = cols[0]; ctx.beginPath(); ctx.arc(cx, cy, cell * .37, spin, spin + TAU * 0.78); ctx.stroke(); }
    else cols.forEach((col, i) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(cx, cy, cell * .37, spin + i * seg + 0.08, spin + (i + 1) * seg - 0.08); ctx.stroke(); });
  }
  const waiting = followers.some(f => p.cs && p.cs.includes(f.c));
  const pr = cell * (.14 + (waiting && !reduceMotion ? .03 * (1 + Math.sin(time * 4)) : 0));
  if (p.rainbow) {
    cols.forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, pr, -spin + i * seg, -spin + (i + 1) * seg); ctx.fill(); });
    if (p.timer < 3 && Math.floor(time * 4) % 2) strokeRing(cx, cy, cell * .47, '#ffffff', 2);
  } else if (p.golden) {
    if (!obj('ob-gate', cx, cy, cell * 0.9, p.active ? 1 : 0.6)) crownPath(ctx, cx, cy + cell * 0.1, cell * 0.36, p.active ? '#ffcd4a' : '#6b7299', p.active ? '#ff6f61' : '#4a4f70');
  } else {
    const ims = p.cs.map(c => spr(TUFT_ART[c]));
    if (ims.every(Boolean)) {
      const n = ims.length, sz = cell * (n > 1 ? 0.4 : 0.52) * (pr / (cell * 0.14));
      disc(cx, cy, cell * (n > 1 ? 0.3 : 0.26), '#1b1530', 0.55);
      ims.forEach((im, i) => { const ox = n > 1 ? (i ? 1 : -1) * cell * 0.15 : 0; ctx.drawImage(im, cx + ox - sz / 2, cy - sz / 2, sz, sz); });
    } else cols.forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, pr, Math.PI / 2 + i * seg, Math.PI / 2 + (i + 1) * seg); ctx.fill(); });
  }
  if (!p.rainbow && !p.golden && meta.cos && meta.cos.portal !== 'none') drawPortalFx(ctx, cx, cy, cell, meta.cos.portal, reduceMotion ? 0 : time, p.x + p.y);
  if (run && run.boss && !p.rainbow && !p.golden) {
    if (p.covered) disc(cx + cell * 0.3, cy - cell * 0.3, cell * 0.08, '#fff1a8');
    else strokeRing(cx, cy, cell * 0.47, '#fff1a8', 2, 0.3 + 0.3 * Math.sin(time * 3));
  }
}
function drawFlake(cx, cy, r) {
  const rot = reduceMotion ? 0 : time * 0.25;
  ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = Math.max(1.5, r * 0.17); ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = rot + k * Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
    for (const d of [-1, 1]) {
      const ex = cx + Math.cos(a) * r * 0.62 * d, ey = cy + Math.sin(a) * r * 0.62 * d, base = a + (d < 0 ? Math.PI : 0);
      for (const tw of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(base + tw * 0.9) * r * 0.3, ey + Math.sin(base + tw * 0.9) * r * 0.3); ctx.stroke(); }
    }
  }
}
const SEED_PATH = new Path2D('M12 2c5 4 7 8 7 11a7 7 0 0 1-14 0c0-3 2-7 7-11z');
function drawSeed(cx, cy, r) {
  const k = r * 2 / 20;
  ctx.save(); ctx.translate(cx - 12 * k, cy - 12.5 * k); ctx.scale(k, k);
  ctx.fillStyle = '#ffcd4a'; ctx.fill(SEED_PATH);
  ctx.restore();
}
let displayFont = '';
function snapCam() { camTarget(); cam.x = camT.x; cam.y = camT.y; }
const camT = { x: 0, y: 0 };
function camTarget() {
  const pp = player ? ppos() : START;
  const mapW = COLS * cell, mapH = ROWS * cell;
  camT.x = Math.max(0, Math.min(mapW - viewW, (pp.x + .5) * cell - viewW / 2));
  camT.y = Math.max(0, Math.min(mapH - viewH, (pp.y + .5) * cell - viewH / 2));
}
function drawEdgeMarkers() {
  const marks = [];
  for (const b of bubbles) if (b.gold) marks.push({ x: (b.x + .5) * cell, y: (b.y + .5) * cell, color: '#fff1a8', r: 9 });
  for (const p of portals) if (!p.rainbow || p.active) marks.push({ x: (p.x + .5) * cell, y: (p.y + .5) * cell, color: p.rainbow ? '#ffffff' : p.golden ? '#ffcd4a' : COLORS[p.cs[0]].fill, r: 8 });
  const pp = ppos();
  for (const e of enemies) {
    if (e.denT > 0) continue;
    const ep = epos(e);
    if (dist(ep, pp) < 9) marks.push({ x: (ep.x + .5) * cell, y: (ep.y + .5) * cell, color: '#ff6f61', r: 6 });
  }
  const pad = 12;
  for (const mk of marks) {
    const sx = mk.x - cam.x, sy = mk.y - cam.y;
    if (sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH) continue;
    const cx = Math.max(pad, Math.min(viewW - pad, sx)), cy = Math.max(pad, Math.min(viewH - pad, sy));
    const ang = Math.atan2(sy - cy, sx - cx);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = mk.color; ctx.strokeStyle = '#0d1122'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(mk.r, 0); ctx.lineTo(-mk.r * 0.7, -mk.r * 0.8); ctx.lineTo(-mk.r * 0.7, mk.r * 0.8); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  }
}
