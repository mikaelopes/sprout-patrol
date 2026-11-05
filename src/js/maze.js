/* ---------- maze ---------- */
function genMaze() {
  grid = [];
  for (let y = 0; y < ROWS; y++) grid.push(new Array(COLS).fill(1));
  const stack = [[1, 1]];
  grid[1][1] = 0;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const n = shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]]).filter(([dx, dy]) => {
      const x = cx + dx, y = cy + dy;
      return x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && grid[y][x] === 1;
    });
    if (!n.length) { stack.pop(); continue; }
    const [dx, dy] = n[0];
    grid[cy + dy / 2][cx + dx / 2] = 0;
    grid[cy + dy][cx + dx] = 0;
    stack.push([cx + dx, cy + dy]);
  }
  for (let y = 1; y < ROWS - 1; y += 2) for (let x = 1; x < COLS - 1; x += 2) {
    const exits = FOUR.filter(([dx, dy]) => grid[y + dy][x + dx] === 0).length;
    if (exits <= 1) {
      const walls = shuffle(FOUR.filter(([dx, dy]) => {
        const wx = x + dx, wy = y + dy;
        return grid[wy][wx] === 1 && wx > 0 && wy > 0 && wx < COLS - 1 && wy < ROWS - 1;
      }));
      if (walls.length) { const [dx, dy] = walls[0]; grid[y + dy][x + dx] = 0; }
    }
  }
  // extra loops scale with map area so big maps have escape routes
  const loops = Math.round(COLS * ROWS / 24);
  for (let i = 0; i < loops; i++) {
    const x = 1 + rnd(COLS - 2), y = 1 + rnd(ROWS - 2);
    if (grid[y][x] === 1 && ((x % 2 === 0 && y % 2 === 1) || (x % 2 === 1 && y % 2 === 0))) grid[y][x] = 0;
  }
}

/* ---------- garden setup ----------
   Pests: 1 + floor((garden-1)/2), max 8 (+2 in Swarm, max 9).
   Map size grows with them: cols = 11 + 2·floor(0.75·(n-1)) up to 19, rows = 15 + 2·(n-1) up to 25. */
