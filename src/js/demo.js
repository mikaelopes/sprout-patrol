function demoBoard() { freshRun(); run.garden = 3; newGarden(); run.garden = 1; updateHud(); }
overlay.addEventListener('click', e => {
  const b = e.target.closest('button[data-act], img[data-act]');
  if (!b || b.disabled) return;
  initAudio(); sfx('tap');
  const act = b.dataset.act, k = b.dataset.k;
  if (act === 'start') startRunMap();
  else if (act === 'mapgo') goNode(+k);
  else if (act === 'continue') { initAudio(); if (!continueRun()) showHub(); }
  else if (act === 'hub' && mode === 'splash' && !meta.tutorialDone) {
    // a returning player on a new device: wait (max 3s) for the cloud save before deciding to show the tutorial
    const t0 = Date.now(), go = () => { if (mode !== 'splash') return; if (cloud.pending && Date.now() - t0 < 3000) return setTimeout(go, 150); if (meta.tutorialDone) { demoBoard(); showHub(); } else startTutorial(); };
    go();
  }
  else if (act === 'tutorial') startTutorial();
  else if (act === 'musictoggle') { meta.musicOff = !meta.musicOff; saveMeta(); showProfile(); }
  else if (act === 'savecopy') {
    const code = saveCode(), box = document.getElementById('saveBox'), ta = document.getElementById('saveText'), msg = document.getElementById('saveMsg');
    box.hidden = false; ta.value = code; document.getElementById('saveApply').hidden = true; document.getElementById('saveLabel').textContent = t('saveCopy');
    const fallback = () => { ta.focus(); ta.select(); msg.textContent = t('saveSelect'); };
    try { navigator.clipboard.writeText(code).then(() => { msg.textContent = t('saveCopied'); }, fallback); } catch (err) { fallback(); }
  }
  else if (act === 'saveload') {
    const box = document.getElementById('saveBox'), ta = document.getElementById('saveText');
    box.hidden = false; ta.value = ''; document.getElementById('saveApply').hidden = false; document.getElementById('saveLabel').textContent = t('savePaste');
    document.getElementById('saveMsg').textContent = ''; ta.focus();
  }
  else if (act === 'restorebak') {
    bestBackup().then(bk => {
      const msg = document.getElementById('bakMsg');
      if (bk && progressOf(bk) > progressOf(meta)) { applySave(bk); store.best = progressOf(meta); saveMeta(); sfx('level'); showProfile(); const m2 = document.getElementById('bakMsg'); if (m2) m2.textContent = t('bakRestored'); }
      else if (msg) msg.textContent = t('bakNone');
    });
  }
  else if (act === 'saveapply') {
    const obj = readCode(document.getElementById('saveText').value);
    if (!obj) { document.getElementById('saveMsg').textContent = t('saveBad'); return; }
    applySave(obj); if (meta.lang === 'en' || meta.lang === 'pt') LANG = meta.lang;
    store.allowDown = true; store.best = progressOf(meta); saveMeta(); sfx('level'); showProfile();
    const st = document.getElementById('saveStatus'); if (st) st.insertAdjacentHTML('afterbegin', `<b style="color:var(--accent)">${t('saveLoaded')}</b> `);
  }
  else if (act === 'clear') {
    if (!clearArm) { clearArm = true; b.textContent = t('clearConfirm'); b.style.borderColor = 'var(--coral)'; b.style.color = 'var(--coral)'; setTimeout(() => { clearArm = false; }, 4000); return; }
    clearArm = false;
    try { ['tufttrail-v2', 'tufttrail-meta', 'tufttrail-pad', ...BAK_KEYS].forEach(key => localStorage.removeItem(key)); } catch (err) {}
    idbPut('main', '').catch(() => {}); store.best = 0; store.allowDown = true;
    const lang = LANG;
    const seen = mergeSeen({}, meta); meta = mergeSeen(JSON.parse(META_DEFAULT), seen); meta.lang = lang;
    if (lang === 'pt') meta.name = S.pt.defaultName;
    saveMeta(); demoBoard(); showSplash();
  }
  else if (act === 'hub') { if (mode === 'over' || mode === 'splash' || mode === 'tutdone') demoBoard(); showHub(); }
  else if (act === 'map') { if (mode === 'advresult') demoBoard(); showMap(); }
  else if (act === 'node') showPrelevel(+b.dataset.g, +b.dataset.i);
  else if (act === 'advnext') { const nx = nextNode(run.adv.g, run.adv.i); demoBoard(); showPrelevel(nx.g, nx.i); }
  else if (act === 'advretry') { const { g: rg, i: ri } = run.adv; demoBoard(); showPrelevel(rg, ri); }
  else if (act === 'boost') { pre.sel[k] = !pre.sel[k]; showPrelevel(pre.g, pre.i); }
  else if (act === 'go') {
    const cost = BOOSTS.reduce((a, x) => a + (pre.sel[x.k] ? x.cost : 0), 0);
    if (cost > meta.coins) return;
    meta.coins -= cost; saveMeta();
    const { g: pg, i: pi, sel } = pre;
    pre = { g: 0, i: 0, sel: {} };
    startAdventure(pg, pi, sel);
  }
  else if (act === 'starchest') openStarChest(false, 'map');
  else if (act === 'starchest1' || act === 'starchestall') { chestAfter = run && run.adv ? nextNode(run.adv.g, run.adv.i) : null; openStarChest(act === 'starchestall', 'advnext'); }
  else if (act === 'chestskip') { const cp = document.getElementById('chestPrompt'); if (cp) cp.remove(); }
  else if (act === 'fight') resume();
  else if (act === 'card') pickCard(+b.dataset.i);
  else if (act === 'next') { if (chestPending) showChest(t('chestN', grove()), t('chestFree'), 'cards'); else afterNode(); }
  else if (act === 'chestopen') openChestAnim();
  else if (act === 'chestdone') { const n = chestNext; chestNext = null; if (n === 'cards') openCards('chest'); else if (n === 'nodecards') openCards('node'); else if (n === 'road') showRoad(); else if (n === 'advnext' && chestAfter && advUnlocked(chestAfter.g, chestAfter.i)) { const nx = chestAfter; chestAfter = null; demoBoard(); showPrelevel(nx.g, nx.i); } else showMap(); }
  else if (act === 'camp') { const it = CAMP.find(c => c.k === k); const before = run.coins; buyCamp(k); if (it) run.campSpent += before - run.coins; }
  else if (act === 'leavecamp') { if (run.campMid) { run.campMid = false; } else { run.map = genGroveMap(grove() + 1); run.campBought = {}; } showRunMap(); }
  else if (act === 'resume') resume();
  else if (act === 'quit') gameOver(true);
  else if (act === 'victorygo') showClear();
  else if (act === 'chars') { charIdx = null; showChars(); }
  else if (act === 'charprev') { charIdx--; showChars(); }
  else if (act === 'charnext') { charIdx++; showChars(); }
  else if (act === 'nest') { showNest.from = ''; nestTab = 'up'; nestPage = 0; showNest(); }
  else if (act === 'nestpre') { showNest.from = 'prelevel'; nestTab = 'up'; nestPage = 0; showNest(); }
  else if (act === 'nesttab') { nestTab = b.dataset.k; nestPage = 0; showNest(); }
  else if (act === 'nestpg') { nestPage = Math.max(0, nestPage + (+b.dataset.k)); showNest(); }
  else if (act === 'nestback') { showNest.from = ''; showPrelevel(pre.g, pre.i); }
  else if (act === 'daily') showDaily();
  else if (act === 'dailygo') startDaily();
  else if (act === 'road') { roadTab = 'road'; showRoad(); }
  else if (act === 'looks') { roadTab = 'look'; lastShown = ''; showRoad(); }
  else if (act === 'roadtab') { roadTab = k; lastShown = ''; showRoad(); }
  else if (act === 'roadclaim') claimRoad();
  else if (act === 'equip') { const [cat, id] = (k || '').split(':'); if (COS[cat] && cosOwned(cat, id)) { cosState()[cat] = id; saveMeta(); } showRoad(); }
  else if (act === 'rbuy') { const r = REPEAT.find(x => x.k === k); if (r && repOpen() && meta.coins >= repCost(r)) { meta.coins -= repCost(r); meta.rep = meta.rep || {}; meta.rep[k] = repLv(k) + 1; saveMeta(); sfx('coin'); } showNest(); }
  else if (act === 'challenges') { chTab = 'goals'; chPage = 0; showChallenges(); }
  else if (act === 'chtab') { chTab = k; chPage = 0; showChallenges(); }
  else if (act === 'chpage') { chPage += +k; showChallenges(); }
  else if (act === 'profile') showProfile();
  else if (act === 'quiz') startQuiz();
  else if (act === 'cloudconnect') { const msg = document.getElementById('cloudMsg'); if (msg) msg.textContent = CLt('working'); b.disabled = true;
    cloudConnect().then(st => { if (st === 'choose') { showCloudChoice(); return; } if (cloud.pulled) { cloud.pulled = false; banner(CLt('pulled'), '#5cbf3a', 'star'); showHub(); return; }
      if (mode === 'profile') { showProfile(); return; } const m2 = document.getElementById('cloudMsg'); if (m2) m2.textContent = cloudLine(); if (st === 'on' || st === 'readonly') b.remove(); else b.disabled = false; }); }
  else if (act === 'clouddisconnect') { cloudDisconnect(); showProfile(); }
  else if (act === 'cloudpick') { cloud.forced = k; cloud.choice = null; b.disabled = true; cloudConnect().then(() => { cloud.pulled = false; showHub(); }); }
  else if (act === 'quizans') { const q = quizOrder[quizAt]; if (q && meta.quiz) { meta.quiz.ans[q[0]] = k; quizAt++; saveMeta(); showQuiz(); } }
  else if (act === 'quizdone') { const tx = document.getElementById('quizStory'); if (meta.quiz) { meta.quiz.story = (tx ? tx.value : '').trim().slice(0, 200); meta.quiz.done = 1; logEv({ q: 1, n: Object.keys(meta.quiz.ans).length }); saveMeta(); } showProfile(); }
  else if (act === 'book') showBook();
  else if (act === 'buy') {
    const u = NEST.find(m => m.k === k), lv = meta.up[k];
    if (u && lv < u.max && u.gate[lv] <= groveReached() && meta.coins >= u.cost[lv]) { meta.coins -= u.cost[lv]; meta.up[k]++; logEv({ b: k, lv: meta.up[k], c: u.cost[lv] }); saveMeta(); sfx('coin'); }
    showNest();
  }
  else if (act === 'unlock') {
    const c = CHARS[k];
    if (c && !meta.owned[k] && meta.coins >= c.cost) { meta.coins -= c.cost; meta.owned[k] = true; meta.char = k; saveMeta(); sfx('level'); }
    showChars();
  }
  else if (act === 'pick') { if (meta.owned[k]) { meta.char = k; saveMeta(); } showChars(); }
  else if (act === 'mode') { if (MODES[k] && meta.st.bestGarden >= MODES[k].unlock) { meta.mode = k; saveMeta(); } showChallenges(); }
  else if (act === 'claim') {
    const c = CHALLENGES.find(x => x.id === k);
    if (c && !meta.claimed[k] && c.val(meta) >= c.goal) { meta.claimed[k] = true; meta.coins += c.reward; saveMeta(); sfx('coin'); }
    showChallenges();
  }
  else if (act === 'controls') {
    padOn = !padOn; applyPad();
    try { localStorage.setItem('tufttrail-pad', padOn ? '1' : '0'); } catch (err) {}
    if (mode === 'hub') showHub(); else if (mode === 'pause') showPause(); else if (mode === 'profile') showProfile();
  }
  else if (act === 'lang') {
    LANG = LANG === 'pt' ? 'en' : 'pt';
    meta.lang = LANG;
    document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
    if (!meta.nameSet) meta.name = t('defaultName');
    saveMeta();
    displayFont = '';
    if (mode === 'splash') showSplash(); else if (mode === 'hub') showHub(); else if (mode === 'profile') showProfile();
  }
});

