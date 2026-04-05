---
phase: 08-university-career-paths
plan: 03
subsystem: game-logic
tags: [career-paths, university-path, server, typescript, tdd, jest]

requires:
  - phase: 08-university-career-paths
    plan: 02
    provides: CAREER_PATHS config, PathTile/CareerPath interfaces, Player model extension, enterPath/exitPath helpers, TURN_PHASES extension

provides:
  - checkEntryRequirements function: validates degree/cash/roll entry conditions
  - handleCareerEntry function: pauses turn for entry prompt or auto-advances on unmet requirements
  - handlePathTurn function: 1d6 path traversal with special tile handling (HOSPITAL/PRISON/CANCEL_PATH/SENT_TO_PAYDAY)
  - handlePathCompletion function: role unlocks (isCop/isArtist), degree selection prompt, experience card stub
  - applyPathTileEffects function: applies fame/happiness/hp/cash/salary from path tile config
  - roll-dice handler intercepts for copWaitTurns and inPath (1d6 path rolling)
  - dispatchTile wired to handleCareerEntry for all 10 career entry tile types
  - STUDENT_LOAN_REDIRECT: deducts $15k, moves to tile 9, enters University path with waived fee
  - career-enter, career-pass, streamer-roll-attempt, choose-degree socket handlers
  - DEGREE_CAP_COLORS and AVAILABLE_DEGREES constants
  - All 37 Wave 0 RED test stubs turned GREEN (career-paths.test.ts + university-path.test.ts)

affects:
  - 08-04-PLAN (University path UI and client-side handlers use these server exports)
  - tests/career-paths.test.ts (now 30 GREEN tests)
  - tests/university-path.test.ts (now 8 GREEN tests)

tech-stack:
  added: []
  patterns:
    - "checkEntryRequirements pure function: returns { meetsRequirements, reason, fee } — testable without io"
    - "handlePathTurn: 1d6 intercept in roll-dice handler via inPath flag check"
    - "dispatchTile case fall-through for 10 career types routes all to handleCareerEntry"
    - "exitPath('completed'): unemployed stays false (keeps career badge); exitPath('hospital'/'prison'/'special'): unemployed=true"

key-files:
  created: []
  modified:
    - server.ts (DEGREE_CAP_COLORS, AVAILABLE_DEGREES, checkEntryRequirements, handleCareerEntry, applyPathTileEffects, handlePathCompletion, handlePathTurn, roll-dice intercepts, dispatchTile career routing, 4 socket handlers, exports)
    - tests/career-paths.test.ts (30 stubs replaced with real assertions using exported functions)
    - tests/university-path.test.ts (8 stubs replaced with real assertions using exported functions)

key-decisions:
  - "checkHpAndHospitalize signature is (player, room, roomCode) not (room, roomCode, playerId) — fixed two wrong calls in handlePathTurn"
  - "applyPathTileEffects takes _room/_roomCode/_playerId prefixed params (unused) — matches plan interface, kept for future PvP expansion"
  - "Wave 0 tests use pure function testing (no socket.io mock) — exercises exported checkEntryRequirements/enterPath/exitPath/applyPathTileEffects directly"
  - "cop-entry test validates copWaitTurns=1 via career-enter simulation (not via socket event) — pure unit test approach"

patterns-established:
  - "Path intercept order in roll-dice: skipNextTurn → copWaitTurns → inPath → inHospital → inPrison → normal 2d6"
  - "handleCareerEntry: if !meetsRequirements → emit prompt + advanceTurn; if rollToEnter → WAITING_FOR_STREAMER_ROLL; else → WAITING_FOR_CAREER_DECISION"
  - "handlePathCompletion: if UNIVERSITY + no degree → WAITING_FOR_DEGREE_CHOICE; else apply roleUnlock + log stub + emit pathComplete + exit + advance"

requirements-completed:
  - COLL-01
  - COLL-02
  - COLL-03
  - COLL-04
  - COLL-05
  - COLL-06
  - CAREER-01
  - CAREER-02
  - CAREER-03
  - CAREER-04
  - CAREER-05
  - CAREER-06
  - CAREER-07
  - CAREER-08
  - CAREER-09
  - CAREER-10

duration: 6min
completed: 2026-04-04
---

# Phase 8 Plan 03: Career/University Path Mechanics — Wave 0 GREEN Summary

