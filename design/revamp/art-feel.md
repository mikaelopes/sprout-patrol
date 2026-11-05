# Revamp: Art & Feel

Owner area: art-director, with technical-artist and sound-designer input.
Scope: visual identity, game feel and juice, animation, audio. Proposals only. Nothing in `src/` changes until Mikael approves.

Evidence used:
- The 18 tour screenshots in `scratchpad/shots/01..14-*.png` (390x844, EN).
- 6 extra shots I took with touch emulation (`isMobile`, `hasTouch`), Grove 2-3, in the same folder:
  `x02-play-touch`, `x03-trail-full`, `x04-deliver-60ms/250ms/600ms`, `x05-hurt-80ms`, `x06-hurt-380ms`
  (script: `scratchpad/scripts/feel.js`).
- Code read: `render-world.js`, `render-actors.js`, `render-frame.js`, `fx.js`, `audio.js`, `combat.js` (deliver, hurt), `loop.js` (fit, camera), `game.css`.
- Sprite budget, measured from the keys in `art.js`: 185 sprites, about 2.2 MB.

Short version: the painted art is good and the game reads well at rest. What's weak is the **moment-to-moment payoff**. The game scores a big delivery quadratically, but it looks and sounds almost the same as a small one. A hit makes the hero *harder* to see. One rule-breaking flash slipped past the sims. Around the game, the menus mix two palettes, and about 30% of the phone screen sits empty during play.

---

## 1. Findings

### Feel and juice

**F1. Delivery payoff is flat, even though the score is not.**
- Points grow with the square of the trail (`combat.js:63`: `trailPts = 25 * count * count`).
- But the feedback is the same for 1 sprout or 7: one 4-note arpeggio (`audio.js` `SFX.deliver`), 6 dots of 0.06-cell radius per sprout (`combat.js:43`, `fx.js:2`), and up to 3 stacked float texts.
- In `x04-deliver-60ms.png` a 4-in-a-row delivery shows as three lines of numbers in two different currencies ("+2,000", "4 in a row! +6 seeds", "+4 seeds"), clamped against the right edge over a hedge.
- The home itself doesn't react: no squash, no flash.
- The seed wallet in the HUD changes number with no motion (0 to 10 between `x03` and `x04`).

**F2. Collecting has no build-up.**
- Every bubble plays the same `free` pop at the same pitch (`player.js:62`, `audio.js` `SFX.free`).
- Filling a trail 1/4 to 4/4 gives the ear no rising tension, so "trail full, go home" is only told by HUD text.

**F3. Getting hit hides the hero.**
- At the moment of a hit, three things happen at once:
  - the hurt pose plays (`render-frame.js:75`);
  - the hero drops to 45% alpha and blinks (`render-frame.js:66-67`, `blinkOut`);
  - the shake is random per frame, ±1.4 px at most (`skills-enemies.js:237` `shake = 0.35`, `render-frame.js:6` `8 * shake`).
- In `x05-hurt-80ms.png` the hero is a dim brown smudge under red dots. The text "Ouch! Pests scatter" is the clearest thing on screen.
- The same half-alpha look makes the hero hard to find at spawn (`11/12/13-play-*.png`, where `setInv(99)` keeps it blinking).
- The lost heart only switches to an outline. The star going from 3 to 2 at the same moment isn't called out (`x05`, top-left HUD).

**F4. Sound meanings are overloaded.**
- `sfx('hurt')` (the damage buzz) also plays for *Night falls* and *The garden is wilting* (`skills-enemies.js:206`, `:218`). The player hears "you got hit" when nothing hit them.
- `sfx('level')` covers level-up, cage open, boss beaten, buying a hero, and restoring a backup.
- `sfx('streak')` covers shiny appears, challenge won, KO combo, and golden delivery.

**F5. Painted FX sprites exist but core moments don't use them.**
- `art.js` has 15 painted `fx-*` sprites (about 120 KB): sparkle, star, heart, petal, poof, twinkle, and more.
- The one-shot painted FX system `spriteFx()` (`skills-enemies.js:2`) has exactly one caller: the stun poof (`skills-enemies.js:47`).
- Sparkle, heart, star and petal appear only on cosmetic trail skins (`daily-road.js:232-261`).
- Collect, deliver, hit and KO all use the plain `burst()` dots.

**F6. One 20-second music loop for a 6-7 hour season.**
- `MUSIC` has a single track: 8 bars at 96 bpm, about 20 s (`audio.js` `MUSIC.main`, comment "used everywhere").
- The sequencer already supports `drive` bass, `drone`, `arp16` and drums, but nothing uses them.
- Boss, night, endless and menus all sound identical. The only change is a duck on pause.

### Readability and motion rules (hard constraints)

