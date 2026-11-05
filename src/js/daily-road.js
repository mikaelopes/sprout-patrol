/* ---------- Phase 3: daily garden, Trail Road, Endless Nest ---------- */
// Daily garden: one board per calendar day, built from the date, so every player gets the same garden and twist.
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
function hash32(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return n >>> 0; }
const TWISTS = [
  { k: 'swarm',  name: { en: 'Swarm', pt: 'Enxame' },              desc: { en: '2 extra pests on a bigger map.', pt: '2 pragas a mais, num mapa maior.' } },
  { k: 'rush',   name: { en: 'Rush Hour', pt: 'Hora do Rush' },     desc: { en: 'Pests move 15% faster.', pt: 'As pragas andam 15% mais rápido.' } },
  { k: 'bounty', name: { en: 'Bounty', pt: 'Fartura' },             desc: { en: '6 extra sprouts to rescue.', pt: '6 brotinhos a mais para resgatar.' } },
  { k: 'mush',   name: { en: 'Leap Day', pt: 'Dia do Salto' }, desc: { en: 'Two Grasshoppers that leap next to your trail. Watch for the purple ring.', pt: 'Dois Gafanhotos que saltam perto da sua fila. Fique de olho no anel roxo.' } },
  { k: 'grapes', name: { en: 'Ant Picnic', pt: 'Piquenique das Formigas' },  desc: { en: 'Two Ant Hills that send out ants. Bump them while frozen.', pt: 'Dois Formigueiros que soltam formigas. Bata neles congelados.' } },
  { k: 'glass',  name: { en: 'Glass Heart', pt: 'Coração de Vidro' }, desc: { en: 'Only 1 heart. Seeds ×2.', pt: 'Só 1 coração. Sementes ×2.' } },
];
const RING = [20, 30, 40, 50, 60, 80, 150]; // seeds for day 1..7 of the ring; the ring never resets, it only moves forward
function dailySpec(d) {
  const n = dayNum(d), h = hash32(n * 7919 + 13);
  return { key: dayKey(d), n, seed: h, g: 2 + h % 5, i: 1 + ((h >>> 4) % 4), twist: TWISTS[(h >>> 9) % TWISTS.length].k };
}
function dailyState() { meta.daily = meta.daily || { ring: 0, last: '', best: 0, bestKey: '', pend: 0 }; return meta.daily; }
const twistOf = k => TWISTS.find(x => x.k === k) || TWISTS[0];
function ringDots(ds, done) {
  const filled = ds.ring && ds.ring % 7 === 0 && done ? 7 : ds.ring % 7;
  return RING.map((r, j) => `<span class="rday ${j < filled ? 'on' : ''} ${j === filled && !done ? 'next' : ''}" title="${r}"><b>${j + 1}</b><small>${j === 6 ? svg('crown', 'currentColor') : r}</small></span>`).join('');
}
function payPendingRing() { const ds = dailyState(); if (ds.pend) { meta.coins += ds.pend; ds.pend = 0; saveMeta(); } }
function dailyBar() {
  const sp = dailySpec(), ds = dailyState(), done = ds.last === sp.key, tw = twistOf(sp.twist);
  return `<button class="chestbar daily" data-act="daily">${svg('calendar', '#9fe3d4')}<span class="txt"><span class="t">${t('dailyT')}${done ? ' ✓' : ''}</span>
    <span class="d">${L(tw.name)} · ${done ? t('dailyDone') : t('dailyNext', ((ds.ring % 7) + 1), RING[ds.ring % 7])}</span></span>${done ? '' : '<span class="badge" style="position:static">1</span>'}<span class="buy">${done ? t('practice') : t('play')}</span></button>`;
}
function showDaily() {
  mode = 'daily';
  const sp = dailySpec(), ds = dailyState(), done = ds.last === sp.key, tw = twistOf(sp.twist), as = advSpec(sp.g, sp.i);
  const dots = [0, 1, 2, 3].slice(0, as.colors).map(c => `<span class="cdot" style="background:${COLORS[c].fill}"></span>`).join('');
  const count = Math.min(26, as.count + (sp.twist === 'bounty' ? 6 : 0)), ne = Math.min(7, as.ne + (sp.twist === 'swarm' ? 2 : 0));
  const dd = new Date();
  show(`<div class="card">
    <div class="eyebrow">${t('dailyT')} · ${dd.toLocaleDateString(LANG === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'short' })}</div>
    <h2>${L(tw.name)}</h2>
    <p>${L(tw.desc)}</p>
    <div class="mrow"><span class="mi">${svg('tuft', '#6fe08a')} ${count}</span><span class="mi">${svg('grumble', '#8b90b5')} ${ne}</span><span class="mi">${dots}</span><span class="mi">${svg('clock', '#bfe8ff')} ${mmss(35 + 6 * count)}</span></div>
    <div class="section" style="margin:6px 0 0">${t('ringT')}</div>
    <div class="ring">${ringDots(ds, done)}</div>
    ${done ? `<p class="small">${t('dailyPractice')}</p>` : `<div class="rchips"><span>${t('chipSeeds')}</span><span>${t('chipClear')}</span><span>${t('chipRing', RING[ds.ring % 7])}</span></div>`}
    <p class="small">${t('ringRule')}</p>
    ${ds.bestKey === sp.key && ds.best ? `<div class="statline"><span>${t('bestL')}<b>${fmt(ds.best)}</b></span></div>` : ''}
    <button class="btn" data-act="dailygo">${done ? t('practice') : t('play')}</button>
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
}
function startDaily() {
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  const sp = dailySpec(), ds = dailyState(), rewarded = ds.last !== sp.key;
  freshRun();
  run.kind = 'adv'; run.mode = sp.twist === 'glass' ? 'oneheart' : 'normal'; run.adv = { g: sp.g, i: sp.i };
  run.daily = { ...sp, rewarded };
  run.garden = (sp.g - 1) * PER_GROVE + sp.i;
  if (rewarded) { ds.last = sp.key; ds.pend = RING[ds.ring % 7]; ds.ring++; saveMeta(); } // the attempt counts the moment it starts
  run.hp = maxHp();
  beginGarden();
}
/* ---------- Play log: one compact entry per attempt, purchase and app open; it travels inside the save code ----------
   a: attempt {t, g: garden id | 'D' daily | 'E' endless, r: 1 win / 0 loss / 2 quit, s: seconds, h: hits, d: sprouts delivered,
      e: seeds earned (incl. bonuses), st: stars, n: Nest levels [trail, speed, heart, frost], b: boosts, k: try number on this garden}
   b: Nest purchase {t, b: key, lv, c: cost} · o: app opened {t, c: seeds held} */
const LOG_MAX = 400;
function logEv(ev) { meta.log = meta.log || []; ev.t = Math.round(Date.now() / 1000); meta.log.push(ev); if (meta.log.length > LOG_MAX) meta.log.splice(0, meta.log.length - LOG_MAX); }
function logAttempt(g, res, earned, stars) {
  meta.tries = meta.tries || {};
  const k = (meta.tries[g] = (meta.tries[g] || 0) + 1);
  logEv({ a: 1, g, r: res, s: Math.round(run.kind === 'adv' ? run.at : run.gt || 0), h: run.hits || 0, d: run.tufts || 0, e: Math.round(earned), st: stars || 0,
    n: [meta.up.trail || 0, meta.up.speed || 0, meta.up.heart || 0, meta.up.frost || 0], b: Object.keys((run.boosts || {})).filter(x => run.boosts[x]).join(','), k, c: run.char, hc: (run.hitLog || []).slice(-12) });
  return k;
}
function dailyResult(won, quit) {
  mode = 'advresult';
  const ds = dailyState(), d = run.daily;
  let bonus = 0, ringPay = 0;
  if (d.rewarded) { if (won) bonus = d.twist === 'glass' ? 60 : 30; ringPay = ds.pend || 0; ds.pend = 0; }
  else run.coins = 0; // practice runs pay nothing
  run.coins += bonus;
  const earned = run.coins;
  logAttempt('D', won ? 1 : quit ? 2 : 0, earned + ringPay, 0);
  bankRun();
  meta.coins += ringPay;
  if (won && d.key === dayKey()) { if (ds.bestKey !== d.key) { ds.bestKey = d.key; ds.best = 0; } ds.best = Math.max(ds.best, run.score); }
  saveMeta();
  const n = claimable(), rn = roadReady();
  show(`<div class="card">
    <div class="eyebrow">${t('dailyT')} · ${L(twistOf(d.twist).name)}</div>
    <h2>${won ? t('cleared') : quit ? t('runEnded') : t('gotYou')}</h2>
    ${d.rewarded ? `<div class="statline"><span>${t('seedsL')}<b>+${fmt(earned - bonus)}</b></span>${bonus ? `<span>${t('bonusL')}<b>+${bonus}</b></span>` : ''}<span>${t('ringL')}<b>+${fmt(ringPay)}</b></span></div>` : `<p>${t('practiceNote')}</p>`}
    <div class="statline"><span>${t('score')}<b>${fmt(run.score)}</b></span>${ds.bestKey === d.key ? `<span>${t('bestL')}<b>${fmt(ds.best)}</b></span>` : ''}${won ? `<span>${t('timeL')}<b>${mmss(run.at)}</b></span>` : ''}</div>
    <div class="ring">${ringDots(ds, true)}</div>
    ${n ? `<p><b style="color:var(--gold)">${t('ready', n)}</b></p>` : ''}${rn ? `<p><b style="color:var(--gold)">${t('roadReady', rn)}</b></p>` : ''}
    <div class="btns"><button class="btn" data-act="hub">${t('home')}</button><button class="btn ghost" data-act="dailygo">${t('practice')}</button></div></div>`);
}

// Trail Road: 50 milestones on total tufts delivered. Cosmetics sit on fixed milestones, seeds on the rest.
const ROAD_N = 50;
const roadNeed = k => Math.round((15 * k + 1.6 * k * k) / 5) * 5;
const COS = {
  hat: {
    leaf:   { at: 0,  name: { en: 'Leaf', pt: 'Folhinha' } },
    bow:    { at: 3,  name: { en: 'Bow', pt: 'Lacinho' } },
    beanie: { at: 10, name: { en: 'Beanie', pt: 'Gorro' } },
    party:  { at: 20, name: { en: 'Party Hat', pt: 'Chapéu de Festa' } },
    flower: { at: 32, name: { en: 'Flower', pt: 'Flor' } },
    wizard: { at: 45, name: { en: 'Wizard Hat', pt: 'Chapéu de Mago' } },
    crown:  { at: 50, name: { en: 'Crown', pt: 'Coroa' } },
  },
  trail: {
    none:    { at: 0,  name: { en: 'Plain', pt: 'Simples' } },
    sparkle: { at: 6,  name: { en: 'Sparkles', pt: 'Brilhos' } },
    ribbon:  { at: 15, name: { en: 'Ribbon', pt: 'Fita' } },
    hearts:  { at: 27, name: { en: 'Hearts', pt: 'Corações' } },
    stars:   { at: 40, name: { en: 'Stars', pt: 'Estrelas' } },
  },
  portal: {
    none:      { at: 0,  name: { en: 'Plain', pt: 'Simples' } },
    petals:    { at: 8,  name: { en: 'Petals', pt: 'Pétalas' } },
    bubbles:   { at: 22, name: { en: 'Bubbles', pt: 'Bolhinhas' } },
    fireflies: { at: 36, name: { en: 'Fireflies', pt: 'Vaga-lumes' } },
  },
};
const COS_CATS = ['hat', 'trail', 'portal'];
function roadReward(k) {
  for (const cat of COS_CATS) for (const id in COS[cat]) if (COS[cat][id].at === k) return { cat, id };
  return { seeds: (10 + 4 * k) * (k % 10 === 0 ? 2 : 1) };
}
const roadReached = () => { let k = 0; while (k < ROAD_N && meta.st.tufts >= roadNeed(k + 1)) k++; return k; };
const roadReady = () => Math.max(0, roadReached() - (meta.road || 0));
const cosOwned = (cat, id) => COS[cat][id] && COS[cat][id].at <= (meta.road || 0);
function cosState() { meta.cos = meta.cos || {}; for (const c of COS_CATS) if (!meta.cos[c] || !cosOwned(c, meta.cos[c])) meta.cos[c] = Object.keys(COS[c])[0]; return meta.cos; }
const catName = c => t('cat_' + c);
function rewardLabel(r) { return r.seeds ? `${SEED}${r.seeds}` : `${catName(r.cat)}: ${L(COS[r.cat][r.id].name)}`; }
function cosCanvas(cat, id, size) { return `<canvas class="avatar anim" data-kind="cos" data-cat="${cat}" data-id="${id}" style="width:${size}px;height:${size}px" aria-hidden="true"></canvas>`; }
let roadTab = 'road';
function showRoad() {
  mode = 'road';
  cosState();
  const got = meta.road || 0, reached = roadReached(), ready = Math.max(0, reached - got);
  const nextK = Math.min(ROAD_N, reached + 1), prevNeed = reached ? roadNeed(reached) : 0, nextNeed = roadNeed(nextK);
  const pct = reached >= ROAD_N ? 100 : Math.max(0, Math.min(100, (meta.st.tufts - prevNeed) / (nextNeed - prevNeed) * 100));
  const tabs = `<div class="tabs"><button class="btn small ${roadTab === 'road' ? '' : 'ghost'}" data-act="roadtab" data-k="road">${t('roadTab')}${ready > 0 ? ' (' + ready + ')' : ''}</button><button class="btn small ${roadTab === 'look' ? '' : 'ghost'}" data-act="roadtab" data-k="look">${t('lookTab')}</button></div>`;
  let body = '';
  if (roadTab === 'road') {
    let rows = '';
    for (let k = 1; k <= ROAD_N; k++) {
      const r = roadReward(k), st = k <= got ? 'got' : k <= reached ? 'ready' : 'lock';
      const icon = r.seeds ? `<span class="rico seed">${SEED}</span>` : `<span class="rico">${cosCanvas(r.cat, r.id, 34)}</span>`;
      rows += `<div class="rnode ${st}${k === nextK && st === 'lock' ? ' cur' : ''}"><span class="rk">${k}</span>${icon}<span class="rt"><span class="t">${rewardLabel(r)}</span><span class="d">${t('tuftsN', fmt(roadNeed(k)))}</span></span><span class="rs">${st === 'got' ? '✓' : st === 'ready' ? `<span class="tag">${t('readyTag')}</span>` : svg('lock', 'currentColor')}</span></div>`;
    }
    body = `<div class="chestbar"><span class="txt"><span class="t">${reached >= ROAD_N ? t('roadDone') : t('roadNext', nextK, fmt(Math.max(0, nextNeed - meta.st.tufts)))}</span><span class="prog"><i style="width:${pct}%"></i></span></span>${ready ? `<button class="buy" data-act="roadclaim">${t('claimN', ready)}</button>` : ''}</div>
      <div class="scroll"><div class="road">${rows}</div></div>`;
  } else {
    body = '<div class="scroll">' + COS_CATS.map(cat => `<div class="section">${catName(cat)}</div><div class="cosgrid">${Object.keys(COS[cat]).map(id => {
      const own = cosOwned(cat, id), on = meta.cos[cat] === id;
      return `<button class="cos ${on ? 'sel' : ''}" data-act="equip" data-k="${cat}:${id}" ${own ? '' : 'disabled'} aria-pressed="${on}">${cosCanvas(cat, id, 46)}<span class="t">${L(COS[cat][id].name)}</span><span class="d">${on ? t('equipped') : own ? t('equip') : svg('lock', 'currentColor') + ' ' + t('atMilestone', COS[cat][id].at)}</span></button>`;
    }).join('')}</div>`).join('') + '</div>';
  }
  const fresh = lastShown !== 'road';
  show(`<div class="card tall"><div class="hubtop"><div><div class="eyebrow">${t('tuftsN', fmt(meta.st.tufts))}</div><h2>${t('roadT')}</h2></div><div class="wallet" style="font-size:18px">${SEED}${fmt(meta.coins)}</div></div>
    <p class="small" style="margin-top:-4px">${t('roadHow')}</p>
    ${tabs}${body}
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
  const cur = overlay.querySelector('.rnode.ready, .rnode.cur'), sc = overlay.querySelector('.scroll');
  if (fresh && roadTab === 'road' && cur && sc) sc.scrollTop = Math.max(0, cur.offsetTop - sc.offsetTop - sc.clientHeight / 2 + 26);
}
function claimRoad() {
  const got = meta.road || 0, reached = roadReached();
  if (reached <= got) return;
  let seeds = 0; const items = [];
  for (let k = got + 1; k <= reached; k++) { const r = roadReward(k); if (r.seeds) seeds += r.seeds; else items.push(L(COS[r.cat][r.id].name)); }
  meta.road = reached; meta.coins += seeds; saveMeta();
  showChest(t('roadT'), [seeds ? t('seeds', seeds) : '', ...items.map(x => t('newLook', x))].filter(Boolean).join(' · '), 'road');
}

// Endless Nest: once any upgrade is maxed, small repeatable upgrades open. Each buy costs 15% more than the last.
const REPEAT = [
  { k: 'rseed',  base: 80, name: { en: 'Seed Sprout', pt: 'Broto de Sementes' }, desc: { en: '+1% seeds from everything.', pt: '+1% de sementes em tudo.' } },
  { k: 'rscore', base: 60, name: { en: 'High Scorer', pt: 'Pontuador' },              desc: { en: '+1% points.', pt: '+1% de pontos.' } },
  { k: 'rfrost', base: 70, name: { en: 'Long Winter', pt: 'Inverno Longo' },     desc: { en: '+1% freeze time.', pt: '+1% no tempo de congelamento.' } },
];
const repLv = k => (meta.rep && meta.rep[k]) || 0;
const repCost = r => Math.round(r.base * Math.pow(1.15, repLv(r.k)));
const repOpen = () => false; // repeat upgrades were removed

// Cosmetic drawing, shared by the board and the menu previews.
// Painted hats sit on the top of each fruit's head (measured per hero), bottom edge tucked in a little.
const HAT_TOP = { pip: -0.74, moss: -1.08, bolt: -0.82, ember: -0.66, nova: -0.74 };
const HAT_FIT = { bow: [1.1, 0.15, 0.3], beanie: [1.5, 0, 0.38], party: [1.1, 0.08, 0.18], flower: [1.45, 0, 0.56], wizard: [1.65, 0.04, 0.25], crown: [1.25, 0, 0.32] }; // width, x shift, tuck (in r)
function drawHat(g, x, y, r, id, tm, k) {
  const im = id !== 'leaf' && spr('hat-' + id);
  if (im && im.naturalWidth) {
    const f = HAT_FIT[id] || [1.1, 0, 0.25], w = r * f[0], h = w * im.naturalHeight / im.naturalWidth;
    const by = y + r * (HAT_TOP[k || meta.char] ?? -0.74) + r * f[2];
    const wob = reduceMotion || !tm ? 0 : Math.sin(tm * 2.2) * 0.04;
    g.save(); g.translate(x + r * f[1], by); g.rotate(wob + (id === 'bow' ? 0.18 : 0)); g.drawImage(im, -w / 2, -h, w, h); g.restore();
    return;
  }
  const top = y - r * 0.92;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  if (id === 'leaf') { g.fillStyle = '#6fe08a'; g.beginPath(); g.ellipse(x + r * 0.18, y - r * 1.22, r * 0.3, r * 0.15, -0.5, 0, TAU); g.fill(); }
  else if (id === 'bow') {
    g.fillStyle = '#ff7aa8'; g.strokeStyle = '#a3365e'; g.lineWidth = Math.max(1, r * 0.06);
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + r * 0.3, top); g.lineTo(x + r * 0.3 + s * r * 0.42, top - r * 0.26); g.lineTo(x + r * 0.3 + s * r * 0.42, top + r * 0.26); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = '#ffd1e2'; circ(g, x + r * 0.3, top, r * 0.11); g.fill();
  } else if (id === 'beanie') {
    g.fillStyle = '#5aa9ff'; g.beginPath(); g.ellipse(x, top + r * 0.1, r * 0.62, r * 0.5, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#d6ecff'; rr(g, x - r * 0.66, top + r * 0.02, r * 1.32, r * 0.2, r * 0.1); g.fill();
    g.fillStyle = '#ffffff'; circ(g, x, top - r * 0.42, r * 0.15); g.fill();
  } else if (id === 'party') {
    g.save(); g.translate(x + r * 0.12, top + r * 0.12); g.rotate(0.22);
    g.fillStyle = '#ffcd4a'; g.beginPath(); g.moveTo(-r * 0.36, 0); g.lineTo(r * 0.36, 0); g.lineTo(0, -r * 0.95); g.closePath(); g.fill();
    g.strokeStyle = '#ff6f61'; g.lineWidth = Math.max(1.2, r * 0.09); g.beginPath(); g.moveTo(-r * 0.26, -r * 0.28); g.lineTo(r * 0.2, -r * 0.42); g.moveTo(-r * 0.14, -r * 0.6); g.lineTo(r * 0.1, -r * 0.68); g.stroke();
    g.fillStyle = '#9fe3d4'; circ(g, 0, -r * 0.98, r * 0.13); g.fill(); g.restore();
  } else if (id === 'flower') {
    const fx = x + r * 0.34, fy = top + r * 0.02, spin = tm * 0.4;
    g.fillStyle = '#fff1f6'; for (let k = 0; k < 5; k++) { const a = spin + k * TAU / 5; circ(g, fx + Math.cos(a) * r * 0.2, fy + Math.sin(a) * r * 0.2, r * 0.14); g.fill(); }
    g.fillStyle = '#ffcd4a'; circ(g, fx, fy, r * 0.12); g.fill();
  } else if (id === 'wizard') {
    g.fillStyle = '#7b5cff'; g.beginPath(); g.ellipse(x, top + r * 0.12, r * 0.72, r * 0.16, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - r * 0.45, top + r * 0.1); g.quadraticCurveTo(x - r * 0.1, top - r * 0.7, x + r * 0.42, top - r * 1.02); g.quadraticCurveTo(x + r * 0.15, top - r * 0.5, x + r * 0.45, top + r * 0.1); g.closePath(); g.fill();
    g.fillStyle = '#ffcd4a'; g.beginPath(); const sx = x + r * 0.02, sy = top - r * 0.3, ss = r * 0.13;
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? ss * 0.45 : ss; g.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); } g.closePath(); g.fill();
  } else if (id === 'crown') crownPath(g, x, top + r * 0.1, r * 1.05, '#ffcd4a', '#ff6f61');
  g.restore();
}
function fxPic(g, name, x, y, size, rot, alpha) { const im = spr(name); if (!im || !im.naturalWidth) return false; g.save(); if (alpha != null) g.globalAlpha *= alpha; g.translate(x, y); if (rot) g.rotate(rot); g.drawImage(im, -size / 2, -size / 2, size, size); g.restore(); return true; }
function drawTrailSkin(g, x, y, r, id, i, tm) {
  if (id === 'sparkle') { const a = tm * 2 + i * 1.7, tw = 0.5 + 0.5 * Math.sin(tm * 5 + i * 2); if (fxPic(g, 'fx-sparkle', x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r, r * (0.45 + 0.35 * tw), 0, 0.5 + 0.5 * tw)) return; }
  if (id === 'hearts') { const bob = Math.sin(tm * 3 + i) * r * 0.2; if (fxPic(g, 'fx-heart', x + r * 0.95, y - r * 0.8 + bob, r * 0.62, Math.sin(tm * 2 + i) * 0.2, 0.95)) return; }
  if (id === 'stars') { const a = -tm * 1.6 + i * 2.3; if (fxPic(g, 'fx-star', x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2, r * 0.6, a)) return; }
  if (id === 'sparkle') {
    const a = tm * 2 + i * 1.7, tw = 0.5 + 0.5 * Math.sin(tm * 5 + i * 2);
    const sx = x + Math.cos(a) * r * 1.25, sy = y + Math.sin(a) * r * 1.0, s = r * 0.22 * (0.5 + tw * 0.5);
    g.save(); g.globalAlpha = 0.5 + 0.5 * tw; g.fillStyle = '#fff6c9';
    g.beginPath(); g.moveTo(sx, sy - s * 2); g.lineTo(sx + s * 0.5, sy); g.lineTo(sx, sy + s * 2); g.lineTo(sx - s * 0.5, sy); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(sx - s * 2, sy); g.lineTo(sx, sy + s * 0.5); g.lineTo(sx + s * 2, sy); g.lineTo(sx, sy - s * 0.5); g.closePath(); g.fill(); g.restore();
  } else if (id === 'hearts') {
    const bob = Math.sin(tm * 3 + i) * r * 0.2, hx = x + r * 0.95, hy = y - r * 0.8 + bob, s = r * 0.26;
    g.save(); g.fillStyle = '#ff7aa8'; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(hx, hy + s);
    g.bezierCurveTo(hx - s * 1.6, hy - s * 0.2, hx - s * 0.5, hy - s * 1.3, hx, hy - s * 0.35); g.bezierCurveTo(hx + s * 0.5, hy - s * 1.3, hx + s * 1.6, hy - s * 0.2, hx, hy + s); g.fill(); g.restore();
  } else if (id === 'stars') {
    const a = -tm * 1.6 + i * 2.3, sx = x + Math.cos(a) * r * 1.2, sy = y + Math.sin(a) * r * 1.2, ss = r * 0.24;
    g.save(); g.fillStyle = '#ffcd4a'; g.beginPath();
    for (let k = 0; k < 10; k++) { const b = a + k * Math.PI / 5, rad = k % 2 ? ss * 0.45 : ss; g.lineTo(sx + Math.cos(b) * rad, sy + Math.sin(b) * rad); } g.closePath(); g.fill(); g.restore();
  }
}
function drawRibbon(g, pts, w, color) {
  if (pts.length < 2) return;
  g.save(); g.strokeStyle = color; g.globalAlpha = 0.45; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
  for (let k = 1; k < pts.length - 1; k++) { const mx = (pts[k].x + pts[k + 1].x) / 2, my = (pts[k].y + pts[k + 1].y) / 2; g.quadraticCurveTo(pts[k].x, pts[k].y, mx, my); }
  g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); g.stroke();
  g.globalAlpha = 0.55; g.strokeStyle = '#ffffff'; g.lineWidth = w * 0.25; g.stroke(); g.restore(); // satin sheen
}
function drawPortalFx(g, cx, cy, s, id, tm, seed) {
  if (id === 'petals' && spr('fx-petal')) { for (let k = 0; k < 4; k++) { const a = tm * 0.9 + k * TAU / 4 + seed, rad = s * (0.5 + 0.05 * Math.sin(tm * 2 + k)); fxPic(g, 'fx-petal', cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, s * 0.22, a + 0.8); } return; }
  if (id === 'fireflies' && spr('fx-firefly')) { for (let k = 0; k < 3; k++) { const a = tm * (0.5 + k * 0.13) + k * 1.9 + seed, tw = 0.5 + 0.5 * Math.abs(Math.sin(tm * 3 + k)); fxPic(g, 'fx-firefly', cx + Math.cos(a) * s * 0.55, cy + Math.sin(a * 1.3) * s * 0.45, s * 0.24, Math.sin(a) * 0.4, tw); } return; }
  if (id === 'petals') {
    for (let k = 0; k < 4; k++) { const a = tm * 0.9 + k * TAU / 4 + seed, rad = s * (0.48 + 0.05 * Math.sin(tm * 2 + k));
      g.save(); g.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); g.rotate(a + 0.8); g.fillStyle = k % 2 ? '#ffb3cf' : '#ffd6e6';
      g.beginPath(); g.ellipse(0, 0, s * 0.09, s * 0.05, 0, 0, TAU); g.fill(); g.restore(); }
  } else if (id === 'bubbles') {
    for (let k = 0; k < 3; k++) { const ph = (tm * 0.5 + k / 3 + seed * 0.1) % 1, bx = cx + Math.sin(ph * 6 + k * 2) * s * 0.18 + (k - 1) * s * 0.18, by = cy - s * 0.15 - ph * s * 0.55;
      g.save(); g.globalAlpha = 0.8 * (1 - ph); g.strokeStyle = '#d9f4ff'; g.lineWidth = Math.max(1, s * 0.03); circ(g, bx, by, s * (0.05 + 0.03 * ph)); g.stroke(); g.restore(); }
  } else if (id === 'fireflies') {
    for (let k = 0; k < 4; k++) { const a = tm * (0.5 + k * 0.13) + k * 1.9 + seed, fx = cx + Math.cos(a) * s * 0.5, fy = cy + Math.sin(a * 1.3) * s * 0.42, tw = 0.4 + 0.6 * Math.abs(Math.sin(tm * 3 + k));
      g.save(); g.globalAlpha = tw * 0.35; g.fillStyle = '#fff3a0'; circ(g, fx, fy, s * 0.09); g.fill(); g.globalAlpha = tw; circ(g, fx, fy, s * 0.035); g.fill(); g.restore(); }
  }
}
function drawCosPreview(g, w, cat, id, tm, i) {
  const c = CHARS[meta.char] || CHARS.pip;
  if (cat === 'hat') { const r = w * 0.22; drawHero(g, meta.char, w / 2, w * 0.6, r, 0, 0.2, reduceMotion ? -1 : i + 0.3, tm, 0, 0, id === 'leaf'); if (id !== 'leaf') drawHat(g, w / 2, w * 0.6, r, id, tm, meta.char); }
  else if (cat === 'trail') {
    const pts = [0, 1, 2].map(k => ({ x: w * (0.22 + k * 0.28), y: w * 0.55 + Math.sin(tm * 2 + k) * w * 0.03 }));
    if (id === 'ribbon') drawRibbon(g, pts, w * 0.12, '#ff8a8a');
    pts.forEach((p, k) => { drawTrailSkin(g, p.x, p.y, w * 0.12, id, k, tm); drawTuft(g, p.x, p.y, w * 0.12, k, reduceMotion ? -1 : k, tm); });
  } else {
    const cx = w / 2, cy = w / 2, s = w * 0.62, spin = reduceMotion ? 0 : tm * 0.35, wr = spr('ob-wreath'), col = COLORS[1].fill;
    if (wr && wr.naturalWidth) {
      const R = s * (0.4 + 0.05 * Math.sin(tm * 2.4)), gl = g.createRadialGradient(cx, cy, 0, cx, cy, R);
      gl.addColorStop(0, '#ffffffee'); gl.addColorStop(0.25, col + 'dd'); gl.addColorStop(0.6, col + '55'); gl.addColorStop(1, col + '00');
      g.fillStyle = gl; circ(g, cx, cy, R); g.fill(); g.drawImage(wr, cx - s * 0.52, cy - s * 0.52, s * 1.04, s * 1.04);
    } else {
      g.fillStyle = col + '30'; circ(g, cx, cy, s * 0.45); g.fill();
      g.strokeStyle = col; g.lineWidth = s * 0.08; g.beginPath(); g.arc(cx, cy, s * 0.37, spin, spin + TAU * 0.78); g.stroke();
    }
    g.fillStyle = col; circ(g, cx, cy, s * 0.14); g.fill();
    drawPortalFx(g, cx, cy, s, id, tm, i);
  }
}

