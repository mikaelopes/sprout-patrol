const LEARN = {
  en: {
    wander: ['Aphid', 'Wanders around. Breaks your trail on contact.'],
    hunter: ['Beetle', 'Chases you when close. Hide behind hedges.'],
    shooter: ['Rain Cloud', 'Shoots drops down its corridor. Stay out of line.'],
    mushroom: ['Grasshopper', 'Leaps next to you. The purple ring shows where.'],
    grape: ['Ant Hill', 'Releases 3 ants when knocked out.'],
    minigrape: ['Ant', 'Tiny. Knocks off just one sprout.'],
    sniper: ['Hail Cloud', 'Throws hail over hedges. Watch the ring.'],
    night: ['Night Moth', 'Hunts you at night. Can\'t be frozen: just run.'],
    isNew: 'New!',
  },
  pt: {
    wander: ['Pulgão', 'Anda à toa. Quebra sua fila se encostar.'],
    hunter: ['Besouro', 'Persegue de perto. Se esconda atrás dos muros.'],
    shooter: ['Nuvem de Chuva', 'Atira gotas no corredor. Saia da linha.'],
    mushroom: ['Gafanhoto', 'Salta perto de você. O anel roxo avisa onde.'],
    grape: ['Formigueiro', 'Solta 3 formigas quando nocauteado.'],
    minigrape: ['Formiga', 'Pequena. Derruba só um brotinho.'],
    sniper: ['Nuvem de Granizo', 'Joga granizo por cima dos muros. Olho no anel.'],
    night: ['Mariposa Noturna', 'Caça você à noite. Não congela: fuja.'],
    isNew: 'Novidade!',
  },
};

/* ---------- Guided tour of the menus (first visit of each screen after the tutorial) ----------
   A callout points at one thing at a time; Space, Enter or a tap moves on. Seen screens live in meta.coach. */
const COACH = {
  en: {
    hub: [['#coins', 'Your seeds. Earn them by rescuing sprouts.'],
          ['[data-act="nest"]', 'Nest: spend seeds on permanent upgrades.'],
          ['[data-act="chars"]', 'Unlock new heroes with seeds.'],
          ['[data-act="map"]', 'Start your adventure here!']],
    map: [['.node.cur', 'Each circle is a garden. Play the glowing one.'],
          ['.mprev', 'What\'s inside: sprouts and pests.'],
          ['.chestbar', 'Stars fill this chest with seeds.']],
    prelevel: [['.mrow', 'Your goal: sprouts, pests and portal colors.'],
               ['.bst', 'Optional boosts. They cost seeds.'],
               ['[data-act="play"],[data-act="advgo"],.btns .btn:not(.ghost)', 'Press Play!']],
    next: 'Next', done: 'Got it',
  },
  pt: {
    hub: [['#coins', 'Suas sementes. Ganhe resgatando brotinhos.'],
          ['[data-act="nest"]', 'Ninho: gaste sementes em melhorias permanentes.'],
          ['[data-act="chars"]', 'Desbloqueie heróis com sementes.'],
          ['[data-act="map"]', 'Comece sua aventura aqui!']],
    map: [['.node.cur', 'Cada círculo é um jardim. Jogue o que brilha.'],
          ['.mprev', 'O que tem dentro: brotinhos e pragas.'],
          ['.chestbar', 'Estrelas enchem este baú de sementes.']],
    prelevel: [['.mrow', 'Seu objetivo: brotinhos, pragas e cores dos portais.'],
               ['.bst', 'Reforços opcionais. Custam sementes.'],
               ['[data-act="play"],[data-act="advgo"],.btns .btn:not(.ghost)', 'Aperte Jogar!']],
    next: 'Próximo', done: 'Entendi',
  },
};

/* ---------- First-time journey through the menus (right after the tutorial) ----------
   One highlighted button at a time; everything else is blocked until the player presses it. */
