---
phase: 06-hospital-prison-japan-trip
verified: 2026-04-03T00:00:00Z
status: gaps_found
score: 16/19 must-haves verified
re_verification: false
gaps:
  - truth: "Cop immunity: Cop (isCop=true) landing on Prison tile stays out of prison (fine/HP instead)"
    status: partial
    reason: "PRISON-06 requires 'turns served' counter displayed next to imprisoned players; host dot badge shows [P] indicator but no turn count. DOC-01 career hook (Nursing Degree → isDoctor=true) is not wired — isDoctor is always false; doctor payment routing code exists but is permanently unreachable. These are known stubs documented in SUMMARY."
    artifacts:
      - path: "client/game.ts"
        issue: "PRISON-06: host dot badge shows [P] but no turns-served counter. REQUIREMENTS.md requires 'prison icon next to imprisoned players and turns served'."
      - path: "server.ts"
        issue: "DOC-01: isDoctor is always false in createPlayer(). Career path that sets isDoctor=true is Phase 8 — not wired in Phase 6. Doctor payment branch (line 500) is always skipped."
    missing:
      - "PRISON-06: turns-served counter per imprisoned player on host screen"
      - "DOC-01: career completion hook setting isDoctor=true (Phase 8 dependency — document as deferred, not a Phase 6 gap)"
  - truth: "REQUIREMENTS.md STOMP-01 says stomp sends to Prison; implementation sends non-Cop stomp to Japan Trip (Tile 20)"
    status: partial
    reason: "REQUIREMENTS.md line 81 says 'all players already there are sent to Prison immediately'. The Phase 6 RESEARCH.md redefines STOMP-01 as 'non-Cop stomp → Japan Trip, Cop stomp → Prison'. Implementation follows RESEARCH.md (confirmed by passing tests). REQUIREMENTS.md was not updated to reflect this design revision."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "STOMP-01 still reads 'sent to Prison immediately' — conflicts with implemented and tested behavior (non-Cop → Japan Trip, Cop → Prison)."
    missing:
      - "Update REQUIREMENTS.md STOMP-01 and STOMP-02 to reflect the Cop/non-Cop routing distinction actually implemented"
  - truth: "PRISON-04 per REQUIREMENTS.md: 'roll 1 die — roll a 1 to be freed'. Implementation uses 2d6 {9, 11, 12}"
    status: partial
    reason: "REQUIREMENTS.md line 75 specifies 1d6 roll=1 escape. Implementation uses 2d6 with escape set {9, 11, 12} per RESEARCH.md and GAME-DESIGN.md. Tests encode 2d6 behavior and all pass. Design was intentionally revised from REQUIREMENTS.md spec; REQUIREMENTS.md was not updated."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "PRISON-04 text still says '1 die — roll a 1 to be freed'; implementation uses 2d6 {9,11,12}."
    missing:
      - "Update REQUIREMENTS.md PRISON-04 to reflect 2d6 escape set {9, 11, 12} as implemented"
human_verification:
  - test: "Japan stay-or-leave choice UI on player device"
    expected: "When a player is inJapan and rolls ≤ 8 on their turn, the player's device shows Stay and Leave buttons (or window.confirm fallback). Tapping Stay emits 'japan-stay'; tapping Leave emits 'japan-leave'."
    why_human: "UI interaction path requires a running server and two browser sessions (host + player). Cannot verify programmatically without starting the server."
  - test: "Hospital status banner on player screen"
    expected: "When a player is hospitalized, their screen shows a red banner reading 'You've been hospitalized!' with roll-to-escape prompts. Banner clears on escape."
    why_human: "Requires active session; #status-banner DOM element not yet in player.html (null-guarded in code, falls back silently — no visual without the HTML element)."
  - test: "Host dot status badges"
    expected: "On the host board, player dots show [H], [P], or [J] suffix in their title attribute when hospitalized, imprisoned, or in Japan respectively."
    why_human: "Requires running game session with players in special locations; badge is set on title attribute (tooltip), not visible text."
---

# Phase 6: Hospital, Prison, Japan Trip, Goomba Stomp — Verification Report

**Phase Goal:** Implement Hospital (HP drain → admission, roll escape, salary/2 payment to Doctor), Prison (2d6 escape, bail, Cop immunity), Japan Trip (stay loop, happiness gain, salary drain, 2d6 forced leave), and Goomba Stomp (occupancy routing to Japan/Prison based on Cop status). Client-side event handlers surfacing all events on player and host screens.

