/* ---------- characters ---------- */
const CHARS = {
  // Tuned so every hero wins within ±5 points of the others (casual bot that uses specials, sim/heroes.js). Different, not stronger.
  pip:   { name: 'Tango',   fill: '#ff9f43', dark: '#a3501a', speed: 2.9, hp: 3, cap: 4, cost: 0,   ability: null,
           desc: { en: 'A zippy tangerine. The fastest roller, no special move.', pt: 'Uma tangerina agitada. A mais rápida, sem golpe especial.' } },
  moss:  { name: 'Mac',  fill: '#3daa3a', dark: '#1d5a1b', speed: 2.45, hp: 5, cap: 4, cost: 60,  ability: null,
           desc: { en: 'Mighty And Calm. 5 hearts and a leaf bubble in every garden.', pt: 'Muito Amigo e Corajoso. 5 corações e uma bolha de folhas por jardim.' } },
  bolt:  { name: 'Zip',  fill: '#ffd93b', dark: '#8a6a00', speed: 2.7, hp: 3, cap: 4, cost: 120, ability: 'warp', cd: 9, label: { en: 'Warp', pt: 'Salto' },
           desc: { en: 'Warp: jump 3 tiles, even over hedges. Every 9 s.', pt: 'Salto: pula 3 casas, até por cima de muros. A cada 9 s.' } },
  ember: { name: 'Lichi', fill: '#f2557f', dark: '#7a1e3c', speed: 2.6, hp: 3, cap: 4, cost: 150, ability: 'puff', cd: 22, puffR: 2, puffS: 2, label: { en: 'Puff', pt: 'Sopro' },
           desc: { en: 'Puff: pests 2 steps away get dizzy. Every 22 s.', pt: 'Sopro: pragas a 2 passos ficam tontas. A cada 22 s.' } },
  nova:  { name: 'Luna',  fill: '#6a4be0', dark: '#2e1f80', speed: 2.4, hp: 3, cap: 7, cost: 220, ability: 'recall', cd: 22, label: { en: 'Recall', pt: 'Chamado' },
           desc: { en: 'Carries 7 sprouts. Recall: shoo every pest away. Every 22 s.', pt: 'Leva 7 brotinhos. Chamado: espanta todas as pragas. A cada 22 s.' } },
};

