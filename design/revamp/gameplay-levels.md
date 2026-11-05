# Revamp proposal: Gameplay & Levels

Area owner for this review: `game-designer`, with input from `level-designer` and `systems-designer`.
Scope: core loop, maze variety across the 12 groves, pest roster, bosses, difficulty curve, in-run cards,
stars/progression, economy pacing (Nest, seeds), Endless/Daily/Challenges.
Status: proposal only. Nothing under `src/` changed.

## How the evidence was gathered

- Code read: `balance.js`, `maze.js`, `combat.js`, `skills-enemies.js`, `content.js`, `hud-cards.js`,
  `adventure.js`, `runmap.js`, `daily-road.js`, `loop.js` (`fit`), `render-world.js` (themes).
- Spec table: a script evaluated `advSpec`/`advRoster`/`advFoes` for all 96 gardens straight from
  `balance.js` and `adventure.js` (no game changes). Script:
  `/tmp/claude-0/-home-claude/1641f6ba-28e9-5e78-9530-496442e47198/scratchpad/spec.js`.
- Bot sim: `tests/sim/tune.js` (copy in scratchpad, current `BAL`, gardens 2/4/6/8 of every grove).
  Run A: N=2, Run B: N=4. Combined that is 24 casual plays per grove (gardens 2/4/6/8).
  Raw results: `/tmp/claude-0/-home-claude/1641f6ba-28e9-5e78-9530-496442e47198/scratchpad/tune_res.json`
  and `tune_res4.json`.
  **Small samples**: per-grove numbers are about ±10-20 pts, so they show shape, not exact rates.
- Screenshots: `04-map`, `06-nest`, `07-challenges`, `03-hub`, `11-play-early`, `12-prelevel-mid`,
  `13-play-late`, `13-prelevel-late`, `14-play-boss`.

---

## 1. Findings

### F1. The trail map shows the wrong pests in 65 of 84 normal gardens
`mapPreview` uses `advFoes` (`adventure.js:220-229`), which works out the pests its own way
(mushroom from grove 6, sniper from 8, grape from **10**, and no `rosterAdd`).
The real board uses `advRoster` (`balance.js:52-63`, grape from **9**). Comparing the two for every
non-boss garden: **65/84 differ**. Example from `04-map`: Grove 6-1 shows 2 Clouds + 1 Beetle + 1 Aphid.
The real board is the *new* Grasshopper alone with 3 Aphids, so the preview hides the pest the garden is
meant to teach. The "New!" strip and the map preview disagree.

### F2. Hidden heart changes; the prelevel heart chip is wrong
`startAdventure` adds `BAL.ghp[...]` (-3 to +3) and `BAL.hard.hp` (-1) to hearts (`adventure.js:140-141`).
The prelevel shows only `advBonusHp` (`+bh`, `adventure.js:98`). Examples: 12-6 shows "+2" but plays at
**-2** net. 10-1 shows "+2" but plays at -1. 7-8 (boss) silently gets **+4**. Players can't know why a
garden "feels" harder, and the Nest ✓/✗ row can't help them plan.