function newGarden() {
  const g = run.garden;
  rng = run.daily ? mulberry32(run.daily.seed) : run.kind === 'adv' ? mulberry32(run.adv.g * 1009 + run.adv.i * 31 + 7) : run.kind === 'tutorial' ? mulberry32(4242) : Math.random;
  run.boss = run.kind === 'tutorial' ? false : run.kind === 'adv' ? isBossI(run.adv.i) : gardenInGrove() === PER_GROVE;
  run.keys = 0; run.bossDone = false; run.cage = null;
  run.gt = 0; run.wiltMsg = false; run.nightOn = false; run.wcd = {}; run.bossAngry = false; run.proj = []; run.fx = []; run.lobs = []; run.sprouts = []; run.homeTufts = [];
  const AS = (run.kind === 'adv' || run.kind === 'tutorial') ? advSpec(run.adv.g, run.adv.i) : null;
  if (AS && run.daily) { const tw = run.daily.twist; if (tw === 'swarm') AS.ne = Math.min(7, AS.ne + 2); if (tw === 'rush') AS.speed *= 1.15; if (tw === 'bounty') AS.count = Math.min(26, AS.count + 6); }
  // Endless: Pests grow with the garden number only (1 → 2 at garden 4, 3 at 7, ...), never with the skills you pick.
  let ne = AS ? AS.ne : Math.min(9, 1 + Math.floor((g - 1) / 3) + Math.floor(g / 10));
  if (run.mode === 'swarm') ne = Math.min(10, ne + 2);
  if (run.kind === 'endless' && run.wild && run.wild.greed) ne = Math.min(10, ne + 1);
  if (run.kind === 'endless' && run.node === 'thorny' && !run.boss) ne = Math.min(10, ne + 1);
  const k = ne - 1 - (AS && AS.mapNe != null ? AS.ne - AS.mapNe : 0); // boss maps: sized by mapNe, not by the guard count
  COLS = Math.min(19, 11 + 2 * Math.floor(k * 0.75));
  ROWS = Math.min(25, 15 + 2 * k);
  START = { x: ((COLS - 1) / 2) | 1, y: ((ROWS - 1) / 2) | 1 };
  genMaze();

  const nColors = AS ? AS.colors : g === 1 ? 2 : g <= 3 ? 3 : 4;
  const corners = shuffle([[1, 1], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, ROWS - 2]]);
  portals = [];
  const colorOrder = shuffle([...Array(nColors).keys()]);
  if ((AS ? AS.dual >= 2 : g >= 13) && nColors === 4) {
    portals.push({ x: corners[0][0], y: corners[0][1], cs: colorOrder.slice(0, 2) });
    portals.push({ x: corners[1][0], y: corners[1][1], cs: colorOrder.slice(2, 4) });
  } else if ((AS ? AS.dual >= 1 : g >= 9) && nColors === 4) {
    portals.push({ x: corners[0][0], y: corners[0][1], cs: colorOrder.slice(0, 2) });
    portals.push({ x: corners[1][0], y: corners[1][1], cs: [colorOrder[2]] });
    portals.push({ x: corners[2][0], y: corners[2][1], cs: [colorOrder[3]] });
  } else {
    colorOrder.forEach((c, i) => portals.push({ x: corners[i][0], y: corners[i][1], cs: [c] }));
  }

  player = { x: START.x, y: START.y, nx: START.x, ny: START.y, p: 0, moving: false, dir: null, want: null, face: [0, 1] };
  followers = [];
  trail = [{ x: START.x, y: START.y }];
  bubbles = []; shots = []; particles = []; floats = []; pickups = []; banners = []; sfxs = [];

  if ((AS ? AS.rainbow : g >= 5) && !run.boss) {
    const t = rainbowSpot();
    if (t) portals.push({ x: t.x, y: t.y, cs: [0, 1, 2, 3], rainbow: true, active: false, timer: 15 });
  }

  const count = AS ? AS.count : Math.min(26, 5 + g, Math.max(8, 3 * cap())); // Endless: never more than 3 trail-loads per garden
  // Adventure starts cozy: no target time in groves 1-3, a generous one from grove 4, the full one from grove 8. Endless is where you hurry.
  run.par = run.kind === 'adv' ? advPar(run.adv.g, run.adv.i, count) : 0; run.at = 0;
  const free = shuffle(freeTiles(t => Math.abs(t.x - START.x) + Math.abs(t.y - START.y) > 1));
  for (let i = 0; i < count && i < free.length; i++) bubbles.push({ x: free[i].x, y: free[i].y, c: i % nColors, bob: Math.random() * 6 });
  // Farm Heroes-style goal: how many sprouts of each color this garden wants
  // Shiny: a rare sparkly sprout. Deliver it before its glow fades for bonus seeds and a spot in your collection.
  if ((run.kind === 'adv' || run.kind === 'endless') && !run.boss && !run.daily && bubbles.length && Math.random() < shinyChance()) bubbles[rnd(bubbles.length)].shiny = true;
  run.goalC = {}; run.gotC = {}; bubbles.forEach(b => { run.goalC[b.c] = (run.goalC[b.c] || 0) + 1; });
  run.heroPar = run.kind === 'adv' ? (run.par || Math.round((35 + 6 * count) * 1.6)) : 0;
  run.bossType = BOSS_ORDER[(grove() - 1) % BOSS_ORDER.length];
  run.goldNeed = 0; run.goldSaved = 0; run.cages = [];
  if (run.boss) {
    const md = t2 => Math.abs(t2.x - START.x) + Math.abs(t2.y - START.y);
    const n = run.bossType === 'twins' ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const occ = new Set(bubbles.map(b => b.x + ',' + b.y));
      const cands = freeTiles(t2 => !occ.has(t2.x + ',' + t2.y) && md(t2) >= 5 && run.cages.every(c => Math.abs(c.x - t2.x) + Math.abs(c.y - t2.y) >= 6)).sort((a, b) => md(b) - md(a));
      const cg = cands[rnd(Math.min(6, cands.length))] || cands[0] || { x: 1, y: 1 };
      bubbles.push({ x: cg.x, y: cg.y, c: 4, gold: true, locked: true, bob: 0 });
      run.cages.push(cg);
    }
    run.cage = run.cages[0];
    run.goldNeed = n;
    portals.push({ x: START.x, y: START.y, cs: [4], golden: true, active: false });
  }

  enemies = [];
  const shooters = AS ? AS.shooters : g < 5 ? 0 : g < 9 ? 1 : Math.floor(ne / 3);
  const hunters = AS ? AS.hunters : g < 7 ? 0 : g < 11 ? 1 : Math.floor(ne / 3);
  const types = [];
  for (let i = 0; i < shooters; i++) types.push('shooter');
  for (let i = 0; i < hunters; i++) types.push('hunter');
  if (AS && !run.daily) { // Adventure: each grove brings one new pest, met alone first (gardens 1-2), then mixed with the older ones
    types.length = 0; types.push(...advRoster(run.adv.g, run.adv.i, ne, AS.shooters + AS.hunters));
  }
  while (types.length < ne) types.push('wander');
  if (run.kind === 'endless' && grove() >= 2) {
    const gv = grove();
    const pool = gv === 2 ? [] : gv === 3 ? ['mushroom'] : gv === 4 ? ['sniper'] : gv === 5 ? ['grape', 'mushroom'] : shuffle(['mushroom', 'grape', 'sniper']).slice(0, 2);
    const nCounter = Math.max(1, Math.floor(ne / 3));
    let kk = 0;
    for (let j = 0; pool.length && j < types.length && kk < nCounter; j++) if (types[j] === 'wander') { types[j] = pool[kk % pool.length]; kk++; }
  }
  if (run.daily && (run.daily.twist === 'mush' || run.daily.twist === 'grapes')) { for (let j = 0, kk = 0; j < types.length && kk < 2; j++) { types[j] = run.daily.twist === 'mush' ? 'mushroom' : 'grape'; kk++; } }
  // Endless speed starts gentler (1.6 tiles/s) and climbs 0.075 per garden to a 3.6 cap around garden 27.
  let espeed = AS ? AS.speed : Math.min(3.6, 1.55 + g * 0.075);
  if (run.kind === 'endless') espeed *= (run.node === 'thorny' && !run.boss ? 1.1 : 1) * (run.wild && run.wild.rush ? 1.1 : 1) * (run.wild && run.wild.calm ? 0.85 : 1);
  const far = shuffle(freeTiles(t => Math.abs(t.x - START.x) + Math.abs(t.y - START.y) >= 6));
  types.slice(0, ne).forEach((type, i) => {
    const t = far[i % far.length];
    enemies.push({ x: t.x, y: t.y, nx: t.x, ny: t.y, p: 1, dir: [0, 0], type, cool: 0, aim: 0, aimDir: null, stun: 0,
      shootT: 3 + Math.random() * 2, speed: espeed * (type === 'hunter' ? 0.92 : 1) });
  });
  if (run.boss) {
    enemies.length = bossTrim(enemies.length, run.bossType === 'twins');
    run.cages.forEach(cg => {
      const near = freeTiles(t2 => Math.abs(t2.x - cg.x) + Math.abs(t2.y - cg.y) <= 3 && Math.abs(t2.x - START.x) + Math.abs(t2.y - START.y) >= 5);
      const bt = near[rnd(near.length)] || cg;
      const v = run.bossType;
      enemies.push({ x: bt.x, y: bt.y, nx: bt.x, ny: bt.y, p: 1, dir: [0, 0], type: 'boss', variant: v, cool: 0, aim: 0, aimDir: null, stun: 0,
        shootT: v === 'queen' ? 2 : 4, speed: espeed * (v === 'queen' ? 0.7 : v === 'twins' ? 0.85 : v === 'potato' ? 0.75 : v === 'broc' ? 0.6 : 0.8),
        bonks: 0, bonkMax: v === 'twins' ? 2 : v === 'broc' ? 5 : 3, weak: v === 'twins' ? (run.cages.indexOf(cg) === 0 ? 'freeze' : 'stun') : null });
    });
  }

  if (run.kind === 'tutorial') {
    const c0 = portals[0].cs[0];
    bubbles = bubbles.filter(b => !b.gold).slice(0, 2).map(b => ({ ...b, c: c0 }));
    enemies = [];
  }
  run.den = pickDen();
  enemies.forEach(flagEnemy);
  freezeT = 0;
  frostSpawnT = 6; seedSpawnT = 8; invuln = 1.2; cometT = 0; clearPending = false;
  run.hitThisGarden = false; run.charmLeft = nestGuards(meta.up.trail); if (run.kind === 'adv') run.hitLog = [];
  if (run.char === 'moss') { shieldUp = true; shieldT = 0; } // Mac's leaf bubble: one per garden
  rng = Math.random;
  fit();
  snapCam();
  updateHud();
}
// The den is its own nook, like a ghost house: a dead-end pocket away from the start, portals, tufts and pests.
// Adventure boards use the seeded rng, so a garden always puts its den in the same place.
function pickDen() {
  const taken = new Set(bubbles.map(b => b.x + ',' + b.y).concat(enemies.map(e => e.x + ',' + e.y)));
  const nearPortal = t => portals.some(p => Math.abs(p.x - t.x) + Math.abs(p.y - t.y) < 3);
  const ok = t => !taken.has(t.x + ',' + t.y) && !nearPortal(t) && Math.abs(t.x - START.x) + Math.abs(t.y - START.y) >= 5;
  const exits = t => FOUR.filter(([dx, dy]) => isOpen(t.x + dx, t.y + dy)).length;
  let pool = freeTiles(t => ok(t) && exits(t) === 1);
  if (!pool.length) pool = freeTiles(ok);
  if (!pool.length) pool = freeTiles(t => !(t.x === START.x && t.y === START.y));
  return pool.length ? pool[rnd(pool.length)] : { x: START.x, y: START.y };
}
function flagEnemy(e) {
  e.immFreeze = e.type === 'night';
  e.immStun = e.type === 'night';
  e.immHome = e.type === 'night' || e.type === 'boss';
  e.frz = 0; e.tol = 0; e.hitT = 0; e.hurtT = 0; e.denT = 0;
  const base = { wander: 1, shooter: 2, sniper: 2, hunter: 2, mushroom: 2, grape: 2, minigrape: 1 }[e.type] || 1;
  const G = run.kind === 'endless' ? grove() : run.adv ? run.adv.g : 1;
  const bonus = e.minion || run.kind === 'tutorial' ? 0 : run.kind === 'endless' ? Math.min(2, Math.floor((G - 1) / 2)) : G >= 8 ? 2 : G >= 4 ? 1 : 0;
  // Basic pests have no health: one bump (frozen or stunned) or one weapon hit sends them to the den. Only bosses take several bonks.
  e.val = base + bonus; // seed reward still grows with the pest's toughness and the grove
  e.maxHp = e.type === 'boss' || e.type === 'night' ? 0 : 1;
  e.hp = e.maxHp;
}
/* Adventure curve: slow climb across groves, small sawtooth inside each grove, hard caps.
   Pests 1→6, speed 1.8→3.4 tiles/s, tufts 6→20. New mechanics arrive one grove at a time. */
