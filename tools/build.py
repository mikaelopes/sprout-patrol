#!/usr/bin/env python3
"""Build Sprout Patrol from src/ into the two shipped files.

  dist/sprout-patrol.html  -> the Claude artifact (Claude's host adds the doctype/viewport skeleton itself)
  index.html               -> GitHub Pages (needs its own skeleton + mobile viewport, or phones render at 980px)

All scripts in src/build.json are concatenated, in order, inside ONE closure, so they share scope exactly as the
old single file did. Order matters: a file may only use top-level names at call time, never at load time, unless
the defining file comes earlier in the list.
Usage: python3 tools/build.py [--check] [--test OUT]
  --check     run node --check on the bundled script
  --test OUT  write ONLY a test build to OUT (src/test/hook.js appended inside the closure; gitignored path, e.g. tests/sim/game_*.html).
              dist/ and index.html are left alone, so the shipped files never contain the hook.
"""
import json, os, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = lambda *p: os.path.join(ROOT, 'src', *p)
cfg = json.load(open(S('build.json')))
TEST_OUT = sys.argv[sys.argv.index('--test') + 1] if '--test' in sys.argv else None
def bundle(extra=''):
    js = '(() => {\n' + ''.join(open(S('js', f)).read() for f in cfg['scripts']) + extra + '})();'
    return js, (open(S('head.html')).read() + '<style>\n' + open(S('css', 'game.css')).read() + '</style>\n'
                + open(S('body.html')).read() + '<script>\n' + js + '\n</script>\n' + cfg.get('tail', ''))
if TEST_OUT:
    # The hook only touches names at call time, so appending it after the last script is equivalent to inserting it before the boot lines.
    tjs, thtml = bundle('\n' + open(S('test', 'hook.js')).read() + '\n')
    with open(TEST_OUT, 'w') as f: f.write('<!doctype html><meta charset="utf-8">' + thtml)
    print('built test page', TEST_OUT); sys.exit(0)
js, html = bundle()
if '--check' in sys.argv:
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f: f.write(js)
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name)
    if r.returncode: sys.exit('syntax error:\n' + r.stderr[-2000:])
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'sprout-patrol.html'), 'w').write(html)
i = html.find('</style>') + len('</style>')
page = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#141a2e">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
        + html[:i] + '\n</head>\n<body>\n' + html[i:] + '\n</body>\n</html>\n')
open(os.path.join(ROOT, 'index.html'), 'w').write(page)
print('built dist/sprout-patrol.html and index.html (%d KB)' % (len(page) // 1024))
