# Web platform reference (no engine)

- Runtime: evergreen mobile browsers. Lowest target: iOS Safari 16, Android Chrome 110.
- APIs in use: Canvas 2D, Web Audio (procedural, `src/js/audio.js`), Pointer/Touch events,
  localStorage + IndexedDB (backup), CSS `zoom` (menu scaling), dynamic `import()` (Firebase only).
- Not available / avoid: SharedArrayBuffer, Workers (single file), WebGL (not needed).
- Inside Claude the page runs in a sandboxed artifact frame: `window.claude` exists, outbound
  network is blocked except the declared capabilities (`db`, `user`).