**All 10 career paths and University path playable server-side: entry gating (degree/cash/roll), 1d6 traversal, CANCEL_PATH/HOSPITAL/PRISON/PAYDAY specials, Cop wait turn, Streamer roll entry, degree selection, role unlocks (isCop/isArtist), medical residency — 257 tests passing**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-04T~T00:17:00Z
- **Completed:** 2026-04-04T~T00:23:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented 5 new server functions: checkEntryRequirements, handleCareerEntry, handlePathTurn, handlePathCompletion, applyPathTileEffects — all exported
- Added 4 new socket handlers: career-enter, career-pass, streamer-roll-attempt, choose-degree
- Modified roll-dice handler to intercept copWaitTurns (Cop wait turn mechanic) and inPath (1d6 path rolling)
- Rewired dispatchTile: all 10 career tile types now route to handleCareerEntry; STUDENT_LOAN_REDIRECT enters University with $0 fee
- Turned all 37 Wave 0 RED stubs GREEN (30 in career-paths.test.ts + 8 in university-path.test.ts — 1 tile-22 was already GREEN from Plan 02)
- Full suite: 257 tests passing, 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement career/university path mechanics on server** - `2b2f703` (feat)
2. **Task 2: Turn all Wave 0 RED test stubs GREEN** - `72088e1` (test)

**Plan metadata:** (this commit)

## Files Created/Modified

- `server.ts` - DEGREE_CAP_COLORS + AVAILABLE_DEGREES constants, 5 path mechanic functions, 4 socket handlers, roll-dice intercepts, dispatchTile career routing, exports update
- `tests/career-paths.test.ts` - All 30 stubs replaced with real assertions using exported functions
- `tests/university-path.test.ts` - All 8 stubs replaced with real assertions using exported functions

## Decisions Made

- `checkHpAndHospitalize` signature is `(player, room, roomCode)` not `(room, roomCode, playerId)` — found and auto-fixed two wrong calls in handlePathTurn (the plan's pseudocode had the wrong order)
- Wave 0 tests use pure function testing approach (no socket.io mock needed) — tests exercise exported checkEntryRequirements/enterPath/exitPath/applyPathTileEffects directly without triggering socket emissions
- cop-entry test validates copWaitTurns by simulating the career-enter logic directly rather than firing a socket event
- STUDENT_LOAN_REDIRECT stub removed from the catch-all stub case and now has its own proper case before the career entry fall-through

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed checkHpAndHospitalize argument order in handlePathTurn**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** Plan's pseudocode called `checkHpAndHospitalize(room, roomCode, playerId)` but the actual server.ts signature is `checkHpAndHospitalize(player, room, roomCode)`. This caused TS2345 type errors at lines 1405 and 1446.
- **Fix:** Changed both calls to `checkHpAndHospitalize(player, room, roomCode)` where `player` is already the resolved player object in handlePathTurn scope.
- **Files modified:** server.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 2b2f703 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered

- Worktree was at commit 10f74e7 (pre-Phase-7), missing all Plan 08-01 and 08-02 changes. Resolved by `git merge main` (fast-forward to d73d76b) before starting implementation.

## Known Stubs

None. All Wave 0 RED stubs have been replaced with real assertions.

The `console.log` experience card stub in `handlePathCompletion` is an intentional deferral per D-21 — full experience card deck is Phase 9 scope.

## Self-Check: PASSED

- FOUND: server.ts contains `function checkEntryRequirements(`
- FOUND: server.ts contains `function handleCareerEntry(`
- FOUND: server.ts contains `function handlePathTurn(`
- FOUND: server.ts contains `function handlePathCompletion(`
- FOUND: server.ts contains `function applyPathTileEffects(`
- FOUND: server.ts contains `socket.on('career-enter'`
- FOUND: server.ts contains `socket.on('career-pass'`
- FOUND: server.ts contains `socket.on('streamer-roll-attempt'`
- FOUND: server.ts contains `socket.on('choose-degree'`
- FOUND: server.ts roll-dice contains `if (player.inPath && player.currentPath)`
- FOUND: server.ts roll-dice contains `copWaitTurns`
- FOUND: server.ts dispatchTile contains `handleCareerEntry(room, roomCode, playerId, tileType`
- FOUND: server.ts dispatchTile contains `case 'STUDENT_LOAN_REDIRECT'` with `enterPath(player, 'UNIVERSITY')`
- FOUND: server.ts exports contains `handleCareerEntry`
- TypeScript: exit 0
- Tests: 257 passing, 0 failing

---
*Phase: 08-university-career-paths*
*Completed: 2026-04-04*
