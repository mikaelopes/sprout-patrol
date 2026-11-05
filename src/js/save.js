let meta = {
  name: 'Sprout Keeper', coins: 0, char: 'pip', owned: { pip: true }, mode: 'normal',
  up: { heart: 0, trail: 0, grip: 0, speed: 0, frost: 0, rainbow: 0, reroll: 0, coin: 0 }, cutsV: 2,
  st: { pops: 0, bosses: 0, streaks: 0, runs: 0, tufts: 0, seedsTotal: 0, bestGarden: 0, bestCombo: 0, noHit: 0, rainbow: 0, evos: 0, oneHeartGrove: 0 },
  claimed: {}, adv: {}, discovered: {},
};
const META_DEFAULT = JSON.stringify(meta);
// Version of the saved Endless run (meta.savedRun). Bump it whenever a run.* field is renamed or its meaning changes:
// a saved run with another version is dropped on load (quietly), and progress (meta) is always kept.
const RUN_V = 1;
const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
function savedRunOk(sv) { return isObj(sv) && sv.v === RUN_V && isObj(sv.run) && sv.run.kind === 'endless' && Number.isFinite(sv.run.garden) && isObj(sv.sk) && isObj(sv.wp) && isObj(sv.evo); }
// Tutorials, guided steps, learn cards and boss intros are shown once per player: whatever save wins, the "seen" flags are kept.
function mergeSeen(into, from) {
  if (!into || !from) return into;
  ['tutorialDone', 'tutReward', 'journeyDone', 'ejDone'].forEach(k => { if (from[k]) into[k] = true; });
  ['journey', 'ej'].forEach(k => { if (typeof from[k] === 'number') into[k] = Math.max(typeof into[k] === 'number' ? into[k] : 0, from[k]); });
  ['learned', 'coach', 'seenFoes', 'bossSeen'].forEach(k => { if (from[k]) into[k] = { ...(into[k] || {}), ...from[k] }; });
  return into;
}
// v98: removed upgrades, repeat upgrades and gear are refunded in seeds (once).
function migrateCuts(m) {
  if (!m || m.cutsV >= 1) return m;
  const sumc = (arr, lv) => arr.slice(0, lv || 0).reduce((a, b) => a + b, 0);
  let back = 0; m.up = m.up || {};
  const OLD = { grip: [60, 190, 420], rainbow: [50, 150, 340], reroll: [70, 220, 480], coin: [50, 130, 260, 450, 750] };
  for (const k in OLD) { back += sumc(OLD[k], m.up[k]); m.up[k] = 0; }
  const REP = { rseed: 80, rscore: 60, rfrost: 70 };
  for (const k in REP) for (let i = 0; i < ((m.rep && m.rep[k]) || 0); i++) back += Math.round(REP[k] * Math.pow(1.15, i));
  m.rep = {};
  const OG = { globe: [90, 280, 650], compass: [60, 200, 480] };
  m.gear = m.gear || {};
  for (const k in OG) { back += sumc(OG[k], m.gear[k]); delete m.gear[k]; }
  m.gearOn = (m.gearOn || []).filter(k => !OG[k]);
  m.coins = (m.coins || 0) + back; if (back) m.refundNote = back;
  m.cutsV = 1; return m;
}
// v105: the Nest became 3 upgrades × 10 levels and gear was folded in, so every Nest and gear purchase is refunded once;
// groves grew from 5 to 8 gardens, so the old boss slot (garden 5) moves to garden 8.
function migrateNest2(m) {
  if (!m || m.cutsV >= 2) return m;
  const sumc = (arr, lv) => arr.slice(0, lv || 0).reduce((a, b) => a + b, 0);
  const OLD = { trail: [40, 230, 490, 840, 1310], speed: [90, 210, 420, 700, 1140], heart: [105, 350, 790], frost: [90, 245, 490, 790, 1225], grip: [], rainbow: [], reroll: [], coin: [] };
  let back = 0; m.up = m.up || {};
  for (const k in OLD) { back += sumc(OLD[k], m.up[k]); m.up[k] = 0; }
  const OG = { charm: [80, 250, 600], thorn: [70, 220, 520] };
  m.gear = m.gear || {}; for (const k in OG) back += sumc(OG[k], m.gear[k]); m.gear = {}; m.gearOn = [];
  if (m.adv) { const nx = {}; for (const id in m.adv) { const [g, i] = id.split('-').map(Number); nx[i === 5 ? g + '-8' : id] = m.adv[id]; } m.adv = nx; }
  m.coins = (m.coins || 0) + back; if (back) m.refundNote = (m.refundNote || 0) + back;
  m.cutsV = 2; return m;
}
function applySave(saved) {
  const prev = typeof meta === 'object' ? meta : null;
  const base = JSON.parse(META_DEFAULT);
  meta = { ...base, ...saved, up: { ...base.up, ...(saved.up || {}) }, st: { ...base.st, ...(saved.st || {}) },
    owned: { ...base.owned, ...(saved.owned || {}) }, claimed: { ...(saved.claimed || {}) }, adv: { ...(saved.adv || {}) } };
  // A save from before the cuts has no cutsV: it must NOT inherit the new-save default (2), or its migrations are skipped.
  // v108 loaded such saves wrongly (old Nest levels, 5-garden groves); spot that shape and migrate it now.
  const u = meta.up || {}, legacy = (u.grip || 0) + (u.reroll || 0) + (u.coin || 0) + (u.rainbow || 0) + (u.frost || 0) > 0 || Object.keys(meta.gear || {}).length > 0;
  if (saved.cutsV == null || legacy) meta.cutsV = 0;
  mergeSeen(meta, prev); migrateCuts(meta); migrateNest2(meta);
  if (!CHARS[meta.char] || !meta.owned[meta.char]) meta.char = 'pip';
  if (!MODES[meta.mode]) meta.mode = 'normal';
  if (meta.savedRun && !savedRunOk(meta.savedRun)) delete meta.savedRun; // only the run is dropped, never progress
}
// Some browsers (Safari, private windows, strict tracking protection) block or wipe storage for pages shown inside
// claude.ai, so the game checks whether the browser actually keeps data and offers a cloud save and a save code.
let storageOK = false;
try { localStorage.setItem('tufttrail-probe', '1'); storageOK = localStorage.getItem('tufttrail-probe') === '1'; localStorage.removeItem('tufttrail-probe'); } catch (e) { storageOK = false; }
/* ---------- Saving ----------
   Every save goes to three places on this device: the main slot, a rotating set of 3 backups (one every 2 minutes),
   and IndexedDB (a second storage that some browsers keep longer). On load the game picks the copy with the most progress.
   A save never overwrites one with clearly more progress unless the player chose that (Clear all data, or a save code),
   so a broken update or a wiped slot can't erase anyone's progress. */
