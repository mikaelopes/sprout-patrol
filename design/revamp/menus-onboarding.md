# Revamp: Menus & Onboarding

Author: ux-designer (with ui-programmer and accessibility-specialist input). Status: proposal only. Nothing under `src/` was changed.

Evidence used:
- `shots/` = the EN tour (390x844, rendered as a desktop pointer, so the keyboard footer shows).
- `shots-pt/` = the same tour re-taken in pt-BR.
- `shots-x/` = extra captures I made with a scratch script, using touch emulation, for screens the tour skips: the real prelevel card, results, pause, post-tutorial journey, full Profile, desktop and tablet hub. `dist/` has no viewport meta, so these render scaled down. Use them for content and layout, not for pixel sizes.

All three folders are under `/tmp/claude-0/-home-claude/1641f6ba-28e9-5e78-9530-496442e47198/scratchpad/`. The script is `scratchpad/x/extra.js`.

---

## 1. Findings

### HUD during play
- **F1. The second HUD row overflows at 390 px.** On 4-color gardens, "TRAIL 0/4" is cut to "TR" in EN (`shots/14-play-boss.png`) and to "FIL" in PT (`shots-pt/14-play-boss.png`). In `shots/12-play-mid.png` it touches the edge. The row holds stars, a timer "0:01/3:35", "0 PTS", 4 color counters and the trail cap (`body.html` `.xprow`, `hud-cards.js:41-46`). In Adventure, "0 PTS" is noise: score isn't a goal there and only shows on the results screen. Trail capacity is the one number players need while steering, and it is the one that gets cut.
- **F2. The board leaves roughly 25% of the phone screen empty, at the bottom where the thumb rests.** In `shots/11-play-early.png` and `12-play-mid.png` the board ends at about y=600 of 844 css px. Nothing lives in that area: the Lichi/Zip/Luna special-move button and the trail count could.

### Menu chrome and navigation
- **F3. The Pause button shows on every menu but does nothing there.** It appears on the splash, hub, map, and so on (`shots/01`–`10`). The handler only acts in `play`/`pause` (`input.js:80`). That is a dead 44 px target in the most valuable corner.
- **F4. The player name shows twice on the hub.** The header slot shows "Sprout Patrol / SPROUT KEEPER" and the card shows "WELCOME BACK / Sprout Keeper" (`shots/03-hub.png`). A brand-new player who has just finished the tutorial is also greeted "Welcome back" (`shots-x/d-hub-journey.png`, `screens.js:9`).
- **F5. The hub's "who" card is confusing (known gap).** "Tango · Classic / Best run: none yet" (`shots/03-hub.png`, `screens.js:12`):
  - "Classic" is the Endless mode name (`content.js:75`) and means nothing until Endless opens after 12-8.
  - "Best run" is an Endless stat, so it reads "none yet" even for a player on grove 6.
  - In PT it wraps to 3 lines ("Melhor partida: nenhuma ainda", `shots-pt/03-hub.png`).
  - The card looks tappable but isn't a button.
- **F6. The hub's information hierarchy is flat.** Profile (settings and save) gets the same tile as Characters and Nest, and leaves an empty 6th cell (`shots/03-hub.png`). The Daily row shows a red "1" badge *and* a "Play" button, which is two signals for one action.

### Save and sign-in (known gap)
- **F7. Sign-in is reachable only from Profile and once after the tutorial.**
  - The account box (`cloudBox()`, `onboarding.js:365`) is rendered in Profile (`screens.js:148`), on the tutorial-done card (`onboarding.js:394`, once) and in `showCloudOffer` (only after a skipped tutorial).
  - On the hub, the only save surface is a red warning that appears when storage is broken (`screens.js:11`). When storage works there is no path to sign-in from the hub at all.
  - In Profile, the save section sits below name, stats and shinies (`shots-x/l-profile-full.png`).
