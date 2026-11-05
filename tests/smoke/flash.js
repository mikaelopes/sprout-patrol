// Flash-rate check (design/accessibility-requirements.md: no flash faster than 3 per second).
// Drives the built page frame by frame on a virtual 60 fps clock, reads the rendered canvas after every frame,
// and counts luminance on/off transitions per 8x8 css-px block. A block with more than 6 transitions
// (3 full on/off cycles) inside any 1 s window fails. Runs every scene with and without prefers-reduced-motion.
// Scenes: idle board with expiring pickups + gold/shiny bubbles + invulnerability + ending freeze bar,
// a hit (hurt) and a 6-sprout delivery. Pests are removed so their walk cycles don't count as flashes.
// usage: node tests/smoke/flash.js [page.html] [--shots DIR]   (exit 1 on any violation)
// env: FLASH_DPR (default 1), FLASH_BLOCK (css px, default 8), FLASH_SAME (pattern tolerance, default 0.03)
const fs = require('fs');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && a.endsWith('.html')) || 'dist/sprout-patrol.html';
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const FPS = 60, BLOCK = +(process.env.FLASH_BLOCK || 8), DELTA = 0.1, MAX_TRANS = 6, SAME = +(process.env.FLASH_SAME || 0.03); // SAME: mean 4x4-pattern difference that still counts as the same state // DELTA: relative-luminance change that counts as one transition

let html = fs.readFileSync(file, 'utf8');
const A1 = 'function frame(now) {\n  requestAnimationFrame(frame);', A2 = 'showSplash();\nrequestAnimationFrame(frame);';
if (!html.includes(A1) || !html.includes(A2)) { console.error('flash.js: hook anchors not found in ' + file); process.exit(2); }
html = html.replace(A1, 'function frame(now) {\n  if (window.__manual) return;\n  requestAnimationFrame(frame);');
html = html.replace(A2, 'showSplash();\nwindow.__noLearn=1;window.__f={get meta(){return meta},startAdventure,resume,step,deliver,hurt,isOpen,' +
  'get run(){return run},get player(){return player},get portals(){return portals},get bubbles(){return bubbles},get pickups(){return pickups},' +
  'setFollowers(c,n,path){followers=[];trail.length=0;for(let k=0;k<n;k++)followers.push({c,born:0});for(let k=0;k<=n;k++){const q=path&&path[Math.min(k,path.length-1)]||player;trail.push({x:q.x,y:q.y});}},snapCam,' +
  'noPests(){enemies.length=0;shots.length=0;if(run){run.lobs=[];run.proj=[];}},setInv(v){invuln=v},setFreeze(v){freezeT=v}};\nrequestAnimationFrame(frame);');

