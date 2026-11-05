// Endless runs are saved at the start of every garden, so a closed tab or a reload can continue the run.
function saveRun() {
  if (!run || run.kind !== 'endless') return;
  try { meta.savedRun = JSON.parse(JSON.stringify({ v: 1, at: Date.now(), run, sk, wp, evo })); saveMeta(); } catch (e) {}
}
function clearRun() { if (meta.savedRun) { delete meta.savedRun; saveMeta(); } }
function continueRun() {
  const sv = meta.savedRun;
  if (!sv || !sv.run) return false;
  freshRun();
  sk = { ...sk, ...sv.sk }; wp = { ...wp, ...sv.wp }; evo = { ...evo, ...sv.evo };
  for (const k in sk) if (!SKILLS[k]) delete sk[k]; for (const k in wp) if (!WEAPONS[k]) delete wp[k]; for (const k in evo) if (!EVO2[k] && !EVOS[k]) delete evo[k];
  run = { ...run, ...sv.run };
  pendingUps = 0; chestPending = false; clearPending = false;
  beginGarden();
  return true;
}
function beginGarden() {
  saveRun();
  setTip(null); newGarden();
  if (run.boss && !(meta.bossSeen || {})[run.bossType]) showBossIntro();
  else { resume(); if (run.boss) banner(t('bossTip')[run.bossType], '#f5b82e', 'crown'); } }
function showBossIntro() {
  mode = 'bossintro';
  meta.bossSeen = { ...(meta.bossSeen || {}), [run.bossType]: 1 }; saveMeta();
  const need = portals.filter(q => !q.rainbow && !q.golden).length, gold = artGet('ob-gate'), cage = artGet('ob-cage');
  const im = src => src ? `<img src="${src}" alt="" style="width:30px;height:30px;object-fit:contain">` : '';
  show(`<div class="card bossintro">
    <div class="eyebrow">${t('grove')} ${grove()}</div>
    <div style="display:flex;justify-content:center"><canvas class="avatar anim" data-kind="boss" data-type="${run.bossType}" style="width:96px;height:96px" aria-hidden="true"></canvas></div>
    <h2>${t('bossName')[run.bossType]}</h2>
    <p class="btip">${t('bossTip')[run.bossType]}</p>
    <div class="bsteps">
      <span class="bs">${svg('key', '#ffcd4a')}<b>×${need}</b><small>${LANG === 'pt' ? 'Encha cada portal' : 'Fill each portal'}</small></span><i>›</i>
      <span class="bs">${im(cage)}<small>${LANG === 'pt' ? 'Gaiola abre' : 'Cage opens'}</small></span><i>›</i>
      <span class="bs">${im(gold)}<small>${LANG === 'pt' ? 'Broto Dourado ao portão' : 'Golden sprout to the gate'}</small></span>
    </div>
    <button class="btn" data-act="fight">${t('fight')}</button></div>`);
}