const SAVE_KEY = 'tufttrail-v2', BAK_KEYS = ['tufttrail-bak-a', 'tufttrail-bak-b', 'tufttrail-bak-c'];
const sumv = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
const progressOf = m => !m || !m.st ? 0 : (m.st.tufts || 0) + 2 * (m.st.runs || 0) + 15 * sumv(m.adv) + 20 * ['trail', 'speed', 'heart', 'frost'].reduce((a, k) => a + ((m.up && m.up[k]) || 0), 0) + 40 * Object.keys(m.owned || {}).length + 5 * (m.road || 0) + 20 * ['charm', 'thorn'].reduce((a, k) => a + ((m.gear && m.gear[k]) || 0), 0) + (m.tutorialDone ? 5 : 0);
const store = { best: 0, allowDown: false, lastBak: 0, bakIdx: 0, idbTimer: null, held: false };
function readSlot(key) { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v && v.meta ? v.meta : v && v.st ? v : null; } catch (e) { return null; } }
function pickBest(list) { return list.filter(Boolean).sort((a, b) => (progressOf(b) - progressOf(a)) || ((b.savedAt || 0) - (a.savedAt || 0)))[0] || null; }
function idbOpen() { return new Promise((res, rej) => { try { const rq = indexedDB.open('tufttrail', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('kv'); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); } catch (e) { rej(e); } }); }
async function idbGet(key) { const db = await idbOpen(); return new Promise(res => { try { const rq = db.transaction('kv').objectStore('kv').get(key); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); } catch (e) { res(null); } }); }
async function idbPut(key, val) { const db = await idbOpen(); return new Promise(res => { try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); } }); }
// A copy kept in IndexedDB can rescue progress when the main slot was wiped; it is checked once at start.
async function idbRestore() {
  try {
    const raw = await idbGet('main'); if (!raw) return;
    const other = JSON.parse(raw);
    if (progressOf(other) > progressOf(meta) + 5) {
      applySave(other); store.best = Math.max(store.best, progressOf(other));
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(meta)); } catch (e) {}
      if (meta.lang === 'en' || meta.lang === 'pt') LANG = meta.lang;
      if (mode === 'splash') showSplash(); else if (mode === 'hub') showHub(); else if (mode === 'profile') showProfile();
    }
  } catch (e) {}
}
function askPersist() { try { if (navigator.storage && navigator.storage.persist && !store.askedPersist) { store.askedPersist = true; navigator.storage.persist(); } } catch (e) {} }
try {
  const saved = pickBest([readSlot(SAVE_KEY), ...BAK_KEYS.map(readSlot)]);
  if (saved) {
    applySave(saved); store.best = progressOf(saved);
  } else {
    const old = JSON.parse(localStorage.getItem('tufttrail-meta') || 'null');
    if (old) {
      meta.coins = old.coins || 0; meta.st.bestGarden = old.bestGarden || 0;
      Object.keys(meta.up).forEach(k => { if (old[k]) meta.up[k] = old[k]; });
    }
  }
} catch (e) {}
if (meta.lang === 'en' || meta.lang === 'pt') LANG = meta.lang;
document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
if (!meta.tutorialDone && ((meta.st && (meta.st.runs || meta.st.tufts)) || meta.coins > 0)) meta.tutorialDone = true; // older saves that already played
if ((meta.name === 'Sprout Keeper' || meta.name === 'Tuft Keeper' || meta.name === 'Guardião dos Tufos') && !meta.nameSet) meta.name = LANG === 'pt' ? S.pt.defaultName : 'Sprout Keeper';
if (!CHARS[meta.char] || !meta.owned[meta.char]) meta.char = 'pip';
if (!MODES[meta.mode]) meta.mode = 'normal';
function saveMeta() {
  meta.savedAt = Date.now(); meta.schema = 3;
  const cur = progressOf(meta);
  if (!store.allowDown && cur + 30 < store.best) { store.held = true; return; } // never replace a save that has clearly more progress
  store.best = store.allowDown ? cur : Math.max(store.best, cur);
  store.allowDown = false; store.held = false;
  const json = JSON.stringify(meta);
  try { localStorage.setItem(SAVE_KEY, json); } catch (e) {}
  if (Date.now() - store.lastBak > 120000) { store.lastBak = Date.now(); try { localStorage.setItem(BAK_KEYS[store.bakIdx], json); } catch (e) {} store.bakIdx = (store.bakIdx + 1) % BAK_KEYS.length; meta.lastBackup = store.lastBak; }
  clearTimeout(store.idbTimer); store.idbTimer = setTimeout(() => { idbPut('main', JSON.stringify(meta)).catch(() => {}); }, 800);
  cloudQueue();
}
// The best older copy on this device (backups + IndexedDB), offered in the Profile when someone thinks progress went missing.
async function bestBackup() {
  let idb = null; try { const raw = await idbGet('main'); idb = raw ? JSON.parse(raw) : null; } catch (e) {}
  return pickBest([...BAK_KEYS.map(readSlot), idb]);
}
/* ---------- Claude account save (opt-in) ----------
   Nothing touches the account until the player taps "Connect" (after the tutorial or in the Profile), so nobody gets
   a sign-in prompt just for opening the game. Once connected, every save is also written to data/users/<id>/save and the
   copy with more progress wins on connect. Only people who can write to this artifact (its owner, Team members at
   Contributor level) can save; everyone else keeps the browser save + save code. */
