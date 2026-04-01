---
phase: 4
slug: economic-tiles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest + ts-jest (existing from Phase 3) |
| **Config file** | `jest.config.json` (in package.json) |
| **Quick run command** | `npm test -- tiles-econ.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (quick) / ~15 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tiles-econ.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | W0 | 0 | ECON-01..10 | unit | `npm test -- tiles-econ.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | ECON-01 | unit | `npm test -- tiles-econ.test.ts -t "ECON-01"` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | ECON-02 | unit | `npm test -- tiles-econ.test.ts -t "ECON-02"` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 1 | ECON-03 | unit | `npm test -- tiles-econ.test.ts -t "ECON-03"` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 1 | ECON-04 | unit | `npm test -- tiles-econ.test.ts -t "ECON-04"` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 1 | ECON-05 | unit | `npm test -- tiles-econ.test.ts -t "ECON-05"` | ❌ W0 | ⬜ pending |
| 4-06-01 | 06 | 2 | ECON-06 | unit | `npm test -- tiles-econ.test.ts -t "ECON-06"` | ❌ W0 | ⬜ pending |
| 4-07-01 | 07 | 2 | ECON-07 | unit | `npm test -- tiles-econ.test.ts -t "ECON-07"` | ❌ W0 | ⬜ pending |
| 4-08-01 | 08 | 2 | ECON-08 | unit | `npm test -- tiles-econ.test.ts -t "ECON-08"` | ❌ W0 | ⬜ pending |
| 4-09-01 | 09 | 3 | ECON-09 | unit | `npm test -- tiles-econ.test.ts -t "ECON-09"` | ❌ W0 | ⬜ pending |
| 4-10-01 | 10 | 3 | ECON-10 | unit | `npm test -- tiles-econ.test.ts -t "ECON-10"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tiles-econ.test.ts` — stub test file with describe blocks for ECON-01..10 (10–15 test cases each covering stateless, stateful, social, and transactional patterns)
- [ ] `server.ts` Player interface — add `hasPonziFlag: boolean` field
- [ ] `server.ts` BOARD_TILES — add economic tile types: `SPORTS_BETTING`, `INVESTMENT_POOL`, `COVID_STIMULUS`, `TAX_AUDIT`, `SCRATCH_TICKET`, `CRYPTO`, `NEPOTISM`, `UNION_STRIKE`, `PONZI_SCHEME`, `STUDENT_LOAN_PAYMENT`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nepotism choice prompt displayed to player | ECON-07 | Requires UI interaction — player must see choice modal and select a target player | Load game, land on Nepotism tile, verify modal appears with player list, select target, verify $500 received by target and $1,000 by current player |
| Ponzi "got away with it" win condition | ECON-09 | Requires game to end while Ponzi flag is set — integration-level test | Manually play to win condition with Ponzi flag active, verify "got away with it" message on game-over screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
