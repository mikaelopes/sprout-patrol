/* ---------- HUD ---------- */
const heartSvg = full => `<svg class="heart" viewBox="0 0 20 18"><path d="M10 16.5s-7.5-4.6-7.5-9.6A4.3 4.3 0 0 1 10 4.3a4.3 4.3 0 0 1 7.5 2.6c0 5-7.5 9.6-7.5 9.6z" fill="${full ? '#ff6f61' : 'none'}" stroke="#ff6f61" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
function loadoutHtml() {
  const ws = Object.keys(WEAPONS).filter(k => wp[k] > 0), ps = PASSIVES.filter(k => sk[k] > 0);
  let h = '';
  for (let j = 0; j < 3; j++) {
    const k = ws[j];
    if (k) { const w = WEAPONS[k], ev = evo[w.evo]; h += `<span class="lslot${ev ? ' evo' : ''}" style="background:${w.bg};border:0" title="${L(w.name)}">${svg(w.icon, w.fg)}<b>${ev ? '★' : wp[k]}</b></span>`; }
    else h += '<span class="lslot"></span>';
  }
  h += '<span class="lsep"></span>';
  for (let j = 0; j < PV_SLOTS; j++) {
    const k = ps[j];
    if (k) { const p2 = SKILLS[k]; h += `<span class="lslot p" style="background:${p2.bg};border:0" title="${L(p2.name)}">${svg(p2.icon, p2.fg)}<b>${sk[k]}</b></span>`; }
    else h += '<span class="lslot p"></span>';
  }
  return h;
}
// Menu screens show the player's wallet and name in the header; the run's numbers only show while playing.
const MENU_MODES = ['splash', 'hub', 'daily', 'road', 'chars', 'nest', 'challenges', 'profile', 'book', 'map', 'prelevel', 'advresult', 'over', 'tutdone'];
const inMenu = () => MENU_MODES.includes(mode) || (mode === 'chest' && (chestNext === 'map' || chestNext === 'road'));
function updateHud() {
  const menu = inMenu();
  document.querySelector('.xprow').style.visibility = menu ? 'hidden' : '';
  document.body.classList.toggle('menu', menu);
  const lo = document.getElementById('loadout');
  const showLo = run.kind === 'endless' && ['play', 'pause', 'cards', 'clear', 'camp', 'bossintro'].includes(mode);
  lo.hidden = !showLo;
  if (showLo) lo.innerHTML = loadoutHtml();
  let h = '';
  for (let i = 0; i < maxHp(); i++) h += heartSvg(i < run.hp);
  if (run.char === 'moss' || run.spareShield) h += `<svg class="shieldpip" viewBox="0 0 24 24" fill="${shieldUp || run.spareShield ? '#9fe3d4' : 'none'}" stroke="#9fe3d4" stroke-width="2">${I.shield}</svg>`;
  const hEl = document.getElementById('hearts'); hEl.innerHTML = menu ? '' : h; hEl.classList.toggle('many', maxHp() > 3);
  const stageTop = run.kind === 'tutorial' ? t('tutorial') : run.boss ? t('boss') : run.daily ? t('dailyT') : run.kind === 'adv' ? `${t('garden')} ${run.adv.i}` : `${t('garden')} ${gardenInGrove()}/${PER_GROVE}`;
  document.getElementById('stage').innerHTML = `${stageTop}<small>${t('grove')} ${grove()}${run.mode !== 'normal' ? ' · ' + L(MODES[run.mode].name) : ''}${run.kind === 'endless' && run.gt != null && !['splash', 'hub', 'chars', 'nest', 'challenges', 'profile', 'book', 'map', 'prelevel', 'advresult'].includes(mode) ? ` · <span style="color:${run.gt > 180 ? '#ff6f61' : run.gt > 90 ? '#ffb38a' : 'inherit'}">${Math.floor(run.gt / 60)}:${String(Math.floor(run.gt % 60)).padStart(2, '0')}</span>` : ''}</small>`;
  if (menu) document.getElementById('stage').innerHTML = `${t('gameName')}<small>${esc(meta.name)}</small>`;
  else if (mode === 'runmap' && run.map) document.getElementById('stage').innerHTML = `${t('mapShort')}<small>${t('grove')} ${run.map.gv}</small>`;
  document.getElementById('coins').innerHTML = SEED + fmt(menu ? meta.coins : run.coins);
  document.getElementById('score').textContent = run.kind === 'tutorial' ? '' : t('pts', fmt(run.score || 0));
  document.getElementById('lv').style.color = run.kind === 'adv' ? 'var(--gold)' : '';
  document.getElementById('lv').innerHTML = run.kind === 'adv' ? '★'.repeat(advStarsFor(run.adv.g, run.hits, run.at, run.par)) + (run.par ? ` <span style="color:${run.at > run.par ? 'var(--coral)' : 'var(--muted)'};margin-left:6px">${mmss(run.at)}/${mmss(run.par)}</span>` : '') : t('lv') + ' ' + run.level;
  document.body.classList.toggle('adv', run.kind === 'adv');
  document.getElementById('xpfill').style.width = Math.min(100, run.xp / xpNeed() * 100) + '%';
  document.getElementById('cap').textContent = t('trail') + ' ' + (followers ? followers.length : 0) + '/' + cap();
  { const gl = document.getElementById('goals'), on = !!(run.kind === 'adv' && !run.boss && run.goalC && Object.keys(run.goalC).length && !MENU_MODES.includes(mode));
    gl.hidden = !on; document.getElementById('score').hidden = on;
    if (on) { const html = Object.keys(run.goalC).map(c => { const left = Math.max(0, run.goalC[c] - ((run.gotC && run.gotC[c]) || 0)), im = artGet(TUFT_ART[c]);
        return `<span class="g${left ? '' : ' done'}">${im ? `<img src="${im}" alt="">` : `<i style="background:${COLORS[c].fill}"></i>`}${left ? left : '✓'}</span>`; }).join('');
      if (gl.dataset.v !== html) { gl.dataset.v = html; gl.innerHTML = html; } } }
  { const kc = document.getElementById('keychip'), on = !!(run.boss && portals); kc.hidden = !on;
    if (on) { const txt = run.keys + '/' + portals.filter(q => !q.rainbow && !q.golden).length; if (kc.dataset.v !== txt) { kc.dataset.v = txt; kc.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + I.key + '</svg>' + txt; kc.setAttribute('aria-label', t('keysL') + ' ' + txt); } } }
  const c = ch();
  abilityBtn.hidden = true;
  document.getElementById('apill').hidden = !c.ability || !['play', 'pause', 'cards', 'clear', 'camp', 'bossintro'].includes(mode);
  lastCdShown = -1;
  updateAbilityBtn();
  document.getElementById('abilityLabel').textContent = L(c.label) || '';
  document.getElementById('keysHint').textContent = t('keys');
}
let lastCdShown = -1;
function updateAbilityBtn() {
  const c = ch();
  if (!c.ability) return;
  const ready = abilityCd <= 0;
  const key = ready ? -2 : Math.ceil(abilityCd);
  if (key === lastCdShown) return;
  lastCdShown = key;
  const pill = document.getElementById('apill');
  pill.classList.toggle('ready', ready);
  pill.textContent = ready ? `${L(c.label)} · ${t('dbl')}` : `${L(c.label)} ${Math.ceil(abilityCd)}s`;
}

/* ---------- cards ---------- */
function evoReady(k) {
  const e = EVOS[k];
  return !evo[k] && sk[e.needs[0]] >= SKILLS[e.needs[0]].max && sk[e.needs[1]] >= 1;
}
const wpCount = () => Object.keys(WEAPONS).filter(k => wp[k] > 0).length;
const pvCount = () => PASSIVES.filter(k => sk[k] > 0).length;
const evo2Ready = k => { const e = EVO2[k]; return !evo[k] && wp[e.weapon] >= WEAPONS[e.weapon].max && sk[e.pair] >= 1; };
function rollCards() {
  const evos = Object.keys(EVO2).filter(evo2Ready).map(k => ({ kind: 'evo2', k }))
    .concat(Object.keys(EVOS).filter(evoReady).map(k => ({ kind: 'evo', k })));
  const ws = Object.keys(WEAPONS).filter(k => !evo[WEAPONS[k].evo] && wp[k] < WEAPONS[k].max && (wp[k] > 0 || wpCount() < 3)).map(k => ({ kind: 'weapon', k }));
  const ps = PASSIVES.filter(k => sk[k] < SKILLS[k].max && (sk[k] > 0 || pvCount() < PV_SLOTS) && !(k === 'fur' && run.mode === 'oneheart')).map(k => ({ kind: 'skill', k }));
  let pool = shuffle(ws.concat(ps));
  if (wpCount() === 0 && ws.length) { const first = pool.find(c => c.kind === 'weapon'); pool = [first].concat(pool.filter(c => c !== first)); }
  const cards = evos.slice(0, 1).concat(pool).slice(0, 3);
  if (run.level >= 3 && Math.random() < 0.3) {
    const wild = WILDS.filter(w => !run.wild[w.k] && !(w.k === 'glass' && run.mode === 'oneheart'));
    if (wild.length) cards[Math.min(2, cards.length)] = { kind: 'wild', k: wild[rnd(wild.length)].k };
  }
  while (cards.length < 3) cards.push({ kind: 'snack', k: 'snack' + cards.length });
  return cards;
}
function cardHtml(c, i) {
  if (c.kind === 'weapon') {
    const w = WEAPONS[c.k], lv = wp[c.k];
    let pips = '';
    for (let j = 0; j < w.max; j++) pips += `<i class="${j < lv + 1 ? 'on' : ''}"></i>`;
    return `<button class="choice" data-act="card" data-i="${i}"><span class="ico" style="background:${w.bg};border-radius:8px">${svg(w.icon, w.fg)}</span>
      <span class="txt"><span class="t">${L(w.name)}<small>${t('weaponTag')}</small><span class="pips">${pips}</span></span><span class="d">${L(w.desc(w.stat(lv + 1)))}${lv + 1 === w.max ? t('evoHint', L(SKILLS[w.pair].name), L(EVO2[w.evo].name)) : ''}</span></span></button>`;
  }
  if (c.kind === 'evo2') {
    const e = EVO2[c.k];
    return `<button class="choice evo" data-act="card" data-i="${i}"><span class="ico" style="background:#ffcd4a">${svg('star', '#2b2000')}</span>
      <span class="txt"><span class="t">${L(e.name)}<small>${t('evolution')}</small></span><span class="d">${L(e.desc)}</span></span></button>`;
  }
  if (c.kind === 'wild') {
    const w = WILDS.find(x => x.k === c.k);
    return `<button class="choice" style="border:2px solid var(--coral)" data-act="card" data-i="${i}"><span class="ico" style="background:#ff6f61">${svg('star', '#3a0d08')}</span>
      <span class="txt"><span class="t">${L(w.name)}<small>${t('wildTag')}</small></span><span class="d">${L(w.desc)}</span></span></button>`;
  }
  if (c.kind === 'evo') {
    const e = EVOS[c.k];
    return `<button class="choice evo" data-act="card" data-i="${i}"><span class="ico" style="background:#ffcd4a">${svg('star', '#2b2000')}</span>
      <span class="txt"><span class="t">${L(e.name)}<small>${t('evolution')}</small></span><span class="d">${L(e.desc)}</span></span></button>`;
  }
  if (c.kind === 'snack') {
    return `<button class="choice" data-act="card" data-i="${i}"><span class="ico" style="background:#c6e98a">${svg('snack', '#1f330a')}</span>
      <span class="txt"><span class="t">${t('snackName')}</span><span class="d">${t('snackDesc')}</span></span></button>`;
  }
  const s = SKILLS[c.k], lv = sk[c.k];
  let pips = '';
  for (let j = 0; j < s.max; j++) pips += `<i class="${j < lv + 1 ? 'on' : ''}"></i>`;
  const hint = Object.values(EVOS).find(e => e.needs[0] === c.k);
  return `<button class="choice" data-act="card" data-i="${i}"><span class="ico" style="background:${s.bg};border-radius:50%">${svg(s.icon, s.fg)}</span>
    <span class="txt"><span class="t">${L(s.name)}<small>${t('passiveTag')}</small><span class="pips">${pips}</span></span><span class="d">${L(s.desc(lv))}${hint && lv + 1 === s.max ? t('evoHint', L(SKILLS[hint.needs[1]].name), L(hint.name)) : ''}</span></span></button>`;
}
function openCards(source) {
  mode = 'cards';
  cardSource = source;
  currentCards = rollCards();
  sfx('level');
  renderCards();
}
function renderCards() {
  const head = cardSource === 'chest'
    ? `<div class="eyebrow">${t('chestN', grove())}</div><h2>${t('pickFree')}</h2>`
    : `<div class="lvup"><span class="lvburst"></span><div class="eyebrow">${t('levelN', run.level)}</div></div><h2>${t('pickSkill')}</h2>`;
  const slotsLine = `<div class="loadout big">${loadoutHtml()}</div><div class="llegend"><span>■ ${t('slotW', wpCount())}</span><span>● ${t('slotP', pvCount())}</span></div>`;
  const lights = '<i></i>'.repeat(9);
  show(`<div class="card">${head}${slotsLine}
    <div class="machine" id="machine"><div class="lights">${lights}</div>
      <div class="jackpot" id="jackpot">${t('jackpot')}</div>
      <div class="reels">${[0, 1, 2].map(i => `<div class="reel spin" id="reel${i}"><span class="face">${reelFace(randomFace())}</span></div>`).join('')}</div>
      <div class="tag" id="mtag">${t('spinning')}</div></div>
    <div class="choices wait" id="choices">${currentCards.map(cardHtml).join('')}
