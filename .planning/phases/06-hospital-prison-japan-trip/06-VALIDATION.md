---
phase: 6
slug: hospital-prison-japan-trip
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + ts-jest |
| **Config file** | `jest.config.js` (existing) |
| **Quick run command** | `npm test -- --testPathPattern="hospital\|prison\|japan\|stomp\|doctor" --forceExit` |
| **Full suite command** | `npm test -- --forceExit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="hospital|prison|japan|stomp|doctor" --forceExit`
- **After every plan wave:** Run `npm test -- --forceExit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | HP-02, HOSP-01..04 | unit | `npm test -- --testPathPattern="hospital" --forceExit` | ❌ Wave 0 | ⬜ pending |
| 06-01-02 | 01 | 0 | PRISON-02,04,05 | unit | `npm test -- --testPathPattern="prison" --forceExit` | ❌ Wave 0 | ⬜ pending |
| 06-01-03 | 01 | 0 | JAPAN-01..03 | unit | `npm test -- --testPathPattern="japan-trip" --forceExit` | ❌ Wave 0 | ⬜ pending |
| 06-01-04 | 01 | 0 | STOMP-01..02 | unit | `npm test -- --testPathPattern="goomba-stomp" --forceExit` | ❌ Wave 0 | ⬜ pending |
| 06-01-05 | 01 | 0 | DOC-01..02 | unit | `npm test -- --testPathPattern="doctor-role" --forceExit` | ❌ Wave 0 | ⬜ pending |
| 06-02-01 | 02 | 1 | HP-02 | unit | `npm test -- --testPathPattern="hospital" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-02-02 | 02 | 1 | HOSP-01..04 | unit | `npm test -- --testPathPattern="hospital" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-02-03 | 02 | 1 | DOC-01..02 | unit | `npm test -- --testPathPattern="doctor-role" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-02-04 | 02 | 1 | PRISON-02,04,05,06 | unit | `npm test -- --testPathPattern="prison" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-02-05 | 02 | 1 | JAPAN-01..03 | unit | `npm test -- --testPathPattern="japan-trip" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-02-06 | 02 | 1 | STOMP-01..02 | unit | `npm test -- --testPathPattern="goomba-stomp" --forceExit` | ✅ Wave 0 | ⬜ pending |
| 06-03-01 | 03 | 2 | HOSP-03, PRISON-03 | unit | `npm test -- --forceExit` | ✅ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/hospital.test.ts` — stubs for HP-02, HOSP-01..04 (6 test cases)
  - HP ≤ 0 triggers inHospital=true and move to Tile 30
  - Roll ≤ 5 escapes hospital; roll > 5 stays (using mocked Math.random)
  - Escape grants +5 HP
  - Escape payment = Math.floor(salary/2), deducted from player
  - Doctor receives ½ Salary if isDoctor exists in room
  - Card play returns error when inHospital=true
- [ ] `tests/prison.test.ts` — stubs for PRISON-02,04,05,06 (5 test cases)
  - inPrison blocks position change on roll-dice
  - inPrison blocks salary collection at turn start
  - Escape roll: only {9, 11, 12} on 2d6 exits prison
  - Bail payment (5000) removes inPrison flag
  - Cop (isCop=true) landing on Prison tile: inPrison stays false
- [ ] `tests/japan-trip.test.ts` — stubs for JAPAN-01..03 (4 test cases)
  - Landing on Tile 20: happiness +1
  - Stay turn start: happiness +2, money -= Math.ceil(salary/5)
  - Roll ≥ 9 (2d6): forced leave, inJapan=false, position becomes 21
  - Roll ≤ 8 (2d6): player receives stay/leave choice event
- [ ] `tests/goomba-stomp.test.ts` — stubs for STOMP-01..02 (3 test cases)
  - Non-Cop player lands on occupied tile: target inJapan=true, position=20
  - Cop player lands on occupied tile: target inPrison=true, position=10
  - Multiple occupants on same tile: all stomped
- [ ] `tests/doctor-role.test.ts` — stubs for DOC-01..02 (1 test case)
  - isDoctor player receives Math.floor(salary/2) when any player exits hospital via payment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Japan Trip UI "Stay or Leave?" prompt | JAPAN-03 | Requires client WebSocket interaction | Start game, reach Tile 20, verify player device shows choice UI |
| Hospital payment prompt on player device | HOSP-01 | Requires client WebSocket rendering | Player in hospital, verify roll-or-pay UI shows on device |
| Cop role immune to Prison UI feedback | PRISON-06 | Requires Cop role from Phase 8 | Test manually once Cop career path implemented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
