/* ---------- sound ---------- */
let actx = null, muted = false;
function initAudio() {
  askPersist();
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
}
/* ---------- sound ----------
   Everything is synthesized with Web Audio: short tones, filtered noise and bell partials for effects,
   plus a small sequencer that loops the music. Effects and music go to separate buses into one compressor. */
let SOUT = null, MBUS = null, PULSE = null, NBUF = null;
function abus() {
  if (!actx) return null;
  if (!SOUT) {
    const comp = actx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 6; comp.connect(actx.destination);
    SOUT = actx.createGain(); SOUT.gain.value = 0.9; SOUT.connect(comp);
    MBUS = actx.createGain(); MBUS.gain.value = 0.5; MBUS.connect(comp);
  }
  if (actx.state === 'suspended') actx.resume();
  return SOUT;
}
const NOTE_I = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function hz(n) { if (typeof n === 'number') return n; const m = /^([A-G][b#]?)(-?\d)$/.exec(n); return 440 * Math.pow(2, (NOTE_I[m[1]] + (+m[2] + 1) * 12 - 69) / 12); }
function pulseWave() {
  if (PULSE) return PULSE;
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) re[k] = (4 / (k * Math.PI)) * Math.sin(Math.PI * k * 0.25);
  return PULSE = actx.createPeriodicWave(re, im);
}
function tone({ f, f2, d = 0.15, type = 'square', v = 0.08, t = 0, a = 0.005, dest, vib = 0 }) {
  const c = actx, t0 = c.currentTime + Math.max(0, t), o = c.createOscillator(), g = c.createGain();
  if (type === 'pulse') o.setPeriodicWave(pulseWave()); else o.type = type;
  o.frequency.setValueAtTime(hz(f), t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(hz(f2), t0 + d);
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 9; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + d + 0.05); }
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(dest || SOUT); o.start(t0); o.stop(t0 + d + 0.05);
}
function noise({ d = 0.2, v = 0.1, t = 0, f = 1000, f2, q = 1, type = 'bandpass', dest }) {
  const c = actx, t0 = c.currentTime + Math.max(0, t);
  if (!NBUF) { NBUF = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = NBUF.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = NBUF; fl.type = type; fl.frequency.setValueAtTime(f, t0); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + d); fl.Q.value = q;
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl).connect(g).connect(dest || SOUT); s.start(t0); s.stop(t0 + d + 0.05);
}
const seqN = (notes, step, fn) => notes.forEach((n, i) => fn(n, i * step));
// The player's picks from the sound board (option letter in comments).
const SFX = {
  free: () => { tone({ f: 600, f2: 1100, d: 0.09, type: 'sine', v: 0.12 }); noise({ d: 0.03, v: 0.05, f: 3000 }); },                  // A soft pop
  deliver: () => seqN(['C5', 'E5', 'G5', 'C6'], 0.06, (n, t) => tone({ f: n, d: 0.14, type: 'triangle', v: 0.12, t })),            // A happy arpeggio
  streak: () => seqN(['C5', 'E5', 'G5', 'C6', 'E6'], 0.07, (n, t) => tone({ f: n, d: 0.18, type: 'pulse', v: 0.07, t })),          // A little fanfare
  seed: () => { tone({ f: 900, f2: 700, d: 0.05, type: 'triangle', v: 0.16 }); noise({ d: 0.02, v: 0.04, f: 2500 }); },             // C wood tok
  freeze: () => { // C crystal shimmer: two gliding sine notes with a soft tremble and a faint airy sparkle
    tone({ f: 'E6', f2: 'B6', d: 0.7, type: 'sine', v: 0.04, vib: 12 }); tone({ f: 'B6', f2: 'E7', d: 0.7, type: 'sine', v: 0.025, t: 0.1, vib: 12 });
    noise({ d: 0.6, v: 0.012, f: 8000, type: 'highpass' });
  },
  crack: () => { noise({ d: 0.12, v: 0.12, f: 4000, type: 'highpass' }); noise({ d: 0.06, v: 0.08, f: 1500, t: 0.04 }); },          // A crunch
  knock: () => tone({ f: 180, f2: 700, d: 0.35, type: 'sine', v: 0.14, vib: 40 }),                                                   // A boing
  bump: () => { tone({ f: 320, f2: 160, d: 0.1, type: 'square', v: 0.05 }); noise({ d: 0.04, v: 0.06, f: 900 }); },
  hurt: () => tone({ f: 220, f2: 70, d: 0.3, type: 'square', v: 0.08 }),                                                              // A low buzz
  break: () => [0, 0.07, 0.13].forEach(t => tone({ f: 900, f2: 500, d: 0.06, type: 'sine', v: 0.1, t })),                            // B pop pop pop
  level: () => seqN(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], 0.04, (n, t) => tone({ f: n, d: 0.1, type: 'pulse', v: 0.06, t })), // A scale run
  shot: () => tone({ f: 900, f2: 300, d: 0.12, type: 'square', v: 0.05 }),                                                           // A pew
  wake: () => { for (let i = 0; i < 6; i++) tone({ f: i % 2 ? 1500 : 1300, d: 0.05, type: 'square', v: 0.03, t: i * 0.05 }); },      // B alarm clock
  shield: () => tone({ f: 500, f2: 250, d: 0.2, type: 'sine', v: 0.14 }),                                                             // A bloop
  tap: () => noise({ d: 0.02, v: 0.07, f: 3500 }),                                                                                    // A soft click
  warp: () => tone({ f: 300, f2: 1200, d: 0.15, type: 'sine', v: 0.09 }),
  puff: () => { tone({ f: 180, f2: 600, d: 0.18, type: 'triangle', v: 0.1 }); noise({ d: 0.2, v: 0.05, f: 1200, f2: 300 }); },
  recall: () => { tone({ f: 900, f2: 200, d: 0.35, type: 'sine', v: 0.08 }); noise({ d: 0.3, v: 0.04, f: 2000, f2: 400 }); },
  tick: () => tone({ f: 1500, f2: 1300, d: 0.03, type: 'square', v: 0.04 }),
  stop: () => tone({ f: 520, f2: 260, d: 0.09, type: 'square', v: 0.06 }),
  creak: () => tone({ f: 140, f2: 90, d: 0.12, type: 'sawtooth', v: 0.05 }),
  fanfare: () => seqN(['G4', 'C5', 'E5', 'G5'], 0.09, (n, t) => tone({ f: n, d: 0.16, type: 'pulse', v: 0.06, t })),
  jackpot: () => seqN(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], 0.09, (n, t) => tone({ f: n, d: 0.14, type: 'pulse', v: 0.06, t })),
};
function sfx(kind) {
  if (!actx || muted) return;
  abus();
  const f = SFX[{ pop: 'free', home: 'deliver', coin: 'seed', shoot: 'shot' }[kind] || kind];
  if (f) try { f(); } catch (e) {}
}

