# Revamp: Code Structure

Reviewer: `lead-programmer`, with input from `technical-director` (constraints, CI, risk) and
`performance-analyst` (load time, frame budget). Base: v115 after the mechanical split (`02eeb84`),
HEAD `551aeeb`. Proposals only. Nothing in `src/`, `tools/` or `tests/` was changed.

## How the evidence was gathered

- `bash tests/run.sh` (NODE_PATH set): **35.3 s, exit 0**. Output: build 2619 KB, `states ok`,
  `140 cells, 0 failing`, cloud and Firebase flows as listed in the brief.
- Each `src/js/*.js` file was parsed with the TypeScript compiler API (art.js left out). The script listed
  top-level names, cross-file reads and writes, function sizes, numeric literals, and i18n patterns. All
  numbers below come from that pass. The scripts are throwaway and live in the session scratchpad.
- Size: `index.html` uncompressed and gzip -9. `art.js` was parsed as JSON (185 keys, by family).
- Frames and load: Playwright Chromium at 390x844, dpr 3 and dpr 1, CPU throttle 1x and 4x
  (CDP `setCPUThrottlingRate`). Load used the shipped `index.html`. Frame cost came from calling
  `__g.step(now)` with drawing on (`__fast = 0`) for 240-360 frames in gardens 2-3, 9-6 and 5-8 (boss).
  One CPU profile was taken over 100 frames.
- GitHub: `gh api .../actions/workflows` and `ls .github`.

## 1. Findings

### Tests and CI

**C1. The fast gate can't fail on a gameplay regression.** Only two things make `tests/run.sh` exit
non-zero: a syntax error from `build.py --check`, or a Node crash.
- `tests/smoke/err.js:3` prints page errors and exits 0. Today it prints 4 `ERR_TUNNEL_CONNECTION_FAILED`
  lines (the Google Font request), and the gate stays green.
- `tests/sim/states.js` writes JSON to `/tmp/sp_states.json`. `run.sh:9` then echoes `states ok`
  whatever the JSON says. Nothing compares S1-S7 to expected values.
- `tests/sim/counter.js` (last 3 lines) prints `N failing` and still exits 0.
- `cloudtest.js` and `fbtest.js` print state lines and never assert.

So "140 cells, 0 failing" is true only because a human reads it.

**C2. There is no CI.** No `.github/` directory exists in the repo or in its history. The only workflow on
GitHub is the automatic `pages-build-deployment`, which publishes `main` root as-is. Nothing runs
`tests/run.sh` on push. Nothing checks that the committed `index.html` matches `src/` (today it does:
`git status` is clean after a rebuild).

**C3. Test hooks are string patches on the built file.**
- `tests/sim/mkpage.js:2-5` adds `window.__g` with `s.replace(...)` on exact source text:
  `'  updateFx(dt);\n  draw();'`, `'function frame(now) {\n  requestAnimationFrame(frame);'`,
  the first line of `advResult`, and `'showSplash();\nrequestAnimationFrame(frame);'`.
- `tests/smoke/cloudtest.js` patches the same anchor again with a second hook, `window.__t`.
- If a refactor reformats any of those lines, the replace does nothing and no error is raised.
  `mkpage.js` prints `page ok false`, but `run.sh` sends it to `/dev/null`.
- Every structural proposal below changes those exact lines.
- Each run also writes three 2.6 MB copies (`tests/sim/game_*.html`). They are untracked but not
  gitignored.

### Save and migration

**C4. Save migrations have no fixtures or tests.**
- `applySave` (`save.js:47-59`), `migrateCuts` (v98, `save.js:17`) and `migrateNest2` (v105, `save.js:35`,
  which also remaps boss slot 5 to 8) are covered by no test. `grep cutsV|migrate tests/` matches only the
  generated html copies.
- The hard constraint "old saves must always load" depends on reading the code by hand.
- `meta.savedRun` (`adventure.js:4`) is a deep copy of the whole `run`, `sk`, `wp` and `evo` objects under
  `v: 1`. Renaming any `run.*` field, which every structural proposal will do, can break "Continue run"
  for a player who quit mid-run. Nothing detects that.