(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  for (const rm of ['no-preference', 'reduce']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.FLASH_DPR || 1), reducedMotion: rm, locale: 'en-US' });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.setContent(html); await page.waitForTimeout(400);
    await page.evaluate(a => { window.__B = a[0]; window.__SAME = a[1]; }, [BLOCK, SAME]);
    await page.evaluate(() => {
      const F = window.__f, m = F.meta; m.tutorialDone = true; m.journeyDone = true; m.coach = { hub: 1, map: 1, prelevel: 1, chars: 1 };
      m.adv = {}; for (let g = 1; g <= 3; g++) for (let i = 1; i <= 8; i++) m.adv[g + '-' + i] = 3; m.bossSeen = { king: 1, queen: 1, twins: 1, broc: 1, potato: 1 };
      F.startAdventure(2, 3, {}); if (window.__f.run && document.querySelector('.card')) F.resume(); F.resume();
      window.__manual = 1; window.__now = performance.now();
      F.noPests();
      window.__frame = () => { // one virtual 60 fps frame, then block luminance of the canvas
        window.__now += 1000 / 60; F.noPests(); F.run.at = 0; F.step(window.__now);
        const cv = document.getElementById('cv'), g = cv.getContext('2d'), W = cv.width, H = cv.height, d = g.getImageData(0, 0, W, H).data;
        const B = Math.round(window.__B * (window.devicePixelRatio || 1)), Q = B / 4, bw = Math.floor(W / B), bh = Math.floor(H / B), out = new Float32Array(bw * bh), sig = new Float32Array(bw * bh * 16);
        const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        if (!window.__lut) { window.__lut = new Float32Array(256); for (let i = 0; i < 256; i++) window.__lut[i] = lin(i); }
        const L = window.__lut;
        for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) { // block mean + a 4x4 pattern signature
          const b = by * bw + bx; let s = 0;
          for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) { const o = ((by * B + y) * W + bx * B + x) * 4, v = 0.2126 * L[d[o]] + 0.7152 * L[d[o + 1]] + 0.0722 * L[d[o + 2]]; s += v; sig[b * 16 + Math.floor(y / Q) * 4 + Math.floor(x / Q)] += v / (Q * Q); }
          out[b] = s / (B * B);
        }
        (window.__sig = window.__sig || []).push(sig);
        (window.__lum = window.__lum || []).push(out); window.__dims = [bw, bh];
      };
      window.__analyse = (DELTA, MAX, FPS) => { // per block: hysteresis transitions, worst count in any 1 s window
        const fr = window.__lum, sg = window.__sig, [bw, bh] = window.__dims, SAME = window.__SAME; let worst = 0, bad = 0, at = null;
        for (let b = 0; b < bw * bh; b++) {
          let hi = fr[0][b], lo = hi, dir = 0; const tr = []; // dir 1: rising (track the peak), -1: falling (track the trough)
          for (let f = 1; f < fr.length; f++) {
            const v = fr[f][b]; hi = Math.max(hi, v); lo = Math.min(lo, v);
            if (dir >= 0 && hi - v >= DELTA) { tr.push(f); dir = -1; hi = lo = v; }
            else if (dir <= 0 && v - lo >= DELTA) { tr.push(f); dir = 1; hi = lo = v; }
          }
          // Only toggling counts: a transition is kept when the block comes back to the pattern it showed two transitions
          // earlier (same on-state / off-state). Moving text or a stream of different sprites passing by doesn't repeat.
          const same = (f1, f2) => { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sg[f1][b * 16 + k] - sg[f2][b * 16 + k]); return e / 16 < SAME; };
          for (let i = tr.length - 1; i >= 2; i--) if (!same(tr[i], tr[i - 2])) tr[i] = -1;
          tr.splice(0, 2); for (let i = tr.length - 1; i >= 0; i--) if (tr[i] < 0) tr.splice(i, 1);
          let w = 0; for (let i = 0, j = 0; i < tr.length; i++) { while (tr[i] - tr[j] >= FPS) j++; w = Math.max(w, i - j + 1); }
          if (w > worst) { worst = w; at = { x: (b % bw) * window.__B, y: Math.floor(b / bw) * window.__B }; } if (w > MAX) bad++;
        }
        window.__lum = []; window.__sig = []; return { worst, bad, at };
      };
    });
    const scenes = {
      idle: async () => page.evaluate(() => { // expiring pickups, gold + shiny bubbles, invulnerability ring, ending freeze bar
        const F = window.__f, p = F.player, near = [];
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if ((dx || dy) && F.isOpen(p.x + dx, p.y + dy)) near.push({ x: p.x + dx, y: p.y + dy });
        F.pickups.length = 0; F.pickups.push({ ...near[0], life: 2.45, type: 'seed' }, { ...near[near.length - 1], life: 2.45, type: 'frost' });
        if (F.bubbles[0]) F.bubbles[0].gold = true; if (F.bubbles[1]) { F.bubbles[1].shiny = true; }
        F.setInv(99); F.setFreeze(0.75);
      }),
      hit: async () => page.evaluate(() => { const F = window.__f; F.setInv(0); F.run.hp = 9; F.hurt(); }),
      deliver: async () => page.evaluate(() => { // the hero arrives on a home with 6 matching sprouts trailing behind along the corridor
        const F = window.__f, pt = F.portals.find(q => !q.rainbow && !q.golden), p = F.player; F.setInv(0);
        p.x = p.nx = pt.x; p.y = p.ny = pt.y; p.moving = false; p.p = 0; F.snapCam();
        const path = [{ x: pt.x, y: pt.y }], seen = new Set([pt.x + ',' + pt.y]);
        while (path.length < 7) { const c = path[path.length - 1], n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => ({ x: c.x + d[0], y: c.y + d[1] })).find(q => F.isOpen(q.x, q.y) && !seen.has(q.x + ',' + q.y)); if (!n) break; seen.add(n.x + ',' + n.y); path.push(n); }
        F.setFollowers(pt.cs[0], 6, path); F.deliver(pt);
      }),
    };
    for (const [name, setup] of Object.entries(scenes)) {
      await setup();
      const N = name === 'idle' ? 120 : 90;
      for (let f = 0; f < N; f++) {
        await page.evaluate(() => window.__frame());
        if (shotsDir && (name === 'idle' ? f === 30 : [1, 5, 10, 20, 35, 50].includes(f)) && (rm === 'no-preference' || f <= 5 || name === 'idle')) {
          fs.mkdirSync(shotsDir, { recursive: true });
          await page.screenshot({ path: `${shotsDir}/${rm === 'reduce' ? 'rm-' : ''}${name}-${String(Math.round((f + 1) * 1000 / FPS)).padStart(3, '0')}ms.png` });
        }
      }
      const r = await page.evaluate(a => window.__analyse(...a), [DELTA, MAX_TRANS, FPS]);
      const ok = r.worst <= MAX_TRANS;
      if (!ok) fail++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${rm.padEnd(13)} ${name.padEnd(8)} worst ${r.worst} transitions/s (limit ${MAX_TRANS}), ${r.bad} blocks over` + (ok ? '' : ` e.g. at ${r.at.x},${r.at.y} css px`));
    }
    if (errs.length) { console.log('page errors:', errs.slice(0, 3)); fail++; }
    await ctx.close();
  }
  await browser.close();
  console.log(fail ? `flash check FAILED (${fail})` : 'flash check ok');
  process.exit(fail ? 1 : 0);
})();