/* ---------- adventure trail (Candy Crush-style map, endless) ---------- */
const BOSS_STARS = 14; // of 21 (7 gardens × 3★)
const advId = (g, i) => g + '-' + i;
const advStars = (g, i) => (meta.adv && meta.adv[advId(g, i)]) || 0;
const groveStars = g => [1, 2, 3, 4, 5, 6, 7].reduce((a, i) => a + advStars(g, i), 0);
const totalStars = () => Object.values(meta.adv || {}).reduce((a, b) => a + b, 0);
const SEASON_GROVES = 12; // Season 1 ends at grove 12; new groves arrive in later seasons
function advUnlocked(g, i) {
  if (g < 1 || g > SEASON_GROVES) return false;
  if (i === 1) return g === 1 || advStars(g - 1, 5) > 0;
  if (isBossI(i)) return advStars(g, BOSS_I - 1) > 0 && groveStars(g) >= BOSS_STARS;
  return advStars(g, i - 1) > 0;
}
function advTop() { let g = 1; while (advUnlocked(g + 1, 1)) g++; return g; }
const nextNode = (g, i) => i < BOSS_I ? { g, i: i + 1 } : { g: g + 1, i: 1 };
const BOOSTS = [
  { k: 'bubble', cost: 15, name: { en: 'Spare Bubble', pt: 'Bolha Reserva' }, desc: { en: "Blocks one hit, and it won't cost you a star.", pt: 'Bloqueia um golpe, e ele não te custa estrela.' } },
];
let pre = { g: 1, i: 1, sel: {} };
// What the Nest should have by this grove. Skill can beat a small gap; the ✓/✗ shows when an upgrade would help.
// The Nest level each grove is balanced for (bot simulations use exactly this): every upgrade at ⌊grove/2⌋, hearts up to 3.
const nestGoal = G => G <= 6 ? G : Math.min(10, 6 + Math.round((G - 6) * 2 / 3));
// The goal is everything the trail has unlocked by this grove (late levels unlock staggered, 2 per grove).
const NEST_REC = G => { const r = {}; NEST.forEach(u => { r[u.k] = u.gate.filter(g => g <= G).length; }); return r; };
function recRow(G) {
  const r = NEST_REC(G), IC = { speed: ['speed', '#ffcd4a'], trail: ['stack', '#5cc6ff'], heart: ['heart', '#ff6f61'] };
  const parts = Object.keys(r).filter(k => r[k] > 0).map(k => { const ok = (meta.up[k] || 0) >= r[k]; return `<span class="rk ${ok ? 'ok' : 'no'}">${svg(IC[k][0], IC[k][1])}${r[k]}${ok ? '✓' : '✗'}</span>`; });
  if (!parts.length) return '';
  const miss = Object.keys(r).some(k => (meta.up[k] || 0) < r[k]);
  const inner = `${LANG === 'pt' ? 'Ninho' : 'Nest'} ${parts.join('')}${miss ? ' ›' : ''}`;
  return `<div class="mrow recrow">${miss ? `<button class="mi tipchip" data-act="nestpre" aria-label="${LANG === 'pt' ? 'Ninho recomendado' : 'Recommended Nest'}">${inner}</button>` : `<span class="mi">${inner}</span>`}</div>`;
}
function showPrelevel(g, i) {
  mode = 'prelevel';
  if (pre.g !== g || pre.i !== i) pre = { g, i, sel: {} };
  const sp = advSpec(g, i);
  const cost = BOOSTS.reduce((a, b) => a + (pre.sel[b.k] ? b.cost : 0), 0);
  const best = advStars(g, i);
  const BI = { cold: ['frost', '#bfe8ff', '#11304a'], heart: ['heart', '#ff6f61', '#3a0d08'], magnet: ['magnet', '#ff9ec0', '#40102a'], bubble: ['shield', '#9fe3d4', '#0f3530'] };
  const items = BOOSTS.map(b => {
    const on = !!pre.sel[b.k];
    const afford = on || meta.coins - cost >= b.cost;
    const [ic, bg, fg] = BI[b.k];
    return `<button class="mini bst ${on ? 'sel' : ''}" data-act="boost" data-k="${b.k}" ${afford ? '' : 'disabled'} aria-label="${L(b.name)}: ${L(b.desc)}">
      <span class="bico" style="background:${bg}">${svg(ic, fg)}</span><span class="t">${L(b.name)}</span><span class="cost">${on ? '✓ ' : ''}${SEED}${b.cost}</span></button>`;
  }).join('');
  const sel = BOOSTS.filter(b => pre.sel[b.k]).map(b => L(b.desc)).join(' · ');
  const bt = BOSS_ORDER[(g - 1) % BOSS_ORDER.length];
  const a = advAllow(g), bh = advBonusHp(g) + advHpAdj(g, i); // net heart change, same sum maxHp() uses
  const dots = [0, 1, 2, 3].slice(0, sp.colors).map(c => `<span class="cdot" style="background:${COLORS[c].fill}"></span>`).join('');
  const goal = isBossI(i)
    ? `<span class="mi">${svg('key', '#fff1a8')} ${sp.colors >= 4 && sp.dual ? '3–4' : sp.colors}</span><span class="mi">→</span><span class="mi">${svg('crown', '#ffcd4a')}</span><span class="mi">${svg('tuft', '#fff1a8')} → ${svg('crown', '#ffcd4a')}</span>`
    : `<span class="mi">${svg('tuft', '#6fe08a')} ${sp.count}</span><span class="mi">${svg('grumble', '#8b90b5')} ${sp.ne}</span><span class="mi">${dots}</span>`;
  show(`<div class="card">
    <div class="eyebrow">${isBossI(i) ? t('bossOf', g) : t('gardenN', g, i)}</div>
    <h2>${isBossI(i) ? t('bossName')[bt] : t('garden') + ' ' + g + '-' + i}</h2>
    ${sp.hard ? `<div class="hardtag">${LANG === 'pt' ? 'Jardim difícil · mais sementes' : 'Hard garden · more seeds'}</div>` : ''}
    <div class="bigstars" style="font-size:28px">${[1, 2, 3].map(k => `<span style="color:${k <= best ? '#ffcd4a' : 'var(--line)'}">★</span>`).join('')}</div>
    <div class="mrow">${goal}</div>
    ${newRow(g, i)}
    ${recRow(g)}
    <div class="mrow">${starChips(g)}${advPar(g, i, sp.count) ? `<span class="mi">${svg('clock', '#bfe8ff')} ${mmss(advPar(g, i, sp.count))}</span>` : ''}${bh ? `<span class="mi"${bh < 0 ? ' style="color:var(--coral)"' : ''}>${svg('heart', '#ff6f61')} ${bh > 0 ? '+' : '−'}${Math.abs(bh)}</span>` : ''}${meta.advBest && meta.advBest[advId(g, i)] ? `<span class="mi">${t('bestL')} ${fmt(meta.advBest[advId(g, i)])}</span>` : ''}</div>
    <div class="hubtop"><div class="section" style="margin:0">${t('boostTitle')}</div><div class="wallet" style="font-size:17px">${SEED}${fmt(meta.coins - cost)}</div></div>
    <div class="grid2">${items}</div>
    <div class="bdesc">${sel}</div>
    <button class="btn" data-act="go">${cost ? t('playCost', cost) : t('play')}</button>
    <button class="btn ghost small" data-act="map">${t('mapBtn')}</button></div>`);
}
const FIRSTS = {
  shooter:  { en: 'Shoots down its lane. Step aside.', pt: 'Atira no corredor. Saia da linha.' },
  hunter:   { en: 'Chases when close. Break its sight.', pt: 'Persegue de perto. Fuja da vista.' },
  mushroom: { en: 'Leaps beside you. Watch the purple ring.', pt: 'Salta do seu lado. Olho no anel roxo.' },
  sniper:   { en: 'Lobs hail over hedges. Watch the ring.', pt: 'Joga granizo por cima. Olho no anel.' },
  grape:    { en: 'Bumped, it lets out 3 ants.', pt: 'Batido, solta 3 formigas.' },
  night:    { en: 'After 3 minutes it hunts. No freezing.', pt: 'Depois de 3 minutos ela caça. Não congela.' },
  shiny:    { name: { en: 'Shiny sprout', pt: 'Broto brilhante' }, en: 'Deliver it before the glow fades.', pt: 'Entregue antes do brilho sumir.' },
  rainbow:  { name: { en: 'Rainbow portal', pt: 'Portal arco-íris' }, en: 'Takes any color, for a moment.', pt: 'Aceita qualquer cor, por um tempinho.' },
  colors4:  { name: { en: 'Four colors', pt: 'Quatro cores' }, en: 'One more color to sort.', pt: 'Mais uma cor para separar.' },
  par:      { name: { en: 'Target time', pt: 'Tempo alvo' }, en: 'Beat the clock for the 3rd star.', pt: 'Vença o relógio pela 3ª estrela.' },
  dual:     { name: { en: 'Two-color portal', pt: 'Portal de duas cores' }, en: 'Some portals take two colors.', pt: 'Alguns portais aceitam duas cores.' },
};
function newRow(g, i) {
  const f = advFirsts(g, i); if (!f.length) return '';
  return `<div class="newrow">${f.map(k => { const d = FIRSTS[k], pest = !d.name, nm = pest ? LT(k)[0] : L(d.name);
    return `<div class="newit">${pest ? grumbleImg(k, 40) : ''}<div><b><span class="newtag">${LT('isNew')}</span> ${nm}</b><span>${L(d)}</span></div></div>`; }).join('')}</div>`;
}
function starChips(g) {
  const a = advAllow(g);
  return `<span class="mi"><span class="st">★★★</span>${svg('hit', '#ff6f61')} ${a}</span><span class="mi"><span class="st">★★</span>${svg('hit', '#ff6f61')} ${a + 2}</span>`;
}
function startAdventure(g, i, boost) {
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  freshRun();
  run.kind = 'adv'; run.mode = 'normal'; run.adv = { g, i };
  run.garden = (g - 1) * PER_GROVE + Math.min(4, Math.ceil(i / 2));
  boost = boost || {}; run.boosts = { ...boost };
  if (boost.heart) run.bonusHp = 1;
  if (boost.bubble) run.spareShield = true;
  run.bonusHp = (run.bonusHp || 0) + advHpAdj(g, i);
  run.hp = maxHp();
  beginGarden();
}
function starChestState() {
  const claimed = meta.starChests || 0, next = (claimed + 1) * 10;
  return { claimed, next, ready: totalStars() >= next };
}
const starChestsReady = () => Math.max(0, Math.floor(totalStars() / 10) - (meta.starChests || 0));
// Opens one ready star chest, or all of them at once (loot is added up into a single reveal).
function openStarChest(all, next) {
  const n = all ? starChestsReady() : Math.min(1, starChestsReady());
  if (!n) return;
  let seeds = 0; const heroes = [];
  for (let k = 0; k < n; k++) {
    const claimed = meta.starChests || 0;
    meta.starChests = claimed + 1; seeds += BAL.eco.chestBase + BAL.eco.chestStep * claimed;
    if (meta.starChests % 3 === 0) {
      const locked = Object.keys(CHARS).filter(c => !meta.owned[c]).sort((a, b) => CHARS[a].cost - CHARS[b].cost);
      if (locked.length) { meta.owned[locked[0]] = true; heroes.push(CHARS[locked[0]].name); }
    }
  }
  meta.coins += seeds;
  const msg = [t('seeds', seeds), ...heroes.map(h => t('chestChar', h))].join(' · ');
  saveMeta();
  showChest(t('starChestT') + (n > 1 ? ` ×${n}` : ''), msg, next || 'map');
}
// Shown on the stage-end screen when star chests are waiting: open one, open all, or skip for now.
function chestPrompt() {
  const n = starChestsReady(); if (!n) return '';
  const pt = LANG === 'pt';
  return `<div class="chestprompt" id="chestPrompt"><img class="chestsm" src="${chestSrc(false)}" alt=""><div class="txt"><b>${pt ? 'Baú de estrelas pronto!' : 'Star chest ready!'}</b>${n > 1 ? `<span>×${n}</span>` : ''}</div>
    <div class="cbtns"><button class="buy" data-act="starchest1">${pt ? 'Abrir' : 'Open'}</button>${n > 1 ? `<button class="buy" data-act="starchestall">${pt ? `Abrir todos (${n})` : `Open all (${n})`}</button>` : ''}<button class="btn ghost small" data-act="chestskip">${pt ? 'Pular' : 'Skip'}</button></div></div>`;
}
function advResult(won, quit) {
  mode = 'advresult';
  if (run.daily) { dailyResult(won, quit); return; }
  const { g, i } = run.adv;
  const earned = run.coins;
  let stars = 0, bonus = 0, starPay = 0, heroLeft = 0, heroPay = 0, seasonPay = 0;
  if (won) {
    if (g === SEASON_GROVES && isBossI(i) && !meta.season1) { meta.season1 = 1; seasonPay = 500; bonus += seasonPay; }
    stars = advStarsFor(g, run.hits, run.at, run.par);
    const prev = advStars(g, i);
    if (!prev) bonus += Math.round(BAL.eco.first * g * (isBossI(i) ? 3 : isHardI(g, i) ? 2 : 1));
    if (stars > prev) { bonus += (stars - prev) * BAL.eco.star; meta.adv[advId(g, i)] = stars; }
    // Seeds grow with the stars of this play (so a better replay pays more)
    starPay = Math.round(earned * ([0, 0, BAL.eco.starPay2, BAL.eco.starPay3][stars] + (isHardI(g, i) ? BAL.eco.starPayHard : 0))); bonus += starPay;
    // Hero Mode: every second left under the hero time becomes seeds
    if (i !== 5 && run.heroPar && run.at < run.heroPar) { heroLeft = Math.floor(run.heroPar - run.at); heroPay = Math.min(Math.round(heroLeft * BAL.eco.heroRate * (1 + 0.1 * g)), Math.round(BAL.eco.heroCap * sumv(run.goalC || {}))); bonus += heroPay; }
    run.coins += bonus;
  }
  logAttempt(advId(g, i), won ? 1 : quit ? 2 : 0, run.coins, stars);
  meta.fails = meta.fails || {};
  if (won) delete meta.fails[advId(g, i)]; else if (!quit) meta.fails[advId(g, i)] = (meta.fails[advId(g, i)] || 0) + 1;
  const stuck = !won && (meta.fails[advId(g, i)] || 0) >= 3;
  bankRun();
  meta.advBest = meta.advBest || {};
  let advBestLine = '';
  if (won) {
    const id = advId(g, i), prevBest = meta.advBest[id] || 0;
    if (run.score > prevBest) { meta.advBest[id] = run.score; saveMeta(); }
    advBestLine = `<span>${t('bestL')}<b>${fmt(Math.max(prevBest, run.score))}</b></span>`;
  }
  const nx = nextNode(g, i);
  const canNext = won && advUnlocked(nx.g, nx.i);
  const starRow = [1, 2, 3].map(k => `<span style="color:${k <= stars ? '#ffcd4a' : 'var(--line)'}">★</span>`).join('');
  const n = claimable();
  show(`<div class="card">
    <div class="eyebrow">${isBossI(i) ? t('bossOf', g) : t('gardenN', g, i)}</div>
    <div style="display:flex;justify-content:center">${avatar(run.char || meta.char, 64, null, won ? 'cheer' : 'sad')}</div>
    <h2>${won ? (isBossI(i) ? t('rescued') : t('cleared')) : quit ? t('runEnded') : t('gotYou')}</h2>
    ${won ? `<div class="bigstars">${starRow}</div><div class="mrow">${starChips(g)}</div>` : ''}
    ${won && isBossI(i) ? `<p><b style="color:var(--gold)">${t('colorBack', g)}</b></p>` : ''}
    ${seasonPay ? `<div class="herorow">${svg('trophy', '#ffcd4a')} ${LANG === 'pt' ? 'Temporada 1 completa!' : 'Season 1 complete!'} ${SEED}+${seasonPay}</div><p class="small">${LANG === 'pt' ? 'A Temporada 2 chega em breve. Até lá: Corrida sem fim e Desafio diário.' : 'Season 2 is coming soon. Meanwhile: Endless Run and the Daily Challenge.'}</p>` : ''}
    ${heroPay ? `<div class="herorow">${svg('crown', '#ffcd4a')} ${LANG === 'pt' ? 'Modo Herói' : 'Hero Mode'} · ${heroLeft}s → ${SEED}+${heroPay}</div>` : ''}
    <div class="statline"><span>${t('seedsL')}<b>+${fmt(earned + bonus)}</b></span>${bonus ? `<span>${t('bonusL')}<b>+${bonus}</b></span>` : ''}</div>
    ${won ? `<div class="statline"><span>${t('timeL')}<b style="color:${!run.par || run.at <= run.par ? 'var(--accent)' : 'var(--coral)'}">${mmss(run.at)}</b></span>${run.par ? `<span>${t('parL')}<b>${mmss(run.par)}</b></span>` : ''}<span>${t('score')}<b>${fmt(run.score)}</b></span>${advBestLine}</div>` : ''}
    ${won && i === BOSS_I - 1 && !advUnlocked(g, BOSS_I) ? `<p>${t('needStars', BOSS_STARS, groveStars(g))}</p>` : ''}
    ${n ? `<p><b style="color:var(--gold)">${t('ready', n)}</b></p>` : ''}
    ${won ? chestPrompt() : ''}
    ${stuck ? `<div class="chestprompt stuck"><div class="txt"><b>${LANG === 'pt' ? 'Tá difícil? Um reforço ou uma melhoria ajuda.' : 'Tough one? A boost or an upgrade helps.'}</b></div><div class="cbtns"><button class="buy" data-act="nest">${LANG === 'pt' ? 'Ninho' : 'Nest'} ›</button><button class="buy" data-act="advretry">${LANG === 'pt' ? 'Reforços' : 'Boosts'} ›</button></div></div>` : ''}
    <div class="btns">
      ${canNext ? `<button class="btn" data-act="advnext">${t('next')}</button>` : ''}
      <button class="btn ${canNext ? 'ghost' : ''}" data-act="advretry">${t('retry')}</button>
      <button class="btn ghost small" data-act="map">${t('mapBtn')}</button>
    </div></div>`);
}
// Map pictures show the pest with its face: rendered once to a small canvas, cached as a data URL.
const PEST_PIC = {};
function pestFaceSrc(type) {
  if (PEST_PIC[type]) return PEST_PIC[type];
  const P = PEST[type]; if (!P) return null;
  const body = spr(P.body), face = spr('pf-' + P.body.slice(5) + '-grump');
  if (!body || !body.naturalWidth || !face || !face.naturalWidth) return null;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  if (!drawPest(c.getContext('2d'), type, 64, 64, 128 / 2.8, '', false)) return null;
  return (PEST_PIC[type] = c.toDataURL());
}
const pestPic = (type, size, cls) => { const P = PEST[type], src = P && (pestFaceSrc(type) || artGet(P.body)); return src ? `<img class="${cls || 'ppic'}" data-pest="${type}" src="${src}" alt="" style="width:${size}px;height:${size}px">` : ''; };
function mapPreview(g, i) {
  if (isBossI(i)) return '';
  const sp = advSpec(g, i), foes = {}; advFoeTypes(g, i).forEach(k => foes[k] = (foes[k] || 0) + 1);
  const pests = Object.entries(foes).map(([k, n]) => `<span class="pv">${pestPic(k, 20)}${n > 1 ? `<b>${n}</b>` : ''}</span>`).join('');
  return `<div class="mprev"><span class="pv">${svg('tuft', '#6fe08a')}<b>${sp.count}</b></span>${pests}</div>`;
}
function showMap() {
  mode = 'map';
  const top = advTop();
  let html = '';
  for (let g = 1; g <= Math.min(top + 1, SEASON_GROVES); g++) {
    const th = THEMES[(g - 1) % THEMES.length], floor = artGet(th.k + '-floor'), locked = !advUnlocked(g, 1);
    const bt = BOSS_ORDER[(g - 1) % BOSS_ORDER.length], bossType = bt === 'twins' ? 'sun' : bt;
    html += `<section class="grovemap${locked ? ' locked' : ''}" style="${floor ? `--floor:url(${floor})` : ''}">
      <div class="grovehead"><span>${t('grove')} ${g}</span><small>${groveStars(g)}/21 ★</small></div><div class="path"><svg class="trailsvg" aria-hidden="true"></svg>`;
    for (let i = 1; i <= ADV_N; i++) {
      const un = advUnlocked(g, i), st = advStars(g, i), boss = isBossI(i);
      const off = [-62, -20, 30, 64, 30, -20, -60, 0][i - 1];
      const cur = un && !st;
      const label = boss ? (pestPic(bossType, 50, 'bpic') || svg('crown', '#ffcd4a')) : un ? i : svg('lock', '#6b7299');
      const below = boss
        ? (st ? `<span class="nstars">${'★'.repeat(st)}</span>` : (!un && advStars(g, BOSS_I - 1) > 0 ? `<span class="gate">${t('needShort', BOSS_STARS, groveStars(g))}</span>` : `<span class="bname">${t('bossName')[bt]}</span>`))
        : `<span class="nstars">${[1, 2, 3].map(k => k <= st ? '★' : '☆').join('')}</span>`;
      const side = off < 0 ? 'r' : 'l';
      html += `<div class="nodewrap" style="transform:translateX(${off}px)">${cur ? `<div class="youhere">${avatar(meta.char, 40)}</div>` : ''}<button class="node${boss ? ' boss' : ''}${isHardI(g, i) ? ' hard' : ''}${st ? ' done' : ''}${cur ? ' cur' : ''}" data-act="node" data-g="${g}" data-i="${i}" ${un ? '' : 'disabled'} aria-label="${boss ? t('bossOf', g) : t('gardenN', g, i)}">${label}</button>${below}${(cur || (!st && g <= top + 1 && !boss && (un || advUnlocked(g, Math.max(1, i - 1))))) ? `<div class="mside ${side}">${mapPreview(g, i)}</div>` : ''}</div>`;
    }
    html += '</div></section>';
  }
  if (top >= SEASON_GROVES - 1) html += `<section class="grovemap locked soon"><div class="grovehead"><span>${LANG === 'pt' ? 'Temporada 2' : 'Season 2'}</span><small>${svg('lock', '#ffd970')}</small></div><div class="soonbody"><b>${LANG === 'pt' ? 'Em breve!' : 'Coming soon!'}</b><span>${LANG === 'pt' ? 'Novos bosques, pragas e chefes estão crescendo.' : 'New groves, pests and bosses are growing.'}</span></div></section>`;
  const fresh = lastShown !== 'map';
  show(`<div class="card tall"><div class="hubtop"><div><div class="eyebrow">${t('adventure')}</div><h2>${t('map')}</h2></div>
    <div class="wallet" style="font-size:18px">${SEED}${fmt(meta.coins)}<span style="margin-left:10px;color:var(--ink)">★ ${totalStars()}</span></div></div>
    ${(() => { const cs = starChestState(); return `<div class="chestbar"><img class="chestsm" src="${chestSrc(false)}" alt=""><div class="txt"><span>${t('starChest', cs.next)} · ${cs.ready ? t('chestReady') : totalStars() + '/' + cs.next}</span><span class="prog"><i style="width:${Math.min(100, totalStars() / cs.next * 100)}%"></i></span></div>${cs.ready ? `<button class="buy" data-act="starchest">${t('openChest')}</button>${starChestsReady() > 1 ? `<button class="buy" data-act="starchestall">${LANG === 'pt' ? 'Todos' : 'All'} (${starChestsReady()})</button>` : ''}` : ''}</div>`; })()}
    <div class="scroll"><div class="trailmap">${html}</div></div>
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
  drawTrailPaths();
  setTimeout(() => { if (mode !== 'map') return; overlay.querySelectorAll('img[data-pest]').forEach(im => { const src = pestFaceSrc(im.dataset.pest); if (src && im.src !== src) im.src = src; }); }, 400);
  // Open centered on the next stage to play (or the last one played when everything is done)
  const done = overlay.querySelectorAll('.node.done'), target = overlay.querySelector('.node.cur') || done[done.length - 1];
  if (fresh && target) { const go = () => target.scrollIntoView({ block: 'center', inline: 'nearest' }); go(); requestAnimationFrame(go); setTimeout(go, 120); }
}
// A winding dirt trail behind the nodes of each grove, drawn from the real node positions.
function drawTrailPaths() {
  overlay.querySelectorAll('.grovemap .path').forEach(path => {
    const svgEl = path.querySelector('.trailsvg'), pr = path.getBoundingClientRect();
    const pts = [...path.querySelectorAll('.node')].map(n => { const r = n.getBoundingClientRect(); return [r.left + r.width / 2 - pr.left, r.top + r.height / 2 - pr.top, n.classList.contains('done')]; });
    if (pts.length < 2) return;
    svgEl.setAttribute('viewBox', `0 0 ${pr.width} ${pr.height}`);
    let d = `M${pts[0][0]},${pts[0][1]}`, walked = `M${pts[0][0]},${pts[0][1]}`;
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], my = (y0 + y1) / 2;
      const seg = ` C${x0},${my} ${x1},${my} ${x1},${y1}`; d += seg; if (pts[k][2] || pts[k - 1][2] && k === 1) walked += seg;
    }
    svgEl.innerHTML = `<path d="${d}" class="tr0"/><path d="${d}" class="tr1"/><path d="${walked}" class="tr2"/>`;
  });
}
function skillChips() {
  const chips = Object.keys(WEAPONS).filter(k => wp[k] && !evo[WEAPONS[k].evo]).map(k => `<span class="chip" style="border-color:${WEAPONS[k].bg}">${L(WEAPONS[k].name)} ${wp[k]}</span>`)
    .concat(Object.keys(EVO2).filter(k => evo[k]).map(k => `<span class="chip evo">${L(EVO2[k].name)}</span>`))
    .concat(Object.keys(SKILLS).filter(k => sk[k]).map(k => `<span class="chip">${L(SKILLS[k].name)} ${sk[k]}</span>`))
    .concat(WILDS.filter(w => run.wild && run.wild[w.k]).map(w => `<span class="chip" style="border-color:var(--coral)">${L(w.name)}</span>`));
  const strip = run.kind === 'endless' ? `<div class="loadout big">${loadoutHtml()}</div>` : '';
  return strip + (chips.length ? `<div class="skills">${chips.join('')}</div>` : `<p>${t('noSkills')}</p>`);
}
function bankRun() {
  const s = meta.st;
  meta.coins += run.coins;
  s.runs++; s.tufts += run.tufts; s.seedsTotal += run.coins + run.campSpent;
  s.bestCombo = Math.max(s.bestCombo, run.bestCombo);
  s.streaks += run.streaks;
  s.pops += run.pops || 0;
  s.bosses += run.bossesBeaten;
  s.noHit += run.noHit; s.rainbow += run.rainbow; s.evos += run.evos;
  s.oneHeartGrove = Math.max(s.oneHeartGrove, run.oneHeartGrove);
  let isBest = false;
  meta.best = meta.best || {};
  if (run.kind === 'endless') {
    if (run.garden > s.bestGarden) { s.bestGarden = run.garden; if (run.garden > 1) isBest = true; }
    if ((run.score || 0) > 0 && (run.score || 0) > (meta.best.endless || 0)) { meta.best.endless = run.score; isBest = true; }
  }
  saveMeta();
  return isBest;
}
function gameOver(quit) {
  if (run.kind === 'tutorial') { finishTutorial(false); return; }
  if (run.kind === 'adv') { advResult(false, quit); return; }
  clearRun();
  mode = 'over';
  const earned = run.coins;
  logAttempt('E', quit ? 2 : 0, earned, 0);
  const isBest = bankRun();
  const n = claimable();
  show(`<div class="card">
    <div class="eyebrow">${isBest ? t('newBest') : quit ? t('runEnded') : t('runOver')}</div>
    <div style="display:flex;justify-content:center">${avatar(run.char || meta.char, 72, null, 'sad')}</div>
    <h2>${quit ? t('backNest') : t('gotYou')}</h2>
    <div class="statline"><span>${t('reached')}<b>${t('short', grove(), gardenInGrove())}</b></span><span>${t('level')}<b>${run.level}</b></span><span>${t('seedsL')}<b>+${fmt(earned)}</b></span></div>
    <div class="statline"><span>${t('score')}<b>${fmt(run.score)}</b></span><span>${t('bestL')}<b>${fmt((meta.best && meta.best.endless) || 0)}</b></span></div>
    ${skillChips()}
    ${n ? `<p><b style="color:var(--gold)">${t('ready', n)}</b></p>` : ''}
    <div class="btns"><button class="btn" data-act="start">${t('runAgain')}</button><button class="btn ghost" data-act="hub">${t('home')}</button></div>
  </div>`);
}
function pauseGame() {
  if (mode !== 'play') return;
  mode = 'pause';
  showPause();
}
function showPause() {
  show(`<div class="card">
    <h2>${t('paused')}</h2>
    <div class="statline"><span>${t('garden')}<b>${t('short', grove(), gardenInGrove())}</b></span><span>${t('level')}<b>${run.level}</b></span><span>${t('seedsL')}<b>${fmt(run.coins)}</b></span></div>
    ${skillChips()}
    <div class="btns"><button class="btn" data-act="resume">${t('resume')}</button><button class="btn ghost" data-act="quit">${t('endKeep')}</button></div>
    ${ctrlBtn()}
  </div>`);
}
function resume() { mode = 'play'; hide(); if (journeyOn()) setTimeout(journeyDraw, 250); last = performance.now(); if (run && run.kind !== 'tutorial') invuln = Math.max(invuln, 1); }
function freshRun() {
  sk = {}; Object.keys(SKILLS).forEach(k => sk[k] = 0);
  evo = {}; Object.keys(EVOS).concat(Object.keys(EVO2)).forEach(k => evo[k] = false);
  wp = {}; Object.keys(WEAPONS).forEach(k => wp[k] = 0);
  run = { garden: 1, level: 1, xp: 0, score: 0, coins: 0, char: meta.char, mode: meta.mode,
    clearSeeds: 0, tufts: 0, streaks: 0, bestCombo: 0, noHit: 0, rainbow: 0, evos: 0, oneHeartGrove: 0,
    campBought: {}, campSpent: 0, spareShield: false, hitThisGarden: false,
    kind: 'endless', adv: null, hits: 0, keys: 0, boss: false, bossDone: false, bossesBeaten: 0, cage: null,
    wild: {}, wildCap: 0, wildHp: 0, gt: 0, mines: [], wcd: {} };
  run.hp = maxHp();
  shieldUp = false; shieldT = 0; abilityCd = 0; lastCdShown = -1;
  pendingUps = 0; chestPending = false;
}
/* ---------- Endless run map (look book R1) ----------
   Each grove is a small branching map: 3 rows of choices, then the boss. Playable stops are gardens of a kind
   (garden, thorny, challenge, mystery); camp and treasure are breaks. You see the whole grove and plan a route. */
