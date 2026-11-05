#!/bin/bash
# Fast regression gate: build, load with no page errors, state transitions, counter table, save/sign-in flows.
# Long balance sims (tests/sim/tune.js, campaign.js, heroes.js) are run by hand when numbers change.
set -e
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
python3 tools/build.py --check
node tests/smoke/err.js dist/sprout-patrol.html
node tests/sim/mkpage.js >/dev/null
node tests/sim/mkpage.js tests/sim/game_states.html >/dev/null && node tests/sim/states.js > /tmp/sp_states.json && echo "states ok"
node tests/sim/mkpage.js tests/sim/game_counter.html >/dev/null && node tests/sim/counter.js tests/sim/game_counter.html /tmp/sp_counter.json | tail -2
node tests/smoke/cloudtest.js
node tests/smoke/fbtest.js
