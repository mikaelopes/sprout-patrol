function fit() {
  const r = boardEl.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const base = Math.floor(Math.min(r.width / 11, r.height / 15));
  const whole = Math.floor(Math.min(r.width / COLS, r.height / ROWS));
  // Phones are taller than the maze: zoom until the height is used, letting at most the outer hedge column slide off-screen
  const tall = Math.floor(Math.min(r.width / Math.max(1, COLS - 1), r.height / ROWS));
  cell = Math.max(14, whole, tall, Math.floor(base * 0.8));
  dpr = Math.min(3, window.devicePixelRatio || 1);
  viewW = Math.min(COLS * cell, Math.floor(r.width));
  viewH = Math.min(ROWS * cell, Math.floor(r.height));
  dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = viewW * dpr; canvas.height = viewH * dpr;
  canvas.style.width = viewW + 'px'; canvas.style.height = viewH + 'px';
  buildMaze();
  if (player) snapCam();
}
let last = performance.now();
// Safety net: the next frame is booked first, so one unexpected error can't freeze the game; broken list entries are swept out.
const tutSkipEl = document.getElementById('tutSkip');
tutSkipEl.addEventListener('click', e => { e.stopPropagation(); skipTutorial(); });
function frame(now) {
  requestAnimationFrame(frame);
  if (TEST.fast) return;
  { const on = !!(run && run.kind === 'tutorial' && (mode === 'play' || mode === 'pause')); if (tutSkipEl.hidden === on) { tutSkipEl.hidden = !on; tutSkipEl.textContent = LANG === 'pt' ? 'Pular tutorial' : 'Skip tutorial'; } }
  try { step(now); } catch (err) {
    console.error(err);
    enemies = enemies.filter(Boolean); shots = shots.filter(Boolean); pickups = pickups.filter(Boolean);
    if (run && run.proj) run.proj = run.proj.filter(Boolean);
  }
}
function step(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  time += dt;
  if (mode === 'play') {
    const held = tutHeld() || journeyPause;
    if (!held) updatePlayer(dt);
    if (mode === 'play' && !held) { updateEnemies(dt); updateSprouts(dt); updateShiny(dt); if (freezeT <= 0) { updateShots(dt); updateLobs(dt); } }
    if (mode === 'play' && !held) collide();
    if (mode === 'play') updateWeapons(dt);
    if (mode === 'play' && run.kind === 'endless') updateDirector(dt);
    if (mode === 'play' && run.tipUntil > 0) { run.tipUntil -= dt; if (run.tipUntil <= 0) setTip(null); }
    if (mode === 'play' && run.kind === 'adv') { const s0 = Math.floor(run.at); run.at += dt; if (Math.floor(run.at) !== s0) updateHud(); }
    if (!tutHeld()) freezeT = Math.max(0, freezeT - dt);
    invuln = Math.max(0, invuln - dt);
    cometT = Math.max(0, cometT - dt);
    abilityCd = Math.max(0, abilityCd - dt);
    if (mode === 'play') updatePickups(dt);
    if (mode === 'play') checkClear();
    updateAbilityBtn();
    tutTick();
  }
  if (player) {
    camTarget();
    const k = Math.min(1, dt * 8);
    cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k;
  }
  updateFx(dt);
  if (!TEST.fast) draw();
  animAvatars();
  updateMusic();
}

demoBoard();
try { if (meta.tutorialDone) { logEv({ o: 1, c: meta.coins }); saveMeta(); } } catch (e) {}
idbRestore();
// Phones keep 1×; tablets and desktop windows scale the interface up to 1.75× so it isn't a tiny phone column in the middle.
function uiScale() { const z = Math.max(1, Math.min(1.75, Math.round(Math.min(innerWidth / 440, innerHeight / 860) * 20) / 20)); document.documentElement.style.setProperty('--uiz', z); }
uiScale(); addEventListener('resize', uiScale);
if ('ResizeObserver' in window) new ResizeObserver(fit).observe(boardEl); else addEventListener('resize', fit);
document.documentElement.dataset.theme = 'moss'; // menus use the Night forest palette
setTimeout(cloudProbe, 0);
if (meta.cloudOn) setTimeout(() => { cloudConnect(false).then(st => { if (st === 'choose' && (mode === 'hub' || mode === 'splash')) { showCloudChoice(); return; } if (cloud.pulled) { cloud.pulled = false; if (mode === 'hub') showHub(); else if (mode === 'splash') showSplash(); } }); }, 0); // only for players who connected before
showSplash();
requestAnimationFrame(frame);