- **F8. The save copy points in a circle.** In Profile, the fallback box says "To move it, use Profile → Copy code", while the player is already in Profile and the button sits right below (`shots/08-profile.png`, `onboarding.js:367`).
- **F9. Profile is a junk drawer.** It holds name, stats, shinies, save warning, a cloud box, copy/paste/restore, a paste textarea, controls, music, language, the playtest quiz, replay tutorial and clear data. That is about 2.5 screens of scroll (`shots-x/l-profile-full.png`). Settings a player wants mid-game (music, controls) are buried there, and pause only offers Controls (`adventure.js:366`).

### Onboarding
- **F10. Five overlapping teaching layers.**
  1. A 12-step tutorial that includes a full boss garden as "part 2" (`onboarding.js:238-253`, the "1/12" in `shots/02-tutorial.png`).
  2. A forced 6-step "journey" that blocks every other button and makes the player buy a Nest upgrade before their first real garden (`onboarding.js:59-66`, `124-133`).
  3. Coach marks for hub, map and prelevel, which are effectively dead for new saves: `finishTutorial` pre-marks them as seen (`onboarding.js:389`). Only very old saves reach them.
  4. A FIRSTS "New!" strip on the prelevel (`adventure.js:109`).
  5. In-play LEARN cards (`onboarding.js:1`).

  Tap to start → first real garden takes tutorial (12) + done card (1) + journey (6) = about 19 guided actions. `ftue.js` only measures the first tap into the tutorial ("1 tap ~3 s"), not time to first real garden.
- **F11. Journey hint text is small and several targets are below 44 px.** `.jskip` has a 32 px min-height (`game.css:617`), `.tutskip` is 40 px (`game.css:615`), and `.buy` buttons are about 35 px tall (8 px padding at 15-16 px text, `game.css:149`). The project commits to 44x44 CSS px minimum (`design/accessibility-requirements.md:26`). In the tutorial, "Skip tutorial" (`.tutskip`, `top:54px`, `game.css:615`) overlaps the 2-line tip box in EN (`shots/02-tutorial.png`) and covers the top-right of the maze, where a portal sits on the boss tutorial map.
- **F12. The playtest quiz is a player-facing button in Profile.** "Playtest quiz (1 min)" (`screens.js:156`) is a 16-question developer survey.

### Text length (owner: as short as possible)
- **F13. Long or wrapping strings in PT.**
  - The map's star-chest bar wraps to **7 lines** in PT, one word per line ("Baú / de / estrelas / com / 10★ / · / Pronto!"), because two buttons squeeze it (`shots-pt/04-map.png`, `adventure.js:283`). EN wraps to 4 lines.
  - The title "Mapa da trilha" wraps to 2 lines and "★ 100" stacks.
  - Challenge rows repeat the target: "Reach grove 2 (garden 5). 5/5" (`shots/07-challenges.png`).
  - Daily explains the payout with three chips ("Seeds you collect", "+30 for a clear", "+20 from the ring") plus a sentence (`shots/10-daily.png`). The PT "Sementes que pegar" reads awkwardly.
  - The prelevel shows "GROVE 1 · GARDEN 3" over "Garden 1-3", which is redundant (`shots-x/e-pre-1-3.png`).
- **F14. 49 inline `LANG === 'pt' ? … : …` strings bypass `i18n.js`.** adventure 16, onboarding 12, screens 9, others 12 (grep count). These can't be length-checked or reviewed side by side, and several are among the longest strings (Nest refund note, season text, stuck hint).

### Prelevel and results
- **F15. The prelevel has up to 8 rows of icon chips that need decoding** (`shots-x/f-pre-6-6.png`, `g-pre-8-8.png`):
  - "★★★ 💥2  ★★ 💥4" for the star rules.
  - "Nest ⬆6✗ ⬆6✗ ❤6✗ ›" for the recommended Nest levels.
  - A boss goal row "🔑3–4 → 👑 🌱→👑".
  - The one booster sits alone in a half-width grid cell.

  The coach mark that used to explain these chips is dead (F10).
- **F16. The win screen has 9 stacked blocks before "Next"** (`shots-x/j-result-win.png`): avatar, title, stars, star-rule chips, Hero Mode line, seeds/bonus, time/par/score/best, a challenges line, and a 3-button star-chest prompt. The loss screen is fine (`k-result-lose.png`) but gives no hint until the 3rd loss (`adventure.js:206`).
- **F17. Pause in Adventure shows Endless-style stats** ("GARDEN G6·1 · LEVEL · SEEDS"). It has no Retry and no Music or Sound control; "End and keep seeds" is the only exit (`shots-x/i-pause.png`, `adventure.js:360-367`).

