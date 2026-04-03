---
phase: 5
slug: board-reset
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | jest.config.js (exists, working) |
| **Quick run command** | `npm test -- tests/board-layout.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/board-layout.test.ts`
- **After every plan wave:** Run `npm test` (full suite — catches regressions)
- **Before `/gsd:verify-work`:** Full suite must be green + manual spot-check of host board tile display
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-W0-01 | W0 | 0 | BOARD-01 | unit | `npm test -- board-layout.test.ts -t "tile type at position"` | ❌ W0 | ⬜ pending |
| 05-W0-02 | W0 | 0 | HP-01 | unit | `npm test -- board-layout.test.ts -t "player initializes with hp 10"` | ❌ W0 | ⬜ pending |
| 05-W0-03 | W0 | 0 | WIN-01 | unit | `npm test -- board-layout.test.ts -t "life total calculation"` | ❌ W0 | ⬜ pending |
| 05-W0-04 | W0 | 0 | WIN-01 | unit | `npm test -- board-layout.test.ts -t "checkWinCondition helper"` | ❌ W0 | ⬜ pending |
| 05-W0-05 | W0 | 0 | HP-01 | unit | `npm test -- state.test.ts -t "getFullState includes hp"` | ✅ update | ⬜ pending |
| 05-W1-01 | W1 | 1 | BOARD-01 | unit | `npm test -- board-layout.test.ts` | ✅ W0 | ⬜ pending |
| 05-W1-02 | W1 | 1 | HP-01 | unit | `npm test -- board-layout.test.ts -t "hp initialized"` | ✅ W0 | ⬜ pending |
| 05-W1-03 | W1 | 1 | WIN-01 | unit | `npm test -- board-layout.test.ts -t "win condition"` | ✅ W0 | ⬜ pending |
| 05-W2-01 | W2 | 2 | BOARD-02 | integration | `npm test -- game-loop.test.ts -t "stat-grid"` | ❌ W0 | ⬜ pending |
| 05-W2-02 | W2 | 2 | BOARD-03 | manual | Manual: open host.html, inspect .tile divs for name text + title tooltip | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/board-layout.test.ts` — new file: covers BOARD-01 (40 tiles, spot-check all positions), HP-01 (hp=10 init), WIN-01 (life total formula, checkWinCondition stub)
- [ ] `tests/state.test.ts` — update: add assertion for `hp` and `salary` in getFullState broadcast
- [ ] `tests/game-loop.test.ts` — update: STARTING_MONEY assertions from 50000 → 10000
- [ ] `tests/lobby.test.ts` — update: STARTING_MONEY assertions from 50000 → 10000 (if any)
- [ ] DELETE `tests/tiles-econ.test.ts` — entire file (old ECON-01..10 tests; tiles no longer exist)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host board tile names visible on tile divs | BOARD-03 | DOM rendering; no headless browser in test suite | Open host.html via `npm start`, join game, inspect each .tile div — text should show abbreviated tile name (max 10 chars) |
| Host board hover tooltips show full instructions | BOARD-03 | CSS hover state; not testable in Jest | Hover over each .tile div in browser — tooltip should appear with full instruction text from GAME-DESIGN.md |
| Player screen stat grid shows all 6 stats | BOARD-02 | Live socket state required | Join game as player, verify Money/Fame/Happiness (row 1) and HP/Degree/Career (row 2) are all visible |
| Active tile instruction updates per turn | BOARD-02 | Requires live game session | Land on a tile, verify instruction panel below stat grid updates with tile name + instruction text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