**F7. A flash breaks the 3/s rule.**
- Expiring pickups blink with `Math.floor(time * 8) % 2` (`render-frame.js:16`). That's 4 flashes per second, and it isn't turned off under reduced motion.
- `readab.js` only checks pest and boss states, so it can't catch this.
- The other blinkers are within the rule (all at or under 3/s): invuln 6 toggles/s = 3/s, wake ring 3/s, rainbow 2/s, freeze bar 3/s.

**F8. Some motion ignores reduced motion.** This breaks `design/accessibility-requirements.md:24` ("reduced motion turns off shake, bob…"), which today is checked only by code review (`:38`).
- Bubble bob (`render-frame.js:27`) and the gold-bubble orbiting dots (`render-frame.js:33`) always animate.

**F9. Some animation depends on frame rate.**
- Particle damping is `vx *= 0.9` per frame (`fx.js:23`).
- Delivered sprouts hop home on `h.t += 1/60` per frame (`render-frame.js:150`).
- On 90/120 Hz Android phones the hop runs 1.5-2x faster and particles travel less. On a 30 fps phone the hop drags.

**F10. Homes and bubbles share a silhouette.**
- Both are "a circle with a sprout inside" of nearly the same size: home = wreath, bubble = thin glass ring (`render-actors.js:435-484`, `render-frame.js:26-31`).
- In greyscale at phone size (cell about 32-35 css px), the wreath against the ring is a fine-texture difference, not a shape difference. See `11-play-early.png`: the green home top-left vs. the bubbles in row 5.
- The sims never test homes against bubbles.

### Screen use and identity

**F11. About 30% of the phone screen is empty during play.**
- `fit()` (`loop.js:4-8`) sizes the cell by width, so the maze ends near y=600 of 844 css px in every play shot (`11-14-play-*`, and `x02-play-touch.png` with touch emulation).
- The thumb pad is off by default (`input.js:24`), so nothing fills the band.
- Meanwhile the second HUD row overflows at 390 px: "TRAIL 0/4" hits the edge in `12-play-mid` and `13-play-late`, and is cut to "TR" in `14-play-boss`.

**F12. Two palettes on every menu screen, and a dead theme system.**
- `game.css:409-421` defines "Storybook Garden: cream paper cards" as the default, plus 5 more palettes (`game.css:606-611`).
- But `loop.js:70` hard-sets `data-theme = 'moss'`, so cream, kraft, sage, night and plum never ship.
- The header buttons and page background still use the old navy root tokens (`--panel #222a4d`, `game.css:2-18`, `:420`). Result in `03-hub` through `10-daily`: navy page, navy icon buttons, moss-green cards, and an orange logo.
- Above each menu card sits a dimmed, blurred maze frame. It reads as an empty game behind a popup, not a designed screen (`03-hub`, `05-chars`, `06-nest`).
- `game.css` is 632 lines in about 9 stacked override passes ("visual QA fixes", "clean skin", "Storybook", "accessibility pass", "overflow guards"…) with 10 `!important`. Small visual changes are slow and risky.

**F13. Menus have no transitions and some uneven grids.**
- Cards swap instantly. Only special cards animate (`lvpop`, the chest).
- Uneven grids: Nest 2+1 (`06-nest`), Hub tiles 3+2 (`03-hub`), Profile shinies 3+1 (`08-profile`).

**F14. Art bytes are spent where they show least.**
- Pest face overlays (`pf-*`) are 56 sprites at 200x200, **811 KB**: 37% of all art, more than all hero, hat and tuft art combined.
- On a phone a pest face draws at about 0.6 cell, roughly 60-70 device px at dpr 3 (`render-actors.js:313`, pest `r = 0.38 cell` at `:362`). The source is about 3x oversampled.
- Meanwhile the font loads from Google Fonts (`head.html:2-4`). That is a network request on every page load, before any cloud opt-in. It conflicts with `design/game-brief.md` ("Out of scope: any network use before the player opts in to cloud save"). Offline, or inside the Claude artifact frame where outbound network is blocked, all UI and canvas text falls back to Trebuchet.

---

## 2. Proposals (ranked by player impact per effort)

### P1. Motion-rule fixes and a flash lint (size S, roughly XS)
**What:**
- Expiring pickups: replace the 8 Hz blink with a 2 Hz pulse (scale 1 to 0.85 plus alpha 1 to 0.5). Under reduced motion, show a static dashed ring instead.
- Guard bubble bob and gold orbit with `reduceMotion`.
- Make particle damping and the home-hop use `dt` (`Math.pow(0.9, dt*60)`, `h.t += dt`).
- Add a test to `tests/run.sh` that greps `src/js` for `Math.floor(time * N) % 2` with N > 6 and fails, so the rule can't regress.

