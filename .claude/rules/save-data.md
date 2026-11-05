---
paths:
  - "src/js/save.js"
  - "src/js/content.js"
---

# Save Data Rules (Sprout Patrol)

- The storage key `tufttrail-v2` never changes.
- Any change to the shape of `meta` (fields added, renamed, removed, or a value's meaning changed)
  needs a migration in `applySave` so EVERY older save still loads with no lost progress.
- Removed content (heroes, skills, pests, cosmetics) must be filtered out of loaded saves, never crash on them.
- Never write to cloud storage before the player opts in (`meta.cloudOn`); reads before opt-in are also forbidden.
- Cloud saves go through the shared `{get, set}` ref (Claude db or Firebase); compare with
  `progressOf` and ask the player via `showCloudChoice` when both sides have real progress.
- Verify with `node tests/smoke/cloudtest.js` and `node tests/smoke/fbtest.js`, plus loading an old
  save code by hand when the migration is new.