/* ---------- music ----------
   Original tunes in a 16-bit adventure style. "E5/.5" = note E5 for half a beat, "r/1" = a rest; chords drive bass and arpeggios. */
const CHORD = { Am: ['A', 'C', 'E'], F: ['F', 'A', 'C'], C: ['C', 'E', 'G'], G: ['G', 'B', 'D'], Dm: ['D', 'F', 'A'], Bb: ['Bb', 'D', 'F'], Gm: ['G', 'Bb', 'D'],
  A: ['A', 'C#', 'E'], E: ['E', 'G#', 'B'], Cm: ['C', 'Eb', 'G'], Ab: ['Ab', 'C', 'Eb'], Fm: ['F', 'Ab', 'C'] };
const MUSIC = {
  main: { bpm: 96, lead: 'triangle', bassStyle: 'half', arp: true, drums: '', chords: ['Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'A'], // M2 Old Map, used everywhere
    mel: 'D5/1.5 A4/.5 D5/1 F5/1 | F5/1 E5/.5 D5/.5 Bb4/2 | C5/1.5 E5/.5 G5/1 F5/.5 E5/.5 | D5/3 r/1 | A5/1.5 F5/.5 D5/1 A5/1 | Bb5/1 A5/.5 G5/.5 D5/2 | E5/1 F5/.5 G5/.5 A5/1 C#6/1 | A5/3 r/1' },
};
function parseMel(s) { const out = []; let beat = 0; s.replace(/\|/g, ' ').trim().split(/\s+/).forEach(tok => { const [n, l] = tok.split('/'); if (n !== 'r') out.push({ n, beat, len: +l }); beat += +l; }); return out; }
const music = { cur: null, timer: null, gain: null };
function musicStop() {
  if (!music.cur) return;
  clearInterval(music.timer);
  const g = music.gain;
  try { g.gain.setTargetAtTime(0.0001, actx.currentTime, 0.08); } catch (e) {}
  setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 600);
  music.cur = null; music.gain = null;
}
function musicStart(name) {
  const tr = MUSIC[name]; if (!tr || !abus()) return;
  const c = actx, gain = c.createGain(); gain.gain.setValueAtTime(0.0001, c.currentTime); gain.gain.setTargetAtTime(1, c.currentTime, 0.3); gain.connect(MBUS);
  const spb = 60 / tr.bpm, loopBeats = tr.chords.length * 4, mel = tr._mel || (tr._mel = parseMel(tr.mel));
  let loopStart = c.currentTime + 0.1;
  const at = b => loopStart + b * spb - c.currentTime;
  const scheduleLoop = () => {
    mel.forEach(m => tone({ f: m.n, d: Math.max(0.08, m.len * spb * 0.9), type: tr.lead, v: tr.lead === 'triangle' ? 0.13 : tr.lead === 'sawtooth' ? 0.035 : 0.05, t: at(m.beat), dest: gain }));
    tr.chords.forEach((ch, bar) => {
      const nn = CHORD[ch], root = nn[0], fifth = nn[2], b0 = bar * 4;
      if (tr.bassStyle === 'drive') for (let i = 0; i < 8; i++) tone({ f: root + (i % 2 ? 3 : 2), d: spb * 0.4, type: 'triangle', v: 0.16, t: at(b0 + i * 0.5), dest: gain });
      if (tr.bassStyle === 'half') [0, 2].forEach(i => tone({ f: (i ? fifth : root) + 2, d: spb * 1.9, type: 'triangle', v: 0.16, t: at(b0 + i), dest: gain }));
      if (tr.bassStyle === 'drone') tone({ f: root + 2, d: spb * 3.9, type: 'triangle', v: 0.14, t: at(b0), dest: gain });
      if (tr.arp) for (let i = 0; i < 8; i++) tone({ f: nn[i % 3] + 4, d: spb * 0.6, type: 'triangle', v: 0.05, t: at(b0 + i * 0.5), dest: gain });
      if (tr.arp16) for (let i = 0; i < 16; i++) tone({ f: nn[i % 3] + (i % 6 < 3 ? 3 : 4), d: spb * 0.22, type: 'pulse', v: 0.022, t: at(b0 + i * 0.25), dest: gain });
      if (tr.drums) for (let i = 0; i < 16; i++) {
        const k = tr.drums[i], t = at(b0 + i * 0.25);
        if (k === 'k') tone({ f: 130, f2: 45, d: 0.14, type: 'sine', v: 0.22, t, dest: gain });
        if (k === 's') noise({ d: 0.1, v: 0.07, f: 1800, t, dest: gain });
        if (k === 'h') noise({ d: 0.03, v: 0.035, f: 8000, type: 'highpass', t, dest: gain });
      }
    });
  };
  scheduleLoop();
  music.timer = setInterval(() => { const end = loopStart + loopBeats * spb; if (end - c.currentTime < 0.7) { loopStart = end; scheduleLoop(); } }, 120);
  music.cur = name; music.gain = gain;
}
// One tune plays everywhere; this starts or stops it when sound or music is switched. Called every frame; only acts on a change.
let musicDuck = null;
function updateMusic() {
  if (!actx) return;
  let want = null;
  if (!muted && !meta.musicOff && actx.state !== 'suspended') want = 'main';
  if (want !== music.cur) { musicStop(); if (want) musicStart(want); }
  const duck = mode === 'pause' ? 0.18 : 0.5;
  if (MBUS && duck !== musicDuck) { musicDuck = duck; MBUS.gain.setTargetAtTime(duck, actx.currentTime, 0.15); }
}

/* ---------- drawing: smooth renderer ----------
   The hedge bands are baked once per board into an offscreen canvas at screen resolution.
   Tufts are round fur balls that squish as they move; Pests are grumpy berries; bosses are big crowned berries. */
