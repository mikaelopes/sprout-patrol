// Golden saves: every fixture in tests/fixtures/saves/ must load with no lost progress, through the real boot path (localStorage)
// and through applySave / readCode. Also pins the storage key and the savedRun guard. Exit 1 on any mismatch.
const { chromium } = require('playwright'); const { pathToFileURL } = require('url'); const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const FX = path.join(__dirname, '..', 'fixtures', 'saves'), PAGE = path.join(__dirname, '..', 'sim', 'game_saves.html');
if (spawnSync('node', [path.join(__dirname, '..', 'sim', 'mkpage.js'), PAGE], { stdio: 'ignore' }).status) { console.error('test build failed'); process.exit(1); }
const EXPECT = JSON.parse(fs.readFileSync(path.join(FX, 'expected.json'), 'utf8')); delete EXPECT._why;
const rawOf = f => f.endsWith('.txt') ? fs.readFileSync(path.join(FX, f), 'utf8').trim() : JSON.parse(fs.readFileSync(path.join(FX, f), 'utf8'));
const fails = []; const check = (label, ok, detail) => { if (!ok) fails.push(label + (detail ? ': ' + detail : '')); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sum = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
// Upgrades and gear are refunded as seeds by design (expected.json pins the amounts); stars, stats, heroes and flags must never go down.
function invariants(label, src, got, T) {
  check(label + ' cutsV', got.cutsV === 2, got.cutsV);
  check(label + ' char valid', !!T.chars[got.char] && !!got.owned[got.char], got.char);
  check(label + ' mode valid', got.mode === 'normal' || !!T.modes[got.mode], got.mode);
  check(label + ' stars kept', sum(got.adv) === sum(src.adv), sum(got.adv) + ' vs ' + sum(src.adv));
  check(label + ' stats kept', eq(got.st, { ...got.st, ...src.st }), JSON.stringify(got.st));
  check(label + ' owned kept', Object.keys(src.owned || {}).every(k => got.owned[k]));
  check(label + ' tutorial kept', !src.tutorialDone || got.tutorialDone === true);
}
function expected(label, name, got) {
  for (const [k, v] of Object.entries(EXPECT[name])) {
    if (k === 'savedRun') { check(label + ' savedRun kept', !!got.savedRun && got.savedRun.v === 1 && got.savedRun.run.kind === 'endless'); continue; }
    check(label + ' ' + k, eq(got[k], v), 'expected ' + JSON.stringify(v) + ' got ' + JSON.stringify(got[k]));
  }
}
(async () => {
  const b = await chromium.launch(); const url = pathToFileURL(PAGE).href;
  const open = async seed => { const ctx = await b.newContext(); if (seed) await ctx.addInitScript(s => localStorage.setItem('tufttrail-v2', s), JSON.stringify(seed)); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForTimeout(300); return { ctx, p, errs }; };
  const info = p => p.evaluate(() => ({ key: window.__g.SAVE_KEY, runV: window.__g.RUN_V }));
  for (const name of Object.keys(EXPECT)) {
    const src = rawOf(name); const obj = typeof src === 'string' ? null : src;
    // 1. through applySave / readCode on a blank profile
    { const { ctx, p, errs } = await open(null);
      const got = await p.evaluate(raw => { const T = window.__g; const o = typeof raw === 'string' ? T.readCode(raw) : raw; if (!o) return null; return { m: T.load(o), prog: T.progressOf(o) }; }, src);
      check(name + ' loads', !!got); if (got) { const T = { chars: { pip: 1, ember: 1, nova: 1, bolt: 1 }, modes: {}, progress: () => 0 }; const s = obj || JSON.parse(Buffer.from(src.slice(4), 'base64').toString());
        invariants(name + ' [applySave]', s, got.m, T); expected(name + ' [applySave]', name, got.m); }
      check(name + ' no page errors', !errs.length, errs[0]); await ctx.close(); }
    // 2. through the real boot path (what a returning player gets)
    if (obj) { const { ctx, p, errs } = await open(obj);
      const m = await p.evaluate(() => JSON.parse(JSON.stringify(window.__g.meta)));
      invariants(name + ' [boot]', obj, m, { chars: { pip: 1, ember: 1, nova: 1 }, modes: {}, progress: () => 0 }); expected(name + ' [boot]', name, m);
      check(name + ' [boot] no page errors', !errs.length, errs[0]); await ctx.close(); }
  }
  // the storage key never changes
  { const { ctx, p } = await open(null); const i = await info(p); check('SAVE_KEY', i.key === 'tufttrail-v2', i.key);
    // savedRun guard: a run that cannot load is dropped, progress is kept
    const good = rawOf('v115-savedRun.json');
    const variants = { 'other version': { ...good.savedRun, v: i.runV + 1 }, 'no version': { ...good.savedRun, v: undefined }, 'run missing': { ...good.savedRun, run: null },
      'garden not a number': { ...good.savedRun, run: { ...good.savedRun.run, garden: 'x' } }, 'not an object': 'junk', 'wrong kind': { ...good.savedRun, run: { ...good.savedRun.run, kind: 'adv' } } };
    for (const [label, sr] of Object.entries(variants)) {
      const m = await p.evaluate(o => window.__g.load(o), { ...good, savedRun: sr });
      check('savedRun ' + label + ' dropped', m.savedRun === undefined); check('savedRun ' + label + ' keeps progress', eq(m.adv, good.adv) && m.coins === good.coins && m.cutsV === 2);
    }
    const ok = await p.evaluate(o => window.__g.load(o), good); check('savedRun current version kept', !!ok.savedRun && ok.savedRun.v === i.runV);
    await ctx.close(); }
  await b.close();
  console.log(fails.length ? 'saves: ' + fails.length + ' FAIL\n  ' + fails.join('\n  ') : 'saves: all fixtures load, ' + Object.keys(EXPECT).length + ' golden saves ok');
  process.exit(fails.length ? 1 : 0);
})();
