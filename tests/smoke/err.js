// Boot check: the page loads and idles for 800 ms with no page error and no console error. Exit 1 otherwise.
// Google Fonts is the one explicit exception (technical-preferences.md): those requests are answered with an empty file so the run stays offline.
// Usage: node tests/smoke/err.js <page.html>
const { chromium } = require('playwright'); const fs = require('fs');
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = [];
  await ctx.route(u => FONT_HOSTS.includes(u.hostname), r => r.fulfill({ status: 200, contentType: r.request().resourceType() === 'stylesheet' ? 'text/css' : 'font/woff2', body: '' }));
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.setContent(fs.readFileSync(process.argv[2], 'utf8')); await p.waitForTimeout(800); await b.close();
  console.log(process.argv[2], errs.length ? errs.slice(0, 5) : 'no page errors');
  process.exit(errs.length ? 1 : 0);
})();
