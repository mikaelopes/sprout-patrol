# Accessibility Requirements

> **Status**: Committed
> **Author**: Mikael + ux-designer
> **Last Updated**: 2026-11-05
> **Accessibility Tier Target**: Basic, plus selected Standard/Comprehensive items below
> **Platform(s)**: Mobile web (iOS / Android browsers), desktop browsers
> **External Standards Targeted**: WCAG 2.1 AA for menu text contrast; Apple/Google touch-target guidance
> **Accessibility Consultant**: None engaged
> **Linked Documents**: `design/game-brief.md`, `design/revamp/menus-onboarding.md`

## This Project's Commitment

**Target Tier**: Basic, with these items lifted above it.

**Rationale**: A fast colour-matching arcade game is most at risk for colour-blind players,
photosensitive players and players overwhelmed by motion. Those are covered with hard,
tested rules. Remapping and screen-reader support are out of scope for a one-file touch game.

**Features explicitly in scope (beyond tier baseline)**:
- Fruit identity is carried by shape/icon as well as colour; gameplay readable in greyscale
  and under deuteranopia/protanopia simulation (`tests/sim/readab.js` + `readab.py`).
- Every threat has a telegraph of at least 0.4 s before it can hit.
- No flash faster than 3 per second; `prefers-reduced-motion` turns off shake, bob and big flashes.
- Hit-cause logging so players (and playtests) can see what hit them.
- Touch targets at least 44x44 CSS px on phones; menus scale up on big screens (`--uiz`).
- All text in PT and EN, short sentences (teaching moments at most 8 words).

**Features explicitly out of scope**:
- Input remapping, gamepad, screen reader for the canvas game, subtitles (there is no voice).

## Verification

| Check | How |
|---|---|
| Colour / greyscale readability | `node tests/sim/readab.js dist/sprout-patrol.html OUT` then `python3 tests/sim/readab.py OUT` |
| Telegraph >= 0.4 s | counter table + state tests (`tests/run.sh`) |
| Flash rate / reduced motion | code review of `fx.js` / `render-*.js`; screenshot with reduced motion emulated |
| Touch targets / text length | screenshot tour (`tests/smoke/tour.js`, EN and pt-BR) |