const JOURNEY = [
  { screen: 'hub', sel: '[data-act="nest"]', en: 'Open the Nest to spend your seeds.', pt: 'Abra o Ninho para gastar suas sementes.' },
  { screen: 'nest', sel: '[data-act="buy"][data-k="trail"]:not([disabled]),[data-act="buy"]:not([disabled])', en: 'Buy this upgrade: +1 trail space.', pt: 'Compre esta melhoria: +1 espaço na fila.' },
  { screen: 'nest', sel: '[data-act="hub"],[data-act="nestback"]', en: 'Nice! Now let\'s play.', pt: 'Boa! Agora bora jogar.' },
  { screen: 'hub', sel: '[data-act="map"]', en: 'Start your adventure.', pt: 'Comece sua aventura.' },
  { screen: 'map', sel: '.node.cur', en: 'Tap the first garden.', pt: 'Toque no primeiro jardim.' },
  { screen: 'prelevel', sel: '[data-act="go"]', en: 'Play!', pt: 'Jogar!' },
];
const JOURNEY_E = [ // first Endless Run: choosing a path and picking skills
  { screen: 'runmap', sel: '.mnode.can', en: 'Pick your next stop. Each one is a garden or a reward.', pt: 'Escolha a próxima parada. Cada uma é um jardim ou um prêmio.' },
];
const mainJ = () => meta && meta.journey != null && !meta.journeyDone;
const JK = () => mainJ() ? 'journey' : 'ej';
const JL = () => mainJ() ? JOURNEY : JOURNEY_E;
const journeyOn = () => !!meta && !window.__noLearn && (mainJ() || (meta.ej != null && !meta.ejDone));
function journeyTarget() {
  const st = JL()[meta[JK()]]; if (!st || st.screen !== mode) return null;
  for (const sel of st.sel.split(',')) { const el = (st.screen === 'play' ? document : overlay).querySelector(sel.trim()); if (el && el.offsetParent && !el.hidden) return el; }
  return null;
}
function journeyDraw() {
  document.querySelectorAll('.coachbox.journey,.coachspot').forEach(n => n.remove());
  document.querySelectorAll('.coach-hl').forEach(n => n.classList.remove('coach-hl'));
  if (!journeyOn()) return;
  if (meta[JK()] >= JL().length) { if (JK() === 'journey') meta.journeyDone = true; else meta.ejDone = true; saveMeta(); return; }
  const st = JL()[meta[JK()]], el = journeyTarget();
  if (!el) { if (st.screen === 'nest' && meta[JK()] === 1 && mode === 'nest') { meta[JK()]++; saveMeta(); journeyDraw(); } return; }
  el.scrollIntoView({ block: 'center' }); el.classList.add('coach-hl');
  // a cutout spotlight: everything around the button is dimmed, the button itself keeps its normal colors
  const spot = document.createElement('div'); spot.className = 'coachspot'; document.body.appendChild(spot);
  const box = document.createElement('div'); box.className = 'coachbox journey';
  box.innerHTML = `<p>${LANG === 'pt' ? st.pt : st.en}</p><div class="crow"><span>${meta[JK()] + 1}/${JL().length}</span><button class="jskip" type="button">${LANG === 'pt' ? 'Pular guia' : 'Skip guide'}</button><span class="kbd">${LANG === 'pt' ? 'Espaço' : 'Space'}</span></div>`;
  document.body.appendChild(box);
  box.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); if (e.target.closest('.jskip')) { journeySkip(); return; } if (st.next) journeyAdvance(); });
  if (st.next) { journeyPause = true; box.querySelector('.crow span:last-child').textContent = LANG === 'pt' ? 'Toque para continuar' : 'Tap to continue'; }
  journeyPlace(el, spot, box);
  el.focus({ preventScroll: true });
  // keep the spotlight and the tip glued to the button while the page scrolls or resizes
  const follow = () => { if (!spot.isConnected || !el.isConnected) return; journeyPlace(el, spot, box); requestAnimationFrame(follow); };
  requestAnimationFrame(follow);
}
function journeyPlace(el, spot, box) {
  const r = el.getBoundingClientRect(), pad = 6;
  spot.style.left = (r.left - pad) + 'px'; spot.style.top = (r.top - pad) + 'px'; spot.style.width = (r.width + pad * 2) + 'px'; spot.style.height = (r.height + pad * 2) + 'px';
  const bw = Math.min(300, innerWidth - 24), below = r.top + r.height / 2 < innerHeight * 0.5;
  box.style.width = bw + 'px'; box.style.left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2)) + 'px';
  box.classList.toggle('down', below); box.classList.toggle('up', !below);
  if (below) { box.style.top = (r.bottom + 14) + 'px'; box.style.bottom = ''; } else { box.style.bottom = (innerHeight - r.top + 14) + 'px'; box.style.top = ''; }
  box.style.setProperty('--ax', Math.max(18, Math.min(bw - 18, r.left + r.width / 2 - parseFloat(box.style.left))) + 'px');
}
let journeyPause = false;
function journeySkip() {
  if (JK() === 'journey') meta.journeyDone = true; else meta.ejDone = true;
  saveMeta(); journeyPause = false;
  document.querySelectorAll('.coachbox.journey,.coachspot').forEach(n => n.remove());
  document.querySelectorAll('.coach-hl').forEach(n => n.classList.remove('coach-hl'));
}
function journeyAdvance() {
  meta[JK()]++; saveMeta(); journeyPause = false;
  document.querySelectorAll('.coachbox.journey,.coachspot').forEach(n => n.remove());
  document.querySelectorAll('.coach-hl').forEach(n => n.classList.remove('coach-hl'));
  if (meta[JK()] >= JL().length) { if (JK() === 'journey') meta.journeyDone = true; else meta.ejDone = true; saveMeta(); return; }
  setTimeout(journeyDraw, 160);
}
// The highlighted button is the only thing that works; pressing it moves the journey on.
document.addEventListener('click', e => {
  if (!journeyOn() || !document.querySelector('.coachspot')) return;
  const el = journeyTarget();
  const jst = JL()[meta[JK()]];
  if (jst && jst.next) { e.stopPropagation(); e.preventDefault(); journeyAdvance(); return; }
  if (el && el.contains(e.target)) { journeyAdvance(); return; }
  if (e.target.closest('.coachbox')) return;
  e.stopPropagation(); e.preventDefault();
  el && el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 300);
}, true);