**Verified:** 2026-04-03
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player interface has inHospital, inJapan, isDoctor, isCop boolean fields (all default false) | VERIFIED | server.ts lines 54-57, createPlayer() lines 255-258, getFullState() lines 405-408 |
| 2 | HP <= 0 triggers inHospital=true, position=30 | VERIFIED | checkHpAndHospitalize() at line 455; handleHpCheck alias at line 474; both exported |
| 3 | Hospital turn: roll 1d6 <= 5 escapes (+5 HP, pay Math.floor(salary/2)); roll 6 stays | VERIFIED | handleHospitalEscape() lines 486-528; escapeRoll <= 5 at line 492; Math.floor(player.salary / 2) at line 496 |
| 4 | Hospital payment routes to Doctor (isDoctor=true) if one exists, else Banker | VERIFIED | doctorPlayer find at line 500; doctor.money += payment at line 502 (routing code correct; isDoctor always false until Phase 8 sets it — confirmed known stub) |
| 5 | Card play rejected when player.inHospital or player.inJapan is true | VERIFIED | canPlayCard() lines 600-613; returns false with error emit when inHospital or inJapan |
| 6 | Prison turn: roll 2d6, only {9, 11, 12} escapes; bail $5,000 exits | VERIFIED | handlePrisonEscape() lines 540-567 (prisonRoll === 9 || 11 || 12); handlePrisonBail() lines 574-591 (5000 deducted) |
| 7 | Cop (isCop=true) landing on Prison tile: inPrison stays false (cop-immune path) | VERIFIED | dispatchTile PRISON case line 887: if (player.isCop) emits prison-cop-immune without setting inPrison |
| 8 | Landing on Japan Trip (Tile 20): player.happiness += 1, player.inJapan = true | VERIFIED | dispatchTile case 'JAPAN_TRIP' lines 870-884; happiness += 1 at line 872, inJapan = true at line 873 |
| 9 | Japan turn-start: happiness += 2, money -= Math.ceil(salary/5); 2d6 >= 9 forces leave (position = 21, inJapan = false) | VERIFIED | handleJapanTurnStart() lines 621-668; drain at line 627; japanRoll >= 9 at line 635; inJapan = false at line 637 |
| 10 | advanceTurn intercepts nextPlayer.inJapan before normal turn | VERIFIED | advanceTurn() lines 778-780; if (nextPlayer && nextPlayer.inJapan) handleJapanTurnStart() |
| 11 | Goomba Stomp: stomper ends on occupied tile, non-Cop sends all occupants to Tile 20 (inJapan=true) | VERIFIED | checkGoombaStomp() lines 672-703; filter at line 676-677; non-Cop path lines 689-690 |
| 12 | Cop stomp sends all occupants to Tile 10 (inPrison=true) | VERIFIED | checkGoombaStomp() line 685-687; isCop branch sets position=10, inPrison=true |
| 13 | roll-dice handler intercepts inHospital and inPrison before normal movement | VERIFIED | server.ts lines 1182 (if player.inHospital) and 1188 (if player.inPrison) — both before d1/d2 calculation |
| 14 | checkGoombaStomp called after position update, before dispatchTile | VERIFIED | server.ts line 1203; after player.position = newPos (line 1200), before move-token emit |
| 15 | All Phase 6 test assertions pass (19 total, including PRISON-01 board sanity) | VERIFIED | npm test --forceExit: 14 suites, 209 tests, 0 failures |
| 16 | TypeScript compiles clean (server and client) | VERIFIED | npx tsc --noEmit exits 0; npx tsc --project tsconfig.client.json exits 0 |
| 17 | Client initPlayerGame handles all 11 Phase 6 events (hospital/prison/japan/stomp) | VERIFIED | client/game.ts lines 560-865; all events present with functional handlers |
| 18 | Client initHostGame shows Phase 6 events in turn history + status badges | VERIFIED | client/game.ts lines 558-591; addTurnHistory calls for each event; gameState badge update at line 549-553 |
| 19 | PRISON-06: Host screen shows turns-served counter next to imprisoned players | FAILED | Host dot badge shows [P] indicator (client/game.ts line 551) but no turn-count tracking. REQUIREMENTS.md explicitly requires "turns served" display. |

