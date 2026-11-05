#!/bin/bash
cd "$(dirname "$0")/../.."
node tests/sim/mkpage.js && node tests/sim/mkpage.js tests/sim/game_states.html && node tests/sim/mkpage.js tests/sim/game_counter.html
node tests/sim/counter.js tests/sim/game_counter.html tests/sim/counter_v107.json > tests/sim/counter_v107.log 2>&1
node tests/sim/states.js > tests/sim/states_v107.log 2>&1
node once.js > tests/sim/once_v107.log 2>&1; node wakeline.js > tests/sim/wake_v107.log 2>&1
node tests/sim/tune.js '{}' 8 full > tests/sim/bands_v107.log 2>&1
node tests/sim/heroes.js tests/sim/heroes_v107.jsonl 24 > tests/sim/heroes_v107.log 2>&1
echo done > tests/sim/final107.done
