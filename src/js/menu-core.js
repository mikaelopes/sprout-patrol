/* ---------- screens ---------- */
function show(html) {
  if (typeof endJoy === 'function') endJoy();
  const same = mode === lastShown;
  const sc0 = overlay.querySelector('.scroll'), cd0 = overlay.querySelector('.card');
  const prevS = same && sc0 ? sc0.scrollTop : 0, prevC = same && cd0 ? cd0.scrollTop : 0;
  overlay.innerHTML = html;
  overlay.hidden = false;
  tidyScreen();
  const sc = overlay.querySelector('.scroll'), cd = overlay.querySelector('.card');
  if (sc) sc.scrollTop = prevS;
  if (cd) cd.scrollTop = prevC;
  lastShown = mode;
  updateHud();
  if (coachOn && coachOn.screen !== mode) { coachOn = null; coachDraw(); }
  setTimeout(() => { if (journeyOn()) journeyDraw(); else if (['hub', 'map', 'prelevel'].includes(mode)) coachStart(mode); }, journeyOn() ? 150 : 450);
  if (kbUser || matchMedia('(pointer:fine)').matches) { const b = overlay.querySelector('.node.cur') || overlay.querySelector('.btn:not(.ghost):not([disabled])') || overlay.querySelector('button:not([disabled])'); if (b) b.focus({ preventScroll: true }); }
}
let lastShown = '', kbUser = false;
/** Menu-side touch-ups for screens whose markup another module builds (prelevel/results live in adventure.js). */
function tidyScreen() {
  if (mode === 'prelevel') { // "GROVE 1 · GARDEN 3" over "Garden 1-3" says the same thing twice; boss screens keep it
    const e = overlay.querySelector('.card > .eyebrow:first-child'), h = overlay.querySelector('.card > h2');
    if (e && h && /\d-\d+$/.test(h.textContent.trim())) e.remove(); }
  if (mode === 'advresult' && nestHintOn()) { const nx = overlay.querySelector('[data-act="advnext"]'); if (nx) nx.insertAdjacentHTML('afterend', nestHintHtml()); }
}
function hide() { overlay.hidden = true; overlay.innerHTML = ''; lastShown = ''; updateHud(); }
function avatar(k, size, hat, mood) {
  const c = CHARS[k];
  const z = size || 44;
  return `<canvas class="avatar anim" role="img" aria-label="${c.name}" data-kind="tuft" data-k="${k}"${hat ? ` data-hat="${hat}"` : ''}${mood ? ` data-mood="${mood}"` : ''} style="width:${z}px;height:${z}px"></canvas>`;
}
// Menu portraits are live canvases, redrawn every frame so tufts keep spinning and blinking.
function animAvatars() {
  if (overlay.hidden) return;
  const list = overlay.querySelectorAll('canvas.anim');
  if (!list.length) return;
  const d = Math.min(3, window.devicePixelRatio || 1);
  list.forEach((cv, i) => {
    const w = cv.clientWidth || parseFloat(cv.style.width) || 44, W = Math.round(w * d);
    if (cv.width !== W) { cv.width = W; cv.height = W; }
    const g = cv.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, w);
    const tm = reduceMotion ? 0.5 : time;
    if (cv.dataset.kind === 'tuftc') { const ph = tm * 1.3 + i * 0.9, hop = reduceMotion ? 0 : -Math.abs(Math.sin(tm * 2.4 + i)) * w * 0.06; drawTuft(g, w / 2, w * 0.56 + hop, w * 0.3, +cv.dataset.c, reduceMotion ? -1 : i, tm, 0, 0, { lx: Math.sin(ph * 0.7), ly: Math.cos(ph * 0.5) * 0.4, mood: i % 4 === 1 && Math.sin(tm * 0.8 + i) > 0.6 ? 'happy' : '' }); return; }
    if (cv.dataset.kind === 'cos') { drawCosPreview(g, w, cv.dataset.cat, cv.dataset.id, tm, i); return; }
    if (cv.dataset.kind === 'boss' && (cv.dataset.type === 'twins' ? drawPest(g, 'sun', w * 0.32, w * 0.58, w * 0.19, '') && drawPest(g, 'frost', w * 0.7, w * 0.58, w * 0.19, '') : drawPest(g, cv.dataset.type, w / 2, w * 0.55, w * 0.32, ''))) return;
    if (cv.dataset.kind === 'boss') { pestStub(g, w / 2, w * 0.55, w * 0.32); return; }
    if (cv.dataset.kind === 'tuft') {
      const c = CHARS[cv.dataset.k] || CHARS.pip, ph = tm * 1.3 + i * 0.9;
      const lx = Math.sin(ph * 0.7), ly = Math.cos(ph * 0.5) * 0.4;
      const hat = cv.dataset.hat, showH = hat && hat !== 'leaf', blob = HERO_CLASSIC && !spr(cv.dataset.k + '-idle'), ar = blob ? (showH ? w * 0.34 : w * 0.4) : w * (showH ? 0.24 : 0.27), ay = blob ? (showH ? w * 0.6 : w / 2 + w * 0.02) : w * (showH ? 0.56 : 0.52); // painted sprites leave room for the squash so nothing gets clipped
      const showHat = hat && hat !== 'leaf';
      drawHero.mood = cv.dataset.mood || '';
      drawHero(g, cv.dataset.k, w / 2, ay, ar * 0.92, lx, ly, reduceMotion ? -1 : i + 0.3, tm, reduceMotion ? 0 : 0.3 + 0.3 * Math.sin(ph * 2.2), Math.PI / 2, !showHat);
      drawHero.mood = '';
      if (showHat) drawHat(g, w / 2, ay, ar * 0.92, hat, tm, cv.dataset.k);
    } else {
      const type = cv.dataset.type, bob2 = reduceMotion ? 0 : -Math.abs(Math.sin(tm * 2.2 + i)) * w * 0.04;
      foodPic(g, type, w / 2, w / 2 + w * 0.04 + bob2, w * 0.36);
    }
  });
}
const chestCache = {};
function chestSrc(open) {
  const painted = artGet(open ? 'ob-chest-open' : 'ob-chest'); if (painted) return painted;
  if (chestCache[open]) return chestCache[open];
  const c = document.createElement('canvas'); c.width = 200; c.height = 170;
  const g = c.getContext('2d');
  const wood = g.createLinearGradient(0, 70, 0, 160); wood.addColorStop(0, '#a8642c'); wood.addColorStop(1, '#6e3c17');
  if (open) {
    const gl = g.createRadialGradient(100, 70, 5, 100, 70, 90); gl.addColorStop(0, 'rgba(255,241,168,.95)'); gl.addColorStop(1, 'rgba(255,241,168,0)');
    g.fillStyle = gl; g.fillRect(0, 0, 200, 140);
    g.fillStyle = '#5e3414'; rr(g, 26, 8, 148, 52, 18); g.fill();
    g.fillStyle = '#8a4f22'; rr(g, 32, 12, 136, 40, 14); g.fill();
    g.fillStyle = '#ffcd4a'; g.fillRect(26, 50, 148, 10);
    g.fillStyle = '#fff1a8'; rr(g, 26, 66, 148, 22, 6); g.fill();
    for (const [x, y, r] of [[60, 70, 9], [100, 66, 11], [140, 71, 8], [80, 74, 7], [122, 75, 7]]) { g.fillStyle = '#ffcd4a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(x - r * .3, y - r * .3, r * .3, 0, Math.PI * 2); g.fill(); }
  } else {
    g.fillStyle = '#5e3414'; rr(g, 22, 22, 156, 64, 26); g.fill();
    g.fillStyle = wood; rr(g, 28, 28, 144, 52, 22); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, 40, 34, 120, 10, 5); g.fill();
    g.fillStyle = '#ffcd4a'; g.fillRect(22, 76, 156, 12);
  }
  g.fillStyle = '#5e3414'; rr(g, 22, 84, 156, 76, 14); g.fill();
  g.fillStyle = wood; rr(g, 28, 88, 144, 66, 10); g.fill();
  g.fillStyle = '#ffcd4a'; g.strokeStyle = '#8a5a00'; g.lineWidth = 3;
  for (const x of [40, 148]) { g.fillRect(x, 84, 12, 76); }
  g.fillStyle = '#ffcd4a'; rr(g, 84, open ? 92 : 76, 32, 36, 8); g.fill(); g.stroke();
  g.fillStyle = '#2a1a05'; g.beginPath(); g.arc(100, open ? 106 : 90, 5, 0, Math.PI * 2); g.fill(); g.fillRect(98, open ? 106 : 90, 4, 12);
  return chestCache[open] = c.toDataURL();
}
let chestNext = null, chestBusy = false, chestAfter = null;
function showChest(title, loot, next) {
  mode = 'chest';
  chestNext = next; chestBusy = false;
  show(`<div class="card"><div class="eyebrow">${title}</div>
    <div class="chestwrap"><div class="rays"></div><img class="chestimg idle" data-act="chestopen" src="${chestSrc(false)}" alt="${t('openChest')}" aria-label="${t('openChest')}" role="button" tabindex="0"><div class="sparks"></div></div>
    <div class="loot" id="chestLoot" hidden>${loot}</div>
    <div class="chesthint" id="chestHint">${t('tapOpen')}</div>
    <div class="btns"><button class="btn" data-act="chestopen" id="chestBtn">${t('openChest')}</button>
    <button class="btn" data-act="chestdone" id="chestDone" hidden>${t('collect')}</button></div></div>`);
}
function openChestAnim() {
  if (chestBusy || mode !== 'chest') return;
  chestBusy = true;
  const img = overlay.querySelector('.chestimg'), btn = document.getElementById('chestBtn'), hint = document.getElementById('chestHint');
  if (btn) btn.hidden = true;
  if (hint) hint.style.visibility = 'hidden';
  img.classList.remove('idle'); img.classList.add('jiggle'); overlay.querySelector('.chestwrap').classList.add('charging');
  sfx('creak'); setTimeout(() => sfx('creak'), 220); setTimeout(() => sfx('creak'), 440);
  setTimeout(() => {
    if (mode !== 'chest') return;
    img.classList.remove('jiggle'); img.classList.add('opened'); img.src = chestSrc(true);
    const wrap = overlay.querySelector('.chestwrap'); wrap.classList.remove('charging'); wrap.classList.add('flash');
    overlay.querySelector('.rays').classList.add('on');
    const sp = overlay.querySelector('.sparks'), seed = artGet('ob-seed');
    if (!reduceMotion) {
      for (let i = 0; i < 12; i++) { // sparkles
        const a = i / 12 * Math.PI * 2, r = 60 + (i % 3) * 18;
        sp.insertAdjacentHTML('beforeend', `<i style="--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r)}px"></i>`);
      }
      if (seed) for (let i = 0; i < 9; i++) { // golden seeds arc up out of the chest and tumble down
        const dx = Math.round((i - 4) * 22 + (Math.random() - 0.5) * 14), up = 70 + Math.round(Math.random() * 40);
        sp.insertAdjacentHTML('beforeend', `<b class="seedfly" style="background-image:url(${seed});--dx:${dx}px;--up:${-up}px;--rot:${Math.round((Math.random() - 0.5) * 540)}deg;animation-delay:${i * 35}ms"></b>`);
      }
    }
    const lo = document.getElementById('chestLoot'); lo.hidden = false; lo.classList.add('pop');
    sfx('fanfare');
    const d = document.getElementById('chestDone'); d.hidden = false;
    if (kbUser) d.focus({ preventScroll: true });
  }, reduceMotion ? 50 : 700);
}
function tuftImg(c, size) { return `<canvas class="avatar anim" aria-hidden="true" data-kind="tuftc" data-c="${c}" style="width:${size}px;height:${size}px"></canvas>`; }
function grumbleImg(type, size) {
  return `<canvas class="avatar anim" aria-hidden="true" data-kind="grumble" data-type="${type}" style="width:${size}px;height:${size}px"></canvas>`;
}
function showSplash() {
  document.title = t('gameName');
  mode = 'splash';
  show(`<div class="card">
    <div class="logo">${artGet('logo-en') ? `<img class="gamelogo" src="${ART['logo-en']}" alt="${t('gameName')}">` : `${avatar('pip', 48)}<h1>${t('gameName')}</h1>`}</div>
    <div class="eyebrow">${t('tagline')}</div>
    <div style="display:flex;justify-content:center;align-items:flex-end;gap:10px">${[0, 1, 2, 3].map(c => tuftImg(c, 38)).join('')}<span style="width:8px"></span>${grumbleImg('wander', 42)}</div>
    <p>${t('splashP')}</p>
    <button class="btn" data-act="hub">${t('tapStart')}</button>
    ${langBtn()}
  </div>`);
}
function paintLogo() {
  const c = document.getElementById('logoTuft');
  if (c) { const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); drawHero(g, 'pip', c.width / 2, c.height * 0.56, c.width * 0.3, 0.3, 0.1, -1, time); }
}