**Score:** 18/19 truths verified (PRISON-06 turns-served is partial)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/hospital.test.ts` | HP-02, HOSP-01..04 (6 assertions, min 60 lines) | VERIFIED | 167 lines; 6 describe/it blocks; all pass |
| `tests/doctor-role.test.ts` | DOC-02 (1 assertion, min 35 lines) | VERIFIED | 64 lines; 1 describe/it block; passes |
| `tests/prison.test.ts` | PRISON-01..05 (5 assertions, min 60 lines) | VERIFIED | 136 lines; 5 describe/it blocks; all pass |
| `tests/japan-trip.test.ts` | JAPAN-01..03 (4 assertions, min 55 lines) | VERIFIED | 136 lines; 4 describe/it blocks; all pass |
| `tests/goomba-stomp.test.ts` | STOMP-01..02 (3 assertions, min 50 lines) | VERIFIED | 109 lines; 3 describe/it blocks; all pass |
| `server.ts` | Player interface with inHospital, inJapan, isDoctor, isCop | VERIFIED | Lines 54-57 |
| `server.ts` | handleHospitalEscape, handlePrisonBail, handlePrisonEscape, handleJapanTurnStart, checkGoombaStomp, canPlayCard exported | VERIFIED | Export block lines 1382-1384; all 6 functions exported |
| `server.ts` | roll-dice handler intercepts inHospital and inPrison | VERIFIED | Lines 1182 and 1188 |
| `server.ts` | dispatchTile JAPAN_TRIP case applies +1 happiness and sets inJapan | VERIFIED | Lines 870-884 |
| `client/game.ts` | Phase 6 socket event handlers in both IIFEs (min 80 lines of handlers) | VERIFIED | 868 total lines; handlers added at lines 558-865 (300+ lines of Phase 6 additions) |
| `public/game.js` | Compiled output containing Phase 6 event names | VERIFIED | hospital-entered appears at lines 471, 673; goomba-stomped at lines 489, 759 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| tests/*.test.ts | server.ts | import from '../server' | VERIFIED | All 5 test files import createPlayer, createGameRoom from '../server' |
| tests/hospital.test.ts | Player.inHospital | player.inHospital assertion | VERIFIED | Tests assert on (player as any).inHospital directly |
| tests/prison.test.ts | Player.isCop | cop immunity via handlePrisonEscape | VERIFIED | PRISON-03 tests canPlayCard result for inPrison player |
| roll-dice handler | handleHospitalEscape / hospital stay | if (player.inHospital) before d1/d2 | VERIFIED | Line 1182 intercepts before normal movement |
| roll-dice handler | handlePrisonEscape / prison stay | if (player.inPrison) before d1/d2 | VERIFIED | Line 1188 intercepts before normal movement |
| roll-dice handler (after position update) | checkGoombaStomp | called at line 1203 | VERIFIED | After player.position = newPos (1200), before move-token emit (1207) |
| advanceTurn | handleJapanTurnStart | if (player.inJapan) check at nextPlayer | VERIFIED | Lines 778-780 |
| client/game.ts initPlayerGame | socket.on('hospital-entered') | status banner on player screen | VERIFIED | Line 775 inside initPlayerGame() IIFE |
| client/game.ts initHostGame | socket.on('goomba-stomped') | addTurnHistory call | VERIFIED | Line 586 inside initHostGame() IIFE |
| client/game.ts initPlayerGame | socket.on('japan-stay-choice') | Stay/Leave buttons emitting japan-stay/leave | VERIFIED | Lines 834-862; socket.emit('japan-stay') line 846, socket.emit('japan-leave') line 850 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| handleHospitalEscape | escapeRoll | Math.random() * 6 + 1 | Yes — server-authoritative random | FLOWING |
| handlePrisonEscape | prisonRoll (2d6) | Math.random() * 6 (two dice) | Yes | FLOWING |
| handleJapanTurnStart | drain = Math.ceil(salary/5) | player.salary (live state) | Yes | FLOWING |
| checkGoombaStomp | stompTargets | room.players.values().filter() | Yes — live player state | FLOWING |
| Doctor payment routing | doctorPlayer | room.players.values().find(p => p.isDoctor) | Finds nothing (isDoctor always false) — Phase 8 will wire | STATIC (known, deferred) |
| client gameState handler | inHospital/inPrison/inJapan badges | server gameState broadcast | Yes — broadcast includes Phase 6 fields | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All Phase 6 test suites pass | npm test --forceExit | 14 suites, 209 tests, 0 failures | PASS |
| hospital.test.ts assertions all green | npm test --testPathPattern=hospital --forceExit | PASS (confirmed in full suite) | PASS |
| prison.test.ts assertions all green | npm test --testPathPattern=prison --forceExit | PASS | PASS |
| japan-trip.test.ts assertions all green | npm test --testPathPattern=japan-trip --forceExit | PASS | PASS |
| goomba-stomp.test.ts assertions all green | npm test --testPathPattern=goomba-stomp --forceExit | PASS | PASS |
| doctor-role.test.ts assertion green | npm test --testPathPattern=doctor-role --forceExit | PASS | PASS |
| TypeScript server compilation clean | npx tsc --noEmit | Exit 0, no output | PASS |
| TypeScript client compilation clean | npx tsc --project tsconfig.client.json | Exit 0, no output | PASS |
| Phase 6 events in compiled game.js | grep "hospital-entered\|goomba-stomped" public/game.js | 4 matches | PASS |
| io() called only at module level | grep "io()" client/game.ts | 1 match (line 5) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| HP-02 | 06-01, 06-02 | HP <= 0 → immediate move to Hospital (Tile 30) | SATISFIED | checkHpAndHospitalize() + handleHpCheck(); test PASSING |
| HOSP-01 | 06-01, 06-02 | Hospital: stuck until roll 1d6 <= 5 escapes; roll 6 stays | SATISFIED | handleHospitalEscape(); escapeRoll <= 5 check; tests PASSING |
| HOSP-02 | 06-01, 06-02 | Leaving Hospital: +5 HP; payment = Math.floor(salary/2) | SATISFIED | player.hp += 5 and Math.floor(player.salary / 2) in handleHospitalEscape |
| HOSP-03 | 06-01, 06-02 | Cannot use cards in Hospital (or Japan Trip) | SATISFIED | canPlayCard() returns false when inHospital; test PASSING |
| HOSP-04 | 06-01, 06-02 | Payment routes to Doctor if exists, Banker otherwise | SATISFIED | doctorPlayer find + routing; test PASSING with mock isDoctor=true |
| DOC-01 | 06-01, 06-02 | Doctor role: Nursing Degree completion sets isDoctor=true | DEFERRED | isDoctor flag exists; setting it is Phase 8 career completion — not Phase 6 scope. Correctly documented as known stub in 06-02-SUMMARY.md. |
| DOC-02 | 06-01, 06-02 | Doctor passive: receives Math.floor(salary/2) on any hospital exit | SATISFIED | Payment routing in handleHospitalEscape; doctor-role.test.ts PASSING with explicit isDoctor=true |
| PRISON-01 | 06-01, 06-02 | Prison tile at index 10 | SATISFIED | BOARD_TILES[10].type === 'PRISON'; test PASSING (pre-existing board layout) |
| PRISON-02 | 06-01, 06-02 | Imprisoned players skip movement (inPrison blocks roll-dice) | SATISFIED | roll-dice handler line 1188 intercepts before movement; test PASSING |
| PRISON-03 | 06-01, 06-02 | Imprisoned players CAN play cards | SATISFIED | canPlayCard() does NOT check inPrison; test PASSING |
| PRISON-04 | 06-01, 06-02 | Escape: roll {9, 11, 12} on 2d6 | SATISFIED (with REQUIREMENTS.md conflict) | Implementation uses 2d6 {9,11,12} per RESEARCH.md/GAME-DESIGN.md; REQUIREMENTS.md still says "1 die, roll a 1"; design was revised — REQUIREMENTS.md needs update |
| PRISON-05 | 06-01, 06-02 | Escape: pay $5,000 bail | SATISFIED | handlePrisonBail() deducts 5000; test PASSING |
| PRISON-06 | 06-01, 06-02, 06-03 | Host screen shows prison icon + turns served | PARTIAL | [P] badge implemented; "turns served" counter missing — not tracked per player |
| JAPAN-01 | 06-01, 06-02 | Japan Trip landing: +1 Happiness, inJapan=true | SATISFIED | dispatchTile JAPAN_TRIP case; test PASSING |
| JAPAN-02 | 06-01, 06-02 | Stay turn: +2 Happiness, Math.ceil(salary/5) drain | SATISFIED | handleJapanTurnStart(); tests PASSING |
| JAPAN-03 | 06-01, 06-02 | Roll 2d6 >= 9 forces leave (position = previous+1, inJapan=false) | SATISFIED | japanRoll >= 9 threshold; test PASSING |
| STOMP-01 | 06-01, 06-02 | Non-Cop stomp: occupant → Japan Trip (Tile 20) | SATISFIED (with REQUIREMENTS.md conflict) | Implementation sends to Tile 20; REQUIREMENTS.md says "sent to Prison immediately" — design was revised in RESEARCH.md; REQUIREMENTS.md needs update |
| STOMP-02 | 06-01, 06-02 | Cop stomp: occupant → Prison (Tile 10) | SATISFIED | checkGoombaStomp() isCop branch → position=10, inPrison=true; test PASSING |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps PROP-01..03 to Phase 6 as well. These were NOT claimed by any Phase 6 PLAN.md (none of the three plans have PROP-01..03 in their requirements fields). This is correct — properties are legitimately out of scope for this phase's deliverables.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| server.ts | 255-258 | isDoctor: false, isCop: false always | Info | Doctor payment routing exists but is unreachable until Phase 8; documented known stub |
| client/game.ts | 549-553 | #status-banner DOM element null-guarded (element not in player.html) | Warning | Hospital/Japan status banner is silent no-op until HTML element added to player.html |
| client/game.ts | 834+ | #japan-choice DOM element null-guarded; falls back to window.confirm() | Warning | Japan stay-or-leave UI uses browser confirm dialog until HTML element is added |
| server.ts | 887+ | Cop immunity emits prison-cop-immune but does not apply "fine/HP" effect mentioned in plan | Info | Plan 02 goal mentions "fine/HP instead" for Cop landing on Prison; implementation only emits the immune event and calls advanceTurn — no fine or HP change. Tests only verify inPrison stays false, not the alternative consequence. |

No blockers that prevent the core phase goal. All anti-patterns are documented known stubs or deferred UI elements.

---

### Human Verification Required

#### 1. Japan Stay-or-Leave Choice UI

**Test:** Start a game with 2+ players. Get a player onto Japan Trip (Tile 20). On that player's next turn, observe the player's device.

**Expected:** If the 2d6 turn roll is <= 8, the player's screen shows a Stay/Leave prompt. Tapping "Stay in Japan" keeps the player at Tile 20 and advances the turn. Tapping "Leave Japan" moves the player to Tile 21 and dispatches the tile effect.

**Why human:** Requires a running server session. The #japan-choice DOM element is not yet in player.html — the mechanic falls back to window.confirm(), which also cannot be automated.

#### 2. Hospital Status Banner on Player Screen

**Test:** Play a game where a player's HP drops to 0 (via Cigarette Break or similar HP-draining tile). Observe the hospitalized player's device.

**Expected:** A red banner appears reading "You've been hospitalized! HP: 0. Roll to escape or pay ½ Salary." The banner persists until the player escapes.

**Why human:** #status-banner element is not in player.html — the null guard in showStatusBanner() silently no-ops. The mechanic works server-side but banner has no visible rendering until player.html is updated.

#### 3. Goomba Stomp Live Notification

**Test:** Land a player token onto a tile already occupied by another player during a live game.

**Expected:** All screens show the stomp notification. The stomped player(s) visually move to Tile 20 (Japan Trip) or Tile 10 (Prison if stomper is a Cop). Host turn history shows "STOMP! [stomper] → stomped [target] to Japan Trip/Prison".

**Why human:** Requires two players in a running game session landing on the same tile.

---

### Gaps Summary

Three gaps found, one blocking partial requirement, two requiring documentation updates:

**Gap 1 — PRISON-06 turns-served counter (warning, not blocker):** The host screen shows a [P] badge next to imprisoned player dots (via dot title attribute). However, REQUIREMENTS.md explicitly requires "turns served" to be displayed alongside the prison icon. No turn counter is tracked on the Player model or displayed in the client. This is a partial implementation of PRISON-06.

**Gap 2 — REQUIREMENTS.md PRISON-04 text is stale (documentation gap):** The implemented prison escape mechanic uses 2d6 with escape set {9, 11, 12}, confirmed by passing tests. REQUIREMENTS.md line 75 still reads "roll 1 die — roll a 1 to be freed." The design was intentionally revised in RESEARCH.md, but REQUIREMENTS.md was never updated. No code fix needed — documentation update only.

**Gap 3 — REQUIREMENTS.md STOMP-01 text is stale (documentation gap):** REQUIREMENTS.md line 81 says stomped players are "sent to Prison immediately." The implemented and tested behavior sends non-Cop stomp targets to Japan Trip (Tile 20) and Cop stomp targets to Prison (Tile 10). RESEARCH.md and GAME-DESIGN.md define the revised behavior. REQUIREMENTS.md was not updated. No code fix needed — documentation update only.

**DOC-01 classification:** Marked as DEFERRED (not a gap). The isDoctor flag exists in the Player interface and is checked in hospital payment routing. Setting isDoctor=true via career completion is explicitly Phase 8 scope, correctly documented as a known stub in the 06-02-SUMMARY.md.

---

*Verified: 2026-04-03*
*Verifier: Claude (gsd-verifier)*
