---
phase: 2
slug: lobby-room-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + ts-jest (existing) |
| **Config file** | package.json (jest transform already configured) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-create-room | server | 1 | LOBBY-01 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-join-room | server | 1 | LOBBY-02, LOBBY-07 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-host-ui | host.html | 1 | LOBBY-03 | manual | See manual verifications | N/A | ⬜ pending |
| 2-player-ui | player.html | 1 | LOBBY-03, LOBBY-05 | manual | See manual verifications | N/A | ⬜ pending |
| 2-formula-submit | server | 2 | LOBBY-05, LOBBY-06 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-start-game | server | 2 | LOBBY-04, LOBBY-06 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-turn-order | server | 2 | LOBBY-06 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-disconnect | server | 2 | LOBBY-07 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |
| 2-form-validation | player.html | 2 | LOBBY-05 | manual | See manual verifications | N/A | ⬜ pending |
| 2-name-validation | server | 2 | LOBBY-02 | unit | `npm test -- --testPathPattern lobby` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lobby.test.ts` — unit stubs for LOBBY-01 through LOBBY-07 (~25 tests)

*All other infrastructure from Phase 1 is sufficient.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host lobby screen shows room code + player list | LOBBY-03 | Browser UI rendering | Open host.html, create room, verify code displayed + player list updates as players join |
| Player lobby sliders sum to 60 live | LOBBY-05 | Browser interaction | Open player.html, adjust sliders, verify live sum updates and Submit button disabled when ≠60 |
| Start Game button state (enabled/disabled) | LOBBY-04 | Cross-device browser state | Host + 2 players join, verify button disabled until all formulas submitted, enabled after |
| Formula hidden from other players | LOBBY-05 | Network inspection | Open DevTools Network tab, confirm gameState events never contain other players' formulas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
