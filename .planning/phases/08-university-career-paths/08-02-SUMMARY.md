---
phase: 08-university-career-paths
plan: 02
subsystem: game-logic
tags: [career-paths, player-model, typescript, config, data-layer]

requires:
  - phase: 08-university-career-paths
    plan: 01
    provides: TDD Wave 0 RED stubs for career-paths and university-path

provides:
  - CAREER_PATHS config with all 10 paths matching CAREERS.md
  - PathTile and CareerPath TypeScript interfaces
  - Player model extended with 6 path state fields
  - TURN_PHASES extended with 3 new phases
  - Tile 22 renamed from DEI_OFFICER to PEOPLE_AND_CULTURE everywhere
  - enterPath() and exitPath() helper functions exported

affects:
  - 08-03-PLAN (GREEN wave for career path mechanics uses CAREER_PATHS and enterPath/exitPath)
  - 08-04-PLAN (University path GREEN wave uses CAREER_PATHS.UNIVERSITY and WAITING_FOR_DEGREE_CHOICE)

tech-stack:
  added: []
  patterns:
    - "CAREER_PATHS: Record<string, CareerPath> — single config file for all path data (user preference from MEMORY.md)"
    - "pvpEffects array (plural) on PathTile for multi-stat PvP effects"
    - "salaryMultiplierCash field on PathTile for computed cash rewards"
    - "enterPath/exitPath helpers encapsulate all inPath state mutations"

key-files:
  created: []
  modified:
    - server.ts (CAREER_PATHS config, Player model extension, TURN_PHASES, tile-22 rename, enterPath/exitPath)
    - tests/board-layout.test.ts (tile-22 rename: DEI_OFFICER → PEOPLE_AND_CULTURE)
    - tests/game-loop.test.ts (career-path tile type list updated for PEOPLE_AND_CULTURE)

key-decisions:
  - "pvpEffects (array, plural) replaces pvpEffect (singular) on PathTile for multi-stat consistency"
  - "salaryMultiplierCash field added to PathTile for Starving Artist Tile 8 (2x salary as cash)"
  - "Right-Wing Grifter Tile 1 uses diceTarget: 'fame' not 'cash' per CAREERS.md (plan noted this correction)"
  - "CAREER_PATHS exported via export const (not re-exported from block) to avoid TS2323 redeclare error"
  - "board-layout.test.ts and game-loop.test.ts updated as Rule 1 auto-fix for tile-22 rename"

requirements-completed:
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
  - COLL-01
  - COLL-02
  - COLL-04
  - COLL-05

duration: 4min
completed: 2026-04-04
---

# Phase 8 Plan 02: CAREER_PATHS Config, Player Model Extension, Path Helpers Summary

**CAREER_PATHS data config with all 10 paths (~90 tiles of data), Player model extended with 6 path state fields, 3 new TURN_PHASES, Tile 22 renamed to PEOPLE_AND_CULTURE, and enterPath/exitPath helpers — all compiling with 0 TypeScript errors and 220 tests passing**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-04T23:55:00Z
- **Completed:** 2026-04-04T23:59:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Merged worktree branch to main (fast-forward from 10f74e7 to 62e297d to get Phase 7 + Plan 08-01 sync)
- Added PathTile and CareerPath TypeScript interfaces with pvpEffects array and salaryMultiplierCash fields
- Created CAREER_PATHS const with all 10 paths matching CAREERS.md canonical data exactly
- Extended Player interface with 6 new fields: inPath, currentPath, pathTile, isArtist, copWaitTurns, streamerAttemptsUsed
- Extended createPlayer factory to initialize all 6 new fields with correct defaults
- Extended getFullState to serialize all 6 new player fields
- Added 3 new TURN_PHASES: WAITING_FOR_CAREER_DECISION, WAITING_FOR_STREAMER_ROLL, WAITING_FOR_DEGREE_CHOICE
- Renamed Tile 22 type and name from DEI_OFFICER/DEI Officer to PEOPLE_AND_CULTURE/People & Culture in BOARD_TILES and dispatchTile
- Created enterPath() and exitPath() helpers encapsulating all inPath state mutations
- Updated tests/board-layout.test.ts and tests/game-loop.test.ts for tile-22 rename

## Task Commits

