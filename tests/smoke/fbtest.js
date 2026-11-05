const { chromium } = require('playwright'); const fs = require('fs');
const run = async (label, mock, remote) => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let html = fs.readFileSync('dist/sprout-patrol.html', 'utf8').replace("showSplash();\nrequestAnimationFrame(frame);", "showSplash();\nwindow.__t={get meta(){return meta},get cloud(){return cloud},startTutorial,finishTutorial,get mode(){return mode}};\nrequestAnimationFrame(frame);")
    ;
  html = '<script>' + mock(remote) + '</script>' + html;
  await p.setContent(html); await p.waitForTimeout(400);
  await p.evaluate(() => { const T = window.__t; T.startTutorial(); T.finishTutorial(true); }); await p.waitForTimeout(300);
  const before = await p.evaluate(() => (document.querySelector('.cloudbox') || {}).innerText);
  const box = await p.$('[data-act="cloudconnect"]'); if (box) { await box.click(); await p.waitForTimeout(1500); }
  const r = await p.evaluate(() => ({ state: window.__t.cloud.state, msg: (document.getElementById('cloudMsg') || {}).textContent, mode: window.__t.mode, coins: window.__t.meta.coins, stored: Object.keys(window.__fs), pops: window.__pops }));
  console.log(label, JSON.stringify(before), !!box, JSON.stringify(r), errs.slice(0, 2)); await b.close(); };
const mock = ok => remote => `window.__pops=0; window.__fs=${remote ? JSON.stringify({ g1: { json: JSON.stringify(remote), at: 1 } }) : '{}'};
window.__fbMock = { initializeApp: c => ({ c }), getAuth: () => ({ currentUser: null, authStateReady: async () => {} }), getFirestore: () => ({}),
  GoogleAuthProvider: function () {}, signInWithPopup: async (a) => { window.__pops++; if (!${ok}) { const e = new Error('x'); e.code = 'auth/popup-closed-by-user'; throw e; } a.currentUser = { uid: 'g1' }; return { user: a.currentUser }; },
  signOut: async a => { a.currentUser = null; }, doc: (db, c, id) => id, getDoc: async id => ({ exists: () => !!window.__fs[id], data: () => window.__fs[id] }), setDoc: async (id, v) => { window.__fs[id] = v; } };`;
(async () => {
  await run('fb-ok', mock(true));
  await run('fb-cancel', mock(false));
  await run('fb-pull', mock(true), { name: 'Remote', coins: 999, tutorialDone: true, journeyDone: true, adv: { '1-1': 3, '1-2': 3, '1-3': 3, '1-4': 3 }, st: { tufts: 500, runs: 5 }, up: { trail: 3, speed: 2, heart: 2, frost: 0 }, owned: { pip: true }, cutsV: 2 });
})();