- Gameplay P6 (Quick Feet) also needs a migration and points to this gap.

**C4b. The GitHub Pages build downloads the Firebase SDK at boot, before the player opts in.** This
breaks the hard constraint ("no network calls until the player taps Connect / Sign in with Google";
`game-brief.md:27`; forbidden patterns in `technical-preferences.md`).
- The chain: `loop.js:71` runs `setTimeout(cloudProbe, 0)`, then `cloudProbe` (`onboarding.js:359`)
  calls `fbLoad()` whenever the host is Firebase. The `fbLoad()` code comment (`save.js:142`) gives the
  reason: "loaded once at boot so the sign-in popup opens straight from the tap".
- Measured: a Playwright request log of `index.html` at boot shows `firebase-app.js`, `firebase-auth.js`
  and `firebase-firestore.js` fetched from gstatic, next to the allowed font stylesheet.
- No test checks boot-time requests, and `fbtest.js` mocks `__fbMock`, so it can't catch this.

### Global state and coupling

**C5. Game state is 80 mutable top-level `let`s, shared across a single closure.**
- There are 585 top-level names and 80 of them are `let`.
- 65 of those lets are written outside the file that declares them, and 44 are written from more than
  one file.
- `mode` (26 values) is assigned in 9 files, 31 times (e.g. `screens.js` 10, `adventure.js` 8).
- `enemies`, `shots`, `freezeT` and `invuln` are each written from 4-5 files.
- `onboarding.js` reads from 18 of the other 24 files, and `loop.js` and `adventure.js` from 17-18.
- One example: `onboarding.js` rebuilds the board by writing `grid`, `portals`, `bubbles`, `player`,
  `trail`, `COLS`, `ROWS` and `START` directly. A tutorial change can therefore break a normal garden.
- Load order is a live hazard. `core.js:50-51` wraps `ART[k]` in `try/catch` because `ART` is defined
  13 files later.

**C6. Simulation and presentation are mixed.**
- `combat.js` has no DOM access but makes 16 `sfx()` calls and 13 HUD, banner or float calls inline.
  `skills-enemies.js` makes 19 `sfx()` calls and 13 `ctx.` draws, and `player.js` makes 11 `ctx.` draws.
- Drawing helpers sit inside gameplay files: `drawShinyFx` (`player.js:105`), and `drawBeamFx` and
  `drawSpriteFx` (`skills-enemies.js:4-19`).
- So a feel change (sound, particle, banner) means editing the rules code, and the sim harness has to run
  the presentation side effects too.
- Randomness is half seeded. `maze.js:42` seeds `rng` per garden, but `maze.js` (3 calls),
  `skills-enemies.js` (5) and `combat.js` (2) still call `Math.random()`. The tests get repeatable runs only
  because `seedRandom` overwrites `Math.random` itself (`mkpage.js` hook).

**C7. The mechanical split left names that don't match their contents, and some very large functions.**
- `demo.js` is 1 line of `demoBoard()` plus the 138-line global click dispatcher for all 64 `data-act`
  menu actions.
- `draw()` (`render-frame.js:1`) is one 188-line, 14.7 KB function.
- `newGarden` (`maze.js:40`) is 127 lines, `updateEnemies` (`skills-enemies.js:317`) 104, and `deliver`
  (`combat.js:1`) 90.
- 11 top-level functions are over the studio's 40-line limit, 20 are over 3,000 characters, and 66 source
  lines are over 300 characters (the longest is 762, `balance.js:18`).

### Data and i18n

**C8. Tuning is only partly data, and derived specs are computed twice.**
- `BAL` (`balance.js:8-27`) is a good start: bands, per-grove speed tables, economy.
- Hard-coded numeric literals outside data tables, not counting 0, 1, 2 and 0.5 (counts by file):

  | File | Literals in code |
  |---|---:|
  | `skills-enemies.js` | 177 |
  | `combat.js` | 88 |
  | `maze.js` | 81 |
  | `adventure.js` | 59 |
  | `daily-road.js` | 253 (many are drawing coordinates) |