/* ---------- skills (in-run cards) ---------- */
const SKILLS = {
  swift:  { name: { en: 'Speed Up', pt: 'Mais Velocidade' }, max: 4, icon: 'speed', bg: '#ffcd4a', fg: '#2b2000',
            desc: () => ({ en: `Roll faster: <b>${num(speedOf(sk.swift))} → ${num(speedOf(sk.swift + 1))}</b> tiles per second.`,
                           pt: `Role mais rápido: <b>${num(speedOf(sk.swift))} → ${num(speedOf(sk.swift + 1))}</b> casas por segundo.` }) },
  trail:  { name: { en: 'Bigger Trail', pt: 'Fila Maior' }, max: 4, icon: 'stack', bg: '#5cc6ff', fg: '#0d2235',
            desc: () => ({ en: `Carry more sprouts at once: <b>${cap()} → ${cap() + 2}</b>.`, pt: `Leve mais brotinhos de uma vez: <b>${cap()} → ${cap() + 2}</b>.` }) },
  fur:    { name: { en: 'Extra Heart', pt: 'Coração Extra' }, max: 4, icon: 'heart', bg: '#ff6f61', fg: '#3a0d08',
            desc: () => ({ en: `Max hearts <b>${maxHp()} → ${maxHp() + 1}</b>, and heal 2 right now.`, pt: `Corações máximos <b>${maxHp()} → ${maxHp() + 1}</b>, e cura 2 na hora.` }) },
  frost:  { name: { en: 'Longer Freeze', pt: 'Gelo Duradouro' }, max: 3, icon: 'frost', bg: '#bfe8ff', fg: '#11304a',
            desc: () => ({ en: `Snowflakes freeze pests for longer: <b>${num(freezeDur())}s → ${num(freezeDur() + 1.5)}s</b>, and show up more often and stay out longer.`,
                           pt: `Os flocos de neve congelam as pragas por mais tempo: <b>${num(freezeDur())}s → ${num(freezeDur() + 1.5)}s</b>, e aparecem com mais frequência e ficam mais tempo no mapa.` }) },
};
/* ---------- Endless-only: weapons (auto, never kill), evolutions, risky cards ---------- */
const nn = v => num(v, v % 1 ? 1 : 0);
const WEAPONS = {
  aura:  { name: { en: 'Frost Breath', pt: 'Sopro Gelado' }, icon: 'frost', bg: '#bfe8ff', fg: '#11304a', max: 4, pair: 'frost', evo: 'blizzard',
           stat: l => ({ cd: [7, 6, 5.5, 5][l - 1], len: [4, 6, 6, 7][l - 1], d: [2, 2.5, 2.5, 3][l - 1], dirs: [1, 1, 2, 4][l - 1] }),
           desc: st => ({ en: `Every ${nn(st.cd)}s, a frost beam shoots at ${st.dirs > 1 ? 'up to ' + st.dirs + ' corridors with pests' : 'a corridor with a pest'}, up to ${nn(st.len)} tiles, freezing pests for ${nn(st.d)}s.`, pt: `A cada ${nn(st.cd)}s, um raio de gelo vai ${st.dirs > 1 ? 'em até ' + st.dirs + ' corredores com praga' : 'no corredor com praga'}, até ${nn(st.len)} casas, congelando as pragas por ${nn(st.d)}s.` }) },
  orbit: { name: { en: 'Orbit Bubbles', pt: 'Bolhas em Órbita' }, icon: 'orbit', bg: '#9fe3d4', fg: '#0f3530', max: 4, pair: 'trail', evo: 'wall',
           stat: l => ({ cd: [4, 3.5, 3, 2.5][l - 1], n: [1, 2, 2, 3][l - 1], r: [1, 1, 1.25, 1.25][l - 1] }),
           desc: st => ({ en: `${st.n} bubble${st.n > 1 ? 's' : ''} circle${st.n > 1 ? '' : 's'} you and knock out pests ${st.n > 1 ? 'they touch' : 'it touches'}. A popped bubble grows back in ${nn(st.cd)}s.`, pt: `${st.n} ${st.n > 1 ? 'bolhas giram' : 'bolha gira'} em volta de você e ${st.n > 1 ? 'nocauteiam' : 'nocauteia'} as pragas que ${st.n > 1 ? 'tocam' : 'toca'}. Bolha estourada volta em ${nn(st.cd)}s.` }) },
  puff:  { name: { en: 'Chaser Seed', pt: 'Semente Caçadora' }, icon: 'burst', bg: '#ff9a7a', fg: '#3a1408', max: 4, pair: 'swift', evo: 'thunder',
           stat: l => ({ cd: [4, 3.5, 3, 2.6][l - 1], range: [7, 9, 11, 13][l - 1], n: [1, 1, 2, 2][l - 1] }),
           desc: st => ({ en: `Every ${nn(st.cd)}s, ${st.n > 1 ? st.n + ' seeds chase' : 'a seed chases'} the nearest pest along the paths (up to ${st.range} tiles) and knock${st.n > 1 ? '' : 's'} it out.`, pt: `A cada ${nn(st.cd)}s, ${st.n > 1 ? st.n + ' sementes perseguem' : 'uma semente persegue'} a praga mais perto pelos caminhos (até ${st.range} casas) e ${st.n > 1 ? 'nocauteiam' : 'nocauteia'}.` }) },
};
const EVO2 = {
  blizzard: { weapon: 'aura',  pair: 'frost',  name: { en: 'Blizzard', pt: 'Nevasca' }, desc: { en: 'Every 4s, frost shoots down all 4 corridors, even through one hedge, freezing pests for 3.5s.', pt: 'A cada 4s, gelo corre pelos 4 corredores, atravessando até um muro, congelando as pragas por 3,5s.' } },
  wall:     { weapon: 'orbit', pair: 'trail',  name: { en: 'Bubble Wall', pt: 'Muralha de Bolhas' }, desc: { en: '4 orbit bubbles that grow back fast, and pests can no longer break your trail.', pt: '4 bolhas em órbita que voltam rápido, e as pragas não quebram mais sua fila.' } },
  thunder:  { weapon: 'puff',  pair: 'swift',  name: { en: 'Thunder Puff', pt: 'Sopro Trovão' }, desc: { en: 'Every 3s, lightning runs down all 4 corridors and stuns every pest on them for 3s.', pt: 'A cada 3s, um raio corre pelos 4 corredores e atordoa toda praga neles por 3s.' } },
};
const WILDS = [
  { k: 'glass', name: { en: 'Glass Trail', pt: 'Fila de Vidro' },      desc: { en: '+3 trail space, but −1 max heart.', pt: '+3 espaços na fila, mas −1 coração máximo.' } },
  { k: 'greed', name: { en: 'Greedy Roots', pt: 'Raízes Gananciosas' }, desc: { en: 'Seeds ×1.5 for this run, but +1 pest in every garden.', pt: 'Sementes ×1,5 nesta partida, mas +1 praga em cada jardim.' } },
  { k: 'rush',  name: { en: 'Sugar Rush', pt: 'Euforia' },              desc: { en: 'Roll 20% faster, but pests are 10% faster too.', pt: 'Role 20% mais rápido, mas as pragas ficam 10% mais rápidas também.' } },
  { k: 'calm',  name: { en: 'Lullaby', pt: 'Canção de Ninar' },         desc: { en: 'Pests are 15% slower, but your trail holds 2 fewer sprouts.', pt: 'As pragas ficam 15% mais lentas, mas sua fila leva 2 brotinhos a menos.' } },
];
const PASSIVES = ['swift', 'trail', 'fur', 'frost'];
const PV_SLOTS = 4;
const EVOS = {
  comet:   { name: { en: 'Comet', pt: 'Cometa' }, needs: ['fur', 'swift'],
             desc: { en: 'After every drop at a portal, nothing can hurt you for 4s and you roll 30% faster.', pt: 'Depois de cada entrega num portal, nada te machuca por 4s e você rola 30% mais rápido.' } },
};

