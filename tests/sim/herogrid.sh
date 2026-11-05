#!/bin/bash
cd "$(dirname "$0")/../.."
node tests/sim/heroes.js tests/sim/hg2_L1.jsonl 24 ember '{"ember":{"cd":14,"puffR":2,"puffS":2}}'
node tests/sim/heroes.js tests/sim/hg2_L2.jsonl 24 ember '{"ember":{"cd":16,"puffR":2,"puffS":3}}'
node tests/sim/heroes.js tests/sim/hg2_L3.jsonl 24 ember '{"ember":{"cd":12,"puffR":2,"puffS":2}}'
node tests/sim/heroes.js tests/sim/hg2_P1.jsonl 24 pip '{"pip":{"speed":3.05}}'
node tests/sim/heroes.js tests/sim/hg2_P2.jsonl 24 pip '{"pip":{"speed":3.2}}'
echo alldone