let coachOn = null;
function coachStart(screen) {
  if (!meta.tutorialDone || window.__noLearn) return;
  meta.coach = meta.coach || {};
  if (meta.coach[screen]) return;
  const steps = ((COACH[LANG] || COACH.en)[screen] || []).filter(([sel]) => document.querySelector(sel));
  if (!steps.length) return;
  meta.coach[screen] = 1; saveMeta();
  coachOn = { steps, i: 0, screen }; coachDraw();
}
function coachDraw() {
  document.querySelectorAll('.coachbox,.coachdim').forEach(n => n.remove());
  document.querySelectorAll('.coach-hl').forEach(n => n.classList.remove('coach-hl'));
  if (!coachOn) return;
  const [sel, text] = coachOn.steps[coachOn.i], el = document.querySelector(sel);
  if (!el) { coachNext(); return; }
  el.scrollIntoView({ block: 'nearest' }); el.classList.add('coach-hl');
  const r = el.getBoundingClientRect(), C = COACH[LANG] || COACH.en, last = coachOn.i === coachOn.steps.length - 1;
  const dim = document.createElement('div'); dim.className = 'coachdim'; document.body.appendChild(dim);
  const box = document.createElement('div'); box.className = 'coachbox';
  box.innerHTML = `<p>${text}</p><div class="crow"><span>${coachOn.i + 1}/${coachOn.steps.length}</span><button class="btn small">${last ? C.done : C.next} <span class="kbd">${LANG === 'pt' ? 'Espaço' : 'Space'}</span></button></div>`;
  document.body.appendChild(box);
  const below = r.top < innerHeight * 0.55, bw = Math.min(320, innerWidth - 24);
  box.style.width = bw + 'px';
  box.style.left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2)) + 'px';
  if (below) { box.style.top = (r.bottom + 14) + 'px'; box.classList.add('down'); } else { box.style.bottom = (innerHeight - r.top + 14) + 'px'; box.classList.add('up'); }
  box.style.setProperty('--ax', Math.max(18, Math.min(bw - 18, r.left + r.width / 2 - parseFloat(box.style.left))) + 'px');
  const go = e => { e.stopPropagation(); e.preventDefault(); coachNext(); };
  box.addEventListener('click', go); dim.addEventListener('click', go);
  box.querySelector('button').focus({ preventScroll: true });
}
function coachNext() {
  if (!coachOn) return;
  coachOn.i++;
  if (coachOn.i >= coachOn.steps.length) coachOn = null;
  coachDraw();
}