### Scaling
- **F18. Desktop and tablet scaling works.**
  - Desktop 1280x800: `--uiz` stays 1 (`loop.js:67`) and the card is phone-sized and centered (`shots-x/m-hub-desktop.png`), which is acceptable.
  - Tablet 820x1180: `--uiz` is 1.35 and fine.
  - The keyboard footer only shows on fine pointers (`game.css:166-168`), which is correct. The footer in `shots/` is an artifact of the tour's desktop pointer.

  No change needed beyond the HUD-row fix.

---

## 2. Proposals (ranked by player impact per effort)

### P1. Make the play HUD fit in one row, everywhere. Size: S
- **What changes:**
  - In Adventure, drop the live "PTS" from `.xprow`.
  - Show trail as an icon plus "0/4" (no word).
  - Show the timer as the time left against par ("2:23"), turning coral when over, instead of "0:01/3:35".
  - Color counters keep icon plus number.
  - If the row still exceeds the width, the color counters shrink first; the trail cap never does: give it `flex:none` and put it first after the stars.
- **Why:** F1.
- **Risk to hard constraints:** none. The counters keep fruit shapes, so greyscale and deuteranope readability are unchanged.
- **Verify:**
  - Re-run `tour.js` EN and pt-BR and add a 360x780 viewport.
  - Add a smoke assertion that `.xprow.scrollWidth <= .xprow.clientWidth` in 11-14 play states.
  - Check that `readab.js` still reports 15/15.

### P2. Fix the menu chrome and give save/sign-in a home. Size: S–M
- **What changes:**
  1. Hide `#pauseBtn` outside `play`/`pause` (F3). On menus, that header slot becomes a **save chip**: a cloud icon showing its state (off / on ✓ / warning !). Tapping it opens a small **Save** card with:
     - Connect account / Sign in with Google (`cloudBox()`).
     - Copy code and Paste code.
     - Restore backup.

     It is the same content as today's Profile section, moved, not new logic. This closes the F7 gap: one tap from any menu.
  2. Remove the hub red banner; the chip's "!" state replaces it.
  3. Offer the account once more at a natural moment: the first boss win (1-8 results), as one line plus a button. Never more than once.
  4. Remove the circular text (F8). EN: "Saved on this device only." / PT: "Salvo só neste aparelho."
- **Why:** F3, F7, F8. Players who lose progress are the biggest silent churn in a browser game, and today the fix hides two levels deep.
- **Risk to hard constraints:**
  - **Cloud opt-in:** the chip and card must not call `cloudProbe`'s network paths. Today `cloudProbe` runs at load (`loop.js:71`), and on the firebase host `fbLoad()` runs there too (`onboarding.js:359`). That should be checked against the "no network until tap" rule regardless of this proposal; I flag it, I don't change it.
  - **Save key and migrations:** untouched, since only UI moves.
- **Verify:**
  - `tests/smoke/cloudtest.js` and `fbtest.js` pass.
  - A Playwright check that the request log is empty until Connect is tapped.
  - Tour shots show the chip on 03-10.
  - Tapping the chip on the hub reaches the Connect button in 1 tap (today: 2 taps and a scroll).

### P3. Text diet pass, plus moving inline strings into `i18n.js`. Size: S (copy), M (string move)
- **What changes:** the 49 inline ternaries move into `i18n.js` (F14). A `tests/` lint flags any button label over 18 characters or line over 48 characters in either language. Proposed rewrites:

