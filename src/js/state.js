const canvas = document.getElementById('cv');
let ctx = canvas.getContext('2d');
const boardEl = document.getElementById('board');
const overlay = document.getElementById('overlay');
const abilityBtn = document.getElementById('abilityBtn');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let cell = 32, dpr = 1, mazeCanvas = null, viewW = 0, viewH = 0;
const cam = { x: 0, y: 0 };
let grid, portals, bubbles, enemies, shots, particles, floats, pickups;
let player, followers, trail;
let sk, evo, run;
let mode = 'splash';
let freezeT = 0, frostSpawnT = 0, seedSpawnT = 0, shake = 0, time = 0, invuln = 0, cometT = 0, abilityCd = 0;
let shieldUp = false, shieldT = 0;
let pendingUps = 0, clearPending = false, chestPending = false, lastFullMsg = -9, currentCards = [], cardSource = 'level';

/* ---------- helpers ---------- */
let rng = Math.random;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
const rnd = n => Math.floor(rng() * n);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function isOpen(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS && grid[y][x] === 0; }
function isPortal(x, y) { return portals.find(p => p.x === x && p.y === y && ((!p.rainbow && !p.golden) || p.active)); }
function freeTiles(pred) {
  const out = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] === 0 && !isPortal(x, y) && (!pred || pred({ x, y }))) out.push({ x, y });
  }
  return out;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = n => Math.round(n).toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ch = () => CHARS[run.char];

/* ---------- derived stats ---------- */
const speedOf = lv => (CHARS[run.char].speed + BAL.heroAdd + lv * 0.4 + (meta.up.speed || 0) * BAL.nestSpeed);
const speed = () => speedOf(sk.swift) * (cometT > 0 ? 1.3 : 1) * (run.wild && run.wild.rush ? 1.2 : 1);
const cap = () => Math.max(2, ch().cap + sk.trail * 2 + nestSpaces(meta.up.trail) + (run.wildCap || 0) - (run.wild && run.wild.calm ? 2 : 0));
const maxHp = () => run.mode === 'oneheart' ? 1 : Math.max(1, ch().hp + sk.fur + nestHearts(meta.up.heart) + (run.bonusHp || 0) + (run.wildHp || 0) + (run.kind === 'adv' ? advBonusHp(run.adv.g) : 0));
// Levels 1-3 cost 2 tufts each (3 cards in the first garden), then 2·level − 1: 7, 9, 11...
const xpNeed = () => run.level <= 3 ? 2 : 2 * run.level - 1;
const freezeDur = () => 4 + sk.frost * 1.5;
const frostEvery = () => 12 - sk.frost * 2;
// Bigger maps take longer to cross, so pickups and the rainbow portal stay out longer (x1 on an 11x15 map, up to x1.8).
const mapF = () => Math.max(1, Math.min(1.8, Math.sqrt(COLS * ROWS / 165)));
const pickupLife = type => (type === 'frost' ? 12 + 2 * (sk.frost || 0) : 12) * mapF();
const rainbowLife = () => (10 + 3 * (meta.up.rainbow || 0)) * mapF();
const ghostT = () => 1.6 + 0.3 * ((meta.up.heart || 0) - nestHearts(meta.up.heart));
const coinMult = () => MODES[run.mode].mult * (run.wild && run.wild.greed ? 1.5 : 1);
let wp = {};
const buildPower = () => Object.values(wp).reduce((a, b) => a + b, 0) + PASSIVES.reduce((a, k) => a + (sk[k] || 0), 0) + Object.keys(EVO2).filter(k => evo[k]).length * 3;
const wiltMult = () => run.kind === 'endless' && run.gt > 90 ? Math.min(1.6, 1 + 0.004 * (run.gt - 90)) : 1;
const dirWord = (n, lang) => n >= 4 ? (lang === 'pt' ? 'nas 4 direções' : 'in all 4 directions') : n === 2 ? (lang === 'pt' ? 'para frente e para trás' : 'ahead and behind') : (lang === 'pt' ? 'para frente' : 'ahead');
function wpStat(k) {
  if (k === 'aura' && evo.blizzard) return { cd: 4, len: 9, d: 3.5, dirs: 4, thru: 1, all: true };
  if (k === 'orbit' && evo.wall) return { cd: 1.8, n: 4, r: 1.35 };
  if (k === 'puff' && evo.thunder) return { cd: 3, d: 3, dirs: 4, bolt: true };
  return WEAPONS[k].stat(Math.max(1, wp[k]));
}
const grove = () => Math.ceil(run.garden / PER_GROVE);
const gardenInGrove = () => (run.garden - 1) % PER_GROVE + 1;

