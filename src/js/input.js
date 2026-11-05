/* ---------- input: drag anywhere (no on-screen stick), keys, optional pad ---------- */
function setWant(name) { if (mode !== 'play' || !DIRS[name]) return; if (tutInput(name)) return; player.want = DIRS[name]; }
const DEAD = 12, FOLLOW = 46;
let joy = null;
let lastTap = { t: 0, x: 0, y: 0 };
document.addEventListener('pointerdown', e => {
  if (mode !== 'play' || joy) return;
  if (e.target.closest('button')) return;
  const now = performance.now();
  if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) { useAbility(); lastTap.t = 0; }
  else lastTap = { t: now, x: e.clientX, y: e.clientY };
  joy = { id: e.pointerId, bx: e.clientX, by: e.clientY };
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!joy || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.bx, dy = e.clientY - joy.by;
  const d = Math.hypot(dx, dy);
  if (d > FOLLOW) { joy.bx += dx - dx / d * FOLLOW; joy.by += dy - dy / d * FOLLOW; }
  if (d > DEAD) setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});
function endJoy(e) { if (joy && (!e || e.pointerId === joy.id)) joy = null; }
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, endJoy));
let padOn = false;
try { padOn = localStorage.getItem('tufttrail-pad') === '1'; } catch (e) {}
function applyPad() { document.body.classList.toggle('pad-on', padOn); }
applyPad();
const ctrlBtn = () => `<button class="ctrl" data-act="controls">${t('controls', padOn)}</button>`;
const musicBtn = () => `<button class="ctrl" data-act="musictoggle">${t('musicBtn', !meta.musicOff)}</button>`;
const langBtn = () => `<button class="ctrl" data-act="lang">${t('langBtn')}</button>`;
document.getElementById('pad').addEventListener('pointerdown', e => {
  const b = e.target.closest('button[data-dir]');
  if (b) { e.preventDefault(); setWant(b.dataset.dir); }
});
abilityBtn.addEventListener('pointerdown', e => { e.preventDefault(); useAbility(); });
addEventListener('keydown', () => { kbUser = true; }, true);
addEventListener('pointerdown', () => { kbUser = false; }, true);
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
// Menus are fully playable from the keyboard: arrows / WASD move between buttons, Space or Enter presses the focused one.
function menuButtons() { return [...overlay.querySelectorAll('button:not([disabled]),[data-act]:not(button)')].filter(b => b.offsetParent && b.getClientRects().length && !b.closest('.choices.wait,[hidden]')); }
function menuMove(dir) {
  const list = menuButtons(); if (!list.length) return;
  const cur = document.activeElement && list.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) { (overlay.querySelector('.btn:not(.ghost):not([disabled])') || list[0]).focus(); return; }
  const r0 = cur.getBoundingClientRect(), x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2;
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  let best = null, bs = 1e9;
  for (const b of list) {
    if (b === cur) continue;
    const r = b.getBoundingClientRect(), vx = r.left + r.width / 2 - x0, vy = r.top + r.height / 2 - y0;
    const along = vx * dx + vy * dy; if (along <= 4) continue;
    const side = Math.abs(vx * dy - vy * dx), score = along + side * 2.2;
    if (score < bs) { bs = score; best = b; }
  }
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }); }
}
addEventListener('keydown', e => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (journeyOn() && document.querySelector('.coachspot') && e.key === 'Escape') { e.preventDefault(); journeySkip(); return; }
  if (run && run.kind === 'tutorial' && mode === 'play' && e.key === 'Escape') { e.preventDefault(); skipTutorial(); return; }
  if (journeyOn() && document.querySelector('.coachspot')) { e.preventDefault(); if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { const st = JL()[meta[JK()]]; if (st && st.next) journeyAdvance(); else { const el = journeyTarget(); if (el && st.screen === 'cards') { const c = el.querySelector('.choice:focus') || el.querySelector('.choice'); if (c) c.click(); } else if (el) el.click(); } } else if (KEYS[e.key] && JL()[meta[JK()]] && JL()[meta[JK()]].screen === 'cards') menuMove(KEYS[e.key]); return; }
  if (coachOn) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || KEYS[e.key]) { e.preventDefault(); if (!e.repeat) coachNext(); } return; }
  if (mode === 'play') {
    if (KEYS[e.key]) { e.preventDefault(); setWant(KEYS[e.key]); }
    else if (e.key === ' ') { e.preventDefault(); useAbility(); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') pauseGame();
    return;
  }
  if (overlay.hidden) return;
  if (KEYS[e.key]) { e.preventDefault(); menuMove(KEYS[e.key]); return; }
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault(); if (e.repeat) return;
    const list = menuButtons(), cur = list.includes(document.activeElement) ? document.activeElement : (overlay.querySelector('.btn:not(.ghost):not([disabled])') || list[0]);
    if (cur) cur.click();
    return;
  }
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { if (mode === 'pause') resume(); }
});
document.getElementById('pauseBtn').addEventListener('click', () => { if (mode === 'play') pauseGame(); else if (mode === 'pause') resume(); });
// Hub save chip: the existing account box (or, where accounts can't work here, the save-code section in Profile).
document.getElementById('saveChip').addEventListener('click', () => {
  if (mode !== 'hub') return; initAudio(); sfx('tap');
  if (cloud.can === false) { showProfile(); const s = document.getElementById('saveStatus'); if (s) s.scrollIntoView({ block: 'center' }); } else showCloudOffer();
});
document.getElementById('soundBtn').addEventListener('click', () => {
  muted = !muted; initAudio();
  document.getElementById('soundWave').style.opacity = muted ? '0' : '1';
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); if (actx) actx.suspend(); } else if (actx) actx.resume(); });

/* ---------- sizing & loop ----------
   Cells never shrink below 80% of what an 11×15 map would get; bigger maps scroll with a following camera. */
