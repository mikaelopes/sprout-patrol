# Game Brief: Sprout Patrol

**One-sentence pitch:** Roll a fruit hero through a night-garden maze, gather lost sprouts into a wobbly trail and get them home before the pests break the line.

## Core loop
- Steer through the hedge maze and pick up sprout bubbles; each joins your trail.
- Deliver sprouts to the home portal of their colour for points, seeds and level-up cards.
- Dodge or stun pests that break your trail and cost hearts; clear the garden's goal for 1-3 stars.
- Spend seeds and stars on heroes, Nest upgrades and looks, then push into the next garden.

## Player goal & fail state — what "working" looks like
- Win a garden by delivering its target before time/hearts run out; a run ends at 0 hearts.
- A session feels complete when the player clears a garden or two in a few minutes and earns something to spend.

## MVP — what must exist to be the game
- Maze + trail + colour-matched delivery, on touch and keyboard
- Pests that break the trail, with readable telegraphs
- Adventure: 12 groves x 8 gardens, stars, boss at garden 8
- 5 heroes with distinct roles, Nest upgrades, in-run cards
- Tutorial that gets to first play in about 3 seconds
- Save that never loses progress (local + backup + save code + opt-in cloud)

## Out of scope — not building this
- Multiplayer, chat, ads, real-money purchases
- A native app or a game engine port (it stays one html file)
- A fifth fruit colour (tested: harder in the bad way, not colour-blind safe)
- Any network use before the player opts in to cloud save

## Build order
1. Keep the core loop and save safe (tests/run.sh green) on every change.
2. Revamp in slices: code structure -> gameplay & levels -> art & feel -> menus & onboarding
   (proposals in `design/revamp/`, owner picks each slice).

---
**Who it's for / what they feel:** casual phone players (PT and EN) who want a bright, quick, slightly frantic five-minute run.

**Art & audio direction:** "Storybook Garden": cute fruit characters on a night garden, cream paper cards, chunky raised buttons; soft procedural chiptune.

**Reference game:** Iggle Pop! — collect-a-trail-and-deliver; we keep the trail and delivery, add pests, heroes and a short adventure map.

## Owner decisions (fixed unless Mikael changes them)

| Decision | Detail |
|---|---|
| One html file | Same build ships as the Claude artifact and on GitHub Pages. |
| Name | "Sprout Patrol" in every language. |
| Languages | PT and EN for every player-facing string; in-game text as short as possible. |
| Save safety | Save key `tufttrail-v2` never changes; every older save must still load. |
| Cloud save | Opt-in only. Claude account inside Claude; Google sign-in (Firebase) on Pages. |
| Heroes | Mac is the no-move tank. Hero win rates within ±5 points of each other. |
| Colours | Four fruit colours, always backed by fruit shape. |
| Delivery | Never publish or send zip files. |
