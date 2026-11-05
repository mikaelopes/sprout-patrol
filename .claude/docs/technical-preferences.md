# Technical Preferences

<!-- project.yaml is the machine-readable source of truth; this file is the human-readable
     companion. Forbidden patterns and allowed libraries live ONLY here. -->

## Engine & Language

- **Engine**: none (custom web). HTML5 Canvas 2D + DOM overlay for menus
- **Language**: JavaScript (ES2020), CSS, HTML. No TypeScript, no framework
- **Rendering**: Canvas 2D (maze, actors, FX) + HTML/CSS cards for menus and HUD
- **Physics**: none. Grid movement with tile-centre interpolation
- **Reference**: @docs/engine-reference/web/VERSION.md

## Input & Platform

- **Target Platforms**: Mobile web (iOS Safari, Android Chrome) first; desktop/tablet browsers
- **Delivery**: ONE self-contained html file, shipped twice from the same build:
  as a Claude artifact (`dist/sprout-patrol.html`) and on GitHub Pages (`index.html`)
- **Input Methods**: Touch (swipe + optional thumb pad + double-tap special), keyboard (arrows/WASD, Space, P)
- **Primary Input**: Touch
- **Gamepad Support**: None
- **Touch Support**: Full
- **Platform Notes**: phones render at 1x; `--uiz` scales menus up to 1.75x on big screens.
  The Claude host adds the doctype/viewport skeleton; `tools/build.py` adds it for Pages.

## Naming Conventions

- **Functions / variables**: camelCase (`updatePlayer`, `meta`, `run`)
- **Constants / tables**: SCREAMING_SNAKE (`BAL`, `PEST_INTRO`, `CHARS`)
- **Files**: kebab-case in `src/js/`, order defined in `src/build.json`
- **Strings**: keys in the `S` table in `src/js/i18n.js`, read with `t(key)`

## Performance Budgets

- **Target Framerate**: 60 fps on a mid-range phone
- **Frame Budget**: 16.67 ms
- **Load size**: keep the single file under 3 MB (art is ~2.2 MB of it)
- **Memory Ceiling**: not set

## Testing

- **Framework**: Playwright (Chromium) driving the real built page; no unit-test framework
- **Fast gate**: `bash tests/run.sh` (build check, load errors, state tests, 140-cell counter table, save flows)
- **Balance sims**: `tests/sim/` (tune.js bands, campaign.js season length, heroes.js parity,
  readab.js readability, ftue.js first play). Run when numbers or pests change.
- **UI evidence**: screenshots via `tests/smoke/tour.js`, retained in `production/qa/evidence/`

## Forbidden Patterns

- Runtime network calls, except (a) the Google Font stylesheet and (b) cloud save AFTER the
  player opts in (Claude artifact db, or Firebase via gstatic when outside Claude)
- External files at runtime (images, scripts, JSON). Everything is inlined by the build
- Changing the save key `tufttrail-v2`, or any save change without a migration in `applySave`
  that loads every older save shape
- `localStorage` access without try/catch (private mode / blocked storage must still play)
- Player-facing text that is not in BOTH `pt` and `en`
- Colour as the only carrier of meaning (fruit shapes/icons must back it up)
- Flashes faster than 3 per second; motion that ignores `reduceMotion`
- Editing `index.html` or `dist/` by hand (they are build outputs)

## Allowed Libraries / Addons

- Firebase JS SDK 10.12.2 (app, auth, firestore) loaded from gstatic, only after opt-in, only outside Claude
- Playwright (dev only, tests)
- Python 3 standard library (build and analysis scripts)

## Architecture Decisions Log

- Single closure, ordered concatenation of `src/js/*.js` (see `tools/build.py` docstring)
- Cloud save abstraction: one `{get,set}` ref shape for Claude db and Firebase (`src/js/save.js`)

## Engine Specialists

- **Primary**: lead-programmer
- **Language/Code Specialist**: gameplay-programmer
- **Shader Specialist**: technical-artist (canvas drawing, sprites, FX)
- **UI Specialist**: ui-programmer
- **Additional Specialists**: performance-analyst (load size, frame time), localization-lead (PT/EN)
- **Routing Notes**: there is no engine specialist; route engine-level questions to lead-programmer

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (`src/js/*.js`) | gameplay-programmer |
| Rendering (`render-*.js`, `fx.js`, `art.js`) | technical-artist |
| UI / screen files (`screens.js`, `menu-core.js`, `hud-cards.js`, `onboarding.js`, `src/css/`) | ui-programmer |
| Strings (`i18n.js`) | localization-lead |
| Scene / level files | n/a (mazes are generated in `maze.js`) |
| General architecture review | lead-programmer |