| Where | Today (EN / PT) | Proposed EN | Proposed PT |
|---|---|---|---|
| Hub who card (F5) | Tango · Classic / Best run: none yet | **Tango** (tap → Characters). Add " · Classic" and the best run only once Endless is open. | **Tango** |
| Hub eyebrow (F4) | Welcome back | First visit: *nothing*; later: drop it and keep the name only in the header | — |
| Map chest bar (F13) | Star chest at 10★ · Ready! + Open + All (10) | **Chest ready** + one button **Open (10)** | **Baú pronto** + **Abrir (10)** |
| Map chest bar, not ready | Star chest at 20★ · 14/20 | **★ 14/20** + bar | **★ 14/20** |
| Challenge desc | Reach grove 2 (garden 5). 5/5 | **Reach grove 2** (the bar shows progress) | **Chegue ao bosque 2** |
| Daily payout chips | Seeds you collect / +30 for a clear / +20 from the ring / Missing a day never resets… | **Clear: +30 · Day 1: +20** / **Missing a day never resets.** | **Vencer: +30 · Dia 1: +20** / **Perder um dia não zera.** |
| Prelevel eyebrow | GROVE 1 · GARDEN 3 + Garden 1-3 | Title only: **Garden 1-3** | **Jardim 1-3** |
| Save fallback (F8) | Your progress stays on this device. To move it, use Profile → Copy code. | **Saved on this device only.** | **Salvo só neste aparelho.** |
| Pause exit | End and keep seeds | **Quit (keep seeds)** | **Sair (fica com as sementes)** |
| Splash story | 4-line paragraph | Keep the tagline, drop the paragraph (the tutorial shows it) | idem |

- **Why:** F5, F13, F14, and the owner's "as short as possible" rule.
- **Risk to hard constraints:** the name "Sprout Patrol" stays in every language. Both languages are always edited together.
- **Verify:**
  - The PT tour shows `04-map` chest bar on 1 line and `03-hub` who-card on 1 line.
  - The new lint passes.
  - `tests/run.sh` passes.

### P4. Shorter onboarding: tutorial part 1 only, a 2-step journey, Nest taught after the first garden. Size: M
- **What changes:**
  - **Tutorial:** keep steps s0–s5 (move, deliver, seed, snowflake, bump, den). Drop part 2 (b0–b5): the existing boss intro card (`showBossIntro`, with the key → cage → gate strip, `shots/14-prelevel-boss.png`) already teaches the boss rule at 1-8, when it matters. The counter becomes "1/6".
  - **Journey:** 2 steps, "Adventure" then "first garden". Leave the "Play" press out; the prelevel's big button is obvious.
  - **Nest:** move the Nest step to the first results screen where seeds ≥ 40. Show it as a non-blocking chip ("New: Nest ›" / "Novo: Ninho ›"), not a lock on the whole UI.
  - Delete the dead hub/map coach marks, or reuse the prelevel one only for the star-rule chips (see P5).
  - `.jskip` gets a 44 px min-height. Move `.tutskip` into the empty strip under the board (F2), out of the maze and away from the tip box (F11).
- **What each removed step did, and where it goes now:**
  - Boss tutorial → the boss intro card at 1-8, plus the LEARN cards in play.
  - Forced Nest purchase → the post-garden chip. The 40 seeds are still granted.
  - Without a forced purchase, the player could start 1-1 to 1-3 without the trail upgrade. The `campaign.js` bands are balanced on `NEST_REC`, and grove 1's recommended Nest is level 1, so the bot run must confirm 1-x clear rates hold.
- **Why:** F10, F11. About 19 guided actions become about 8 before the first real garden.
- **Risk to hard constraints:** none directly. The `tutorialDone`/`journey` meta flags stay, so old saves load. A save mid-journey at step 3+ must be clamped to done.
- **Verify:**
  - Extend `ftue.js` to report taps and seconds from "Tap to start" to the first `startAdventure`; target ≤ 10 taps and ≤ 90 s.
  - `campaign.js` grove 1 clear rate stays within its current band.
  - Load a save fixture with `journey: 4` to prove the clamp.

### P5. Prelevel and results: words instead of icon riddles, fewer blocks. Size: M
- **Prelevel:**
  - One goal row (sprouts / pests / colors).
  - One star line in words: EN "★★★: ≤2 hits · under 2:23" / PT "★★★: ≤2 golpes · até 2:23".
  - The Nest row shows only when behind, as text: EN "Nest is behind ›" / PT "Ninho atrasado ›".
  - The single boost becomes a full-width toggle row.
  - Remove the eyebrow.
