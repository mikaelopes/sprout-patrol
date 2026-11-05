#!/bin/bash
# Fast regression gate (about 35 s locally). Exits non-zero on the first failure:
# build, boot with no page errors, no network before opt-in, state tests, counter table, golden saves, sign-in flows.
# Long balance sims (tests/sim/tune.js, campaign.js, heroes.js) are run by hand when numbers change.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -d node_modules/playwright ]; then export NODE_PATH="$PWD/node_modules"; else export NODE_PATH="${NODE_PATH:-$(npm root -g)}"; fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
python3 tools/build.py --check
node tests/smoke/err.js dist/sprout-patrol.html
node tests/smoke/netcheck.js
node tests/sim/mkpage.js tests/sim/game_states.html
node tests/sim/states.js
node tests/sim/mkpage.js tests/sim/game_counter.html
node tests/sim/counter.js tests/sim/game_counter.html "$TMP/counter.json" | tail -2
node tests/smoke/saves.js
node tests/smoke/cloudtest.js
node tests/smoke/fbtest.js
echo "GATE GREEN"
