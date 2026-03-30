---
phase: 1
slug: foundation-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (unit) + manual socket integration tests |
| **Config file** | none — Wave 0 installs |
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
| 1-pkg-01 | package.json | 1 | SETUP-01 | unit | `node -e "const p=require('./package.json');process.exit(p.scripts.start?0:1)"` | ❌ W0 | ⬜ pending |
| 1-srv-01 | server.js | 1 | SETUP-01, SETUP-03, SETUP-04 | integration | `npm start & sleep 1 && curl -s http://localhost:3000 && kill %1` | ❌ W0 | ⬜ pending |
| 1-room-01 | room isolation | 2 | SETUP-04 | unit | `npm test -- --testPathPattern room` | ❌ W0 | ⬜ pending |
| 1-state-01 | state manager | 2 | SETUP-04 | unit | `npm test -- --testPathPattern state` | ❌ W0 | ⬜ pending |
| 1-sync-01 | full-state-sync | 2 | SETUP-04 | unit | `npm test -- --testPathPattern sync` | ❌ W0 | ⬜ pending |
| 1-disc-01 | disconnect handler | 2 | SETUP-04 | unit | `npm test -- --testPathPattern disconnect` | ❌ W0 | ⬜ pending |
| 1-rate-01 | rate limiting | 3 | SETUP-04 | unit | `npm test -- --testPathPattern rate` | ❌ W0 | ⬜ pending |
| 1-beat-01 | heartbeat | 3 | SETUP-04 | unit | `npm test -- --testPathPattern heartbeat` | ❌ W0 | ⬜ pending |
| 1-readme | README | 1 | SETUP-02 | manual | See manual verifications | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — with `jest` devDependency and `"test": "jest"` script
- [ ] `tests/room.test.js` — stubs for room isolation (SETUP-04)
- [ ] `tests/state.test.js` — stubs for game state manager (SETUP-04)
- [ ] `tests/sync.test.js` — stubs for full-state-sync (SETUP-04)
- [ ] `tests/disconnect.test.js` — stubs for disconnect handler (SETUP-04)
- [ ] `tests/rate.test.js` — stubs for rate limiting (SETUP-04)
- [ ] `tests/heartbeat.test.js` — stubs for heartbeat/ping-pong (SETUP-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README is readable and complete | SETUP-02 | Documentation quality, not machine-checkable | Open README.md, follow steps 1-4, confirm server starts and ngrok URL is accessible |
| CORS allows ngrok URLs | SETUP-04 | Requires live ngrok tunnel | Start server, start ngrok, open player.html via ngrok URL, confirm socket connects without CORS error |
| 50 concurrent rooms <100MB | SETUP-04 | Load test | Run `node tests/load-test.js`, check process.memoryUsage() output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