**Why:** F7, F8, F9. F7 breaks a hard constraint today.
**Risk:** none to the constraints; it restores one.
**Verify:**
- The new lint passes.
- `tests/run.sh` is green.
- `readab.js` still 15/15.
- Take the tour once with `prefers-reduced-motion` emulated and check that nothing on the board moves except actors.

### P2. Payoff that scales with the trail (size S)
**What (no new art bytes; reuses existing `fx-*` sprites and the sequencer):**
- **Collect ladder.** The `free` pop rises one pentatonic step per trail slot (C D E G A C…). The last free slot gets a brighter double pop. You can *hear* the trail filling.
- **Delivery tiers** by `count`:
  - 1-2 sprouts: 3-note arpeggio.
  - 3-4: 4 notes, plus one `fx-sparkle` `spriteFx` per sprout as it lands.
  - 5+: 5 notes, plus `fx-star` ring, plus a 2-3 px squash of the home.
  - The streak fanfare stays on top.
- **Home reacts.** The wreath scales 1.15 to 1 over 0.25 s, with a brief light bloom in the home's color as each sprout hops in.
- **One line, not three.** Merge the delivery floats into one seed line plus a separate score pop at the HUD:
  - EN `+6 seeds · 4 in a row!` / PT `+6 sementes · 4 seguidos!` (reuses the existing `seeds` + `inRow` strings).
  - Points show as a small "+2,000" that drifts to the score instead of stacking at the home.
- **Wallet bump.** The HUD seed counter does a 150 ms scale pop when it changes (CSS only, off under reduced motion).

**Why:** F1, F2, F5. This is the core loop. Players should feel why a full trail beats two half trails.
**Risk:** low. Feedback only, no gameplay numbers change. Particle and spriteFx counts stay capped (`sfxs` max 24).
**Verify:**
- Re-run `scratchpad/scripts/feel.js`. In the `x04-deliver-*` frames the home reacts, sparkles land per sprout, and only one text line is near the home.
- `tests/run.sh` green.
- Ear check, as in the sound-board picks: deliveries of 1, 3 and 5 are clearly different.

### P3. A hit you feel, with the hero still visible (size S)
**What:**
- On hurt, a **70 ms hit-stop** freezes the whole sim, enemies included, while rendering continues. Skip it under reduced motion.
- Replace the random jitter with a **directional kick**: 4 px away from the hitter, eased back over 0.2 s. Off under reduced motion.
- **The hero stays fully opaque** for the first 0.4 s (hurt pose readable). After that, invulnerability shows as a white-and-ink ring around the hero blinking at 3/s or less, instead of fading the hero to 45%. The same applies at spawn.
- **The HUD heart pops out** (scale 1.3 to 0, 250 ms) and the lost star shakes once.
- **Audio:** the hurt buzz plays only on damage.
  - New `night` cue: a low two-note owl-like falling minor third (triangle, about 0.5 s).
  - New `wilt` cue: a slow downward sine sigh.
  - These replace `sfx('hurt')` at `skills-enemies.js:206/218`.

**Why:** F3, F4.
**Risk:**
- Hit-stop changes real time by 70 ms per hit, so the timer gets slightly less time per hit. Pause the garden clock during the stop so time-based stars don't move.
- Re-run hero parity, since Mac takes the most hits.

**Verify:**
- `x05-hurt-80ms` re-shot shows the hero at full opacity.
- `heroes.js` parity stays within ±5 points (today 46.7-54.0%).
- `tune.js` bands unchanged.
- The flash lint from P1 passes.

### P4. Fill the phone: bigger board, HUD band under it (size M)
**What:**
- Change `fit()` so the cell sizes by **height** on tall phones, letting up to about 1.5 columns per side scroll off. The camera already follows and the edge markers already exist.
- Add a small look-ahead in the move direction (0.15 of the view) so the hero isn't driving blind into the cropped side.
- Move the overflowing second HUD row (stars, timer, color goals, trail) into the empty band **under** the board as a "trail shelf" that shows the actual sprouts you carry (slot sprites, not text).
- On an 11x15 maze at 390x844, sprites get about 25% bigger.

**Why:** F11. It's also the cheapest way to make every piece of art read better.
**Risk:**
- Medium. Threats can be just off-screen.
- The `readab` and `tune` sims must re-run, and the gameplay area should sign off. A touch-only cross-area change.
- Doesn't touch the save or single-file constraints.

**Verify:**
- Tour shots `11-14` show no empty band, and "TRAIL" is never clipped.
- `readab.js` 15/15.
- `tune.js` bands and `campaign.js` season time hold (today 6.2-6.8 h).
- `ftue.js` first play is still 1 tap.