- Examples of those literals:
  - Boss speeds by variant, written as a ternary chain (`maze.js:146`).
  - The Endless speed curve `1.55 + g*0.075`, capped at 3.6 (`maze.js:130`).
  - `FROST_COOLDOWN`, `SHINY_T` (`player.js:98-99`), `TELL` (`skills-enemies.js:297`) and `BOSS_DAZE`
    (`combat.js:276`).
  - Hero stats mixed into display data in `CHARS` (`content.js:2`).
- The cost is already visible in the other reviews:
  - Gameplay **F1**: the map preview's `advFoes` (`adventure.js:220`) and the real `advRoster`
    (`balance.js:51`) disagree in 65 of 84 gardens.
  - Gameplay **F2**: the hearts shown on the prelevel screen and the hearts actually played differ.
  - Both come from the same rules being written twice.

**C9. Strings go through four different paths.**
- `S` / `t()` in `i18n.js`: 215 keys, EN and PT match exactly.
- 217 inline `{en, pt}` objects read through `L()`, mostly content data: `content.js` 92, `screens.js` 68,
  `daily-road.js` 34.
- 46 `LANG === 'pt' ? '...' : '...'` ternaries in 10 files, including `loop.js:27` ("Pular tutorial").
- A separate `CL` table plus `CLt()` in `save.js:163-169`.
- No test checks that each string has both languages. No test checks the "as short as possible" rule
  (there is no length budget per UI slot).

### Load time and frame budget

**C10. The art blob is 93% of what players download, and it is one unreviewable line.**
- `index.html` is 2.68 MB, or 1.82 MB gzipped.
- `art.js` alone is 1.69 MB gzipped. Everything else (JS, CSS, HTML) is 134 KB gzipped.
- 185 WebP sprites:

  | Family | Sprites | Size |
  |---|---:|---:|
  | `pf-*` | 56 | 811 KB |
  | `pest-*` | 14 | 212 KB |
  | `ic-*` | 28 | 151 KB |

- The Art & Feel review's P7 covers trimming the sprites themselves.
- The structural problem is different. Sprites exist only as base64 inside a 2.2 MB single-line file.
  Changing one sprite rewrites a 2.2 MB line, so the diff is unreadable, the change can't be reviewed,
  and there is no per-sprite size budget.
- Load at 390x844 with the font blocked: DOMContentLoaded at 345 ms (1x CPU) and 1.42 s (4x CPU),
  before any network time. On a 10 Mbit/s phone link, 1.82 MB adds about 1.5 s.
- Sprites are decoded lazily on first draw (`render-actors.js:5`, `new Image()` inside `spr()`).

**C11. Frame cost is within budget in normal play, with an unexplained stall to confirm on a device.**
- Per-frame `step()` cost, drawing on, dpr 3:

  | CPU | p50 | p95 |
  |---|---|---|
  | 1x | 0.2-0.5 ms | 2.0-4.2 ms |
  | 4x | 1.1-2.7 ms | 4.8-13.1 ms |

- The worst case is boss 5-8 at 4x: p95 13.1 ms against a 16.7 ms budget.
- Every run also showed a periodic stall: about every 74 frames, one frame took 0.5-0.8 s at dpr 1 and
  3-7 s at dpr 3.
- The CPU profile puts it in `drawImage` and `restore` inside `facePart` (`render-actors.js:105`), on the
  sprout face path with alpha.
- It grows with canvas size, so it is probably software rasterization in headless Chromium and not real
  phone behaviour. Players would have reported multi-second freezes.
- It is **not confirmed either way**. No action should be taken until it is traced on a real phone.
- JS heap is 9.5 MB.

## 2. Proposals (ranked by player impact per effort)

Most of these protect players by catching breakage before it ships. They don't change what players see.
The ranking follows how much each one makes the gameplay, art and menu proposals safe and quick to build.
**Every proposal keeps the shipped output to one self-contained html file.**

### P1. Make the gate fail, and run it on every push (size S)

**What changes:**
- `err.js` exits 1 on any `pageerror` or console error. Requests to Google Fonts are on an explicit
  allow-list, and fonts are aborted in tests so the run stays offline.
- `states.js` gets expected values for S1-S7 (e.g. `heroHits: 0`, `bonked: true`) and exits 1 on a
  mismatch.