</div>
  </div>`);
  spinReels();
}
function cardFace(c) {
  if (c.kind === 'weapon') { const w = WEAPONS[c.k]; return { bg: w.bg, html: svg(w.icon, w.fg) }; }
  if (c.kind === 'skill') { const s = SKILLS[c.k]; return { bg: s.bg, html: svg(s.icon, s.fg), round: 1 }; }
  if (c.kind === 'wild') return { bg: '#ff6f61', html: svg('star', '#3a0d08') };
  if (c.kind === 'snack') return { bg: '#c6e98a', html: svg('snack', '#1f330a') };
  return { bg: '#ffcd4a', html: svg('star', '#2b2000') };
}
function randomFace() {
  const pool = [...Object.keys(WEAPONS).map(k => ({ kind: 'weapon', k })), ...Object.keys(SKILLS).map(k => ({ kind: 'skill', k }))];
  return Math.random() < 0.12 ? 'seven' : cardFace(pool[rnd(pool.length)]);
}
function reelFace(f) {
  if (f === 'seven') return artGet('ob-seed') ? `<img class="seven" src="${artGet('ob-seed')}" alt="" style="width:46px;height:46px">` : '<span class="seven">7</span>';
  return `<span style="display:grid;place-items:center;width:46px;height:46px;background:${f.bg};${f.round ? 'border-radius:50%' : ''}">${f.html}</span>`;
}
let spinTimer = null;
function spinReels() {
  clearInterval(spinTimer);
  const token = {}; spinReels.token = token;
  const jackpot = currentCards.some(c => c.kind === 'evo2' || c.kind === 'evo');
  const stops = [0, 1, 2].map(i => (reduceMotion ? 0 : 520 + i * 360) + (jackpot && i === 2 && !reduceMotion ? 450 : 0));
  const done = [false, false, false];
  const t0 = performance.now();
  const finish = () => {
    if (spinReels.token !== token || mode !== 'cards') return;
    const reveal = () => {
      if (spinReels.token !== token || mode !== 'cards') return;
      const m = document.getElementById('machine'), ch = document.getElementById('choices');
      const go = () => { if (m) m.hidden = true; if (ch) { ch.classList.remove('wait'); ch.classList.add('reveal'); } if (journeyOn()) setTimeout(journeyDraw, 600); else setTimeout(() => { const c = ch && ch.querySelector('.choice:not([disabled])'); if (c && mode === 'cards' && !overlay.contains(document.activeElement)) c.focus({ preventScroll: true }); }, 450); };
      if (m && !reduceMotion) { m.classList.add('out'); setTimeout(() => { if (spinReels.token === token && mode === 'cards') go(); }, 260); } else go();
      if (kbUser) setTimeout(() => { const b = overlay.querySelector('.choice'); if (b) b.focus({ preventScroll: true }); }, reduceMotion ? 0 : 280);
    };
    if (jackpot) {
      document.getElementById('jackpot').classList.add('on');
      document.getElementById('machine').classList.add('win');
      document.getElementById('mtag').textContent = t('evoInside');
      sfx('jackpot');
      setTimeout(reveal, reduceMotion ? 600 : 1300);
    } else setTimeout(reveal, reduceMotion ? 0 : 280);
  };
  const tick = () => {
    if (spinReels.token !== token || mode !== 'cards') { clearInterval(spinTimer); return; }
    const el = performance.now() - t0;
    let spinning = 0;
    for (let i = 0; i < 3; i++) {
      const r = document.getElementById('reel' + i);
      if (!r || done[i]) continue;
      if (el >= stops[i]) {
        done[i] = true;
        r.classList.remove('spin'); r.classList.add('stop');
        r.querySelector('.face').innerHTML = reelFace(jackpot ? 'seven' : cardFace(currentCards[i] || currentCards[0]));
        sfx('stop');
      } else { spinning++; r.querySelector('.face').innerHTML = reelFace(randomFace()); }
    }
    if (spinning) sfx('tick');
    if (done.every(Boolean)) { clearInterval(spinTimer); finish(); }
  };
  spinTimer = setInterval(tick, 70);
  tick();
  const m = document.getElementById('machine');
  if (m) m.addEventListener('click', () => { for (let i = 0; i < 3; i++) stops[i] = Math.min(stops[i], performance.now() - t0); });
}
function pickCard(i) {
  const c = currentCards[i];
  if (!c) return;
  if (c.kind === 'weapon') {
    wp[c.k]++;
  } else if (c.kind === 'evo2') {
    evo[c.k] = true; run.evos++;
    meta.discovered = meta.discovered || {}; meta.discovered[c.k] = true; saveMeta();
  } else if (c.kind === 'wild') {
    run.wild[c.k] = true;
    if (c.k === 'glass') { run.wildCap += 3; run.wildHp -= 1; run.hp = Math.min(run.hp, maxHp()); }
  } else if (c.kind === 'evo') {
    evo[c.k] = true;
    run.evos++;
    meta.discovered = meta.discovered || {}; meta.discovered[c.k] = true; saveMeta();
  } else if (c.kind === 'snack') {
    run.hp = Math.min(maxHp(), run.hp + 1); run.coins += 5;
  } else {
    sk[c.k]++;
    if (c.k === 'fur') run.hp = Math.min(maxHp(), run.hp + 2);
  }
  updateHud();
  if (cardSource === 'chest') { chestPending = false; showCamp(); return; }
  if (cardSource === 'node') { ensureMap(); showRunMap(); return; }
  pendingUps--;
  if (pendingUps > 0) openCards('level');
  else if (clearPending) showClear();
  else resume();
}

