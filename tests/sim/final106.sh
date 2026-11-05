#!/bin/bash
cd "$(dirname "$0")/../.."
node tests/sim/mkpage.js && node tests/sim/mkpage.js tests/sim/game_econ.html && node tests/sim/mkpage.js tests/sim/game_counter.html
node tests/sim/counter.js tests/sim/game_counter.html tests/sim/counter_v106.json > tests/sim/counter_v106.log 2>&1
node tests/sim/schedule.js > tests/sim/schedule_v106.log 2>&1
node tests/sim/tune.js '{}' 8 full > tests/sim/bands_v106_final.log 2>&1
node tests/sim/heroes.js tests/sim/heroes_final.jsonl 24 > tests/sim/heroes_final.log 2>&1
node tests/sim/campaign.js casual 1 tests/sim/c106_casual.json > tests/sim/c106_casual.log 2>&1
echo alldone > tests/sim/final106.done
