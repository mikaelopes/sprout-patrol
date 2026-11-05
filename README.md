# Sprout Patrol

A little maze game for phones: steer your fruit hero, pick up sprouts, bring them home before pests break your trail.

**Play:** https://mikaelopes.github.io/sprout-patrol/

## Working on it

```bash
python3 tools/build.py --check   # src/ -> dist/sprout-patrol.html (Claude) + index.html (GitHub Pages)
bash tests/run.sh                # build, load, state, counter-table and save-flow tests (needs Playwright)
python3 -m http.server 8765      # play locally at http://localhost:8765/
```

Code lives in `src/` (see `src/build.json` for the file order). `index.html` and `dist/` are build outputs.

This repo uses [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT, see `LICENSE-CCGS`)
for its agents, skills and workflow. Project rules are in `CLAUDE.md`.
