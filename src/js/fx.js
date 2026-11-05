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
  const damp = Math.pow(0.9, dt * 60); // same slow-down per second at 30, 60 or 120 fps
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= damp; p.vy *= damp; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (particles.length > 260) particles.splice(0, particles.length - 260);
  if (banners.length) { banners[0].t += dt; if (banners[0].t >= banners[0].dur) banners.shift(); }
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].y -= dt * 0.9; floats[i].life -= dt;
    if (floats[i].life <= 0) { floats.splice(i, 1); continue; }
  }
  shake = Math.max(0, shake - dt);
}

/* ---------- hit feel (art-feel P3) ----------
   A hit freezes the garden for a beat (hit-stop: rendering goes on, the sim and the garden clock wait),
   kicks the board a few px away from what hit you and eases back. The hero is never faded. */
const FEEL = { hitStop: 0.07, kickPx: 4, kickDur: 0.2, heroClearT: 0.4 };
let hitStop = 0, hitAt = -9, kick = { x: 0, y: 0, t: 9 };
/** Called once per frame by step(). Returns true while the hit-stop holds the simulation. */
function hitStopTick(dt) { if (hitStop <= 0) return false; hitStop -= dt; return true; }
/** Feedback for a real hit at tile position p (hearts lost). Sound, burst, hit-stop and kick. */
function hitFeel(p) {
  hitAt = time;
  burst(p.x, p.y, '#ff6f61', 10);
  sfx('hurt');
  if (reduceMotion) return;
  hitStop = FEEL.hitStop;
  let src = null, best = 1.6; // nearest thing that could have hit us; else the way we were rolling
  for (const e of enemies) { const q = epos(e), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < best) { best = d; src = q; } }
  for (const s of shots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < best) { best = d; src = s; } }
  let dx = src ? p.x - src.x : -player.face[0], dy = src ? p.y - src.y : -player.face[1];
  const L = Math.hypot(dx, dy) || 1; kick = { x: dx / L, y: dy / L, t: 0 };
}
/** Board offset in css px for this frame: the hit kick (eased back) plus a smooth, short wobble for bumps. */
const JOLT = { x: 0, y: 0 }, REACT = { s: 1, g: 0 }; // reused every frame
function boardJolt(dt) {
  let x = 0, y = 0; JOLT.x = 0; JOLT.y = 0;
  if (reduceMotion) return JOLT;
  if (kick.t < FEEL.kickDur) { kick.t += dt; const k = Math.max(0, 1 - kick.t / FEEL.kickDur), e = k * k; x += kick.x * FEEL.kickPx * e; y += kick.y * FEEL.kickPx * e; }
  if (shake > 0) { x += Math.sin(time * 38) * 6 * shake; y += Math.cos(time * 29) * 4 * shake; } // ~6 Hz, gone in <0.4 s: at most 2 wiggles
  JOLT.x = x; JOLT.y = y; return JOLT;
}

/* ---------- delivery payoff (art-feel P2) ----------
   Feedback grows with the number of sprouts delivered at once: the arpeggio gets longer, sparkles land with
   each sprout from 3 up, a ring of stars from 5 up, and the home swells once and glows in its colour.
   One envelope per delivery (not per sprout), so nothing pulses faster than the 3/s flash rule. */
const DELIVER_TIER = n => n >= 5 ? 3 : n >= 3 ? 2 : 1;
/** Start the home's reaction and the delivery sound for `count` sprouts reaching portal pt. */
function deliverFeel(pt, count) {
  if (!count) return;
  const tier = DELIVER_TIER(count);
  sfx('home', count);
  const last = 0.08 * (count - 1) + 0.55; // when the last hopping sprout lands (matches the homeTufts timing)
  pt.feel = { t0: time + 0.55, t1: time + last, amp: [0, 0.08, 0.12, 0.15][tier], tier };
  if (tier >= 3) { // a ring of particles in the home's colour, sized by the trail
    const col = pt.rainbow ? '#ffffff' : COLORS[pt.cs[0]].fill, n = Math.min(36, 5 * count);
    for (let a = 0; a < n; a++) { const ang = a / n * TAU; particles.push({ x: pt.x, y: pt.y, vx: Math.cos(ang) * 4.5, vy: Math.sin(ang) * 4.5, life: .7, max: .7, color: a % 2 ? col : '#fff1a8' }); }
  }
}
/** A delivered sprout reached its home (called by the hop animation). */
function homeLand(h) {
  const tier = DELIVER_TIER(h.n || 1);
  if (tier >= 2) spriteFx('fx-sparkle', h.x1 + (Math.random() - .5) * 0.5, h.y1 - 0.15 - Math.random() * 0.3, 0.5, 0.3, 0.7, 2);
  if (tier >= 3 && h.first) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; spriteFx('fx-star', h.x1 + Math.cos(a) * 0.75, h.y1 + Math.sin(a) * 0.75, 0.7, 0.25, 0.55, 3); }
}
/** Home swell (scale) and glow (0..1) for portal p right now. */
function homeReact(p) {
  const f = p.feel; REACT.s = 1; REACT.g = 0; if (!f || time < f.t0) return REACT;
  const rel = 0.3, end = f.t1 + rel; if (time > end) { p.feel = null; return REACT; }
  const up = Math.min(1, (time - f.t0) / 0.08), down = time > f.t1 ? 1 - (time - f.t1) / rel : 1, env = up * down;
  REACT.s = reduceMotion ? 1 : 1 + f.amp * env; REACT.g = env * (0.35 + 0.15 * f.tier); return REACT;
}
