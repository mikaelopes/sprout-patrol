/* TEST HOOK. Never part of the shipped build: tools/build.py --test OUT appends this file inside the game closure.
   It is the one test API: window.__g (gameplay sims and state tests) and window.__t (menu, save and cloud tests).
   The game itself only reads the TEST flags (fast, onResult); everything else lives here. */
TEST.fast = window.__fast === undefined ? 1 : +window.__fast; // 1: no drawing, no rAF stepping (tests call step); set window.__fast = 0 before load to draw
Object.defineProperty(window, '__fast', { get: () => TEST.fast, set: v => { TEST.fast = v; }, configurable: true });
if (window.__noLearn === undefined) window.__noLearn = 1;
TEST.onResult = (won, quit) => {
  window.__res = { hc: run.hitLog || [], raw: run.coins, won, stars: won && run.adv ? advStarsFor(run.adv.g, run.hits, run.at, run.par) : 0, at: run.at, par: run.par, heroPar: run.heroPar, sprouts: sumv(run.goalC || {}) };
};
const seedRandom = sd => { let x = sd >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const BOSS_ALL = { king: 1, queen: 1, twins: 1, broc: 1, potato: 1 };
const startC = (g, i, bo) => { window.__res = null; meta.bossSeen = { ...BOSS_ALL }; startAdventure(g, i, bo || {}); if (mode === 'bossintro') resume(); if (mode !== 'play') resume(); };
window.__g = {
  get meta() { return meta }, CHARS, flagEnemy, setAbCd(v) { abilityCd = v }, setShield(v) { shieldUp = v }, shield() { return shieldUp }, scatter,
  deliverAt(i) { deliver(portals[i]) }, ability() { useAbility() }, abCd() { return abilityCd }, hero() { return ch() }, distMap() { return playerDistMap() },
  BAL, dims() { return { COLS, ROWS } }, enemies() { return enemies }, bubbles() { return bubbles }, portals() { return portals }, pickups() { return pickups },
  followers() { return followers }, player() { return player }, run() { return run }, mode() { return mode }, cap, speed, isOpen, isFrozen, epos,
  freezeT() { return freezeT }, now() { return performance.now() }, step, cleared() { return clearPending }, shots() { return shots }, lobs() { return run.lobs || [] },
  res() { return window.__res }, freeze, bonkBoss, skillStun, isOpenT(x, y) { return isOpen(x, y) },
  setFollowers(n) { followers = []; trail.length = 0; for (let k = 0; k < n; k++) followers.push({ c: k % 3, born: 0 }); for (let k = 0; k <= n; k++) trail.push({ x: player.x, y: player.y }); },
  trail() { return trail }, setInv(v) { invuln = v }, invuln() { return invuln }, NEST, NEST_REC, groveReached, starChestsReady, openStarChest, setMode(v) { mode = v },
  startC, seedRandom,
  start(g, i, bo) { meta.adv = {}; startC(g, i, bo); },
  // save and cloud safety (tests/smoke/saves.js)
  SAVE_KEY, RUN_V, progressOf, applySave, readCode, saveCode, savedRunOk,
  load(obj) { applySave(obj); return JSON.parse(JSON.stringify(meta)); },
  startEndless() { window.__res = null; freshRun(); beginGarden(); if (mode !== 'play') resume(); },
};
window.__t = { get meta() { return meta }, get cloud() { return cloud }, startTutorial, finishTutorial, skipTutorial, showProfile, saveMeta, get mode() { return mode } };
