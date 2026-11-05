/* ---------- effects ---------- */
function burst(x, y, color, n) {
  if (reduceMotion) n = Math.ceil(n / 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, max: 0.8, color });
  }
}
function floatText(x, y, text, color) { floats.push({ x, y, text, color, life: 1.2 }); if (floats.length > 3) floats.splice(0, floats.length - 3); }
// Big moments get a paper ribbon that bounces in at the top of the board, with a little sparkle burst.
let banners = [];
function banner(text, color, icon, prio) {
  if (banners.some(b => b.text === text)) return;
  const nb = { text, color, icon, t: 0, dur: 1.7 };
  if (prio && banners.length) { banners = [banners[0], nb].concat(banners.slice(1)).slice(0, 3); return; }
  banners.push(nb); if (banners.length > 3) banners.splice(1, banners.length - 3);
}
function updateFx(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (banners.length) { banners[0].t += dt; if (banners[0].t >= banners[0].dur) banners.shift(); }
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].y -= dt * 0.9; floats[i].life -= dt;
    if (floats[i].life <= 0) { floats.splice(i, 1); continue; }
  }
  shake = Math.max(0, shake - dt);
}

