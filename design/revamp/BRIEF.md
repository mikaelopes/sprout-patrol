# Revamp brief (shared by all review agents)

Owner: Mikael. Goal: revamp Sprout Patrol across code structure, gameplay & levels,
art & feel, and menus & onboarding, WITHOUT breaking the hard constraints in `CLAUDE.md`.
This phase produces proposals only. No changes to `src/` until Mikael approves.

## The game today (v115)

- Mobile browser arcade maze. You roll a fruit hero through a hedge maze, collect sprout
  bubbles (4 fruit colors) into a trail behind you, and deliver them to matching home portals.
  Pests wander/chase/shoot and break your trail; the shiny sprout pays extra.
- Adventure: 12 groves x 8 gardens (garden 6 is "hard", garden 8 is a boss). Stars 1-3 per
  garden; groves unlock by stars. Endless opens after 12-8. Daily garden (7-day ring),
  Challenges, Trail Road (cosmetics track), Nest (permanent upgrades bought with seeds),
  in-run level-up cards (skills: swift/trail/fur/frost; weapons: aura/orbit/puff; evolutions).
- Heroes: Tango (fast, no special), Mac (5 hearts tank, no move), Zip (Warp 9 s),
  Lichi (Puff dizzy 22 s), Luna (carries 7, Recall 22 s). Win rates kept within +-5 pts.
- Pests: Beetle/wander, hunter (chases), shooter, mushroom, sniper, grape (splits), plus
  bosses (Rhino/king variants) and night pests. Introduced at fixed gardens (PEST_INTRO).
- Onboarding: interactive tutorial (first play in ~3 s, 1 tap), coach marks, "journey" hints,
  FIRSTS "New!" strip, 16-question test quiz in Profile.
- Save: localStorage + IndexedDB backup, save code, opt-in cloud save.
- Size: ~2.6 MB, 2.2 MB of which is sprite art (WebP data URIs in `src/js/art.js`).

## Evidence and tools you can use

- Screenshots of every main screen at 390x844 (EN):
  `/tmp/claude-0/-home-claude/1641f6ba-28e9-5e78-9530-496442e47198/scratchpad/shots/*.png`
  (01 splash, 02 tutorial, 03 hub, 04 map, 05 chars, 06 nest, 07 challenges, 08 profile,
  09 road, 10 daily, 11-14 prelevel + play early/mid/late/boss). Look at them with Read.
- `node tests/smoke/tour.js OUTDIR [pt-BR]` re-takes them (set NODE_PATH=$(npm root -g)).
- Sim harness in `tests/sim/` (bot plays the real game). Prior results: counter table 140 cells
  0 failing; readability 15/15 OK; first play 1 tap ~3 s; hero parity 46.7-54.0 % win;
  casual season 6.2-6.8 h. A 5th fruit color was tested and rejected (harder in the bad way,
  blue/purple dE 4 for deuteranopes).
- Code map (`src/js/`): core, i18n (all PT/EN strings), content (heroes/skills/modes/challenges),
  save, state, maze (generation), balance (BAL, roster, intros), player, combat, skills-enemies,
  fx, audio, render-world, art, render-actors, render-frame, hud-cards, menu-core, daily-road,
  screens, onboarding, adventure, runmap, demo, input, loop. CSS in `src/css/game.css`.

## What every proposal file must contain

`design/revamp/<area>.md` with:
1. **Findings**: what is weak today, each with evidence (a screenshot name, a file:line, or a
   sim number). No vague taste claims.
2. **Proposals**: 3-7, ranked by player impact per effort. For each: what changes, why
   (which finding), size (S/M/L), risk to the hard constraints, and how we'd verify it
   (which test/sim/screenshot proves it worked).
3. **Recommended first slice**: the 1-3 proposals to build first, small enough for one pass.
4. **Open questions for Mikael**: only real decisions that are his (max 3).

Keep in-game text proposals short, and always give both EN and PT wording.
