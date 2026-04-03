---
phase: 05-board-reset
plan: "01"
subsystem: tests
tags: [tdd, board-layout, hp, win-condition, test-infrastructure]
dependency_graph:
  requires: []
  provides: [board-layout-tests, hp-init-tests, win-condition-tests, stub-tile-tests]
  affects: [05-02-PLAN, 05-03-PLAN]
tech_stack:
  added: []
  patterns: [TDD-RED, spot-check-each, it.each]
key_files:
  created:
    - tests/board-layout.test.ts
  modified:
    - tests/state.test.ts
  deleted:
    - tests/tiles-econ.test.ts
decisions:
  - "Delete tiles-econ.test.ts: old ECON-01..10 handlers removed in Phase 5; tests invalid"
  - "board-layout.test.ts written fully RED: STARTING_HP and checkWinCondition don't exist yet in server.ts"
  - "state.test.ts uses dynamic require pattern for getFullState (matches existing file convention)"
metrics:
  duration: 2min
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 3
---

# Phase 5 Plan 01: Test Infrastructure (Wave 1 TDD RED) Summary

**One-liner:** TDD RED test suite — board layout spot-checks for all 40 tiles, HP init, win-condition formula, and getFullState assertions, all failing against current server.ts (contracts for Plan 02 to satisfy).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete tiles-econ.test.ts and write board-layout.test.ts | cfb6583 | tests/board-layout.test.ts (+), tests/tiles-econ.test.ts (D) |
| 2 | Update state.test.ts with hp/salary/getFullState tests | 64d1a64 | tests/state.test.ts |

## What Was Built

**tests/board-layout.test.ts** — New file with 5 test suites:

1. `BOARD-01 board layout — 40 tiles` — 44 tests: structure assertions + `it.each` spot-check all 40 tile types/positions from GAME-DESIGN.md
2. `HP-01 player HP initialization` — 3 tests: `p.hp === STARTING_HP`, `STARTING_HP === 10`, `p.salary === 10000`
3. `D-11 STARTING_MONEY is 10000` — 2 tests: constant and createPlayer money
4. `WIN-01 win condition formula` — 5 tests: Life Total formula, formula satisfaction logic, null formula guard, floor truncation
5. `BOARD-01 stub tiles reach advanceTurn without throwing` — 19 tests via `it.each` covering all new stub tile indices

**tests/state.test.ts** — Updated:
- Added `getFullState` variable declaration and `beforeEach` assignment
- Added `test('initializes hp to 10')` in `createPlayer` describe
- Added `test('initializes salary to 10000')` in `createPlayer` describe
- Added `describe('getFullState')` block asserting `hp` and `salary` are present in player snapshot

**tests/tiles-econ.test.ts** — Deleted (old ECON-01..10 test handlers that no longer exist in Phase 5 board design).

## RED State Confirmation

Running `npm test -- tests/board-layout.test.ts` produces FAIL with TypeScript errors:
- `Module '../server' has no exported member 'STARTING_HP'`
- `Module '../server' has no exported member 'checkWinCondition'`
- `Property 'hp' does not exist on type 'Player'`
- `Property 'salary' does not exist on type 'Player'`

Running `npm test -- tests/state.test.ts` produces FAIL with:
- `Property 'hp' does not exist on type 'Player'`
- `Property 'salary' does not exist on type 'Player'`

This is the expected RED state. Plan 02 will add these exports and make these tests GREEN.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan only writes tests, not implementation.

## Self-Check: PASSED

- tests/board-layout.test.ts: FOUND
- tests/state.test.ts: FOUND (modified)
- tests/tiles-econ.test.ts: correctly absent
- Commit cfb6583: FOUND
- Commit 64d1a64: FOUND
