# Sprout Patrol -- Claude Code Game Studios setup

Mikael's mobile browser game (PT/EN), run with the Claude Code Game Studios agents
(engine-specific Godot/Unity/Unreal agents removed). Each agent owns a domain;
the collaboration protocol below still applies.

## Technology Stack

- **Engine**: none (custom). HTML5 Canvas 2D + vanilla JavaScript (ES2020)
- **Language**: JavaScript, CSS, HTML
- **Version Control**: Git, trunk (`main`); GitHub Pages deploys `main` / root
- **Build System**: `python3 tools/build.py --check` concatenates `src/` into ONE html file
- **Asset Pipeline**: sprites are base64 WebP data URIs in `src/js/art.js` (no external files at runtime)

## Project Structure

- `src/head.html`, `src/body.html`, `src/css/game.css`: page shell and styles
- `src/js/*.js`: game code, concatenated in the order listed in `src/build.json` inside a
  single closure (shared scope, no modules). A file may use another file's top-level names
  at call time; at load time only names from earlier files exist.
- `dist/sprout-patrol.html`: build output published as the Claude artifact
  (https://claude.ai/artifact/AC5g1tTCceFVtT2S2hdthi, capabilities `db`, `user`)
- `index.html`: build output for GitHub Pages (adds doctype + mobile viewport). Never edit by hand.
- `tests/run.sh`: fast gate (build, load errors, state tests, 140-cell counter table, save flows)
- `tests/sim/`: Playwright bot harness for balance (tune.js bands, campaign.js, heroes.js parity,
  readab.js readability, ftue.js first play). Uses the `window.__g` hook from `mkpage.js`.
- `design/`, `docs/`, `production/`: studio documents (GDDs, ADRs, sprints)

See @.claude/docs/directory-structure.md for the studio layout; for this project the
code root is `src/` and the test root is `tests/`.

## Hard Constraints (owner decisions -- do not change without asking Mikael)

- The game ships as ONE self-contained html file, playable as a Claude artifact AND on GitHub Pages.
- Name is "Sprout Patrol" in every language. All in-game text exists in PT and EN, kept as short as possible.
- Save key `tufttrail-v2` never changes; old saves must always load (see `applySave` migrations).
- Cloud save is opt-in: no network calls until the player taps Connect / Sign in with Google.
  In Claude it uses the artifact db; outside Claude it uses Firebase (keys in `src/js/save.js`
  are public by design; Firestore rules restrict `saves/{uid}` to that uid).
- Mac is the no-move tank hero. Hero win rates stay within +-5 points of each other.
- Readability: telegraphs >= 0.4 s, flashes <= 3/s, reduced motion respected, colors readable in
  greyscale and for deuteranopes (4 fruit colors, shapes carry meaning).
- Never publish or send zip files.

## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`. It is not imported here: before
`/setup-engine` runs it is almost entirely `[TO BE CONFIGURED]` placeholders, and
after it runs `project.yaml` holds the real values.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.claude/rules/agent-memory.md`)
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this file's folder? Warn first: hooks, deny rules and the
  ask-first mode load only when Claude Code starts here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> This is a brownfield project already in Production. Use `/adopt` or
> `/project-stage-detect` instead of `/start` when orienting.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)
