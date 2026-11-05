// Test switches. Always {} in the shipped build; src/test/hook.js (build.py --test) fills it for the Playwright gate.
const TEST = {};
const PER_GROVE = 4;
let COLS = 11, ROWS = 15, START = { x: 5, y: 7 };
const COLORS = [
  { fill: '#6fe08a', dark: '#2c7d45' },
  { fill: '#5cc6ff', dark: '#246aa3' },
  { fill: '#b993ff', dark: '#6643b3' },
  { fill: '#ff7a9a', dark: '#ad3656' },
  { fill: '#fff1a8', dark: '#b8860b' },   // 4: Golden Tuft (boss gardens only)
];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const FOUR = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/* ---------- icons ---------- */
const SEED = '<svg viewBox="0 0 20 20"><path d="M10 2c4 3 6 6 6 9a6 6 0 0 1-12 0c0-3 2-6 6-9z" fill="#ffcd4a" stroke="#8a5d08" stroke-width="1.4"/><path d="M8 9c0 2 .5 4 2 5" stroke="#fff3c4" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
const I = {
  speed: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  stack: '<circle cx="5" cy="12" r="3.2"/><circle cx="12" cy="12" r="3.2"/><circle cx="19" cy="12" r="3.2"/>',
  heart: '<path d="M12 21s-9-5.6-9-11.6A5.2 5.2 0 0 1 12 6.2a5.2 5.2 0 0 1 9 3.2C21 15.4 12 21 12 21z"/>',
  frost: '<path d="M11 2h2v20h-2zM2 11h20v2H2zM4.2 5.6l1.4-1.4 14.2 14.2-1.4 1.4zM18.4 4.2l1.4 1.4L5.6 19.8l-1.4-1.4z"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
  sticky: '<path d="M7 7h5v3H7a2 2 0 0 0 0 4h5v3H7a5 5 0 0 1 0-10zm5 0h5a5 5 0 0 1 0 10h-5v-3h5a2 2 0 0 0 0-4h-5z"/>',
  magnet: '<path d="M4 3h5v8a3 3 0 0 0 6 0V3h5v8a8 8 0 0 1-16 0zM4 3h5v3H4zM15 3h5v3h-5z"/>',
  home: '<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>',
  ghost: '<path d="M12 2a7 7 0 0 1 7 7v12l-2.3-1.7L14.3 21 12 19.3 9.7 21l-2.4-1.7L5 21V9a7 7 0 0 1 7-7zm-2.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
  seed: '<path d="M12 2c5 4 7 8 7 11a7 7 0 0 1-14 0c0-3 2-7 7-11z"/>',
  star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/>',
  snack: '<path d="M6 3h12l-1 5H7zM5 9h14l-1.5 12h-11z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  user: '<circle cx="12" cy="8" r="4.5"/><path d="M3 21c1-5 4.5-7.5 9-7.5s8 2.5 9 7.5z"/>',
  trophy: '<path d="M6 3h12v3h3c0 4-2 6-5 6.5A5 5 0 0 1 13 15v3h4v3H7v-3h4v-3a5 5 0 0 1-3-2.5C5 12 3 10 3 6h3zm-1 5c.3 1.5 1 2.6 2 3.1V8zm14 0h-2v3.1c1-.5 1.7-1.6 2-3.1z"/>',
  nest: '<path d="M2 12c2 5 6 8 10 8s8-3 10-8zM7 11a5 5 0 0 1 10 0z"/>',
  tent: '<path d="M12 3l10 18H2zm0 7l-4 9h8z"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  calendar: '<path d="M7 2h2v2h6V2h2v2h3v17H4V4h3zm-1 7v10h12V9zm2 2h3v3H8z"/>',
  road: '<path d="M5 2h2v20H5zM8 3h11l-2.5 4L19 11H8z"/>',
  tuft: '<path d="M12 2l1.8 3 3.2-1.6.4 3.6 3.6.4-1.6 3.2 3 1.8-3 1.8 1.6 3.2-3.6.4-.4 3.6-3.2-1.6L12 22l-1.8-3-3.2 1.6-.4-3.6-3.6-.4 1.6-3.2-3-1.8 3-1.8-1.6-3.2 3.6-.4.4-3.6 3.2 1.6z"/>',
  grumble: '<path fill-rule="evenodd" d="M12 6.5a8 8 0 1 1 0 16a8 8 0 1 1 0-16z M7.6 13.6a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0z M13 13.6a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0z"/><path d="M12 7.5c-1.5-2-1.5-4.5 0-6 1.5 1.5 1.5 4 0 6zM11 7.5C9 6.8 7.2 5.2 7 3.2c2.2.2 3.8 2 4 4.3zM13 7.5c2-.7 3.8-2.3 4-4.3-2.2.2-3.8 2-4 4.3z"/>',
  hit: '<path fill-rule="evenodd" d="M12 21s-9-5.6-9-11.6A5.2 5.2 0 0 1 12 6.2a5.2 5.2 0 0 1 9 3.2C21 15.4 12 21 12 21zm-.4-14l-1.8 4.4 2.6 1.4-1.8 4.8 3.6-6-2.6-1.4 1.2-3.2z"/>',
  key: '<path fill-rule="evenodd" d="M7 5.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z M7 9.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2z M13.5 10.2h10v3.6h-10z M17 13.8h2.8v4.4H17z M20.7 13.8h2.8v3.2h-2.8z"/>',
  orbit: '<circle cx="12" cy="12" r="3.5"/><path fill-rule="evenodd" d="M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zm0 2.2a6.8 6.8 0 1 0 0 13.6a6.8 6.8 0 1 0 0-13.6z"/><circle cx="20" cy="8" r="2.8"/>',
  burst: '<circle cx="12" cy="12" r="3.2"/><path d="M11 1h2v6h-2zM11 17h2v6h-2zM1 11h6v2H1zM17 11h6v2h-6zM4.2 5.6l1.4-1.4 4.2 4.2-1.4 1.4zM14.2 15.6l1.4-1.4 4.2 4.2-1.4 1.4zM18.4 4.2l1.4 1.4-4.2 4.2-1.4-1.4zM8.4 14.2l1.4 1.4-4.2 4.2-1.4-1.4z"/>',
  mine: '<circle cx="12" cy="14" r="6.5"/><path d="M11 2h2v5h-2zM4.6 6.4l1.4-1.4 2.6 2.6-1.4 1.4zM18 5l1.4 1.4-2.6 2.6-1.4-1.4z"/>',
  clock: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20zm0 3a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM11 7h2v5.4l3.3 2-1 1.7L11 13.6z"/>',
  expand: '<path d="M3 3h7v2.5H7.3l3.5 3.5-1.8 1.8-3.5-3.5V10H3zM21 21h-7v-2.5h2.7l-3.5-3.5 1.8-1.8 3.5 3.5V14H21zM21 3v7h-2.5V7.3L15 10.8 13.2 9l3.5-3.5H14V3zM3 21v-7h2.5v2.7L9 13.2l1.8 1.8-3.5 3.5H10V21z"/>',
  lock: '<path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm3 0h4V7a2 2 0 0 0-4 0z"/>',
  pin: '<path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
};
// Painted icons (Scenario sticker sheets) sit inside the same <svg> box, so every size rule still applies; dim fills mean locked or not earned.
const ICON_DIM = { '#6b7299': 1, '#4a4f70': 1, '#3a3f60': 1 };
const artGet = k => { try { return ART[k]; } catch (e) { return null; } };
const artIcon = k => { try { return ART['ic-' + k]; } catch (e) { return null; } }; // ART is defined further down the file
const svg = (k, fill) => artIcon(k)
  ? `<svg viewBox="0 0 24 24"${ICON_DIM[fill] ? ' style="filter:grayscale(1) brightness(.75);opacity:.6"' : ''}><image href="${artIcon(k)}" x="-1" y="-1" width="26" height="26"/></svg>`
  : `<svg viewBox="0 0 24 24" fill="${fill}">${I[k]}</svg>`;

