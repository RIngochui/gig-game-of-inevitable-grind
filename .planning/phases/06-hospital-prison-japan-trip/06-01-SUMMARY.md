---
phase: "06-hospital-prison-japan-trip"
plan: "01"
subsystem: "test-scaffolding"
tags: ["tdd", "wave-0", "hospital", "prison", "japan-trip", "goomba-stomp", "doctor"]
dependency_graph:
  requires: []
  provides: ["HP-02", "HOSP-01", "HOSP-02", "HOSP-03", "HOSP-04", "DOC-01", "DOC-02", "PRISON-01", "PRISON-02", "PRISON-03", "PRISON-04", "PRISON-05", "PRISON-06", "JAPAN-01", "JAPAN-02", "JAPAN-03", "STOMP-01", "STOMP-02"]
  affects: ["tests/hospital.test.ts", "tests/doctor-role.test.ts", "tests/prison.test.ts", "tests/japan-trip.test.ts", "tests/goomba-stomp.test.ts"]
tech_stack:
  added: []
  patterns: ["TDD Wave 0 scaffolding — failing RED tests before implementation", "require('../server') dynamic import for not-yet-exported functions", "Math.random mocking for deterministic 1d6 and 2d6 rolls"]
key_files:
  created:
    - "tests/hospital.test.ts"
    - "tests/doctor-role.test.ts"
    - "tests/prison.test.ts"
    - "tests/japan-trip.test.ts"
    - "tests/goomba-stomp.test.ts"
  modified: []
decisions:
  - "Use require('../server').fn() pattern for functions not yet exported — throws 'not a function' in RED, becomes callable in GREEN"
  - "Math.random mocking via replacement: origRandom saved/restored; callCount for 2d6 alternating dice"
  - "PRISON-01 tile sanity check intentionally stays GREEN — confirms existing board layout, not Wave 0 gap"
  - "2d6 for Japan Trip forced-leave threshold (roll >= 9) per RESEARCH.md recommendation"
  - "Bail amount = $5,000 flat per RESEARCH.md recommendation"
  - "Hospital escape: 1d6 roll <= 5 (5 out of 6 chance to escape)"
metrics:
  duration: "5min"
  completed_date: "2026-04-03"
  tasks: 2
  files: 5
---

# Phase 6 Plan 1: Wave 0 Test Scaffolding (Hospital, Prison, Japan Trip, Goomba Stomp, Doctor) Summary

Wave 0 TDD scaffolding — 5 failing test files encoding exact game mechanic thresholds for Hospital/Prison/Japan Trip/Goomba Stomp/Doctor role, all RED against current server.ts for Plan 02 to turn green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write failing tests for Hospital and Doctor role | eb34a02 | tests/hospital.test.ts, tests/doctor-role.test.ts |
| 2 | Write failing tests for Prison, Japan Trip, and Goomba Stomp | 7f46566 | tests/prison.test.ts, tests/japan-trip.test.ts, tests/goomba-stomp.test.ts |

## Test Coverage Summary

| File | Requirement IDs | Assertions | Status |
|------|----------------|------------|--------|
| tests/hospital.test.ts | HP-02, HOSP-01a, HOSP-01b, HOSP-02, HOSP-03, HOSP-04 | 6 | RED (all failing) |
| tests/doctor-role.test.ts | DOC-02 | 1 | RED (failing) |
| tests/prison.test.ts | PRISON-01, PRISON-02, PRISON-03, PRISON-04, PRISON-05 | 5 | PRISON-01 GREEN (sanity), rest RED |
| tests/japan-trip.test.ts | JAPAN-01, JAPAN-02a, JAPAN-02b, JAPAN-03 | 4 | RED (all failing) |
| tests/goomba-stomp.test.ts | STOMP-01, STOMP-01b, STOMP-02 | 3 | RED (all failing) |

**Total:** 19 assertions, 18 failing (RED), 1 passing (PRISON-01 sanity check - intentional)

## Key Thresholds Encoded in Tests

- Hospital escape: 1d6 roll <= 5 escapes (roll = 6 stays)
- Hospital HP gain on escape: +5 HP
- Hospital payment: Math.floor(salary / 2) = 5000 when salary = 10000
- Hospital tile: position 30
- Doctor passive: receives Math.floor(salary/2) when any patient escapes
- Prison escape: 2d6 roll must be exactly {9, 11, 12}
- Prison bail: $5,000 flat payment
- Prison tile: position 10
- Japan Trip landing: +1 Happiness
- Japan Trip stay: +2 Happiness per turn, Math.ceil(salary/5) = 2000 drain (salary=10000)
- Japan Trip forced leave: 2d6 >= 9, player moves to position 21
- Japan Trip tile: position 20
- Goomba Stomp (non-Cop): target → position 20, inJapan=true
- Goomba Stomp (Cop): target → position 10, inPrison=true
- Multiple occupants all stomped

## Verification Results

```
Test Suites: 5 failed (Phase 6), 9 passed (existing), 14 total
Tests:       18 failed (Phase 6 RED), 191 passed (existing GREEN), 209 total
```

Existing test suite fully green — no regression introduced.

## Deviations from Plan

**1. [Rule 3 - Blocking] Worktree jest testPathIgnorePatterns excludes worktree paths**
- **Found during:** Task 1 verification
- **Issue:** The `package.json` `testPathIgnorePatterns` contains `/.claude/worktrees/` which excluded test files when running from the worktree directory
- **Fix:** Added `--testPathIgnorePatterns="/node_modules/"` override flag when running jest in the worktree to remove the worktree exclusion during development
- **Files modified:** None (runtime flag only; plan 02 may need to address this)
- **Commit:** N/A (no code change needed)

## Known Stubs

None — this plan creates test scaffolding only, no implementation code.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| tests/hospital.test.ts | FOUND |
| tests/doctor-role.test.ts | FOUND |
| tests/prison.test.ts | FOUND |
| tests/japan-trip.test.ts | FOUND |
| tests/goomba-stomp.test.ts | FOUND |
| Commit eb34a02 (hospital + doctor-role) | FOUND |
| Commit 7f46566 (prison + japan-trip + goomba-stomp) | FOUND |
