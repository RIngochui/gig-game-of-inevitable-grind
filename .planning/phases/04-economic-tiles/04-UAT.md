---
status: resolved
phase: 04-economic-tiles
source: [04-00-SUMMARY.md, 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Run `npm test` from scratch. Server boots without errors and all 150 tests pass (or at minimum the 34 economic tile tests in tiles-econ.test.ts pass).
result: issue
reported: "Test Suites: 14 failed, 47 passed, 61 total / Tests: 61 failed, 902 passed, 963 total"
severity: major

### 2. Sports Betting — roll outcome
expected: When a player lands on SPORTS_BETTING (position 3), rolling 1 wins 6× their bet amount; any other roll loses the full bet (floored at $0, can't go negative).
result: skipped
reason: automated tests confirmed passing (PASS tests/tiles-econ.test.ts); blocked from clean manual run by worktree Jest issue (same as test 1)

### 3. COVID Stimulus — all-player flat payout
expected: When any player lands on COVID_STIMULUS (position 13), ALL players in the room each receive +$1,400 simultaneously via a single broadcast.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 4. Tax Audit — percentage deduction
expected: When a player lands on TAX_AUDIT (position 15), they lose Math.floor(money × (roll × 5) / 100) — floored at $0. Higher rolls = bigger tax hit.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 5. Scratch Ticket — can go negative
expected: When a player lands on SCRATCH_TICKET (position 17), they pay $200 entry fee and get a roll-based payout. Unlike other tiles, this can push money below $0 (no floor).
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 6. Investment Pool — accumulation and jackpot
expected: Each player landing on INVESTMENT_POOL (position 7) who doesn't roll 1 adds $500 to the shared pool. Rolling 1 wins the entire pool (pool resets to 0). Pool balance persists across turns and players.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 7. Crypto — two-landing invest/payout cycle
expected: First landing on CRYPTO (position 23): player's entire money is invested (balance goes to ~$0). Second landing: pays out 3× (roll 1-2), 1× break-even (roll 3-4), or 0 (roll 5-6). Investment resets after payout regardless of outcome.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 8. Nepotism — turn pauses for beneficiary choice
expected: When a player lands on NEPOTISM (position 34), they immediately gain $1,000 and the turn pauses (TILE_RESOLVING state). A private socket event prompts only them to choose a beneficiary. After selection, the chosen player gets $500 and the turn advances. Self-selection and invalid targets are rejected.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 9. Union Strike — atomic all-player redistribution
expected: When any player lands on UNION_STRIKE (position 33), ALL players' money is summed, divided equally (Math.floor), and each player's balance is set to that equal share — in one atomic broadcast. Nobody gets richer, nobody gets poorer individually; it equalizes.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 10. Ponzi Scheme — steal now, repay later
expected: Landing on PONZI_SCHEME (position 34) steals min($1,000, victim.money) from each other player and sets hasPonziFlag. On the NEXT time ANY player lands on a money tile, the Ponzi player automatically repays 2× the exact stolen amount to each victim and the flag clears.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

### 11. Student Loan Payment — every-landing drain
expected: Any player with hasStudentLoans=true loses $1,000 every time they land on STUDENT_LOAN_PAYMENT (position 35). No one-time immunity — it fires every single landing. Players without student loans are unaffected.
result: skipped
reason: automated tests confirmed passing; blocked by same worktree Jest issue

## Summary

total: 11
passed: 0
issues: 1
pending: 0
skipped: 10
blocked: 0

## Gaps

- truth: "npm test runs clean with all 150 project tests passing and 0 failures"
  status: resolved
  reason: "User reported: Test Suites: 14 failed, 47 passed, 61 total / Tests: 61 failed, 902 passed, 963 total"
  root_cause: "testPathIgnorePatterns missing — Jest testMatch glob '**/tests/**/*.test.ts' matched stale stub files in .claude/worktrees/"
  fix: "Added testPathIgnorePatterns: ['/.claude/worktrees/'] to jest config in package.json (commit 164e47c)"
  severity: major
  test: 1
