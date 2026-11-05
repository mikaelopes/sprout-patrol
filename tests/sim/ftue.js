// First-time user: how long and how many taps from opening the game to rolling in a garden, and how many words on the way.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: process.argv[3] || 'pt-BR', hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let html = fs.readFileSync(process.argv[2] || 'dist/sprout-patrol.html', 'utf8');
  html = html.replace("showSplash();\nrequestAnimationFrame(frame);", "showSplash();\nwindow.__m=()=>mode;window.__k=()=>run&&run.kind;\nrequestAnimationFrame(frame);");
  const t0 = Date.now(); await p.setContent('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + html);
  const log = []; let taps = 0;
  for (let k = 0; k < 12; k++) {
    await p.waitForTimeout(400);
    const st = await p.evaluate(() => { const ov = document.getElementById('overlay'); const vis = ov && !ov.hidden && getComputedStyle(ov).display !== 'none'; const tip = document.getElementById('tip'); return { mode: window.__m(), kind: window.__k(), words: vis ? (ov.innerText || '').split(/\s+/).filter(Boolean).length : 0, tip: tip && !tip.hidden ? tip.textContent : '', btn: vis ? ([...ov.querySelectorAll('.btn:not(.ghost)')].map(x => x.innerText.trim()).filter(Boolean)[0] || '') : '' }; });
    log.push({ s: ((Date.now() - t0) / 1000).toFixed(1), ...st });
    if (st.mode === 'play') break;
    const btn = await p.$('#overlay .btn:not(.ghost):not([disabled])'); if (!btn) break; await btn.click(); taps++;
  }
  console.log(JSON.stringify(log, null, 0).replace(/},{/g, '},\n{')); console.log('taps', taps, errs.slice(0, 3)); await b.close();
})();
