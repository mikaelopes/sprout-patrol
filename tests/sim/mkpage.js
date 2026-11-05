// Builds the test page (the game plus src/test/hook.js, which provides window.__g / window.__t) and exits 1 if the build fails.
// Usage: node tests/sim/mkpage.js [out.html]   (default tests/sim/game_fast.html; game_*.html is gitignored)
const { spawnSync } = require('child_process'); const path = require('path');
const out = process.argv[2] || 'tests/sim/game_fast.html';
const r = spawnSync('python3', [path.join(__dirname, '..', '..', 'tools', 'build.py'), '--test', out], { stdio: 'inherit' });
if (r.status !== 0) { console.error('page ok false'); process.exit(1); }
console.log('page ok true');