### F3. The difficulty curve has a wall at groves 4-7, then gets easier
`maze.js:192` says "slow climb across groves", but the sims say otherwise. Casual bot win % by grove
(runs A+B, 24 plays each, Nest at the grove's goal):

| Grove | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| casual | 92 | 79 | 58 | **33** | **42** | 50 | **42** | 71 | 63 | 71 | 67 | 50 |
| novice | 58 | 50 | 8 | 17 | 8 | 25 | 8 | 33 | 25 | 33 | 17 | 17 |

Run B band totals (normal gardens only): normal-b 63 % (target 55-75 ✓), normal-c **72 %**
(target 45-65 ✗). So the late groves are *easier* than intended, while groves 4-7 are the hardest stretch
of the season. Why grove 4 is a wall (spec table): speed hits `speedCap` 3.25 in 7 of 8 gardens
(grove 3 runs at 2.4-3.0). Band b adds +1 pest and +1 special. A 4th color arrives. `ghp` takes
-1/-1/-2 hearts in 4-2, 4-3 and 4-5. Par time starts at 4-3. That is five pressures in one grove.
After that, **38 of 96 gardens sit at the speed cap**, so pest speed can't carry the late climb.

### F4. Spikes at the first boss and the hard gardens
- **Boss maps are always near max size.** `BAL.boss.ne` +5 makes the map size grow
  (`maze.js:58-60`). Gardens 1-1 to 1-7 are 11x15 or 11x17 with 1-2 pests. The **first boss, 1-8, is 17x25
  with 6 pests at 2.93 tiles/s**.
- The **first hard garden (3-6)** jumps from 11x17 with 2 pests to **19x25 with 7 pests at the speed cap,
  12 sprouts and -2 hearts**. Casual bot on hard gardens 3-6 / 4-6 / 5-6: **1/6, 1/6, 0/6**. The novice bot won
  **3 of 36 bosses** (runs A+B).
- Hard gardens play longer than target: 1.83 min (target 0.9-1.65, Run B).

### F5. Late groves are 16 copies of the same garden
Spec table: every normal garden in groves 11-12 is 7 pests, 18 sprouts, 19x25, speed 3.25. The roster in
each is the full soup (Cloud + Beetle + Grasshopper + Hail Cloud + Ant Hill + 1-2 extras). `advFirsts`
(`balance.js:66-74`) has **nothing for groves 10, 11, 12**, so the last 24 gardens have no "New!"
moment. Share of hits in groves 10-12 (runs A+B): Grasshopper 31 %, Beetle 24 %, Hail Cloud 13 %, and every
other pest 10 % or less. One pest dominates, and the soup makes it hard to tell which pest hit you.

### F6. Every maze is the same maze, at a size the phone can't show
- One generator for all 96 gardens. It's a recursive backtracker with dead-end removal and random loops
  (`maze.js:2-36`). Only the size changes, and the size is set by the pest count. No open areas, no
  hand-shaped spaces, no grove-specific layout rules.
- Six themes (`render-world.js:10-17`) repeat for 12 groves: 7-12 reuse 1-6.
- Size vs screen: 34 of 96 gardens are 19 columns wide. `fit()` (`loop.js:4-8`) keeps cell ≥ 80 % of
  the 11-column size, so wide boards **pan sideways**. `13-play-late` and `14-play-boss` show clipped
  left hedges, a pest cut off at the edge and 4 off-screen arrows. Meanwhile the bottom ~25 % of the
  play screen is empty in every play shot (`11`, `12`, `13`, `14`).

### F7. The build-craft layer is locked behind ~6.5 hours
Cards, weapons, evolutions, wild cards, the run map and the Book all live in Endless only. XP is only
earned when `run.kind === 'endless'` (`combat.js:84-87`). Endless opens at `12-8`
(`screens.js:2`). Prior campaign sims put a casual Season 1 at 6.2-6.8 h. `design/game-brief.md` lists
"in-run cards" as MVP, and its core loop says delivering earns "level-up cards". In the main mode,
delivering earns none. So the game's most
choice-rich system (autonomy) is unseen by almost everyone. Adventure has one decision outside movement:
the 15-seed Spare Bubble.

### F8. Nest "Quick Feet" is a step nobody can feel
`BAL.nestSpeed` = 0.035 tiles/s per level (`balance.js:24`), about 1 %. `06-nest` shows
"3.45 → 3.49" for **200 seeds**. Ten levels cost 5,190 seeds for +0.35 tiles/s. One in-run Speed Up card
gives +0.4. The Nest overall matters a lot: casual vs Nest-0 bot is **+32 pts** win (Run B), and Nest-0 wins 4 % of bosses and 0 % of hard
gardens. But that comes from hearts, trail space and guards, not speed.

### F9. Daily and Challenges use units the player never sees
- The Daily picks **groves 2-6, gardens 1-4** for everyone (`daily-road.js:16`). That is the hardest band
  in F3. A grove-1 player can get a Grasshopper board ("Leap Day" in `03-hub`) before meeting that pest.
  Late players get an easy board.
- Challenges say "Reach grove 2 (garden 5)" (`07-challenges`). That counts in old Endless units
  (`advReach`, `content.js:65`). On the 8-garden trail map, "garden 5" of grove 2 is a different place.
- Leftovers from the 5-garden grove design: the next grove unlocks after **garden 5** of the last one
  (`adventure.js:50`), so 6, 7 and the boss are optional. Hero pay skips `i === 5` (`adventure.js:190`).
  The `BAL.gm` comment says "index (grove-1)*5" while the code uses `*8`.

---

## 2. Proposals (ranked by player impact per effort)

### P1. "What you see is what you play" (size S)
**What changes**
- `mapPreview` counts pests from `advRoster(G, i, ne, shooters + hunters)` instead of its own copy.
  Delete `advFoes`'s separate tables. One source of truth.
- The prelevel heart chip shows the **net** heart change: `advBonusHp + ghp + hard.hp`. It reads "+2",
  "−1" and so on, and is coloured coral when negative.
- Challenge text drops the hidden unit. EN "Reach grove 2." / PT "Chegue ao bosque 2."
  (same for groves 3 and 4). Progress counts groves reached on the trail map (`advTop()`), not `advReach`.
**Why**: F1, F2, F9. Players plan with this information, and right now it is wrong most of the time.
**Risk to hard constraints**: none. Saves untouched, since `advReach` stays for old Endless data. Text gets
shorter in both languages.
**Verify**: add a state test in `tests/run.sh` asserting preview counts = roster counts for all 84
non-boss gardens (today 65 fail). Retake `04-map` and confirm Grove 6-1 shows the Grasshopper. Unit-check
the 12-6 chip shows −2.

### P2. Turn the grove 4-7 wall into a sawtooth climb (size M)
**What changes** (all in `BAL`/`advSpec`, then re-run the autotuner)
1. Spread grove 4's five changes: par time from 5-1 (not 4-3). Band b's `neAdd` +1 from grove 5. The 4th
   color stays at 4-1, since that is the grove's "New!".
2. Lower `speedCap` pressure: cap 3.0 for groves ≤ 6, 3.25 after. Groves 7-12 then climb through
   count, roster and map shape (P3, P4), not just speed.
3. **Boss map size follows the grove**: boss board = the grove's garden-7 size + one step. The extra
   boss guards count toward pests but not toward map size. 1-8 becomes about 13x19 with 3-4 guards, not 17x25 with 6.
4. **First hard garden is a teaser**: `hard.ne` = +2 at grove 3, +3 from grove 5. `hard.hp` = 0 at grove 3.
5. Bound per-garden noise: `gm` clamped to 0.8-1.25. Today it runs 0.55-1.57, which flips the
   within-grove sawtooth: 1-1 runs at 2.73 tiles/s, faster than 1-6. `ghp` clamped to −1..+1. All of it
   shown via P1.
6. Fix the target bands so the curve can only go up: normal-a 85-95, normal-b 60-75, normal-c 50-65,
   and **each grove's casual win ≤ the grove before + 5**.
**Why**: F3, F4. A sawtooth keeps players in flow. A wall at groves 4-7 followed by easier groves 8-11 is the
reverse of that: likely quits at 4-7, and a flat finish.
**Risk**: hero parity (±5 pts). The tuning changes affect all heroes, but Mac's extra hearts weigh
more when hearts are scarce, so parity must be re-run. No save impact: stars already earned stay.
**Verify**: `tests/sim/autotune.js` against the new bands, then `tune.js full` N=8. Pass if every band ✓
and per-grove casual win never rises > 5 pts. `heroes.js` 46-54 %. `campaign.js casual` 6-7 h.
`readab.js` 15/15.

### P3. Pest squads and grove signatures for groves 9-12 (size M)
**What changes**
- `advRoster`: a normal garden uses at most **2 special types** (hard and boss: 3). Pairs rotate through a
  fixed list per grove. Examples: Beetle + Cloud (chase plus lane), Grasshopper + Hail Cloud (two ring
  telegraphs), Ant Hill + Beetle. Extra slots repeat the pair or use Aphids. Every garden then has a
  readable identity.
- Groves 10, 11, 12 each get one **signature**, reusing the Daily twist code already in `maze.js:52`:
  - G10 "Bounty" (+6 sprouts, less speed)
  - G11 "Leap Day" (Grasshopper squads)
  - G12 "Rush" (+15 % pests, shorter maps)
  Each shows on the "New!" strip at x-1 (`advFirsts` + `FIRSTS`):
  - G10 EN "Bounty: More sprouts, slower pests." / PT "Fartura: Mais brotinhos, pragas mais lentas."
  - G11 EN "Leap groves: Grasshoppers in pairs." / PT "Bosque dos saltos: Gafanhotos em dupla."
  - G12 EN "Rush: Faster pests, smaller mazes." / PT "Correria: Pragas mais rápidas, labirintos menores."
**Why**: F5. It brings back the "something new" beat for the last 24 gardens with no new art. It also
cuts the number of rules on screen at once, which helps the readability constraint.
**Risk**: balance retune needed (P2's pipeline). The counter table (`tests/sim/counter.js`, 140 cells)
must still pass. No new colors, telegraphs or art.
**Verify**: spec table shows ≤ 2 special types per normal garden. `counter.js` 0 failing. Hit-log share of
the top pest in groves 10-12 < 25 % (today Grasshopper 31 %). `tune.js` per P2.

### P4. Portrait-first maze shapes with a layout recipe per grove (size M)
**What changes**
- Map size: `COLS` max **15**. The extra area goes to `ROWS` (max 31). The camera then only scrolls
  vertically, which phones handle well and which uses the empty bottom of the screen.
- `genMaze(recipe)` takes 3-4 seeded knobs per grove:
  - loop density
  - open "plazas" (a 3x3 clear room, 0-2 per map)
  - corridor straightness (bias toward the last direction)
  - mirror symmetry (left/right)
  Example recipes:
  - G1 tight and twisty
  - G3 reeds = long straight lanes (good for Cloud lessons)
  - G5 spores = plazas (Grasshopper leaps)
  - G9 mirrored
  - and so on
  The same seed gives the same board, so each Adventure garden stays fixed.
**Why**: F6. Groves differ by look only today. Layout is the level designer's main tool, and it costs no art.
**Risk**: map area changes difficulty, so a P2 retune is needed. Shorter rows also touch `pickDen` and
`rainbowSpot` (both use `freeTiles`, so they're fine). Readability gets better because cells get bigger.
**Verify**: `tests/smoke/tour.js` retake of 13/14: no clipped columns, 0 off-screen arrows at start.
`readab.js` 15/15. A spec script prints recipe stats (dead ends, loops, plaza count) per grove so
groves visibly differ. `tune.js` per P2.

### P5. Open Endless earlier (size S), then consider Adventure perks (size M)
**What changes (S)**: `endlessOpen()` = `4-8` cleared, not `12-8`. Hub copy for the button stays the
same. The Nest **gates** (`NEST[].gate`, `balance.js:25-31`) already cap upgrade levels by grove reached,
so extra Endless seeds can't push a player above the Adventure balance goal. They only help players who
are behind, which is good.
**Optional follow-up (M)**: before hard (x-6) and boss (x-8) gardens, offer **1 of 3 run-only perks**
drawn from `SKILLS` (one level). EN "Pick a perk for this garden" / PT "Escolha um bônus para este jardim".
**Why**: F7. It puts the game's richest choice system in front of players while they are still playing.
**Risk**: the S part has no constraint risk. The perk part touches hero parity, since Speed Up favours
Tango, so `heroes.js` must stay within ±5 pts. Endless Challenges (`evo1`, `onegrove`) appear earlier, which is intended.
**Verify**: the FTUE path is unchanged (`ftue.js` 1 tap ~3 s). `campaign.js casual` with an Endless run
every 2 groves: season time doesn't drop more than 10 %, and the "behind" Nest count goes down.

### P6. Make Quick Feet a step you can feel (size S)
**What changes**: Quick Feet goes to **5 levels of +0.07** (same +0.35 total). Costs are the sums of today's
level pairs: 440 / 635 / 915 / 1310 / 1890. Gates are every other one of today's gates. Old saves map
level L to ceil(L/2), with the overspend refunded as seeds, in `applySave`.
The card shows the total too: EN "Roll faster: 3.45 → 3.52 (+2%)" / PT "Role mais rápido: 3,45 → 3,52 (+2%)".
**Why**: F8. Same power curve, but each purchase feels like something.
**Risk**: save migration must be tested, because the save key and old saves must load. Hero parity is
unchanged because total speed is unchanged at each Nest goal.
**Verify**: `tests/run.sh` save-flow tests with an old save at speed 3 and speed 10. `campaign.js` buy log
shows the same grove-by-grove speed. Retake `06-nest`.

### P7. A Daily that matches the player (size S)
**What changes**: keep one seed and one twist per day for everyone. The grove comes from the player's
progress: `g = clamp(advTop() − 1, 1, 12)`, garden 2-5 from the seed. Pest twists (`mush`, `grapes`)
fall back to `bounty` if the player hasn't met that pest (`PEST_INTRO`).
**Why**: F9. The Daily is the return-tomorrow loop. Today it is too hard for new players and trivial
for late ones.
**Risk**: the same board for everyone is lost. The same twist is kept. See open question 3.
**Verify**: unit test that `dailySpec` for a grove-1 save never returns `mush`/`grapes` or g > 1.
Sim casual win on Daily for saves at groves 1, 6 and 12 within 60-85 %.

---

## 3. Recommended first slice

1. **P1 "What you see is what you play"**: pure correctness, S, with a test that locks it.
2. **P2 items 3 and 4 only** (boss maps follow the grove, first hard garden as a teaser) plus a P2-pipeline
   retune of just those gardens (`tunehard.js` / `tunegarden.js` exist for this). These are the two
   sharpest spikes, and a new player hits both in the first ~40 minutes.
3. **P6 Quick Feet** in 5 felt steps (S), including the save migration test.

Run in one pass: `tests/run.sh`, `tune.js full` N=8, `heroes.js`, `readab.js`, then retake shots 04, 06, 14.
Leave P2 items 1/2/5/6, P3 and P4 for a second pass. They share one big retune, and the retune should
happen once, after P4's new map shapes exist.

---

## 4. Open questions for Mikael

1. **When should Endless open?** After grove 4's boss (my pick, P5), or does it stay a post-Season-1
   reward?
2. **Should bosses gate the next grove?** Today clearing garden 5 opens the next grove, so the hard
   garden and the boss are optional (`adventure.js:50`). Keep it as a deliberate "never stuck" valve,
   or require garden 7 (boss still optional) or the boss?
3. **Daily: same board for everyone, or a board that matches your progress?** P7 keeps the shared day
   and twist but scales the board, so scores are no longer comparable between players.
