// Injected into the page: a tile-level bot that steers the hero, plus a fast-forward runner.
window.__bot = (function () {
  const T = window.__g;
  const FOURD = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let rng = 1;
  const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  // Danger: every tile an awake pest can walk to within `look` tiles (maze distance), heavier the closer it is.
  function dangerMap(cfg) {
    const { COLS, ROWS } = T.dims(); const pen = new Float32Array(COLS * ROWS);
    for (const e of T.enemies()) {
      if (e.denT > 0 || T.isFrozen(e) || e.stun > 0 || e.frz > 0 || e.popT > 0 || e.under) continue;
      const q = T.epos(e), big = e.type === 'boss' ? 1 : 0, look = cfg.look + big + (e.type === 'hunter' && e.chaseT > 0 ? 1 : 0);
      const starts = [[Math.round(q.x), Math.round(q.y)], [e.nx, e.ny]];
      const seen = new Map(); const qu = [];
      for (const [x, y] of starts) if (T.isOpen(x, y) && !seen.has(x + y * COLS)) { seen.set(x + y * COLS, 0); qu.push([x, y, 0]); }
      while (qu.length) { const [x, y, d] = qu.shift(); if (d >= look) continue; for (const [dx, dy] of FOURD) { const nx = x + dx, ny = y + dy, k = nx + ny * COLS; if (T.isOpen(nx, ny) && !seen.has(k)) { seen.set(k, d + 1); qu.push([nx, ny, d + 1]); } } }
      for (const [k, d] of seen) pen[k] += d === 0 ? 400 : d === 1 ? 120 : 30 / d;
    }
    if (cfg.dodgeShots) for (const sh of (T.shots() || [])) { // tiles a pea or bubble shot is about to cross
      let x = Math.round(sh.x), y = Math.round(sh.y);
      for (let k = 0; k < 3; k++) { if (!T.isOpen(x, y)) break; pen[x + y * COLS] += 80 / (k + 1); x += sh.dx; y += sh.dy; }
    }
    return pen;
  }
  // Dijkstra-lite (0-1-ish costs) from the hero's next tile; returns dist and first-step maps
  function search(sx, sy, pen) {
    const { COLS, ROWS } = T.dims(), N = COLS * ROWS, dist = new Float32Array(N).fill(1e9), first = new Int8Array(N).fill(-1), steps = new Int16Array(N);
    const open = [[0, sx, sy]]; dist[sx + sy * COLS] = 0;
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [d, x, y] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (d > dist[x + y * COLS]) continue;
      for (let k = 0; k < 4; k++) {
        const nx = x + FOURD[k][0], ny = y + FOURD[k][1]; if (!T.isOpen(nx, ny)) continue;
        const ni = nx + ny * COLS, nd = d + 1 + pen[ni];
        if (nd < dist[ni]) { dist[ni] = nd; steps[ni] = steps[x + y * COLS] + 1; first[ni] = first[x + y * COLS] === -1 ? k : first[x + y * COLS]; open.push([nd, nx, ny]); }
      }
    }
    return { dist, first, steps, COLS };
  }
  function pickTarget(cfg, S) {
    const P = T.player(), fol = T.followers(), cap = T.cap(), run = T.run();
    const at = (x, y) => S.dist[Math.round(x) + Math.round(y) * S.COLS];
    const stepsTo = (x, y) => S.steps[Math.round(x) + Math.round(y) * S.COLS];
    const spd = T.speed();
    // 1. bump frozen/stunned pests while there is time
    if (cfg.hunt) {
      let best = null;
      for (const e of T.enemies()) {
        if (e.denT > 0 || e.type === 'boss' || e.type === 'night') continue;
        const still = T.isFrozen(e) || e.stun > 0 || e.frz > 0; if (!still) continue;
        const left = Math.max(T.freezeT(), e.stun || 0, e.frz || 0), q = T.epos(e), d = at(q.x, q.y);
        if (d < 1e8 && stepsTo(q.x, q.y) / spd < left - 0.3 && stepsTo(q.x, q.y) <= cfg.huntRange && (!best || d < best.d)) best = { x: Math.round(q.x), y: Math.round(q.y), d };
      }
      if (best) return best;
    }
    // 2. snowflake when pests are around
    for (const k of T.pickups()) {
      if (k.type !== 'frost') continue; const d = at(k.x, k.y);
      const near = T.enemies().some(e => !(e.denT > 0) && e.type !== 'boss' && Math.hypot(T.epos(e).x - P.x, T.epos(e).y - P.y) < 6);
      if (d < 1e8 && (near || fol.length >= 2) && stepsTo(k.x, k.y) <= cfg.frostRange) return { x: k.x, y: k.y, d };
    }
    // 3. seed pickups nearby
    for (const k of T.pickups()) if (k.type === 'seed' && cfg.seeds && stepsTo(k.x, k.y) <= cfg.seedRange && at(k.x, k.y) < 1e8) return { x: k.x, y: k.y, d: at(k.x, k.y) };
    const bubbles = T.bubbles().filter(b => !b.locked);
    // 4. deliver
    const golds = fol.filter(f => f.gold).length;
    const portals = T.portals().filter(p => p.active !== false || p.rainbow);
    const portalFor = () => {
      let best = null;
      for (const p of T.portals()) {
        if (p.golden) { if (!golds || !p.active) continue; }
        else if (p.rainbow && !p.active) continue;
        const n = p.golden ? golds : fol.filter(f => p.cs.includes(f.c)).length; if (!n) continue;
        const d = at(p.x, p.y); if (d >= 1e8) continue;
        const score = d / (n + (run.boss && !p.covered && !p.rainbow && !p.golden ? 3 : 0) + (p.golden ? 10 : 0));
        if (!best || score < best.score) best = { x: p.x, y: p.y, d, score };
      }
      return best;
    };
    let nb = null; for (const b of bubbles) { const d = at(b.x, b.y); if (d < 1e8 && (!nb || d < nb.d)) nb = { x: b.x, y: b.y, d }; }
    if (fol.length && (fol.length >= cap || !nb || golds || (fol.length >= cfg.deliverAt && portalFor() && portalFor().d < nb.d * 0.7))) { const p = portalFor(); if (p) return p; }
    if (nb && fol.length < cap) return nb;
    const p = portalFor(); if (p) return p;
    return nb;
  }
  // Specials, used the way a decent player would: Lichi puffs when a pest is close, Zip warps out of danger
  // (or along the way when it skips ahead safely), Luna recalls when a pest is about to touch her.
  function special(cfg, pen, sx, sy) {
    if (!cfg.specials || T.abCd() > 0) return false;
    const c = T.hero(); if (!c.ability) return false;
    const { COLS } = T.dims(), here = pen[sx + sy * COLS];
    if (c.ability === 'puff') {
      const D = T.distMap(); const n = T.enemies().filter(e => { if (e.denT > 0 || e.type === 'boss' || e.type === 'night' || T.isFrozen(e) || e.stun > 0) return false; const q = T.epos(e), d = D[Math.round(q.x) + Math.round(q.y) * COLS]; return d >= 0 && d <= 2; }).length;
      if (n >= 1) { T.ability(); return true; }
    } else if (c.ability === 'recall') {
      if (here >= 120 || (here >= 30 && T.followers().length >= 4)) { T.ability(); return true; }
    } else if (c.ability === 'warp') {
      const P = T.player(), f = P.face || [0, 1];
      let land = null; for (let k = 3; k >= 1; k--) if (T.isOpen(P.x + f[0] * k, P.y + f[1] * k)) { land = [P.x + f[0] * k, P.y + f[1] * k]; break; }
      if (!land) return false;
      const lp = pen[land[0] + land[1] * COLS];
      if (here >= 30 && lp < here * 0.3) { T.ability(); return true; }
    }
    return false;
  }
  function decide(cfg) {
    const P = T.player(); const sx = P.moving ? P.nx : P.x, sy = P.moving ? P.ny : P.y;
    if (cfg.specials) { const pen0 = dangerMap(cfg); if (special(cfg, pen0, P.x, P.y)) return; }
    if (rand() < cfg.err) { const ok = FOURD.filter(d => T.isOpen(sx + d[0], sy + d[1])); if (ok.length) { P.want = ok[Math.floor(rand() * ok.length)]; return; } }
    const pen = dangerMap(cfg), S = search(sx, sy, pen); let tg = pickTarget(cfg, S);
    const { COLS } = T.dims();
    if (cfg.flee && pen[sx + sy * COLS] >= 30) { // danger close: step to the safest neighbour
      let best = null; for (let k = 0; k < 4; k++) { const nx = sx + FOURD[k][0], ny = sy + FOURD[k][1]; if (!T.isOpen(nx, ny)) continue; const v = pen[nx + ny * COLS]; if (!best || v < best.v) best = { k, v }; }
      if (best && best.v < pen[sx + sy * COLS]) { P.want = FOURD[best.k]; return; }
    }
    if (!tg) return;
    const ti = tg.x + tg.y * S.COLS;
    if (tg.x === sx && tg.y === sy) { // standing on it: nudge to any open neighbour and back
      const ok = FOURD.filter(d => T.isOpen(sx + d[0], sy + d[1])); if (ok.length) P.want = ok[0]; return;
    }
    const k = S.first[ti]; if (k >= 0) P.want = FOURD[k];
  }
  // Run one attempt to the end. Returns the outcome.
  function play(g, i, cfg, seed, boost, keep) {
    rng = seed >>> 0 || 1; T.seedRandom(seed);
    if (keep) T.startC(g, i, boost); else T.start(g, i, boost);
    let now = T.now(), t = 0, nextDec = 0; const dt = 1 / 30, maxT = cfg.maxT || 900;
    while (T.mode() === 'play' && t < maxT) {
      if (t >= nextDec) { decide(cfg); nextDec = t + cfg.react; }
      now += dt * 1000; T.step(now); t += dt;
    }
    const run = T.run(), won = !!(T.cleared() || run.bossDone);
    const rr = T.res && T.res() || {};
    return { dl: run.dl || 0, best: run.bestCombo || 0, hc: rr.hc, won, raw: rr.raw, stars: rr.stars, par: rr.par, heroPar: rr.heroPar, sprouts: rr.sprouts, mode: T.mode(), t: Math.round(run.at), hits: run.hits || 0, coins: run.coins, tufts: run.tufts, pops: run.pops || 0, timeout: t >= maxT };
  }
  return { play };
})();