/* ---------- persistent profile ---------- */
// Each level costs more and unlocks only after reaching a grove (gate), so the Nest grows with the trail instead of maxing out early.
const NEST = [
  { k: 'trail', name: { en: 'Long Burrow', pt: 'Toca Comprida' }, max: 10, cost: [40,  240,  290,  345,  415,  500,  595,  715,  860,  1030], gate: [1,  2,  3,  4,  5,  6,  7,  8,  10,  11],
    desc: lv => lv % 2 === 0 ? { en: '+1 trail space.', pt: '+1 espaço na fila.' } : { en: '+1 line guard: blocks a trail break each garden.', pt: '+1 guarda: bloqueia uma quebra da fila por jardim.' } },
  { k: 'speed', name: { en: 'Quick Feet', pt: 'Pés Ligeiros' }, max: 10, cost: [200,  240,  290,  345,  415,  500,  595,  715,  860,  1030], gate: [1,  2,  3,  4,  5,  6,  7,  9,  10,  12],
    desc: lv => ({ en: `Roll faster: ${num(nestSpeedAt(lv),2)} → ${num(nestSpeedAt(lv + 1),2)} tiles/s.`, pt: `Role mais rápido: ${num(nestSpeedAt(lv),2)} → ${num(nestSpeedAt(lv + 1),2)} casas/s.` }) },
  { k: 'heart', name: { en: 'Sturdy Nest', pt: 'Ninho Firme' }, max: 10, cost: [200,  240,  290,  345,  415,  500,  595,  715,  860,  1030], gate: [1,  2,  3,  4,  5,  6,  8,  9,  11,  12],
    desc: lv => nestHearts(lv + 1) > nestHearts(lv) ? { en: '+1 heart in every garden.', pt: '+1 coração em todo jardim.' } : { en: '+0.3 s of safety after a hit.', pt: '+0,3 s de proteção depois de um golpe.' } },
]
// Nest effects: Toca alternates trail space (levels 1,3,5…) and line guards (2,4,6…); Ninho gives a heart at levels 1,4,7,10 and safety time in between.
const nestHearts = L => [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4][Math.max(0, Math.min(10, L || 0))];
const nestSpaces = L => Math.ceil((L || 0) / 2), nestGuards = L => Math.floor((L || 0) / 2);
const nestSpeedAt = L => CHARS[meta.char || 'pip'].speed + BAL.heroAdd + (L || 0) * BAL.nestSpeed;
const MODES = {
  normal: { name: { en: 'Classic', pt: 'Clássico' }, desc: { en: 'The standard run.', pt: 'A partida padrão.' }, mult: 1, unlock: 0 },
  oneheart: { name: { en: 'One Heart', pt: 'Um Coração' }, desc: { en: 'Only 1 heart and no Extra Heart cards. Seeds ×2.', pt: 'Só 1 coração e sem cartas de Coração Extra. Sementes ×2.' }, mult: 2, unlock: 5 },
  swarm: { name: { en: 'Swarm', pt: 'Enxame' }, desc: { en: '2 extra pests in every garden, on bigger maps. Seeds ×1.5.', pt: '2 pragas extras em cada jardim, em mapas maiores. Sementes ×1,5.' }, mult: 1.5, unlock: 9 },
};
// How far the player got in Adventure, in the same "garden number" units as Endless (a boss clear counts as the next garden).
const advReach = m => Object.keys(m.adv || {}).reduce((best, id) => { const [g, i] = id.split('-').map(Number); return Math.max(best, (g - 1) * 4 + (i >= 8 ? 5 : Math.min(4, Math.ceil(i / 2)))); }, 0);
const CHALLENGES = [
  { id: 'tufts25',  name: { en: 'First Rescues', pt: 'Primeiros Resgates' }, desc: { en: 'Deliver 25 sprouts in total.', pt: 'Entregue 25 brotinhos no total.' },             goal: 25,  val: m => m.st.tufts,   reward: 20 },
  { id: 'grove2',   name: { en: 'Into the Groves', pt: 'Rumo aos Bosques' }, desc: { en: 'Reach grove 2 (garden 5).', pt: 'Chegue ao bosque 2 (jardim 5).' },              goal: 5,   val: m => Math.max(m.st.bestGarden, advReach(m)), reward: 30 },
  { id: 'combo4',   name: { en: 'Color Parade', pt: 'Desfile de Cores' }, desc: { en: 'Drop 4 sprouts of one color in a row.', pt: 'Entregue 4 brotinhos da mesma cor em sequência.' },     goal: 4,   val: m => m.st.bestCombo, reward: 40 },
  { id: 'streak3', name: { en: 'Triple Treat', pt: 'Trio Perfeito' }, desc: { en: 'Get your first streak: 3+ sprouts of one color in a row.', pt: 'Faça sua primeira sequência: 3+ brotinhos da mesma cor em fila.' }, goal: 1, val: m => m.st.streaks, reward: 15 },
  { id: 'streaks10', name: { en: 'Streak Habit', pt: 'Mania de Sequência' }, desc: { en: 'Get 10 streaks of 3+ in total.', pt: 'Faça 10 sequências de 3+ no total.' }, goal: 10, val: m => m.st.streaks, reward: 40 },
  { id: 'combo6', name: { en: 'Single-Color Snake', pt: 'Fila Monocromática' }, desc: { en: 'Drop 6 sprouts of one color in a row.', pt: 'Entregue 6 brotinhos da mesma cor em sequência.' }, goal: 6, val: m => m.st.bestCombo, reward: 80 },
  { id: 'streaks50', name: { en: 'Streak Master', pt: 'Mestre das Sequências' }, desc: { en: 'Get 50 streaks of 3+ in total.', pt: 'Faça 50 sequências de 3+ no total.' }, goal: 50, val: m => m.st.streaks, reward: 120 },
  { id: 'nohit3',   name: { en: 'Untouched', pt: 'Intocável' }, desc: { en: 'Clear 3 gardens without getting hit.', pt: 'Termine 3 jardins sem levar golpe.' },    goal: 3,   val: m => m.st.noHit,   reward: 35 },
  { id: 'rainbow5', name: { en: 'Rainbow Rider', pt: 'Arco-íris' }, desc: { en: 'Use the rainbow portal 5 times.', pt: 'Use o portal arco-íris 5 vezes.' },         goal: 5,   val: m => m.st.rainbow, reward: 40 },
  { id: 'evo1',     name: { en: 'Evolved', pt: 'Evoluído' }, desc: { en: 'Unlock an evolution in a run.', pt: 'Libere uma evolução numa partida.' },           goal: 1,   val: m => m.st.evos,    reward: 60, endless: 1 },
  { id: 'grove3',   name: { en: 'Deep Woods', pt: 'Mata Fechada' }, desc: { en: 'Reach grove 3 (garden 9).', pt: 'Chegue ao bosque 3 (jardim 9).' },              goal: 9,   val: m => Math.max(m.st.bestGarden, advReach(m)), reward: 80 },
  { id: 'friends',  name: { en: 'New Friends', pt: 'Novos Amigos' }, desc: { en: 'Unlock 2 more characters.', pt: 'Libere mais 2 personagens.' },              goal: 3,   val: m => Object.keys(m.owned).length, reward: 50 },
  { id: 'tufts300', name: { en: 'Sprout Shepherd', pt: 'Pastor de Brotinhos' }, desc: { en: 'Deliver 300 sprouts in total.', pt: 'Entregue 300 brotinhos no total.' },            goal: 300, val: m => m.st.tufts,   reward: 90 },
  { id: 'onegrove', name: { en: 'Glass Heart', pt: 'Coração de Vidro' }, desc: { en: 'Clear grove 1 in One Heart mode.', pt: 'Termine o bosque 1 no modo Um Coração.' },        goal: 1,   val: m => m.st.oneHeartGrove, reward: 120, endless: 1 },
  { id: 'grove4',   name: { en: 'Heart of the Wood', pt: 'Coração da Floresta' }, desc: { en: 'Reach grove 4 (garden 13).', pt: 'Chegue ao bosque 4 (jardim 13).' },           goal: 13,  val: m => Math.max(m.st.bestGarden, advReach(m)), reward: 150 },
  { id: 'pop25', name: { en: 'Nap Time', pt: 'Hora da Soneca' }, desc: { en: 'Knock out 25 pests (bump them while frozen or stunned).', pt: 'Nocauteie 25 pragas (encoste nelas congeladas ou atordoadas).' }, goal: 25, val: m => m.st.pops, reward: 50 },
  { id: 'boss1', name: { en: 'Royal Rescue', pt: 'Resgate Real' }, desc: { en: 'Rescue your first Golden Sprout from a boss.', pt: 'Resgate seu primeiro Broto Dourado de um chefe.' }, goal: 1, val: m => m.st.bosses, reward: 50 },
  { id: 'stars30', name: { en: 'Star Collector', pt: 'Colecionador de Estrelas' }, desc: { en: 'Earn 30 stars on the trail map.', pt: 'Ganhe 30 estrelas no mapa da trilha.' }, goal: 30, val: m => Object.values(m.adv || {}).reduce((a, b) => a + b, 0), reward: 80 },
  { id: 'boss5', name: { en: 'Five Crowns', pt: 'Cinco Coroas' }, desc: { en: 'Rescue 5 Golden Sprouts.', pt: 'Resgate 5 Brotos Dourados.' }, goal: 5, val: m => m.st.bosses, reward: 150 },
  { id: 'seeds1k',  name: { en: 'Seed Hoard', pt: 'Celeiro Cheio' }, desc: { en: 'Earn 1,000 seeds in total.', pt: 'Ganhe 1.000 sementes no total.' },             goal: 1000, val: m => m.st.seedsTotal, reward: 100 },
];