- `counter.js` exits 1 when `fail.length > 0`. `cloudtest.js` and `fbtest.js` assert their expected
  `state` and `stored` values.
- `mkpage.js` exits 1 if any patch anchor is missing, until P2 replaces it.
- A new boot network check loads `index.html` and `dist/` with all requests logged. Only the Google
  Font stylesheet may be requested before opt-in. This check fails today because of C4b, so it ships
  together with the P3 fix.
- `run.sh` stops discarding stdout and gitignores `tests/sim/game_*.html`.
- New file `.github/workflows/test.yml`:
  - Runs on push and PR.
  - Checks out the repo, sets up Node and Python, installs Playwright Chromium, and runs `bash tests/run.sh`.
  - Then runs `git diff --exit-code index.html` so a stale committed build fails CI. `dist/` is gitignored
    and not checked.
- The CI file is owned by `devops-engineer`.

**Why:** C1, C2.

**Risk to hard constraints:** none. No game code changes.

**Verify:**
- Mutation check. On a scratch branch:
  1. Flip one expected value in `states.js` and confirm CI turns red.
  2. Add a `throw` to `showHub` and confirm `err.js` turns red.
  3. Revert both and confirm green.
- Gate runtime stays at about 35 s locally; expect about 2 min in CI with the browser install.

### P2. A real test build instead of text patches (size S)

**What changes:**
- `tools/build.py --test OUT` adds `src/test/hook.js` inside the closure, just before the boot lines.
  The output goes to a gitignored path.
- `hook.js` is the one `window.__g` API. It merges `mkpage`'s `__g` and `cloudtest`'s `__t`, and exposes
  `fast`, `onResult` and `seedRandom` as flags instead of rewritten lines.
- `mkpage.js` becomes a thin wrapper around it. The three patched lines in the game get small,
  readable switches: `if (!TEST.fast) draw()`, and `TEST.onResult?.(…)` in `advResult`. `TEST` is
  `{}` in the shipped build.

**Why:** C3. Every later refactor, and the gameplay and menu proposals, touches the exact lines the tests
patch today.

**Risk:** none. The shipped `dist/` and `index.html` are built without `--test`.

**Verify:**
- The sha256 of `index.html` before and after P2 differs only by the `TEST` switches. Diff them once and
  record it.
- `run.sh` is green.
- `grep -c "s.replace" tests/` returns 0.

### P3. Save and cloud safety: golden saves, savedRun guard, no Firebase before opt-in (size S)

**C4b fix:**
- `cloudProbe` sets `cloud.can = true` for Firebase without calling `fbLoad()`.
- The SDK loads only after the player has opted in, in one of two ways (open question 3):
  - **(a)** Two steps. The "Keep your progress in your Google account?" box loads the SDK when the
    player taps Connect, then shows "Sign in with Google" (EN) / "Entrar com Google" (PT). That second
    tap opens the popup.
  - **(b)** One tap, using `signInWithRedirect` instead of a popup.
- Verified by the boot network check in P1 and by `fbtest.js` (ok, cancel and pull) still passing.

**What changes:**
- Add `tests/fixtures/saves/`, built from the migration code and git history:
  - `pre-v98.json`, which has `grip`, `reroll` and `coin` upgrades, `rep`, and gear.
  - `v104-5garden.json`, which has `adv` keys `g-5` and old Nest levels.
  - `v115.json`, a current full save.
  - `v115-savedRun.json`, saved mid-run.
  - One `TT1-` save code.
- A new `tests/smoke/saves.js` loads each fixture through the test build (`applySave` / `readCode`) and
  asserts invariants:
  - The refunded seeds equal the sums in `migrateCuts` and `migrateNest2`.
  - `adv` keys `g-5` become `g-8`.
  - `cutsV` is 2, `char` and `mode` are valid, and the progress never goes down.
  - `SAVE_KEY === 'tufttrail-v2'`.
- Add `RUN_V` to `savedRun`. On load, a mismatched or invalid saved run is dropped and progress (`meta`) is
  kept. That is the proposed default (see the open questions).

**Why:** C4. This is also a prerequisite for gameplay P6 and for P5 below, which renames `run` fields.