const LT = k => (LEARN[LANG] || LEARN.en)[k] ?? LEARN.en[k];
// Queue a card (once per save). Shown right away when the game is running, otherwise at the next moment it is.
// Runs a few times a second while playing: anything on the board that has not been explained yet gets a card.

function setTip(text) { const el = document.getElementById('tip'); el.hidden = !text; el.textContent = text || ''; }
/* ---------- Tutorial: one small fixed garden, one instruction at a time ----------
   The whole map fits on screen (no scrolling), and each step shows a pulsing target, an arrow over it and an
   animated finger swiping the way to go. Steps: swipe to the tuft, take it to the portal, grab the snowflake, bump the frozen pest. */
const TUT_MAP = [
  '#########',
  '#.......#',
  '#.#.#.#.#',
  '#.......#',
  '#.##.##.#',
  '#.......#',
  '#.##.##.#',
  '#.......#',
  '#.#.#.#.#',
  '#.......#',
  '#########',
];
/* Tutorial = a fixed, scripted journey. Part 1 teaches the basics, part 2 a boss garden (keys, cage, golden gate).
   Each step waits for one exact action: the hero stops at every turn and only the right direction moves it on,
   and nothing else on the board moves while it waits. */
const TUTX = {
  en: { s0: 'Free the sprout: roll to the bubble.', s1: 'Bring it into the portal of its color.', s2: 'Grab the seed. Seeds buy upgrades.', s3: 'A pest! Grab the snowflake.', s4: 'It\'s frozen. Bump it!', s5: 'It went to the den to nap.',
        b0: 'Boss garden! Each portal gives a key.', b1: 'Into its portal: key 1!', b2: 'Now the blue sprout.', b3: 'Into the blue portal: key 2!', b4: 'The cage opened! Free the Golden Sprout.', b5: 'Bring it to the golden gate to win!',
        swipe: 'Swipe', press: 'Press', part2: 'Part 2: boss garden', done: 'Tutorial complete!', doneP: 'Here are 40 seeds. Let\'s spend them!', go: 'Let\'s go!' },
  pt: { s0: 'Solte o brotinho: role até a bolha.', s1: 'Leve ele ao portal da mesma cor.', s2: 'Pegue a semente. Sementes compram melhorias.', s3: 'Uma praga! Pegue o floco de neve.', s4: 'Congelou. Encoste nela!', s5: 'Ela foi tirar soneca na toca.',
        b0: 'Jardim do chefe! Cada portal dá uma chave.', b1: 'Para o portal dele: chave 1!', b2: 'Agora o brotinho azul.', b3: 'Para o portal azul: chave 2!', b4: 'A gaiola abriu! Solte o Broto Dourado.', b5: 'Leve ele ao portão dourado para vencer!',
        swipe: 'Deslize', press: 'Aperte', part2: 'Parte 2: jardim do chefe', done: 'Tutorial concluído!', doneP: 'Tome 40 sementes. Bora gastar!', go: 'Bora!' },
};
const TX = k => (TUTX[LANG] || TUTX.en)[k] ?? TUTX.en[k];
function tutReset(part) {
  newGarden();
  COLS = TUT_MAP[0].length; ROWS = TUT_MAP.length;
  grid = TUT_MAP.map(row => [...row].map(ch => ch === '#' ? 1 : 0));
  START = { x: 1, y: 9 };
  player = { x: 1, y: 9, nx: 1, ny: 9, p: 0, moving: false, dir: null, want: null, face: [1, 0] };
  followers = []; trail = [{ x: 1, y: 9 }];
  enemies = []; pickups = []; shots = []; particles = []; floats = []; banners = [];
  run.den = { x: 4, y: 3 }; run.part = part; run.gate = null;
  freezeT = 0; invuln = 0;
  if (part === 1) {
    portals = [{ x: 7, y: 1, cs: [0] }];
    bubbles = [{ x: 7, y: 9, c: 0, bob: 0 }];
    run.boss = false;
  } else {
    portals = [{ x: 7, y: 1, cs: [0] }, { x: 1, y: 1, cs: [1] }, { x: 1, y: 9, cs: [4], golden: true, active: false }];
    bubbles = [{ x: 7, y: 9, c: 0, bob: 0 }, { x: 4, y: 1, c: 1, bob: 1 }, { x: 4, y: 5, c: 4, gold: true, locked: true, bob: 2 }];
    run.boss = true; run.bossType = 'king'; run.keys = 0; run.bossDone = false; run.goldNeed = 1; run.goldSaved = 0;
    run.cages = [{ x: 4, y: 5 }]; run.cage = run.cages[0];
  }
  fit(); snapCam(); updateHud();
}
function startTutorial() {
  if (!meta.tutorialDone) { meta.tutorialDone = true; saveMeta(); }
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  freshRun();
  run.kind = 'tutorial'; run.adv = { g: 1, i: 1 }; run.bonusHp = 2; run.hp = maxHp(); logEv({ tu: 's' });
  tutReset(1);
  resume();
  tutStep(0);
}
const TUT_STEPS = [
  { tip: 's0', target: () => bubbles[0], done: () => followers.length > 0 },
  { tip: 's1', target: () => portals[0], done: () => run.tufts >= 1, enter() { } },
  { tip: 's2', target: () => pickups.find(k => k.type === 'seed'), done: () => !pickups.some(k => k.type === 'seed'), enter() { pickups.push({ x: 1, y: 1, life: 9999, type: 'seed' }); } },
  { tip: 's3', target: () => pickups.find(k => k.type === 'frost'), done: () => freezeT > 0, enter() {
      if (!enemies.length) { const e = { x: 7, y: 7, nx: 7, ny: 7, p: 1, dir: [0, 0], type: 'wander', cool: 1, aim: 0, aimDir: null, stun: 0, shootT: 99, speed: 0.7 }; flagEnemy(e); e.maxHp = 1; e.hp = 1; enemies.push(e); }
      if (!pickups.some(k => k.type === 'frost')) pickups.push({ x: 1, y: 5, life: 9999, type: 'frost' }); } },
  { tip: 's4', target: () => enemies[0] && !(enemies[0].denT > 0) ? epos(enemies[0]) : null, done: () => (run.pops || 0) > 0, back: () => freezeT <= 0 ? 3 : -1, enter() { freezeT = Math.max(freezeT, 30); } },
  { tip: 's5', target: () => run.den, wait: 3 },
  { tip: 'b0', target: () => bubbles.find(b => b.c === 0), done: () => followers.some(f => f.c === 0), part: 2 },
  { tip: 'b1', target: () => portals[0], done: () => run.keys >= 1 },
  { tip: 'b2', target: () => bubbles.find(b => b.c === 1), done: () => followers.some(f => f.c === 1) },
  { tip: 'b3', target: () => portals[1], done: () => run.keys >= 2 },
  { tip: 'b4', target: () => bubbles.find(b => b.gold), done: () => followers.some(f => f.gold) },
  { tip: 'b5', target: () => portals[2], done: () => run.goldSaved >= 1 },
];
const isTouch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
const kbMode = () => kbUser || !isTouch();
function tutStep(n) {
  const st = TUT_STEPS[n]; if (!st) { finishTutorial(true); return; }
  if (st.part === 2 && run.part !== 2) { tutReset(2); banner(TX('part2'), '#f5b82e', 'crown'); }
  run.tut = n; run.tutT = time; run.gate = null;
  if (st.enter) st.enter();
  setTip(`${n + 1}/${TUT_STEPS.length} · ${TX(st.tip)}`);
  tutGate();
}
// The direction the hero must take next (first step of the shortest walk to the target).
function tutHintDir(target) {
  if (!target) return null;
  const D = playerDistMap(), tx = Math.round(target.x), ty = Math.round(target.y);
  if (!(D[tx + ty * COLS] > 0)) return null;
  let x = tx, y = ty;
  for (let guard = 0; guard < 200; guard++) {
    const v = D[x + y * COLS]; if (v === 1) return [x - Math.round(player.x), y - Math.round(player.y)];
    const n = FOUR.map(([dx, dy]) => [x + dx, y + dy]).find(([nx, ny]) => isOpen(nx, ny) && D[nx + ny * COLS] === v - 1);
    if (!n) return null; [x, y] = n;
  }
  return null;
}
// Stop and wait for the right direction whenever the hero is on a tile where the path turns (or at the start of a step).
function tutGate() {
  if (run.kind !== 'tutorial' || player.moving) return false;
  const st = TUT_STEPS[run.tut]; if (!st || st.wait) return false;
  const need = tutHintDir(st.target()); if (!need) return false;
  const same = d => d && d[0] === need[0] && d[1] === need[1];
  if (same(player.want) || (same(player.dir) && !player.want)) { player.want = need; return false; }
  player.dir = null; player.want = null; run.gate = need;
  return true;
}
function tutInput(name) { // returns true when the tutorial handled the input
  if (!run || run.kind !== 'tutorial') return false;
  const d = DIRS[name];
  if (run.gate) { if (d && d[0] === run.gate[0] && d[1] === run.gate[1]) { player.want = run.gate; run.gate = null; } else run.gateMiss = time; return true; }
  if (player.moving) { const st = TUT_STEPS[run.tut], need = st && !st.wait && tutHintDir(st.target()); return !!need; } // no detours while rolling
  return false;
}
function tutTick() {
  if (run.kind !== 'tutorial' || mode !== 'play') return;
  const st = TUT_STEPS[run.tut]; if (!st) return;
  if (st.back) { const bk = st.back(); if (bk >= 0 && !st.done()) { tutStep(bk); return; } }
  if (st.wait ? time - run.tutT >= st.wait : st.done()) { tutStep(run.tut + 1); return; }
  if (!run.gate && !player.moving) tutGate();
}
const tutHeld = () => run && run.kind === 'tutorial' && !!run.gate; // the board waits while the player has to act
function drawPortalHint() {
  if (!run || !run.adv || run.adv.g > 1 || run.kind === 'tutorial' || !followers.length || mode !== 'play') return;
  const c = followers[0].c, p = portals.find(q => !q.rainbow && !q.golden && q.cs && q.cs.includes(c)); if (!p) return;
  tutArrow((p.x + .5) * cell, (p.y + .5) * cell, COLORS[c].fill);
}
function tutArrow(tx, ty, col) {
  const pulse = reduceMotion ? 0.5 : (Math.sin(time * 5) + 1) / 2, ay = ty - cell * (0.85 + 0.15 * pulse);
  ctx.fillStyle = col; ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(tx, ay + cell * 0.3); ctx.lineTo(tx - cell * 0.2, ay); ctx.lineTo(tx - cell * 0.07, ay); ctx.lineTo(tx - cell * 0.07, ay - cell * 0.22); ctx.lineTo(tx + cell * 0.07, ay - cell * 0.22); ctx.lineTo(tx + cell * 0.07, ay); ctx.lineTo(tx + cell * 0.2, ay); ctx.closePath(); ctx.fill(); ctx.stroke();
}
// Spotlight on the hero and the target, a pulsing ring + arrow on the target, and a control hint for the exact move.
function drawTutorialHints() {
  drawPortalHint();
  if (run.kind !== 'tutorial' || run.tut == null || mode !== 'play') return;
  const st = TUT_STEPS[run.tut], tg = st && st.target(); if (!tg) return;
  const tx = (tg.x + .5) * cell, ty = (tg.y + .5) * cell, pp = ppos(), hx = (pp.x + .5) * cell, hy = (pp.y + .5) * cell;
  const pulse = reduceMotion ? 0.5 : (Math.sin(time * 5) + 1) / 2;
  ctx.save(); ctx.fillStyle = 'rgba(6,10,8,.5)'; ctx.beginPath(); ctx.rect(0, 0, COLS * cell, ROWS * cell);
  ctx.moveTo(hx + cell * 1.1, hy); ctx.arc(hx, hy, cell * 1.1, 0, TAU, true); ctx.moveTo(tx + cell * 0.95, ty); ctx.arc(tx, ty, cell * 0.95, 0, TAU, true); ctx.fill(); ctx.restore();
  strokeRing(tx, ty, cell * (0.55 + 0.12 * pulse), '#ffcd4a', Math.max(2, cell * 0.08), 0.9);
  tutArrow(tx, ty, '#ffcd4a');
  if (!run.gate) return;
  const d = run.gate, miss = time - (run.gateMiss || -9) < 0.35 ? Math.sin(time * 60) * cell * 0.06 : 0;
  // three chevrons sliding out of the hero toward the way to go
  for (let j = 0; j < 3; j++) {
    const k = ((reduceMotion ? 0.3 : time * 1.6) + j / 3) % 1, cx = hx + d[0] * cell * (0.7 + k * 1.4), cy = hy + d[1] * cell * (0.7 + k * 1.4), a = Math.atan2(d[1], d[0]);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = Math.max(3, cell * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-cell * 0.14, -cell * 0.2); ctx.lineTo(cell * 0.08, 0); ctx.lineTo(-cell * 0.14, cell * 0.2); ctx.stroke(); ctx.restore();
  }
  // the control to use: a keycap on PC, a swipe on touch
  const bx = hx + miss - d[0] * cell * 0.15, by = hy - cell * 1.05 - (d[1] < 0 ? 0 : 0), press = reduceMotion ? 0 : Math.max(0, Math.sin(time * 6)) * cell * 0.05;
  if (kbMode()) {
    const glyph = { '1,0': '→', '-1,0': '←', '0,1': '↓', '0,-1': '↑' }[d[0] + ',' + d[1]], wasd = { '1,0': 'D', '-1,0': 'A', '0,1': 'S', '0,-1': 'W' }[d[0] + ',' + d[1]];
    const w = cell * 0.62;
    for (const [ox, label] of [[-w * 0.6, glyph], [w * 0.6, wasd]]) {
      ctx.fillStyle = '#2a1a10'; rr(ctx, bx + ox - w / 2, by - w / 2 + cell * 0.07, w, w, cell * 0.12); ctx.fill();
      ctx.fillStyle = '#fff7e8'; rr(ctx, bx + ox - w / 2, by - w / 2 + press, w, w, cell * 0.12); ctx.fill();
      ctx.fillStyle = '#4a3426'; ctx.font = `700 ${Math.round(w * 0.6)}px ${displayFont || 'sans-serif'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, bx + ox, by + press + 1);
    }
  } else {
    const k = reduceMotion ? 0.6 : (time * 1.1) % 1, sx = hx + d[0] * cell * 0.4, sy = hy + d[1] * cell * 0.4 + cell * 0.55;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = cell * 0.32; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + d[0] * cell * 2 * k, sy + d[1] * cell * 2 * k); ctx.stroke();
    disc(sx + d[0] * cell * 2 * k, sy + d[1] * cell * 2 * k, cell * 0.28, '#ffffff', 0.95 * (1 - k * 0.4)); strokeRing(sx + d[0] * cell * 2 * k, sy + d[1] * cell * 2 * k, cell * 0.36, '#ffe27a', 2, 0.8 * (1 - k));
    ctx.restore();
  }
}
// Skip: the tutorial is marked done (seeds included) and the guide cards it would have shown will appear in real gardens.
function skipTutorial() {
  if (!run || run.kind !== 'tutorial') return;
  meta.tutSkipped = true; logEv({ tu: 'k', st: run.tut || 0 }); const asked = meta.cloudAsked; finishTutorial(true);
  demoBoard(); if (!asked && cloud.state !== 'on' && cloud.can !== false) showCloudOffer(); else showHub();
}
// Only people who can write this artifact's data (the owner; Team members at Contributor) can save to an account.
// Everyone else never sees a Connect button that can't work: they get the save-code tip instead. can() asks nothing of the viewer.
async function cloudProbe() {
  if (cloudHost() === 'firebase') { cloud.can = true; fbLoad().catch(() => { cloud.can = false; const bx = overlay.querySelector('.cloudbox'); if (bx) bx.outerHTML = cloudBox(); }); return; }
  try { const user = window.claude && window.claude.use ? await window.claude.use('user') : null; cloud.can = user ? await user.can('data.write') : false; }
  catch (e) { cloud.can = false; }
  if (cloud.can === false && (mode === 'tutdone' || mode === 'profile')) { const bx = overlay.querySelector('.cloudbox'); if (bx) bx.outerHTML = cloudBox(); }
  if (cloud.can === false && mode === 'cloudoffer') showHub();
}
function cloudBox() {
  const on = cloud.state === 'on';
  if (!on && cloud.can === false) return `<div class="cloudbox"><p>${LANG === 'pt' ? 'Seu progresso fica neste aparelho. Para levar a outro, use Perfil → Copiar código.' : 'Your progress stays on this device. To move it, use Profile → Copy code.'}</p></div>`;
  return `<div class="cloudbox"><p id="cloudMsg">${on ? CLt('on') : cloud.state === 'off' ? CLt('offer') : cloudLine()}</p>${on ? '' : `<button class="btn ghost small" data-act="cloudconnect">${CLt('connect')}</button>`}</div>`;
}
const saveSummary = m => { const gs = Object.keys(m.adv || {}).map(id => +id.split('-')[0]); return `${t('grove')} ${gs.length ? Math.max(...gs) : 1} · ${fmt(m.coins || 0)} ${LANG === 'pt' ? 'sementes' : 'seeds'}`; };
function showCloudChoice() {
  mode = 'cloudchoice'; const r = cloud.choice; const remote = { ...r };
  show(`<div class="card"><div class="eyebrow">${t('saveH')}</div><h2>${LANG === 'pt' ? 'Qual progresso usar?' : 'Which progress?'}</h2>
    <div class="grid2" style="grid-template-columns:1fr"><button class="btn" data-act="cloudpick" data-k="device">${LANG === 'pt' ? 'Este aparelho' : 'This device'}<small style="display:block;font-size:13px">${saveSummary(meta)}</small></button>
    <button class="btn ghost" data-act="cloudpick" data-k="account">${LANG === 'pt' ? 'Conta ' + acctName() : acctName() + ' account'}<small style="display:block;font-size:13px">${saveSummary(remote)}</small></button></div>
    <p class="small">${LANG === 'pt' ? 'O outro é substituído.' : 'The other one is replaced.'}</p></div>`);
}
function showCloudOffer() {
  mode = 'cloudoffer'; meta.cloudAsked = true; saveMeta();
  show(`<div class="card"><div class="eyebrow">${t('saveH')}</div><h2>${LANG === 'pt' ? 'Sua conta' : 'Your account'}</h2>${cloudBox()}
    <button class="btn" data-act="hub">${CLt('later')}</button></div>`);
}
function finishTutorial(done) {
  if (done && !meta.tutSkipped) logEv({ tu: 'd' });
  mode = 'tutdone';
  setTip(null);
  meta.tutorialDone = true;
  if (done && !meta.tutReward) { meta.tutReward = true; meta.coins += 40; }
  if (done && !meta.journeyDone && meta.journey == null) { meta.journey = 0; meta.coach = Object.assign(meta.coach || {}, { hub: 1, map: 1, prelevel: 1 }); }
  saveMeta();
  show(`<div class="card"><div class="eyebrow">${t('tutorial')}</div><h2>${done ? TX('done') : t('tutorial')}</h2>
    <div style="display:flex;justify-content:center">${avatar(meta.char, 64, null, 'cheer')}</div>
    <p>${done ? TX('doneP') : t('tutDoneP')}</p>
    ${!meta.cloudAsked && cloud.state !== 'on' ? cloudBox() : ''}
    <button class="btn" data-act="hub">${done ? TX('go') : t('home')}</button></div>`);
  meta.cloudAsked = true;
}
