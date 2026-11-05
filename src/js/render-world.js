const TAU = Math.PI * 2;
const HEDGE = [ // outer, mid, top, leaf dots: green, teal, plum, amber groves
  ['#2a6b47', '#3c8a5e', '#4fa874', '#86dba2'],
  ['#25616e', '#35808f', '#4a9fae', '#8ad3df'],
  ['#4f3d72', '#69548f', '#8470ad', '#bda8e3'],
  ['#6e5226', '#8f6d36', '#ad8a4c', '#e3c284'],
]
const FLOOR = ['#1a223f', '#1d2645'];
// Grove looks (look book W1-W6): each grove has its own hedge material, floor and ambient props. Painted textures replace them when present.
const THEMES = [
  { k: 'w1', hedge: ['#2a6b47', '#3c8a5e', '#4fa874'], floor: '#1d2a3f', dot: '#86dba2', deco: 'flowers' },
  { k: 'w2', hedge: ['#5a3a1a', '#8a5a2a', '#c08a4a'], floor: '#2a2230', dot: '#e3c284', deco: 'wicker' },
  { k: 'w3', hedge: ['#164a4a', '#1e6a6a', '#3fa8a0'], floor: '#14303a', dot: '#8ad3df', deco: 'reeds' },
  { k: 'w4', hedge: ['#4a7aa8', '#7ab0d8', '#d6ecff'], floor: '#1a2648', dot: '#ffffff', deco: 'ice' },
  { k: 'w5', hedge: ['#3a2a5a', '#5a3a8a', '#9a6ad0'], floor: '#1a1530', dot: '#e8d0ff', deco: 'spores' },
  { k: 'w6', hedge: ['#2a6a6a', '#5aa0a0', '#bfeee8'], floor: '#1d2a2a', dot: '#ffcd4a', deco: 'glass' },
];
const theme = () => THEMES[((run ? (run.adv ? run.adv.g : grove()) : 1) - 1 + THEMES.length * 99) % THEMES.length];
function drawAmbient() {
  const th = theme(), W = COLS * cell, H = ROWS * cell, tm = reduceMotion ? 0 : time;
  if (reduceMotion) return;
  for (let k = 0; k < 7; k++) {
    const sx = ((k * 0.137 + 0.07) % 1) * W, sy = ((k * 0.291 + 0.13) % 1) * H;
    if (th.deco === 'flowers') { const x = sx + Math.sin(tm * 0.6 + k) * cell * 1.5, y = sy + Math.cos(tm * 0.8 + k * 2) * cell, f = Math.abs(Math.sin(tm * 9 + k)); ctx.fillStyle = k % 2 ? '#ffb3cf' : '#fff1a8'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(x - cell * 0.08 * f, y, cell * (0.06 + 0.06 * f), cell * 0.07, 0, 0, TAU); ctx.ellipse(x + cell * 0.08 * f, y, cell * (0.06 + 0.06 * f), cell * 0.07, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    else if (th.deco === 'wicker') { const y = ((tm * 0.05 + k / 7) % 1) * H, x = sx + Math.sin(tm + k) * cell * 0.6; ctx.fillStyle = ['#e8823a', '#d9a03a', '#c0563a'][k % 3]; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.ellipse(x, y, cell * 0.1, cell * 0.05, tm * 2 + k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    else if (th.deco === 'reeds' || th.deco === 'spores') { const x = sx + Math.sin(tm * 0.5 + k * 2) * cell * 1.2, y = sy + Math.cos(tm * 0.7 + k) * cell, a = 0.4 + 0.6 * Math.abs(Math.sin(tm * 2 + k)), c = th.deco === 'reeds' ? '#fff3a0' : '#e0b8ff'; disc(x, y, cell * 0.16, c, a * 0.2); disc(x, y, cell * 0.05, c, a); }
    else if (th.deco === 'ice') for (let j = 0; j < 3; j++) { const x = (sx + j * W / 3 + Math.sin(tm + k + j) * cell * 0.3) % W, y = ((tm * 0.04 + (k * 3 + j) / 21) % 1) * H; disc(x, y, cell * 0.04, '#ffffff', 0.7); }
  }
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const tgt = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((tgt - r) * p + r); g = Math.round((tgt - g) * p + g); b = Math.round((tgt - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0; }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); }
function disc(x, y, r, color, alpha) { if (alpha != null) ctx.globalAlpha = alpha; ctx.fillStyle = color; circ(ctx, x, y, r); ctx.fill(); ctx.globalAlpha = 1; }
function strokeRing(x, y, r, color, w, alpha) { if (alpha != null) ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; circ(ctx, x, y, r); ctx.stroke(); ctx.globalAlpha = 1; }
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function rrect(g, x, y, w, h, rad) { // rad = [tl, tr, br, bl]
  const [a, b, c, d] = rad;
  g.beginPath(); g.moveTo(x + a, y); g.lineTo(x + w - b, y); g.quadraticCurveTo(x + w, y, x + w, y + b);
  g.lineTo(x + w, y + h - c); g.quadraticCurveTo(x + w, y + h, x + w - c, y + h);
  g.lineTo(x + d, y + h); g.quadraticCurveTo(x, y + h, x, y + h - d);
  g.lineTo(x, y + a); g.quadraticCurveTo(x, y, x + a, y); g.closePath();
}
const HEDGE_IN = 0.17;
function buildMaze() {
  if (!grid) return;
  const W = COLS * cell, H = ROWS * cell;
  mazeCanvas = document.createElement('canvas');
  mazeCanvas.width = Math.ceil(W * dpr); mazeCanvas.height = Math.ceil(H * dpr);
  const m = mazeCanvas.getContext('2d');
  m.scale(dpr, dpr);
  const th = theme(), floorTex = spr(th.k + '-floor'), hedgeTex = spr(th.k + '-hedge');
  m.fillStyle = floorTex ? m.createPattern(floorTex, 'repeat') : th.floor; m.fillRect(0, 0, W, H);
  m.fillStyle = 'rgba(255,255,255,0.09)';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] === 0) { m.beginPath(); m.arc((x + .5) * cell, (y + .5) * cell, Math.max(1, cell * 0.04), 0, 7); m.fill(); }
  }
  const pass = (color, ins) => {
    m.fillStyle = color;
    // hedges are drawn slimmer than their tile (HEDGE_IN on each side) so the roads read wider than the characters
    ins += cell * HEDGE_IN;
    const r = cell * 0.26;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== 1) continue;
      const px2 = x * cell, py2 = y * cell;
      rr(m, px2 + ins, py2 + ins, cell - ins * 2, cell - ins * 2, Math.max(1, r - ins + cell * HEDGE_IN)); m.fill();
      if (x + 1 < COLS && grid[y][x + 1] === 1) m.fillRect(px2 + cell / 2, py2 + ins, cell, cell - ins * 2);
      if (y + 1 < ROWS && grid[y + 1][x] === 1) m.fillRect(px2 + ins, py2 + cell / 2, cell - ins * 2, cell);
    }
  };
  const hue = th.hedge;
  pass(hue[0], 0);
  pass(hue[1], cell * 0.05);
  if (hedgeTex) { const pat = m.createPattern(hedgeTex, 'repeat'); const k2 = cell * 2 / hedgeTex.width; pat.setTransform(new DOMMatrix([k2, 0, 0, k2, 0, 0])); pass(pat, cell * 0.09); return; }
  pass(hue[2], cell * 0.12);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== 1) continue;
    const h = (x * 73 + y * 151) % 7, cx2 = (x + .5) * cell, cy2 = (y + .5) * cell;
    m.fillStyle = th.dot; m.strokeStyle = th.dot; m.lineCap = 'round';
    if (th.deco === 'flowers') { m.fillStyle = ['#ffffff', '#fff1a8', '#ffd6e6'][h % 3]; m.beginPath(); m.arc((x + .3 + h * .06) * cell, (y + .35 + (h % 3) * .12) * cell, cell * .06, 0, 7); m.fill(); }
    else if (th.deco === 'wicker') { m.globalAlpha = 0.45; m.lineWidth = Math.max(1, cell * 0.05); for (const o of [-0.15, 0.15]) { m.beginPath(); m.moveTo(cx2 + o * cell - cell * 0.1, cy2 - cell * 0.12); m.lineTo(cx2 + o * cell + cell * 0.1, cy2 + cell * 0.12); m.stroke(); } m.globalAlpha = 1; }
    else if (th.deco === 'reeds') { m.globalAlpha = 0.5; m.lineWidth = Math.max(1, cell * 0.04); for (const o of [-0.16, 0, 0.16]) { m.beginPath(); m.moveTo(cx2 + o * cell, cy2 + cell * 0.14); m.lineTo(cx2 + o * cell + cell * 0.03, cy2 - cell * 0.14); m.stroke(); } m.globalAlpha = 1; }
    else if (th.deco === 'ice') { m.globalAlpha = 0.6; m.fillRect(x * cell + cell * 0.26, y * cell + cell * 0.25, cell * 0.48, Math.max(1.5, cell * 0.05)); m.globalAlpha = 1; }
    else if (th.deco === 'spores') { m.globalAlpha = 0.85; m.beginPath(); m.arc((x + .3 + h * .06) * cell, (y + .35 + (h % 3) * .12) * cell, cell * .05, 0, 7); m.fill(); m.globalAlpha = 1; }
    else if (th.deco === 'glass') { m.globalAlpha = 0.5; m.strokeStyle = '#ffffff'; m.lineWidth = Math.max(1, cell * 0.03); m.beginPath(); m.moveTo(cx2 - cell * 0.12, cy2 + cell * 0.12); m.lineTo(cx2 + cell * 0.04, cy2 - cell * 0.12); m.stroke(); m.globalAlpha = 1; if (h % 3 === 0) { m.fillStyle = '#ffcd4a'; m.beginPath(); m.arc(cx2, cy2, cell * 0.04, 0, 7); m.fill(); } }
  }
}
function eyes(g, x, y, r, lx, ly, seed) {
  const er = r * 0.24, bl = seed < 0 ? 1 : ((time + seed * 1.7) % 3.6) < 0.12 ? 0.15 : 1;
  for (const s of [-1, 1]) {
    g.save(); g.translate(x + s * r * 0.3, y - r * 0.08); g.scale(1, bl);
    g.fillStyle = '#fff'; circ(g, 0, 0, er); g.fill();
    g.fillStyle = '#151a30'; circ(g, lx * er * 0.4, ly * er * 0.35 + er * 0.05, er * 0.55); g.fill();
    g.fillStyle = '#fff'; circ(g, lx * er * 0.4 - er * 0.18, ly * er * 0.35 - er * 0.15, er * 0.16); g.fill();
    g.restore();
  }
}
function furBall(g, x, y, r, roll, fill, dark, lx, ly, seed, t, sq, sqAng) {
  if (sq) { g.save(); g.translate(x, y); g.rotate(sqAng || 0); g.scale(1 + 0.11 * sq, 1 - 0.09 * sq); g.rotate(-(sqAng || 0)); x = 0; y = 0; }
  const n = 13, rip = 0.05 + 0.04 * (sq || 0);
  g.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = roll + i * Math.PI / n;
    const q = i % 2 ? r * 0.86 : r * (1.12 + rip * Math.sin(t * 3 + i + seed));
    const px2 = x + Math.cos(a) * q, py2 = y + Math.sin(a) * q;
    i ? g.lineTo(px2, py2) : g.moveTo(px2, py2);
  }
  g.closePath(); g.lineJoin = 'round';
  g.fillStyle = fill; g.fill(); g.strokeStyle = dark; g.lineWidth = Math.max(1, r * 0.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.22)'; circ(g, x - r * 0.35, y - r * 0.45, r * 0.22); g.fill();
  if (!furBall.noEyes) eyes(g, x, y, r, lx, ly, seed);
  if (sq) g.restore();
}
/* ---------- Art: painted sprites when available, drawn stand-ins otherwise ----------
   ART maps a sprite name (e.g. 'pip-idle', 'tuft-green', 'e2-chasing') to an image data URL.
   Heroes and sprouts fall back to drawn versions while an image decodes; pests and bosses show a soft placeholder disc. */