**Risk:** the test itself protects the save-key constraint. The `RUN_V` guard can drop a saved run. It can
never drop progress.

**Verify:**
- `saves.js` is green in `run.sh`.
- Remove one line from `migrateNest2` and it turns red.

### P4. One tuning table, one garden spec (size M, in 3 passes)

**What changes:**
- **Pass A (no value changes):**
  - Move the gameplay numbers from C8 into a single `src/data/tuning.js` (`const TUNE = {…}`, first in
    `build.json`, plain commented data). Covers hero stats, pest params, boss variant speeds and HP, the
    Endless curve, timers (`TELL`, `FROST_COOLDOWN`, `SHINY_T`, `BOSS_DAZE`) and `BAL`.
  - Code reads `TUNE.x` only.
  - Drawing coordinates stay in the code. They are art, not tuning.
- **Pass B:**
  - One `gardenSpec(G, i)` returns everything a garden needs: pests (from `advRoster`), net hearts, par,
    count and twist.
  - `newGarden`, the map preview, the prelevel chips and the "New!" strip all read it.
  - `advFoes` is deleted. This fixes gameplay F1 and F2 at the root.
- **Pass C:**
  - Wrap the remaining `Math.random()` calls in gameplay code in `rng()`.
  - `fx`, `audio` and menu shuffles may keep `Math.random`.
- The sim harness can then override `TUNE` with `__g.tune(patch)`, so `autotune.js` no longer has to edit
  source.

**Why:** C8, C6 (determinism), and the studio standard "gameplay values must be data". After this, the
gameplay revamp's P2 and P6 become data edits.

**Risk:** a medium chance of changing balance by mistake, which threatens the Mac and win-rate constraints.

**Verify:**
- Pass A is a pure refactor. It must keep the counter table at 140/0, keep `states` identical, and give
  identical seeded `campaign.js` and `heroes.js` output before and after (same seed, same JSON, diffed).
- Pass B adds a test that preview pests equal board pests for all 96 gardens.

### P5. Narrow writes to shared state (size M, incremental, never a big-bang rewrite)

**What changes, in order:**
1. **`setMode(m, why)`**:
   - Replaces the 31 direct `mode =` writes.
   - It is the single place that can log transitions, guard illegal ones, and let tests assert flow
     (C5).
2. **A game-event queue for the rules code**:
   - `combat.js`, `skills-enemies.js` and `player.js` call `emit('deliver', {…})`, `emit('hurt')`, and
     so on, instead of `sfx` or `banner` directly.
   - `fx.js`, `audio.js` and `hud-cards.js` subscribe.
   - The drawing helpers listed in C6 move to the `render-*` files. This is the cut between game state
     and presentation the brief asks for, and it lets the sim run with no audio or HUD (C6).
3. **One `world` object**:
   - The per-garden lets (`grid`, `portals`, `bubbles`, `enemies`, `shots`, `pickups`, `player`,
     `followers`, `trail`, `freezeT`, …) move into it, created by `newGarden`.
   - The tutorial builds its own world instead of writing 8 globals (C5).
   - Done file by file. Each step runs the full gate and the seeded sims.
4. **Rename by content**:
   - `demo.js` becomes `ui-actions.js`.
   - `draw()` becomes `drawWorld`, `drawActors` and `drawOverlayFx`, each under 60 lines.
   - `newGarden` splits into layout, spawn and reset. One rename or split per commit (C7).
- Not proposed: ES modules, classes, or a framework. The single shared closure stays.

**Why:** C5, C6, C7. Today a tutorial or menu change can silently break play.

**Risk:**
- Low per step, but the total is large, so stop after steps 1-2 if the time is better spent on the game.
- Step 3 renames `run`/world fields and needs P3's `RUN_V` guard first.

**Verify:**
- Steps 1-2: the gate plus identical seeded sim output.
- Re-run the global-writes measurement after each step. Target: `mode` written in 1 file, `enemies` and
  `shots` in 2.

### P6. One string path with a length budget (size S-M)

**What changes:**
- Move the 46 `LANG ===` ternaries and the `CL` table into `S` (`t()`).
- Keep inline `{en, pt}` objects only in content data (`content.js`, challenge and road data), read
  through `L()`.