1. **Task 1: CAREER_PATHS config, Player model, TURN_PHASES, Tile 22 rename, helpers** - `d03167d` (feat)

**Plan metadata:**

## Files Created/Modified

- `server.ts` - CAREER_PATHS (10 paths), PathTile/CareerPath interfaces, Player extension (6 fields), TURN_PHASES (3 new), tile-22 rename, enterPath/exitPath helpers
- `tests/board-layout.test.ts` - Updated tile-22 assertion to PEOPLE_AND_CULTURE
- `tests/game-loop.test.ts` - Updated career-path types list to include PEOPLE_AND_CULTURE

## Decisions Made

- pvpEffects (plural array) used instead of pvpEffect (singular) for P&C Specialist Tile 8 multi-stat support; all tiles converted to array form for consistency
- salaryMultiplierCash field added to PathTile interface for Starving Artist Tile 8 (2x salary as cash computation)
- Right-Wing Grifter Tile 1 uses `diceTarget: 'fame'` per CAREERS.md canonical data (plan's template had 'cash' which was the noted correction)
- CAREER_PATHS exported via `export const` declaration (not added to the named exports block) to avoid TypeScript TS2323 redeclare error

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed board-layout.test.ts and game-loop.test.ts after tile-22 rename**
- **Found during:** Task 1 (running tests after renaming DEI_OFFICER to PEOPLE_AND_CULTURE)
- **Issue:** tests/board-layout.test.ts line 59 had `{ index: 22, type: 'DEI_OFFICER', name: 'DEI Officer' }` and tests/game-loop.test.ts line 145 had `'DEI_OFFICER'` in the career tile types array — both failed after tile-22 rename
- **Fix:** Updated board-layout.test.ts to `PEOPLE_AND_CULTURE / 'People & Culture'` and game-loop.test.ts career types array to use PEOPLE_AND_CULTURE
- **Files modified:** tests/board-layout.test.ts, tests/game-loop.test.ts
- **Commit:** d03167d

**2. [Rule 3 - Blocking] Merged main branch (62e297d) into worktree before executing plan**
- **Found during:** Initial setup (worktree was on 10f74e7, needed Phase 7 + 08-01 changes)
- **Issue:** Worktree had stale pre-Phase-7 server.ts; needed 08-01 test stubs to be present for this plan
- **Fix:** `git merge main` fast-forward to 62e297d
- **Commit:** (no separate commit — fast-forward merge)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 blocking)
**Impact on plan:** Both deviations necessary for correctness. No scope creep.

## Known Stubs

No stubs in the files modified by this plan. The 37 remaining failing tests in career-paths.test.ts (36 stubs) and university-path.test.ts (8 stubs minus tile-22 which now passes) are intentional Wave 0 RED baselines from Plan 08-01 to be implemented in Plans 08-02 through 08-04.

Note: tile-22 test in career-paths.test.ts now passes GREEN (was previously RED because DEI_OFFICER rename was pending).

## Self-Check: PASSED

- FOUND: server.ts contains `const CAREER_PATHS: Record<string, CareerPath>`
- FOUND: server.ts contains MCDONALDS, UNIVERSITY, FINANCE_BRO, SUPPLY_TEACHER, COP, PEOPLE_AND_CULTURE, TECH_BRO, RIGHT_WING_GRIFTER, STARVING_ARTIST, STREAMER
- FOUND: server.ts Player interface has inPath, currentPath, pathTile, isArtist, copWaitTurns, streamerAttemptsUsed
- FOUND: server.ts createPlayer has `inPath: false`
- FOUND: server.ts getFullState has `inPath: player.inPath`
- FOUND: server.ts TURN_PHASES has WAITING_FOR_CAREER_DECISION, WAITING_FOR_STREAMER_ROLL, WAITING_FOR_DEGREE_CHOICE
- FOUND: server.ts BOARD_TILES[22] type is PEOPLE_AND_CULTURE
- FOUND: server.ts contains `function enterPath(` and `function exitPath(`
- FOUND commit: d03167d
- TypeScript: exit 0
- Tests: 220 passing, 37 failing (all intentional Wave 0 RED stubs from Plan 08-01)

---
*Phase: 08-university-career-paths*
*Completed: 2026-04-04*