const cloud = { state: 'off', pending: false, ref: null, timer: null, busy: false, dirty: false };
/* Outside Claude (e.g. the GitHub Pages copy) the same opt-in save runs on Firebase with Google sign-in.
   Fill FB from the Firebase console (Project settings → Your apps → Web). These keys are public by design;
   the Firestore rules are what keep each player's save private (saves/{uid}: only that signed-in uid). */
const FB = { apiKey: 'AIzaSyDZZoX_cfs_WVgtVjdxzqORLNoapLnTGqw', authDomain: 'sprout-patrol.firebaseapp.com', projectId: 'sprout-patrol', storageBucket: 'sprout-patrol.firebasestorage.app', messagingSenderId: '452658771940', appId: '1:452658771940:web:ff20f16a63719e8e4c79f1' };
const FB_V = '10.12.2';
const inClaude = () => !!(window.claude && window.claude.use);
const cloudHost = () => inClaude() ? 'claude' : FB.apiKey ? 'firebase' : null;
const acctName = () => cloudHost() === 'firebase' ? 'Google' : 'Claude';
const fb = { ready: null, m: null, app: null, auth: null, db: null };
// Loads the Firebase SDK. Only called after the player opted in: on the first Connect tap, or at boot when meta.cloudOn is already true.
// Loading it before the sign-in tap keeps the popup directly inside the second tap (popup blockers need that).
function fbLoad() {
  if (fb.ready) return fb.ready;
  const base = 'https://www.gstatic.com/firebasejs/' + FB_V + '/';
  fb.ready = (window.__fbMock ? Promise.resolve(window.__fbMock) : Promise.all(['firebase-app', 'firebase-auth', 'firebase-firestore'].map(n => import(base + n + '.js'))).then(([a, u, f]) => ({ ...a, ...u, ...f })))
    .then(m => { fb.m = m; fb.app = m.initializeApp(FB); fb.auth = m.getAuth(fb.app); fb.db = m.getFirestore(fb.app); return fb; })
    .catch(e => { fb.ready = null; throw e; });
  return fb.ready;
}
// The same {get, set} shape the Claude db gives, so the connect/compare/choose logic below is shared.
async function fbRef(interactive) {
  const f = await fbLoad(), m = f.m;
  if (f.auth.authStateReady) await f.auth.authStateReady();
  let u = f.auth.currentUser;
  if (!u && interactive) {
    try { u = (await m.signInWithPopup(f.auth, new m.GoogleAuthProvider())).user; }
    catch (e) { return null; } // closed, blocked or failed: the box says to try again
  }
  if (!u) return null;
  const d = m.doc(f.db, 'saves', u.uid);
  return { id: u.uid, ref: { get: async () => { const s = await m.getDoc(d); return { exists: s.exists(), data: () => s.data() }; }, set: v => m.setDoc(d, v) } };
}
const CL = {
  en: { offer: 'Keep your progress in your Claude account?', connect: 'Connect account', later: 'Not now', on: '✓ Saved to your Claude account.', off: 'Account not connected.',
        signedOut: 'Sign in to Claude to save to your account.', readonly: 'This link can\'t save to accounts. Use your save code.', working: 'Connecting…', loading: 'Loading…', disconnect: 'Disconnect', pulled: 'Loaded your account save.' },
  pt: { offer: 'Guardar seu progresso na sua conta Claude?', connect: 'Conectar conta', later: 'Agora não', on: '✓ Salvo na sua conta Claude.', off: 'Conta não conectada.',
        signedOut: 'Entre no Claude para salvar na conta.', readonly: 'Este link não salva em contas. Use seu código.', working: 'Conectando…', loading: 'Carregando…', disconnect: 'Desconectar', pulled: 'Save da sua conta carregado.' },
};
// With Firebase the button reads Connect until the SDK is loaded (first tap), then Sign in with Google (second tap).
const CLt = k => (k === 'connect' && cloudHost() === 'firebase' && fb.m) ? (LANG === 'pt' ? 'Entrar com Google' : 'Sign in with Google') : (CL[LANG] || CL.en)[k].replace('Claude', acctName()).replace('Sign in to Google to save to your account.', 'Google sign-in didn\'t finish. Try again.').replace('Entre no Google para salvar na conta.', 'O login do Google não terminou. Tente de novo.');
function cloudJson() { // one document, max 256 KiB: drop the oldest play-log entries if needed
  const m = { ...meta }; let j = JSON.stringify(m);
  while (j.length > 240000 && m.log && m.log.length > 20) { m.log = m.log.slice(Math.floor(m.log.length / 4)); j = JSON.stringify(m); }
  return j;
}
function cloudQueue() { if (cloud.state !== 'on') return; cloud.dirty = true; clearTimeout(cloud.timer); cloud.timer = setTimeout(cloudFlush, 1500); }
async function cloudFlush() {
  if (cloud.state !== 'on' || !cloud.ref || cloud.busy || !cloud.dirty) return;
  cloud.busy = true; cloud.dirty = false;
  try { await cloud.ref.set({ json: cloudJson(), at: meta.savedAt || Date.now() }); }
  catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'permission-denied')) cloud.state = 'readonly'; else { cloud.dirty = true; cloud.timer = setTimeout(cloudFlush, 5000); } }
  cloud.busy = false;
}
// Returns the resulting state: 'on' | 'signedOut' | 'readonly'
async function cloudConnect(interactive = true) {
  cloud.state = 'working';
  try {
    let ref;
    if (cloudHost() === 'firebase') { const r = await fbRef(interactive); if (!r) return (cloud.state = 'signedOut'); ref = r.ref; }
    else {
    const user = window.claude && window.claude.use ? await window.claude.use('user') : null;
    const id = user ? await user.id() : null;
    if (!id) return (cloud.state = 'signedOut');
    if ((await user.can('data.write')) === false) return (cloud.state = 'readonly');
    const db = await window.claude.use('db');
    if (!db) return (cloud.state = 'signedOut');
    ref = db.doc('data/users/' + id + '/save');
    }
    const snap = await ref.get();
    let remote = null; try { const d = snap.exists ? snap.data() : null; remote = d && typeof d.json === 'string' ? JSON.parse(d.json) : null; } catch (e) { remote = null; }
    cloud.ref = ref;
    if (remote) { const keep = meta; applySave(remote); remote = JSON.parse(JSON.stringify(meta)); meta = keep; } // compare like with like: the account copy migrated to today's shape
    const played = m => m && m.adv && Object.keys(m.adv).length > 0;
    // Both this device and the account have real progress: the player picks (never overwrite silently).
    if (remote && played(remote) && played(meta) && Math.abs(progressOf(remote) - progressOf(meta)) > 5 && !cloud.forced) { cloud.choice = remote; return (cloud.state = 'choose'); }
    cloud.state = 'on'; meta.cloudOn = true;
    if (remote && (cloud.forced === 'account' || (!cloud.forced && progressOf(remote) > progressOf(meta) + 5))) { applySave(remote); meta.cloudOn = true; cloud.pulled = true; store.allowDown = true; }
    else if (remote) mergeSeen(meta, remote);
    cloud.forced = null;
    saveMeta(); cloud.dirty = true; await cloudFlush();
    if (cloud.state === 'readonly') meta.cloudOn = false;
    return cloud.state;
  } catch (e) { return (cloud.state = (e && (e.code === 'invalid_argument' || e.code === 'permission-denied')) ? 'readonly' : 'signedOut'); }
}
function cloudDisconnect() { meta.cloudOn = false; cloud.state = 'off'; cloud.ref = null; saveMeta(); if (fb.auth) fb.m.signOut(fb.auth).catch(() => {}); }
function cloudLine() { return cloud.state === 'on' ? CLt('on') : cloud.state === 'working' ? CLt('working') : cloud.state === 'signedOut' ? CLt('signedOut') : cloud.state === 'readonly' ? CLt('readonly') : CLt('off'); }
/* ---------- save codes: progress you can copy anywhere and paste back ---------- */
function saveCode() { return 'TT1-' + btoa(unescape(encodeURIComponent(JSON.stringify(meta)))); }
function readCode(code) {
  try {
    const raw = String(code || '').trim().replace(/\s+/g, '');
    if (!raw.startsWith('TT1-')) return null;
    const obj = JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))));
    return obj && typeof obj === 'object' && obj.st && obj.up ? obj : null;
  } catch (e) { return null; }
}
const challengeList = () => CHALLENGES.filter(c => !c.endless || endlessOpen()); // Endless goals stay hidden while Endless is parked
const claimable = () => challengeList().filter(c => !meta.claimed[c.id] && c.val(meta) >= c.goal).length;

