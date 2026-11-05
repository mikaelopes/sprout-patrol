# Sprout Patrol -- Claude Code Game Studios

Mikael's mobile maze game, developed with Claude Code Game Studios (Godot/Unity/Unreal
specialists removed: this is a plain web game). Each agent owns a specific domain.

**Read first:** `design/game-brief.md` (what the game is and the owner's fixed decisions),
`.claude/docs/technical-preferences.md` (forbidden patterns, budgets, routing),
`design/accessibility-requirements.md` (readability commitments).

## Technology Stack

- **Engine**: none -- HTML5 Canvas 2D + vanilla JavaScript, shipped as ONE html file
- **Language**: JavaScript (ES2020), CSS, HTML
- **Version Control**: Git, trunk-based on `main`; GitHub Pages serves `main` root
- **Build System**: `python3 tools/build.py --check` -> `dist/sprout-patrol.html` (Claude artifact) + `index.html` (Pages)
- **Asset Pipeline**: sprites are WebP data URIs in `src/js/art.js`; no runtime asset files
- **Tests**: `bash tests/run.sh` (fast gate) and `tests/sim/` (Playwright bot balance sims)

## Project Structure

@.claude/docs/directory-structure.md

Code root `src/`: `head.html`, `body.html`, `css/game.css`, and `js/*.js` concatenated in
`src/build.json` order inside ONE closure (shared scope, no modules). Never edit `index.html`
or `dist/` by hand. Published artifact: https://claude.ai/artifact/AC5g1tTCceFVtT2S2hdthi
(capabilities `db`, `user`); Pages: https://mikaelopes.github.io/sprout-patrol/

## Engine Version Reference

@docs/engine-reference/web/VERSION.md


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

> **Brownfield project in Production.** Orient with `/help` or `/project-stage-detect`,
> not `/start`. Ship flow: `bash tests/run.sh` -> commit -> push (Pages) -> republish the artifact.

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
