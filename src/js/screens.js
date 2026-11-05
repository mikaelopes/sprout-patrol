// Endless is the post-season mode: it opens after the grove 12 boss.
function endlessOpen() { return !!(meta.adv && meta.adv['12-8'] > 0); } // a run already in progress can still be continued from the hub
function showHub() {
  mode = 'hub';
  payPendingRing();
  const c = CHARS[meta.char], md = MODES[meta.mode], n = claimable(), rr0 = roadReady();
  const refund = meta.refundNote; if (refund) setTimeout(() => { if (meta.refundNote) { delete meta.refundNote; saveMeta(); } }, 0);
  show(`<div class="card">
    <div class="hubtop"><div><div class="eyebrow">${t('welcome')}</div><h2>${esc(meta.name)}</h2></div></div>
    ${meta.refundNote ? `<div class="chestbar refund"><div class="txt"><span><i class="rseed">${SEED}</i> +${meta.refundNote} · ${LANG === 'pt' ? 'O Ninho mudou: devolvemos suas sementes para você escolher de novo.' : 'The Nest changed: your seeds are back so you can choose again.'}</span></div></div>` : ''}
    ${!storageOK && cloud.state !== 'on' ? `<div class="chestbar" style="border-color:var(--coral)"><div class="txt"><span>${t('hubWarn')}</span></div><button class="buy" data-act="profile">${t('hubWarnBtn')}</button></div>` : ''}
    <div class="who">${avatar(meta.char, 44, cosState().hat)}<div class="txt"><span class="t">${c.name} · ${L(md.name)}</span><span class="d">${meta.st.bestGarden ? t('bestRun', Math.ceil(meta.st.bestGarden / PER_GROVE), (meta.st.bestGarden - 1) % PER_GROVE + 1) : t('bestNone')}</span></div></div>
    <button class="btn" data-act="map">${t('adventure')} · ${t('grove')} ${advTop()}</button>
    ${meta.savedRun && meta.savedRun.run ? `<button class="btn btn2l" data-act="continue">${t('continueRun')}<small>${t('continueSub', Math.floor((meta.savedRun.run.garden - 1) / PER_GROVE) + 1, (meta.savedRun.run.garden - 1) % PER_GROVE + 1)}</small></button>` : ''}
    ${endlessOpen() ? `<button class="btn ghost" data-act="start">${meta.savedRun ? t('newRun') : t('endless')} · ${L(md.name)}</button>` : ''}
    ${dailyBar()}
    <div class="hubgrid six">
      <button class="tile" data-act="chars">${svg('user', '#ffcd4a')}<span class="t">${t('characters')}</span><span class="d">${t('unlockedN', Object.keys(meta.owned).length, Object.keys(CHARS).length)}</span></button>
      <button class="tile" data-act="nest">${svg('nest', '#9fe3d4')}<span class="t">${t('nest')}</span><span class="d">${t('nestSub')}</span></button>
      <button class="tile" data-act="challenges">${n ? `<span class="badge">${n}</span>` : ''}${svg('trophy', '#ff9ec0')}<span class="t">${t('challenges')}</span><span class="d">${t('challSub')}</span></button>
      <button class="tile" data-act="profile">${svg('home', '#b993ff')}<span class="t">${t('profile')}</span><span class="d">${t('profSub')}</span></button>
      <button class="tile" data-act="road">${rr0 ? `<span class="badge">${rr0}</span>` : ''}${svg('road', '#ffcd4a')}<span class="t">${t('roadShort')}</span><span class="d">${t('roadSub')}</span></button>
      ${endlessOpen() ? '' : '<!--'}<button class="tile" data-act="book">${svg('star', '#ffcd4a')}<span class="t">${t('bookShort')}</span><span class="d">${Object.keys(meta.discovered || {}).length}/${Object.keys(EVO2).length + Object.keys(EVOS).length}</span></button>${endlessOpen() ? '' : '-->'}
    </div>
  </div>`);
}
function showChars() {
  mode = 'chars';
  const keys = Object.keys(CHARS);
  if (charIdx == null) charIdx = Math.max(0, keys.indexOf(meta.char));
  charIdx = (charIdx + keys.length) % keys.length;
  const k = keys[charIdx], c = CHARS[k];
  const owned = meta.owned[k], sel = meta.char === k;
  const action = sel ? `<button class="btn" disabled>${t('playing')}</button>`
    : owned ? `<button class="btn" data-act="pick" data-k="${k}">${t('pick')}</button>`
    : `<button class="btn" data-act="unlock" data-k="${k}" ${meta.coins < c.cost ? 'disabled' : ''}>${SEED.replace('<svg', '<svg width="16" height="16"')} ${c.cost}</button>`;
  const dots = keys.map((x, j) => `<i class="${j === charIdx ? 'on' : ''}"></i>`).join('');
  show(`<div class="card"><div class="hubtop"><div><div class="eyebrow">${t('characters')}</div><h2>${t('chooseTuft')}</h2></div></div>
    <div class="carousel"><button class="iconbtn" data-act="charprev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg></button>
      <div class="cshow">${avatar(k, 80, cosState().hat)}<span class="t">${c.name}</span></div>
      <button class="iconbtn" data-act="charnext" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l8 8-8 8"/></svg></button></div>
    <div class="dots">${dots}</div>
    <p>${L(c.desc)}</p>
    <div class="stats" style="justify-content:center"><span>${t('speedS', num(c.speed))}</span><span>${t('heartsS', c.hp)}</span><span>${t('trailS', c.cap)}</span></div>
    ${action}
    <button class="btn ghost" data-act="looks">${svg('star', 'currentColor')} ${t('changeLook')}</button>
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
}
let charIdx = null, chTab = 'goals', chPage = 0;
// The furthest grove reached in either mode decides which Nest levels are open.
function groveReached() {
  const adv = typeof advTop === 'function' ? advTop() : 1;
  const end = Math.floor(Math.max(0, (meta.st.bestGarden || 1) - 1) / PER_GROVE) + 1;
  return Math.max(adv, end);
}

/* ---------- Gear (Phase 4.4): pieces that change the rules, bought with seeds, 2 equipped at a time ---------- */
// Boss prep: one compact line. Equipped gear shows a check; otherwise it points to the Nest, where it can be bought or equipped.

let nestTab = 'up', nestPage = 0;
function showNest() {
  mode = 'nest';
  if (nestTab === 'rep' && !repOpen()) nestTab = 'up';
  const items = NEST.map(u => {
    const lv = meta.up[u.k], maxed = lv >= u.max, cost = maxed ? 0 : u.cost[lv];
    const gate = maxed ? 0 : u.gate[lv], locked = gate > groveReached();
    let pips = '';
    for (let j = 0; j < u.max; j++) pips += `<i class="${j < lv ? 'on' : ''}"></i>`;
    const tag = maxed ? t('max') : locked ? `<span style="color:var(--muted)">${svg('lock', 'currentColor')} ${t('grove')} ${gate}</span>` : SEED + cost;
    return `<button class="mini" data-act="buy" data-k="${u.k}" ${maxed || locked || meta.coins < cost ? 'disabled' : ''}>
      <span class="t">${L(u.name)}</span><span class="d">${maxed ? '' : L(typeof u.desc === 'function' ? u.desc(lv) : u.desc)}</span>
      <span class="foot"><span class="pips">${pips}</span><span class="cost">${tag}</span></span></button>`;
  });
  show(`<div class="card">
    <div class="hubtop"><div><div class="eyebrow">${t('permUp')}</div><h2>${t('nest')}</h2></div><div class="wallet" style="font-size:18px">${SEED}${fmt(meta.coins)}</div></div>
    <div class="tabs" style="display:none">${[['up', LANG === 'pt' ? 'Melhorias' : 'Upgrades']].map(([k, lab]) => `<button class="btn small ${nestTab === k ? '' : 'ghost'}" data-act="nesttab" data-k="${k}">${lab}</button>`).join('')}</div>
    ${nestTab === 'up' ? `<div class="grid2">${items.slice(nestPage * 4, nestPage * 4 + 4).join('')}</div>${items.length > 4 ? `<div class="pager"><button class="btn small ghost" data-act="nestpg" data-k="-1" ${nestPage ? '' : 'disabled'}>‹</button><span>${nestPage + 1}/${Math.ceil(items.length / 4)}</span><button class="btn small ghost" data-act="nestpg" data-k="1" ${(nestPage + 1) * 4 < items.length ? '' : 'disabled'}>›</button></div>` : ''}` : ''}
    ${nestTab === 'rep' ? `<p class="small" style="text-align:left;margin:0">${t('repSub')}</p>` : ''}
    ${nestTab === 'rep' && repOpen() ? `<div class="grid2">${REPEAT.map(r => { const c2 = repCost(r); return `<button class="mini" data-act="rbuy" data-k="${r.k}" ${meta.coins < c2 ? 'disabled' : ''}><span class="t">${L(r.name)}</span><span class="d">${L(r.desc)}</span><span class="foot"><span class="cost" style="color:var(--muted)">${t('repLv', repLv(r.k))}</span><span class="cost">${SEED}${fmt(c2)}</span></span></button>`; }).join('')}</div>` : ''}
    <button class="btn ghost small" data-act="${showNest.from === 'prelevel' ? 'nestback' : 'hub'}">${t('back')}</button>
  </div>`);
}
function showChallenges() {
  if (!endlessOpen()) chTab = 'goals';
  mode = 'challenges';
  const n = claimable();
  const tabs = `<div class="tabs"><button class="btn small ${chTab === 'goals' ? '' : 'ghost'}" data-act="chtab" data-k="goals">${t('goals')}${n ? ' (' + n + ')' : ''}</button>${endlessOpen() ? `<button class="btn small ${chTab === 'modes' ? '' : 'ghost'}" data-act="chtab" data-k="modes">${t('gameMode')}</button>` : ''}</div>`;
  let body = '';
  if (chTab === 'modes') {
    body = `<div class="choices">${Object.entries(MODES).map(([k, m]) => {
      const unlocked = meta.st.bestGarden >= m.unlock;
      return `<button class="choice ${meta.mode === k ? 'sel' : ''}" data-act="mode" data-k="${k}" ${unlocked ? '' : 'disabled'}>
        <span class="txt"><span class="t">${L(m.name)}${meta.mode === k ? `<small>${t('selected')}</small>` : ''}</span>
        <span class="d">${unlocked ? L(m.desc) : t('locked', m.unlock, Math.ceil(m.unlock / PER_GROVE))}</span></span></button>`;
    }).join('')}</div>`;
  } else {
    const rank = c => meta.claimed[c.id] ? 2 : c.val(meta) >= c.goal ? 0 : 1;
    const order = challengeList().sort((a, b) => rank(a) - rank(b));
    const per = 4, pages = Math.ceil(order.length / per);
    chPage = Math.max(0, Math.min(pages - 1, chPage));
    const rows = order.slice(chPage * per, chPage * per + per).map(c => {
      const v = Math.min(c.goal, c.val(meta)), done = v >= c.goal, claimed = meta.claimed[c.id];
      const action = claimed ? `<span class="done">${t('claimed')}</span>`
        : done ? `<button class="buy" data-act="claim" data-k="${c.id}">${t('claim')} ${SEED}${c.reward}</button>`
        : `<span class="done">${SEED.replace('<svg', '<svg width="12" height="12"')} ${c.reward}</span>`;
      return `<div class="nrow"><div class="txt"><span class="t">${L(c.name)}</span><span class="d">${L(c.desc)} ${fmt(v)}/${fmt(c.goal)}</span>
        <span class="prog"><i style="width:${v / c.goal * 100}%"></i></span></div>${action}</div>`;
    }).join('');
    body = `<div class="list">${rows}</div>
      <div class="pager"><button class="iconbtn" data-act="chpage" data-k="-1" ${chPage === 0 ? 'disabled' : ''} aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg></button><span>${chPage + 1}/${pages}</span><button class="iconbtn" data-act="chpage" data-k="1" ${chPage >= pages - 1 ? 'disabled' : ''} aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l8 8-8 8"/></svg></button></div>`;
  }
  show(`<div class="card"><div class="eyebrow">${t('challenges')}</div><h2>${t('goalsModes')}</h2>
    ${tabs}${body}
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
}
let clearArm = false;
function showBook() {
  mode = 'book';
  const rows = Object.entries(EVO2).map(([k, e]) => {
    const w = WEAPONS[e.weapon], found = meta.discovered && meta.discovered[k];
    return `<div class="nrow"><span class="ico" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:none;background:${found ? '#ffcd4a' : w.bg}">${svg(found ? 'star' : w.icon, found ? '#2b2000' : w.fg)}</span>
      <div class="txt"><span class="t">${found ? L(e.name) : t('unknown')}</span>
      <span class="d"><b style="color:var(--ink)">${L(w.name)}</b> (max) + <b style="color:var(--ink)">${L(SKILLS[e.pair].name)}</b></span>
      ${found ? `<span class="d">${L(e.desc)}</span>` : ''}</div></div>`;
  }).join('') + Object.entries(EVOS).map(([k, e]) => { // passive + passive evolutions
    const a = SKILLS[e.needs[0]], found = meta.discovered && meta.discovered[k];
    return `<div class="nrow"><span class="ico" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:none;background:${found ? '#ffcd4a' : a.bg}">${svg(found ? 'star' : a.icon, found ? '#2b2000' : a.fg)}</span>
      <div class="txt"><span class="t">${found ? L(e.name) : t('unknown')}</span>
      <span class="d"><b style="color:var(--ink)">${L(a.name)}</b> (max) + <b style="color:var(--ink)">${L(SKILLS[e.needs[1]].name)}</b></span>
      ${found ? `<span class="d">${L(e.desc)}</span>` : ''}</div></div>`;
  }).join('');
  show(`<div class="card"><div class="eyebrow">${t('endless')}</div><h2>${t('book')}</h2>
    <p>${t('bookP')}</p>
    <div class="list">${rows}</div>
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
}
function showProfile() {
  mode = 'profile';
  const s = meta.st;
  show(`<div class="card"><div class="eyebrow">${t('profile')}</div><h2>${esc(meta.name)}</h2>
    <form class="field" id="nameForm"><label for="nameInput">${t('yourName')}</label><input id="nameInput" maxlength="16" value="${esc(meta.name)}" autocomplete="off"></form>
    <div class="statline"><span>${t('runs')}<b>${fmt(s.runs)}</b></span><span>${t('tuftsSaved')}<b>${fmt(s.tufts)}</b></span></div>
    <div class="statline"><span>${t('bestGarden')}<b>${s.bestGarden || '–'}</b></span><span>${t('bestRow')}<b>${s.bestCombo || '–'}</b></span><span>${t('seedsEarned')}<b>${fmt(s.seedsTotal)}</b></span></div>
    <div class="section">${LANG === 'pt' ? 'Brotinhos brilhantes' : 'Shiny sprouts'}</div>
    <div class="mrow shinyrow">${[0, 1, 2, 3].map(c => { const n = (meta.shinies || {})[c] || 0; return `<span class="mi${n ? ' got' : ''}">${tuftImg(c, 26)} ×${n}</span>`; }).join('')}</div>
    <div class="section">${t('saveH')}</div>
    <div class="mission" id="saveStatus" style="${cloud.state === 'on' ? '' : storageOK ? '' : 'border-color:var(--coral)'}">${cloud.state === 'on' ? '✓ ' + t('saveCloud').replace('Claude', acctName()) : storageOK ? t('saveLocal') : t('saveBroken')}</div>
    ${cloud.state === 'on' ? `<button class="btn ghost small" data-act="clouddisconnect">${CLt('disconnect')}</button>` : cloudBox()}
    <div class="grid2"><button class="btn ghost small" data-act="savecopy">${t('saveCopy')}</button><button class="btn ghost small" data-act="saveload">${t('saveLoad')}</button></div>
    <button class="btn ghost small" data-act="restorebak">${t('restoreBak')}</button><div id="bakMsg" class="bdesc" aria-live="polite">${meta.lastBackup ? t('lastBak', new Date(meta.lastBackup).toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) : ''}</div>
    <div id="saveBox" hidden class="field"><label for="saveText" id="saveLabel">${t('savePaste')}</label><textarea id="saveText" rows="3" style="font:500 16px var(--body);background:var(--night);color:var(--ink);border:1.5px solid var(--line);border-radius:12px;padding:8px;resize:none;user-select:text;-webkit-user-select:text;word-break:break-all"></textarea>
      <button class="btn small" data-act="saveapply" id="saveApply">${t('saveApply')}</button><div id="saveMsg" class="bdesc" aria-live="polite"></div></div>
    ${ctrlBtn()}
    ${musicBtn()}
    ${langBtn()}
    <button class="btn ghost small" data-act="quiz">${LANG === 'pt' ? 'Quiz do teste (1 min)' : 'Playtest quiz (1 min)'}${meta.quiz && meta.quiz.done ? ' ✓' : ''}</button>
    <div class="grid2"><button class="btn ghost small" data-act="tutorial">${t('replayTut')}</button><button class="btn ghost small" data-act="clear">${t('clearData')}</button></div>
    <button class="btn ghost small" data-act="hub">${t('back')}</button></div>`);
  const inp = document.getElementById('nameInput');
  const form = document.getElementById('nameForm');
  const save = () => { const v = inp.value.trim().slice(0, 16); if (v) { meta.name = v; meta.nameSet = true; saveMeta(); overlay.querySelector('h2').textContent = v; } };
  inp.addEventListener('input', save);
  form.addEventListener('submit', e => { e.preventDefault(); save(); inp.blur(); });
}

/* ---------- Playtest quiz: can a player say what each hero, pest and rule does? ----------
   One tap per question ("not sure" is always there, so guesses don't inflate the score). Answers go into the save code
   (meta.quiz), where the playtest reader scores them. Only asks about pests the player has actually reached. */
const QUIZ = [
  ['h_pip', 'hero', 'pip', { en: 'What is Tango good at?', pt: 'No que o Tango é bom?' }, [{ en: 'Fastest, no special move', pt: 'Mais rápido, sem golpe especial' }, { en: 'Freezes pests', pt: 'Congela pragas' }, { en: 'Carries 7 sprouts', pt: 'Leva 7 brotinhos' }]],
  ['h_moss', 'hero', 'moss', { en: 'What is Mac good at?', pt: 'No que o Mac é bom?' }, [{ en: 'Extra hearts and a leaf bubble', pt: 'Corações extras e bolha de folhas' }, { en: 'Jumps over hedges', pt: 'Pula os muros' }, { en: 'Makes pests dizzy', pt: 'Deixa pragas tontas' }]],
  ['h_bolt', 'hero', 'bolt', { en: "What does Zip's special do?", pt: 'O que o golpe do Zip faz?' }, [{ en: 'Jumps ahead, even over hedges', pt: 'Pula à frente, até por cima de muros' }, { en: 'Shoos pests away', pt: 'Espanta as pragas' }, { en: 'Heals a heart', pt: 'Cura um coração' }]],
  ['h_ember', 'hero', 'ember', { en: "What does Lichi's special do?", pt: 'O que o golpe da Lichi faz?' }, [{ en: 'Makes nearby pests dizzy', pt: 'Deixa as pragas perto tontas' }, { en: 'Carries more sprouts', pt: 'Leva mais brotinhos' }, { en: 'Jumps over hedges', pt: 'Pula os muros' }]],
  ['h_nova', 'hero', 'nova', { en: "What does Luna's special do?", pt: 'O que o golpe da Luna faz?' }, [{ en: 'Shoos every pest far away', pt: 'Espanta todas as pragas pra longe' }, { en: 'Freezes everything', pt: 'Congela tudo' }, { en: 'Gives an extra heart', pt: 'Dá um coração extra' }]],
  ['p_shooter', 'pest', 'shooter', { en: 'What does this pest do?', pt: 'O que essa praga faz?' }, [{ en: 'Shoots down its lane', pt: 'Atira no corredor' }, { en: 'Chases you', pt: 'Te persegue' }, { en: 'Lets out ants', pt: 'Solta formigas' }]],
  ['p_hunter', 'pest', 'hunter', { en: 'What does this pest do?', pt: 'O que essa praga faz?' }, [{ en: 'Chases you when close', pt: 'Te persegue de perto' }, { en: 'Shoots down its lane', pt: 'Atira no corredor' }, { en: 'Throws hail over hedges', pt: 'Joga granizo por cima dos muros' }]],
  ['p_mushroom', 'pest', 'mushroom', { en: 'What does this pest do?', pt: 'O que essa praga faz?' }, [{ en: 'Leaps next to you (purple ring)', pt: 'Salta do seu lado (anel roxo)' }, { en: 'Steals sprouts', pt: 'Rouba brotinhos' }, { en: "Can't be frozen", pt: 'Não congela' }]],
  ['p_sniper', 'pest', 'sniper', { en: 'What does this pest do?', pt: 'O que essa praga faz?' }, [{ en: 'Throws hail over hedges', pt: 'Joga granizo por cima dos muros' }, { en: 'Chases you', pt: 'Te persegue' }, { en: 'Lets out ants', pt: 'Solta formigas' }]],
  ['p_grape', 'pest', 'grape', { en: 'What does this pest do?', pt: 'O que essa praga faz?' }, [{ en: 'Lets out 3 ants when bumped', pt: 'Solta 3 formigas quando batido' }, { en: 'Shoots down its lane', pt: 'Atira no corredor' }, { en: 'Leaps next to you', pt: 'Salta do seu lado' }]],
  ['m_flake', 'pick', 'ob-flake', { en: 'What does the snowflake do?', pt: 'O que o floco de neve faz?' }, [{ en: 'Freezes pests so you can bump them', pt: 'Congela as pragas pra você bater' }, { en: 'Gives seeds', pt: 'Dá sementes' }, { en: 'Heals you', pt: 'Te cura' }]],
  ['m_bump', 'pest', 'wander', { en: 'You touch an awake pest. What happens?', pt: 'Você encosta numa praga acordada. O que acontece?' }, [{ en: 'You lose a heart and some sprouts', pt: 'Perde um coração e brotinhos' }, { en: 'It goes to the den', pt: 'Ela vai pra toca' }, { en: 'Nothing', pt: 'Nada' }]],
  ['m_den', 'pick', 'ob-den', { en: 'What is this hole for?', pt: 'Pra que serve esse buraco?' }, [{ en: 'Bumped pests nap there, then return', pt: 'Pragas batidas dormem ali e voltam' }, { en: 'It is your home', pt: 'É a sua casa' }, { en: 'It is a shop', pt: 'É uma loja' }]],
  ['m_rainbow', 'pick', 'ob-wreath', { en: 'What does the rainbow portal do?', pt: 'O que o portal arco-íris faz?' }, [{ en: 'Takes any color for a moment', pt: 'Aceita qualquer cor por um tempinho' }, { en: 'Doubles your seeds', pt: 'Dobra as sementes' }, { en: 'Ends the garden', pt: 'Termina o jardim' }]],
  ['m_boss', 'pick', 'ob-gate', { en: 'How do you win a boss garden?', pt: 'Como se vence o jardim do chefe?' }, [{ en: 'Fill each portal, then bring the Golden Sprout to the gate', pt: 'Encha cada portal e leve o Broto Dourado ao portão' }, { en: 'Bump the boss 3 times', pt: 'Bater no chefe 3 vezes' }, { en: 'Survive 2 minutes', pt: 'Sobreviver 2 minutos' }]],
  ['m_guard', 'nest', 'trail', { en: 'What does a Toca Comprida guard do?', pt: 'O que a guarda da Toca Comprida faz?' }, [{ en: 'Blocks one trail break per garden', pt: 'Bloqueia uma quebra da fila por jardim' }, { en: 'Gives a heart', pt: 'Dá um coração' }, { en: 'Makes you faster', pt: 'Te deixa mais rápido' }]],
];
const QUIZ_NEEDS = { p_shooter: 2, p_hunter: 5, p_mushroom: 6, p_sniper: 8, p_grape: 9, m_rainbow: 3, m_guard: 2 };
let quizAt = 0, quizOrder = [];
function quizQs() { const G = groveReached(); return QUIZ.filter(q => !QUIZ_NEEDS[q[0]] || G >= QUIZ_NEEDS[q[0]]); }
function startQuiz() { quizAt = 0; quizOrder = quizQs(); meta.quiz = { v: 1, at: Math.round(Date.now() / 1000), g: groveReached(), ans: {}, story: '' }; showQuiz(); }
function showQuiz() {
  mode = 'quiz';
  if (quizAt >= quizOrder.length) {
    show(`<div class="card"><div class="eyebrow">Quiz</div><h2>${LANG === 'pt' ? 'Conte a história' : 'Tell the story'}</h2>
      <p>${LANG === 'pt' ? 'Em uma frase: do que se trata o jogo?' : 'In one sentence: what is the game about?'}</p>
      <textarea id="quizStory" rows="3" maxlength="200" style="width:100%;font:500 16px var(--body);background:var(--night);color:var(--ink);border:1.5px solid var(--line);border-radius:12px;padding:10px"></textarea>
      <button class="btn" data-act="quizdone">${LANG === 'pt' ? 'Pronto' : 'Done'}</button></div>`);
    return;
  }
  const [id, kind, pic, q, opts] = quizOrder[quizAt];
  const img = kind === 'hero' ? avatar(pic, 72) : kind === 'pest' ? grumbleImg(pic, 72) : kind === 'pick' && artGet(pic) ? `<img src="${artGet(pic)}" alt="" style="width:72px;height:72px;object-fit:contain">` : kind === 'nest' ? `<b style="font-size:20px">${L(NEST[0].name)}</b>` : '';
  const sh = [0, 1, 2].map(k => ({ k, r: hash32(quizAt * 31 + k * 7 + (meta.quiz.at % 97)) })).sort((a, b) => a.r - b.r).map(o => o.k);
  show(`<div class="card"><div class="eyebrow">Quiz ${quizAt + 1}/${quizOrder.length}</div>
    <div style="display:flex;justify-content:center;min-height:72px">${img}</div><h2 style="font-size:20px">${L(q)}</h2>
    <div class="btns" style="display:flex;flex-direction:column;gap:8px">${sh.map(k => `<button class="btn ghost small" data-act="quizans" data-k="${k === 0 ? 'ok' : 'x' + k}">${L(opts[k])}</button>`).join('')}
    <button class="btn ghost small" data-act="quizans" data-k="ns" style="opacity:.8">${LANG === 'pt' ? 'Não sei' : 'Not sure'}</button></div></div>`);
}
const WIN_GROVE = 6;
function showClear() {
  if (run.kind === 'adv') { advResult(true); return; }
  if (run.kind === 'endless' && run.boss && grove() === WIN_GROVE && !run.won) { showVictory(); return; }
  mode = 'clear';
  const chest = gardenInGrove() === PER_GROVE;
  if (run.chal && run.chal.k === 'nohit' && !run.hitThisGarden) run.chalDone = true;
  const nodeLine = run.node === 'thorny' ? t('thornyPrize') : run.chal ? (run.chalDone ? t('chalPrize', Math.round(25 * coinMult())) : t('chalMissed')) : '';
  show(`<div class="card">
    <div class="eyebrow">${t('groveGarden', grove(), gardenInGrove(), PER_GROVE)}</div>
    <div style="display:flex;justify-content:center">${avatar(run.char || meta.char, 64, null, 'cheer')}</div>
    <h2>${chest ? t('groveCleared') : t('gardenCleared')}</h2>
    <div class="statline"><span>${t('seedsL')}<b>+${run.clearSeeds}</b></span><span>${t('heal')}<b>+1</b></span>${!run.hitThisGarden ? `<span>${t('noHits')}<b>${t('yes')}</b></span>` : ''}</div>
    ${nodeLine && !chest ? `<p><b style="color:var(--gold)">${nodeLine}</b></p>` : ''}
    <p>${chest ? t('campNext') : t('busier')}</p>
    <button class="btn" data-act="next">${chest ? t('goCamp') : t('nextGarden')}</button>
  </div>`);
}
function showVictory() {
  mode = 'victory';
  run.won = true;
  const prize = Math.round(200 * coinMult());
  run.coins += prize;
  meta.st.endlessWins = (meta.st.endlessWins || 0) + 1; saveMeta();
  sfx('jackpot');
  show(`<div class="card">
    <div class="eyebrow">${t('groveGarden', grove(), gardenInGrove(), PER_GROVE)}</div>
    <h1 style="font-size:40px">${t('victory')}</h1>
    <p>${t('victoryP', WIN_GROVE)}</p>
    <div class="statline"><span>${t('score')}<b>${fmt(run.score)}</b></span><span>${t('prize')}<b>+${prize}</b></span><span>${t('level')}<b>${run.level}</b></span></div>
    <div class="btns"><button class="btn" data-act="victorygo">${t('keepGoing')}</button><button class="btn ghost" data-act="quit">${t('endWin')}</button></div>
  </div>`);
}
const CAMP = [
  { k: 'heal',   name: { en: 'Rest', pt: 'Descanso' },             desc: { en: 'Heal 2 hearts.', pt: 'Cura 2 corações.' }, cost: 8 },
  { k: 'bubble', name: { en: 'Spare Bubble', pt: 'Bolha Reserva' },  desc: { en: 'Blocks the next hit you take.', pt: 'Bloqueia o próximo golpe que você levar.' }, cost: 12 },
];
function showCamp() {
  mode = 'camp';
  const items = CAMP.map(it => {
    const bought = run.campBought[it.k];
    const blocked = (it.k === 'heal' && run.hp >= maxHp()) || (it.k === 'bubble' && run.spareShield);
    return `<button class="mini ${bought ? 'sel' : ''}" data-act="camp" data-k="${it.k}" ${bought || run.coins < it.cost || blocked ? 'disabled' : ''}>
      <span class="t">${L(it.name)}</span><span class="d">${L(it.desc)}</span><span class="cost">${bought ? t('bought') : SEED + it.cost}</span></button>`;
  }).join('');
  show(`<div class="card"><div class="hubtop"><div><div class="eyebrow">${run.campMid ? t('node_camp') + ' · ' + t('grove') + ' ' + grove() : t('campAfter', grove())}</div><h2>${t('restock')}</h2></div><div class="wallet">${SEED}${fmt(run.coins)}</div></div>
    <p>${t('campP')}</p>
    <div class="grid2">${items}</div>
    ${skillChips()}
    <button class="btn" data-act="leavecamp">${run.campMid ? t('backToMap') : t('enterGrove', grove() + 1)}</button></div>`);
}
function buyCamp(k) {
  const it = CAMP.find(c => c.k === k);
  if (!it || run.campBought[k] || run.coins < it.cost) return;
  run.coins -= it.cost; run.campBought[k] = true;
  if (k === 'heal') run.hp = Math.min(maxHp(), run.hp + 2);
  if (k === 'bubble') run.spareShield = true;
  sfx('coin');
  showCamp();
}
function nextGarden() { run.garden++; run.campBought = {}; beginGarden(); }

/* ---------- First-time guide cards ----------
   Every mechanic gets one short card the first time it shows up on the board (pests, pickups, portals, the den,
   the goal of each mode, skill cards, the hero's special move). Seen keys live in meta.learned; Profile can reset them. */