- **Win screen order:**
  1. Stars.
  2. Seeds as one total line, e.g. "+167" (bonus folded in; detail on tap).
  3. **Next** (primary).
  4. One "Chest ready · Open" button that opens all.
  5. Time and best on one small line.
  6. Retry and Map as ghost buttons.

  Move "4 challenges ready" to a badge on the Map button.
- **Loss screen:** show one cause line from data the run already has (e.g. EN "Hit 3 times by Beetles" / PT "3 golpes de Besouros") and the stuck hint from the 2nd loss.
- **Pause (F17), Adventure:**
  - Stats: Time and stars only.
  - Buttons: Resume, Retry, Map.
  - Settings: Music and Sound toggles next to Controls.
- **Why:** F15, F16, F17.
- **Risk to hard constraints:** none. Bots click by `data-act`, so the `advnext`, `advretry`, `map`, `go` and `starchest*` attributes are kept.
- **Verify:**
  - New tour shots for prelevel, results and pause, which `tour.js` currently skips: add them the same way `scratchpad/x/extra.js` does.
  - `campaign.js` and `ftue.js` still click through.
  - The win screen measures ≤ 6 blocks above the fold at 390x844.

### P6. Hub information architecture. Size: M
- **What changes:**
  - Profile and settings move to a gear in the header, sharing the slot logic with the P2 save chip; settings sits as a section of the Save/Settings card.
  - The grid becomes 4 equal tiles: Heroes, Nest, Goals, Road (EN "Heroes / Nest / Goals / Road", PT "Heróis / Ninho / Metas / Estrada").
  - The Daily row keeps its "Play" button and drops the duplicate red "1".
  - Profile keeps name, stats and shinies only.
  - The playtest quiz moves behind a URL flag (`?quiz`) or a 5-tap on the version text (see Q2).
- **Why:** F6, F9, F12.
- **Risk to hard constraints:** none. Copy changes in both languages.
- **Verify:**
  - The hub fits without scroll at 390x844 in PT, from the tour shot.
  - Every `data-act` destination is still reachable: assert in a smoke script that each old destination opens in ≤ 2 taps from the hub.

### P7. Use the empty strip under the board on phones. Size: S–M
- **What changes:** on touch phones with more than 120 px free below the board, move the special-move button (`#abilityBtn`) and the tutorial Skip into that strip. Both are thumb-reachable and keep the maze clear. Nothing is added on desktop.
- **Why:** F2, F11.
- **Risk to hard constraints:** none, since layout only changes. Reduced motion is unaffected.
- **Verify:** touch tour shots for Zip, Lichi and Luna. `heroes.js` parity stays within ±5 points, because a reachable button could raise special-move use. That is a useful check, not a risk to hide.

---

## 3. Recommended first slice (one pass)

1. **P1 HUD one-row fit:** the most visible bug, small and contained to `hud-cards.js`/CSS.
2. **P2, steps 1, 2 and 4:** hide the dead Pause on menus, add the save chip that opens the existing Save section as a card, and fix the circular copy. This closes the sign-in reachability gap without new cloud logic. The one-time boss-win offer can follow.
3. **P3 copy rows for the hub who-card, map chest bar, challenge descriptions and prelevel eyebrow:** these directly fix the hub "Tango · Classic" gap and the 7-line PT chest bar. Moving the 49 inline strings into `i18n.js` can come in a later pass.

Gate for the slice: `tests/run.sh` passes, the EN and PT tour is re-shot and diffed, the `.xprow` overflow assertion passes, and the request log shows no network calls before Connect.

---

## 4. Open questions for Mikael

1. **Tutorial length:** may the boss half of the tutorial (steps 7-12) go, leaving the 1-8 boss intro card to teach keys, cage and gate? Should the forced "buy a Nest upgrade" step become a non-blocking hint after the first garden? (P4: about 19 guided actions become about 8.)
2. **Playtest quiz:** do you still need it reachable by every player from Profile, or can it move behind a hidden flag, e.g. `?quiz` or a 5-tap on the version?
3. **Account nudge:** besides the always-visible save chip, is one extra offer at the first boss win acceptable? Or should sign-in only ever appear when the player opens the chip?