- Add a lint to `run.sh` with three checks:
  - Zero `LANG === 'pt' ?` with a string literal outside `i18n.js`.
  - Every `S` key and every `{en, pt}` object has both languages.
  - A per-key character budget for tight UI slots (buttons, HUD, chips) that fails when PT or EN goes over.
- Example: `skipTut`: EN "Skip tutorial" / PT "Pular tutorial" (moved from `loop.js:27`, wording
  unchanged).

**Why:** C9, and the hard constraint "PT and EN, as short as possible" becomes testable.

**Risk:** none to the constraints. A missed string would show the EN fallback, and the lint catches that.

**Verify:**
- Lint green.
- `node tests/smoke/tour.js OUT pt-BR` screenshots match the current ones on every screen touched.

### P7. Sprites as source files, inlined at build (size M, with technical-artist)

**What changes:**
- `src/art/<key>.webp` (185 files) becomes the source. `build.py` generates the `ART` object, so
  `art.js` is no longer committed by hand.
- The build prints a size table per family and fails on budgets. Initial budgets: art 2.2 MB, one
  sprite 40 KB (matching Art & Feel P7), and the whole file 3 MB, the limit in
  `technical-preferences.md`. Today the file is 2.68 MB, 89% of that limit.
- At splash, sprites for the first screens are decoded ahead (`img.decode()`) so first draws don't decode
  synchronously.
- Before any optimisation work, run one on-device trace (Chrome remote debugging, a mid-range Android)
  of boss 5-8 to confirm or rule out the C11 stall.

**Why:** C10, C11. It also makes art changes reviewable per sprite in git.

**Risk:**
- The shipped file stays self-contained. Data URIs are the same, and the output is byte-identical if the
  key order is kept.
- The pre-decode adds work during splash. Measure that DCL plus decode stays under 1.5 s at 4x CPU.

**Verify:**
- `index.html` sha256 is unchanged after the move.
- `build.py` prints the table.
- The on-device trace is saved in `production/qa/evidence/`.

## 3. Recommended first slice

Build **P1 + P2 + P3** in one pass.
- All three are size S. They touch:
  - `tests/`
  - `tools/build.py` (the `--test` flag, owned by `devops-engineer`)
  - a 3-line `TEST` switch in the game
  - the small Firebase load-timing fix in `onboarding.js` and `save.js`
- The Firebase fix closes a live hard-constraint violation (C4b). The new network test proves it.
- Together they turn the existing 140-cell table, the 7 state tests and the save flows into a gate that
  actually fails, in CI on every push, with golden saves protecting `tufttrail-v2`.
- Every gameplay, art and menu proposal after that lands behind a red/green signal instead of a human
  reading logs.
- P4 pass A should be the next pass, because gameplay P1, P2 and P6 are mostly tuning edits.

## 4. Open questions for Mikael

1. **How should Pages deploy?**
   - **(a) Keep committing `index.html` at the root (my pick).** CI fails if it is stale. It's simple,
     and the Claude artifact and Pages stay one file each.
   - **(b) A GitHub Action builds and deploys Pages from `src/`.** The repo then holds no build output,
     but Pages depends on Actions being healthy.
2. **When "Continue run" can't load after an update, which is OK?**
   - **Option 1 (my default):** drop the saved run quietly. Progress, seeds and stars are always kept.
   - **Option 2:** show a one-line note. EN "Your last run ended with the update." /
     PT "Sua última partida terminou com a atualização."
   - **Option 3:** keep old run formats loading forever, which costs code in every refactor.
3. **Firebase sign-in after the fix (C4b): which flow?**
   - **(a) Two taps (my pick).** Tap Connect, the SDK loads, then tap "Sign in with Google" /
     "Entrar com Google". The popup works and nothing loads before the player opts in.
   - **(b) One tap with a redirect.** The page leaves and comes back, which is slower and riskier on iOS
     Safari.
   - **(c) Keep the boot preload.** This needs you to change the hard constraint explicitly.

   I am choosing the tuning-file format myself: a commented `src/data/tuning.js`, inlined at build. If you
   want strict JSON instead, say so.