### P5. One menu skin (size M)
**What:**
- Commit to the palette that actually ships (moss, unless Mikael picks otherwise; see Q1).
- Bring the header buttons, page background and HUD chips into that family. No more navy chrome around green cards.
- Replace the blurred ghost maze behind menus with the grove's painted floor (`w1-floor`…`w6-floor`, already in `art.js`) under a soft vignette.
- Delete the 5 unused palettes and the dead cream rules. Fold the 9 override passes in `game.css` into one token block plus components. Target: under 450 lines and zero `!important`.
- Add a 160 ms card rise-in, none under reduced motion.
- Fix uneven grids: Nest goes to a single column of full-width rows; Hub tiles 3+3 or 2+2+1 with the odd one full-width; Profile shinies 4-up.

**Why:** F12, F13.
**Risk:**
- Low to the constraints.
- Moderate regression risk on the accessibility pass (4.5:1 contrast, 44 px targets, PT label overflow guards), so those rules move over first.

**Verify:**
- Tour in EN and `pt-BR`: every screen uses one palette and no label overflows.
- A contrast check on the token pairs (script over the CSS variables).
- `tests/run.sh` green.

### P6. Music with more than one mood (size S-M)
**What:** add 2 short tracks as text in the existing sequencer (about 1 KB each, no audio files):
- **Boss:** `drive` bass plus `k.s.` drums, 112 bpm, minor.
- **Night / endless late:** `drone` plus `arp16`, 84 bpm.

Also:
- Keep the main tune for menus and normal gardens, but offset its start bar per grove so it doesn't always open on the same phrase.
- Crossfade 0.4 s on change.
- Add two stingers: garden clear (rising fifth plus bell) and garden failed (soft descending three notes, not the hurt buzz).

**Why:** F6, F4.
**Risk:** none to the constraints. A minor CPU cost from more scheduled oscillators, so cap simultaneous voices.
**Verify:**
- Listen-through on a mid-range Android device.
- `tests/run.sh` green.
- No audio scheduling errors in `err.js`.

### P7. Art diet: spend bytes where they show (size M, technical-artist)
**What:**
- Re-encode the **pest** `pf-*` faces (about 34 of the 56; bosses keep 200 px) at 128 px.
- Test WebP quality 80 against today's on the 6 biggest sprites.
- Estimated saving: 200-300 KB of the 811 KB (to be measured, not promised).
- Use the savings to embed a Latin subset of Fredoka (400/600/700, about 50-70 KB as base64 woff2) and remove the Google Fonts `<link>`. The game then makes zero external requests before cloud opt-in, as `game-brief.md` requires, and text looks the same offline and inside the artifact (see Q3).
- Add an asset budget check to `tools/build.py --check`: warn if `art.js` grows past 2.2 MB, or if any single sprite is over 40 KB.

**Why:** F14.
**Risk:**
- Faces could soften on tablets. Check at dpr 3 and with `--uiz` 1.75.
- Embedding the font adds about 60 KB, but it removes a request the brief already rules out. Dropping Fredoka for a system font is the zero-byte alternative.

**Verify:**
- `readab.js` 15/15 (faces carry state).
- Side-by-side crops of each pest at phone and tablet scale.
- `build.py --check` reports the new size.

---

## 3. Recommended first slice

Build **P1 + P2 + P3** together. All three:
- touch only `fx.js`, `audio.js`, `render-frame.js`, `render-actors.js` and a few call sites in `combat.js`, `player.js`, `skills-enemies.js`, plus about 10 lines of CSS for the heart and wallet pops;
- add **zero bytes of art**, since they reuse the `fx-*` sprites already shipped;
- change no gameplay numbers (the only timing effect is the 70 ms hit-stop, with the clock paused);
- can be proven with the existing gates: `tests/run.sh`, `readab.js`, `heroes.js`, plus the new flash lint and the `feel.js` frame shots.

The result is that the core loop (collect, deliver, get hit) finally *feels* like its scoring. P4 and P5 are the next pass: they're bigger and touch layout, which the menus and gameplay areas also own.

---

## 4. Open questions for Mikael

1. **Which menu skin is "the" look?** Moss green is what ships (forced in `loop.js:70`), but the CSS was designed around cream paper, with 4 more palettes nobody can reach. Options:
   - **Keep moss and delete the rest** (recommended: least work, matches the night maze).
   - **Switch to cream paper**: brighter, more storybook, more contrast against the dark board.
   - **Add a palette picker in Profile**: more to test in EN/PT.
2. **Can the maze crop at the sides to make everything about 25% bigger (P4)?** You'd scroll sideways a little on small mazes, but sprites and touch targets grow and the empty bottom third goes away. The alternative is keeping the whole width visible and using the band only for the HUD/trail shelf.
3. **How to fix the font request?** The Google Fonts link is a network call before cloud opt-in, which the game brief rules out. Options:
   - **Embed a Fredoka subset** (recommended): about 60 KB, paid for by the art diet. Same look everywhere.
   - **Switch to a system rounded font stack**: 0 KB, but the look changes per device.
   - **Keep the link**: this means changing the brief's rule.
