const NODES = {
  garden:    { icon: 'tuft',   bg: '#4fb86a', fg: '#0f2e17' },
  thorny:    { icon: 'hit',    bg: '#ff6f61', fg: '#3a0d08' },
  challenge: { icon: 'trophy', bg: '#5cc6ff', fg: '#0b2a40' },
  mystery:   { icon: null,     bg: '#b07aff', fg: '#25124a' },
  camp:      { icon: 'home',   bg: '#ffcd4a', fg: '#3a2a05' },
  treasure:  { icon: 'star',   bg: '#e0a050', fg: '#3a2405' },
  boss:      { icon: 'crown',  bg: '#ff9f43', fg: '#3a1a05' },
};
const PLAYABLE = { garden: 1, thorny: 1, challenge: 1, mystery: 1, boss: 1 };
function genGroveMap(gv) {
  const pools = [['garden', 'garden', 'thorny', 'challenge', 'mystery'], ['garden', 'thorny', 'camp', 'treasure', 'challenge', 'mystery'], ['camp', 'garden', 'thorny', 'treasure', 'mystery', 'challenge']];
  const rows = pools.map((pool, r) => {
    const n = r === 2 ? 2 + (Math.random() < 0.5 ? 1 : 0) : 3;
    let kinds;
    do { kinds = Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]); }
    while (!kinds.some(k => PLAYABLE[k]) || new Set(kinds).size < Math.min(2, n) || (r === 0 && gv === 1 && !kinds.includes('garden')));
    return kinds.map(k => ({ k, links: [] }));
  });
  rows.push([{ k: 'boss', links: [] }]);
  for (let r = 0; r < rows.length - 1; r++) {
    const a = rows[r], b = rows[r + 1];
    a.forEach((nd, j) => { const t2 = a.length > 1 ? j / (a.length - 1) : 0.5; const near = Math.round(t2 * (b.length - 1)); nd.links = [near]; if (b.length > 1 && Math.random() < 0.5) { const other = near + (t2 * (b.length - 1) >= near ? 1 : -1); if (other >= 0 && other < b.length) nd.links.push(other); } });
    b.forEach((nd, j) => { if (!a.some(x => x.links.includes(j))) { const from = Math.round((b.length > 1 ? j / (b.length - 1) : 0.5) * (a.length - 1)); a[from].links.push(j); } });
  }
  return { gv, rows, path: [] };
}
function mapReachable(j) {
  const m = run.map, step = m.path.length;
  if (step >= m.rows.length) return false;
  if (step === 0) return true;
  const prev = m.path[step - 1];
  return prev < 0 || m.rows[step - 1][prev].links.includes(j);
}
function ensureMap() { // older saved runs have no map: build one for the current grove and mark the rows already played
  if (!run.map || run.map.gv !== grove()) { run.map = genGroveMap(grove()); run.map.path = Array(gardenInGrove()).fill(-1); }
}
function startRunMap() {
  if (meta.ej == null && !window.__noLearn) { meta.ej = 0; meta.learned = meta.learned || {}; meta.learned.cards = 1; saveMeta(); } // first Endless Run gets its own guided steps
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  demoBoard();
  run.garden = 0; run.map = genGroveMap(1);
  showRunMap();
}
function nodeLabel(k) { return t('node_' + k); }
function showRunMap() {
  mode = 'runmap';
  const m = run.map, step = m.path.length;
  let rowsHtml = '';
  for (let r = m.rows.length - 1; r >= 0; r--) {
    rowsHtml += `<div class="mrow2">` + m.rows[r].map((nd, j) => {
      const N = NODES[nd.k], chosen = m.path[r] === j, can = r === step && mapReachable(j), past = r < step;
      const ico = N.icon ? svg(N.icon, chosen || can ? N.fg : '#c9cde6') : `<b style="color:${chosen || can ? N.fg : '#c9cde6'}">?</b>`;
      return `<button class="mnode ${nd.k === 'boss' ? 'boss' : ''} ${chosen ? 'chosen' : ''} ${can ? 'can' : ''} ${past && !chosen ? 'skip' : ''}" data-act="mapgo" data-k="${j}" data-r="${r}" ${can ? '' : 'disabled'} style="--nb:${N.bg}" aria-label="${nodeLabel(nd.k)}">
        <span class="disc">${ico}</span><span class="lbl">${nodeLabel(nd.k)}</span>${chosen && r === step - 1 ? `<span class="here">${avatar(run.char || meta.char, 26)}</span>` : ''}</button>`;
    }).join('') + `</div>`;
  }
  const can = m.rows[step] ? m.rows[step].map((nd, j) => mapReachable(j) ? nodeLabel(nd.k) : null).filter(Boolean) : [];
  show(`<div class="card tall"><div class="hubtop"><div><div class="eyebrow">${t('grove')} ${m.gv} · ${t('mapStep', Math.min(step + 1, 4), 4)}</div><h2>${t('pickPath')}</h2></div><div class="wallet" style="font-size:18px">${SEED}${fmt(run.coins)}</div></div>
    <div class="scroll"><div class="runmap" id="runmap"><svg class="mlinks" id="mlinks"></svg>${rowsHtml}</div>
    ${step === 0 ? `<div class="mstart">${avatar(run.char || meta.char, 30)}<span>${t('youHere')}</span></div>` : ''}
    <div class="mlegend">${[...new Set(m.rows.flat().map(nd => nd.k))].filter(k => k !== 'boss').map(k => `<span><i style="background:${NODES[k].bg}"></i><b>${nodeLabel(k)}</b> ${t('leg_' + k)}</span>`).join('')}</div></div>
    <button class="btn ghost small" data-act="quit">${t('endKeep')}</button></div>`);
  requestAnimationFrame(drawMapLinks);
}
function drawMapLinks() {
  const box = document.getElementById('runmap'), svgEl = document.getElementById('mlinks');
  if (!box || !svgEl || !run.map) return;
  const bb = box.getBoundingClientRect(), m = run.map;
  svgEl.setAttribute('width', bb.width); svgEl.setAttribute('height', bb.height);
  const pos = (r, j) => { const el = box.querySelector(`.mnode[data-r="${r}"][data-k="${j}"] .disc`); if (!el) return null; const q = el.getBoundingClientRect(); return [q.left - bb.left + q.width / 2, q.top - bb.top + q.height / 2]; };
  let lines = '';
  m.rows.forEach((row, r) => row.forEach((nd, j) => nd.links.forEach(k => {
    const a = pos(r, j), b = pos(r + 1, k); if (!a || !b) return;
    const on = m.path[r] === j && (m.path[r + 1] === k || (r + 1 === m.path.length && mapReachable(k)));
    lines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${on ? '#f5b82e' : '#d2b383'}" stroke-width="${on ? 4 : 3}" ${on ? '' : 'stroke-dasharray="5 6"'} stroke-linecap="round"/>`;
  })));
  svgEl.innerHTML = lines;
}
function goNode(j) {
  const m = run.map, step = m.path.length;
  if (!mapReachable(j)) return;
  m.path.push(j);
  let k = m.rows[step][j].k;
  run.garden = (m.gv - 1) * PER_GROVE + m.path.length;
  run.chal = null; run.chalDone = false;
  if (k === 'mystery') { // a surprise: a treasure, a thorny garden, or a lucky garden that heals you
    const roll = Math.random();
    k = roll < 0.35 ? 'treasure' : roll < 0.65 ? 'thorny' : 'lucky';
    floatText(player.x, player.y - 1.5, t('mystery_' + k), '#d0b0ff');
    if (k === 'lucky') { run.hp = Math.min(maxHp(), run.hp + 1); run.coins += 10; }
  }
  run.node = k;
  if (k === 'camp') { run.campMid = true; run.campBought = {}; run.hp = Math.min(maxHp(), run.hp + 1); showCamp(); return; }
  if (k === 'treasure') { run.coins += Math.round(15 * coinMult()); showChest(t('treasureT'), t('treasureLoot', Math.round(15 * coinMult())), 'nodecards'); return; }
  if (k === 'challenge') run.chal = Math.random() < 0.5 ? { k: 'nohit' } : { k: 'big', n: Math.min(4, cap()) };
  beginGarden();
  if (run.chal) { setTip(run.chal.k === 'nohit' ? t('chalNoHit') : t('chalBig', run.chal.n)); run.tipUntil = 6; }
}
// After a garden: thorny and won challenges pay a card; then back to the map.
function afterNode() {
  const k = run.node;
  if (k === 'thorny' || (k === 'challenge' && run.chalDone)) { if (k === 'challenge') run.coins += Math.round(25 * coinMult()); openCards('node'); return; }
  ensureMap(); showRunMap();
}

function startGame() {
  if (meta.ej == null && !window.__noLearn) { meta.ej = 0; meta.learned = meta.learned || {}; meta.learned.cards = 1; saveMeta(); } // first Endless Run gets its own guided steps
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  freshRun();
  beginGarden();
}
