// Trail shape: each grove has ADV_N gardens; the last is the boss, HARD_I is the hard one (from grove 3).
const ADV_N = 8, BOSS_I = 8, HARD_I = 6;
const isBossI = i => i === BOSS_I;
const isHardI = (G, i) => G >= 3 && i === HARD_I;
const advHard = (G, i) => isHardI(G, i) && !run?.daily;
// Balance table for the Season 1 trail. Tuned against bot simulations (see design notes); change numbers here, not in the code below.
// Bands: a = groves 1-3, b = groves 4-8, c = groves 9-12.
const BAL = {
  count:  { a: 2.2, b: 1.35, c: 0.92 },  // sprouts multiplier (early gardens longer, late ones capped by time)
  countAdd: { a: 0, b: 0, c: 0 },
  neAdd:  { a: 0, b: 1, c: 1 },          // extra pests
  speed:  { a: 1.3, b: 1.5, c: 1.3 },    // pest speed multiplier
  hard:   { count: 0.45, ne: 3, speed: 1.4, hp: -1 }, // hard garden: short and sharp, one heart less
  boss:   { speed: 0.92, ne: 5 },        // bigger boss maps, slightly slower guards
  // per-grove pest speed multipliers for normal, hard and boss gardens (auto-tuned, index = grove - 1)
  gs: { n: [1.15, 1.15, 1.15, 1.678, 1.475, 1.069, 0.987, 1.15, 0.987, 1.475, 1.028, 1.069], h: [1, 1, 1.5, 1.65, 0.9, 1.5, 1.15, 0.825, 1.719, 1.6, 0.947, 1.759], b: [1.719, 1.719, 0.642, 0.987, 0.987, 0.825, 0.947, 0.703, 0.541, 1.069, 0.581, 0.744] },
  hne: [0,0,1,2,2,1,0,0,0,3,0,0],          // extra pests in each grove's hard garden
  gm: [1.469, 1.075, 1.075, 1.338, 1.075, 1.469, 0.813, 1.075, 1.075, 1.469, 1.075, 0.944, 1.075, 0.583, 1.075, 0.944, 1.075, 1.338, 1.075, 1.075, 1.075, 1.075, 1.075, 0.583, 0.616, 1.075, 1.075, 1.075, 1.075, 1.075, 1.075, 0.681, 1.534, 1.075, 1.075, 0.681, 1.567, 0.878, 1.075, 1.338, 0.944, 0.681, 1.338, 0.681, 1.075, 1.075, 0.878, 0.747, 1.009, 1.075, 0.681, 0.813, 1.206, 1.338, 0.944, 0.55, 1.075, 1.075, 0.813, 0.681, 0.747, 1.075, 0.616, 1.075, 1.338, 1.075, 1.338, 1.075, 1.009, 1.075, 1.075, 1.338, 1.075, 0.681, 1.075, 1.075, 1.075, 1.075, 0.583, 0.878, 0.813, 0.813, 1.075, 0.714, 0.681, 1.567, 1.075, 1.534, 1.534, 1.338, 1.075, 1.075, 1.075, 1.075, 1.075, 1.239],                 // per-garden fine tune of pest speed, index (grove-1)*5 + garden-1
  ghp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, -1, 0, -2, 0, 0, 0, -1, 0, 0, 0, -1, -2, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 3, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, -3, 0, 0, -3, 0, 0, 0, -1, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, -3, -1, -3, 0, 0],                // per-garden heart adjustment
  rosterAdd: { a: 0, b: 1, c: 2 },     // extra special pests (instead of wanderers) once a grove's new pest has been met
  speedCap: 3.25,                         // pests never outrun a hero at the Nest goal
  twinsNe: 1,                            // the Twins already bring 2 bosses
  // economy: seeds paid per garden (tuned with full-season campaign simulations)
  eco: { first: 3, star: 6, starPay2: 0.15, starPay3: 0.3, starPayHard: 0.15, heroRate: 0.3, heroCap: 1, clearBase: 2, clearG: 1, chestBase: 20, chestStep: 8 },
  nestSpeed: 0.035,                      // hero speed per Pés Ligeiros level (skill should decide ~70% of a win)
  heroAdd: 0.55,                         // added to every hero's base speed
};
const balBand = G => G <= 3 ? 'a' : G <= 8 ? 'b' : 'c';
function advSpec(G, i) {
  const bd = balBand(G), hard = isHardI(G, i), boss = isBossI(i);
  const ii = [1, 1, 2, 3, 2, 4, 3, 4][Math.min(ADV_N, i) - 1]; // difficulty step inside the grove (sawtooth: easy, easy, medium, medium+, breather, hard, medium)
  const saw = [0, 0, 1, 1][ii - 1];
  const ne = Math.min(6, 1 + Math.floor((G - 1) * 0.5) + saw) - (boss ? 1 : 0);
  const gi = Math.max(0, Math.min(11, G - 1)), gm = (boss ? BAL.gs.b[gi] : hard ? BAL.gs.h[gi] : BAL.gs.n[gi]) * (BAL.gm[gi * ADV_N + i - 1] || 1);
  const sp = Math.min(BAL.speedCap, Math.min(2.9, (1.5 + 0.06 * G + 0.035 * ii) * (G <= 2 ? 0.78 : G <= 4 ? 0.88 : 1)) * BAL.speed[bd] * (hard ? BAL.hard.speed : 1) * (boss ? BAL.boss.speed : 1) * gm);
  return {
    hard,
    ne: Math.min(8, Math.max(boss ? 0 : 1, ne) + BAL.neAdd[bd] + (hard ? BAL.hard.ne + BAL.hne[Math.max(0, Math.min(11, G - 1))] : 0) + (boss ? (BOSS_ORDER[(G - 1) % BOSS_ORDER.length] === 'twins' ? BAL.twinsNe : BAL.boss.ne) : 0)),
    colors: G === 1 ? (ii <= 2 ? 2 : 3) : G <= 3 ? 3 : 4,
    count: Math.max(5, Math.min(26, Math.round((Math.min(20, 5 + Math.floor(G * 1.2) + ii) + BAL.countAdd[bd]) * BAL.count[bd] * (hard ? BAL.hard.count : 1)))),
    shooters: G < 2 ? 0 : Math.min(G >= 10 ? 3 : 2, Math.floor(G / 3) + (ii >= 3 ? 1 : 0)),
    hunters: G < 5 ? 0 : Math.min(G >= 12 ? 3 : 2, Math.max(1, Math.floor((G - 2) / 3))),
    speed: sp,
    dual: G >= 9 ? 2 : G >= 7 ? 1 : 0,
    rainbow: G >= 3,
  };
}
// Onboarding: the grove where each pest first shows up. Gardens 1-2 of that grove have it as the only special pest,
// from garden 3 it mixes with the older ones, the hard garden (6) and the boss (8) test it.
const PEST_INTRO = { shooter: 2, hunter: 5, mushroom: 6, sniper: 8, grape: 9 };
function advRoster(G, i, ne, oldSpecials) {
  const known = Object.keys(PEST_INTRO).filter(k => PEST_INTRO[k] < G), fresh = Object.keys(PEST_INTRO).find(k => PEST_INTRO[k] === G);
  const room = Math.max(0, ne - (ne >= 3 ? 1 : 0)), types = [];
  if (fresh && i <= 2) types.push(fresh);
  else if (fresh || known.length) {
    const pool = fresh ? [fresh, ...known.slice().reverse()] : known.slice().reverse(); // newest first
    const n = Math.min(room, Math.max(1, oldSpecials + (isBossI(i) ? 0 : BAL.rosterAdd[balBand(G)])));
    for (let k = 0; k < n; k++) types.push(pool[(k + (fresh ? 0 : i - 1)) % pool.length]);
  }
  while (types.length < ne) types.push('wander');
  return types.slice(0, ne);
}
// First appearance of each thing in the season (for the "New!" strip before a garden)
function advFirsts(G, i) {
  const out = [], fresh = Object.keys(PEST_INTRO).find(k => PEST_INTRO[k] === G);
  if (fresh && i === 1) out.push(fresh);
  if (G === 2 && i === 3) out.push('shiny');
  if (G === 3 && i === 1) out.push('rainbow');
  if (G === 4 && i === 1) out.push('colors4');
  if (G === 4 && i === 3) out.push('par');
  if (G === 7 && i === 1) out.push('dual');
  if (G === 8 && i === 3) out.push('night');
  return out;
}
const advPar = (G, i, count) => { const k = G <= 3 || (G === 4 && i < 3) ? 0 : G <= 7 ? 1.5 : 1; return k ? Math.round((isBossI(i) ? 70 + 8 * count : 35 + 6 * count) * k) : 0; };
const advBonusHp = G => Math.min(2, Math.floor((G - 1) / 4));
const advAllow = G => Math.min(3, Math.floor((G - 1) / 2));
// 3 stars = few hits AND under par time; going over par caps the result at 2 stars.
const advStarsFor = (G, hits, time, par) => { const a = advAllow(G); const s = hits <= a ? 3 : hits <= a + 2 ? 2 : 1; return s === 3 && par && time > par ? 2 : s; };
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function rainbowSpot() {
  const occ = new Set((bubbles || []).map(b => b.x + ',' + b.y));
  const pp = player ? { x: player.x, y: player.y } : START;
  const free = freeTiles(t => !occ.has(t.x + ',' + t.y) && Math.abs(t.x - pp.x) + Math.abs(t.y - pp.y) >= 3);
  return free.length ? free[rnd(free.length)] : null;
}

