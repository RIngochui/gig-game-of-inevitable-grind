---
phase: 06-hospital-prison-japan-trip
plan: 04
subsystem: game-mechanics
tags: [prison, prisonTurns, counter, host-display, requirements-fix]

# Dependency graph
requires:
  - phase: 06-hospital-prison-japan-trip
    provides: "Prison escape/bail/Goomba Stomp handlers (Plan 02), client event handlers (Plan 03)"
provides:
  - "prisonTurns counter on Player model with full increment/reset lifecycle"
  - "Host dot badge showing turns-served count [P:N] for imprisoned players"
  - "turnsServed field in prison-stayed event payload"
  - "Corrected REQUIREMENTS.md PRISON-04 (2d6 mechanic) and STOMP-01 (Cop/non-Cop routing)"
affects: [host-screen, prison-mechanics, requirements-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["prisonTurns counter reset on all imprisonment entry points (fresh, stomp, escape, bail)"]

key-files:
  created: []
  modified:
    - server.ts
    - client/game.ts
    - public/game.js
    - tests/prison.test.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "prisonTurns resets to 0 on ALL entry points: fresh imprisonment, Goomba Stomp, escape, and bail"
  - "turnsServed included in prison-stayed emit payload for client-side display"

patterns-established:
  - "Counter fields follow lifecycle: init 0 in createPlayer, reset 0 on state entry, increment on stay, reset 0 on exit, broadcast in getFullState"

requirements-completed: [PRISON-06]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 6 Plan 04: Gap Closure (prisonTurns Counter and REQUIREMENTS.md Fixes) Summary

**prisonTurns counter tracking turns served in prison with host badge [P:N] display and corrected REQUIREMENTS.md escape/stomp documentation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T06:38:44Z
- **Completed:** 2026-04-03T06:41:54Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added prisonTurns: number to Player interface with full lifecycle (init 0, increment on failed escape, reset on escape/bail/fresh imprisonment/Goomba Stomp)
- Updated host dot badge from [P] to [P:N] showing turns-served counter, compiled to game.js
- Corrected REQUIREMENTS.md: PRISON-04 now says "roll 2d6, escape on 9/11/12" and STOMP-01 describes Cop/non-Cop routing
- Added 2 new PRISON-06 tests (increment on failed escape + reset on successful escape), total 7 prison tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add prisonTurns field to Player model and wire increment/reset in prison handlers** - `83e6119` (feat)
2. **Task 2: Update host dot badge to show prison turn count and recompile game.js** - `2676e59` (feat)
3. **Task 3: Update REQUIREMENTS.md PRISON-04 and STOMP-01 stale text** - `66184d5` (docs)

## Files Created/Modified
- `server.ts` - Added prisonTurns to Player interface, createPlayer, getFullState; increment/reset in all prison handlers
- `client/game.ts` - Changed host dot badge from [P] to [P:N] with prisonTurns counter
- `public/game.js` - Recompiled from game.ts with updated badge logic
- `tests/prison.test.ts` - Added 2 new PRISON-06 tests for counter increment/reset
- `.planning/REQUIREMENTS.md` - Updated PRISON-04 (2d6 mechanic) and STOMP-01 (Cop/non-Cop routing)

## Decisions Made
- prisonTurns resets to 0 on ALL imprisonment entry points (fresh landing, Goomba Stomp) -- ensures counter always starts fresh
- turnsServed field added to prison-stayed emit payload for potential future client-side use

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Jest testPathIgnorePatterns includes `/.claude/worktrees/` -- tests must be run with `--testPathIgnorePatterns="/node_modules/"` override when in a worktree. Not a code issue; worktree-specific Jest configuration.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 verification gaps from 06-VERIFICATION.md are now closed
- Phase 6 is complete: Hospital, Prison, Japan Trip, Goomba Stomp, Doctor Role, and prisonTurns counter all implemented
- 14 test suites, 211 tests, 0 failures
- Ready for Phase 7 (College and Career Paths)

## Self-Check: PASSED

All 5 modified files exist. All 3 task commits verified (83e6119, 2676e59, 66184d5).

---
*Phase: 06-hospital-prison-japan-trip*
*Completed: 2026-04-03*
