# Phase 5: Board Reset - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the 40-tile BOARD_TILES array to match the final design, add HP as a core player stat, update the win condition formula, remove all obsolete Phase 4 tile handlers, stub all new tile types, and update both the player and host screens with new stat displays and tile instructions.

This phase delivers: correct board, HP system, win condition, UI groundwork.
This phase does NOT deliver: full tile mechanics for new tiles (stubs only), career paths, hospital/prison mechanics (those are Phase 6+).

</domain>

<decisions>
## Implementation Decisions

### Player Screen — Stat Layout
- **D-01:** Use a 2×3 stat grid: `Money | Fame | Happiness` / `HP | Degree | Career`. Compact, all 6 items visible without scrolling on mobile.
- **D-02:** Degree shows current degree name (e.g. "Computer Science") or "None". Career shows list of completed career paths (e.g. "Tech Bro, McDonald's") or "None".

### Host Board — Tile Instructions
- **D-03:** Tile NAME must be visible on the board tile itself (abbreviated if needed, e.g. "Sports Bet", "Japan Trip").
- **D-04:** Full instructions appear as a **hover tooltip** on the host board tile. No inline text on the tile div beyond the name.
- **D-05:** The **player screen** shows the currently active tile's full instruction text — updated each turn when the player lands. This is the primary instruction surface for the active player.

### Test Migration
- **D-06:** Delete `tests/tiles-econ.test.ts` entirely (old ECON-01..10 tests are now invalid — those tiles no longer exist at those positions or with those mechanics).
- **D-07:** Write a new `tests/board-layout.test.ts` covering:
  - Correct tile type at each of the 40 positions (spot-check all 40)
  - Player object initializes with `hp: 10`
  - Win condition: `Life Total = Fame + Happiness + floor(Cash/10000) ≥ 60`
  - STARTING_MONEY updated to 10,000 (per GAME-DESIGN.md)
  - All new tile stub cases reach `advanceTurn` without throwing

### HP System
- **D-08:** HP ≤ 0 check runs **after the full tile effect resolves** — not mid-effect. Avoids partial state corruption.
- **D-09:** When HP ≤ 0 after tile resolves: move player to Hospital (Tile 30), broadcast `movedToHospital` event, advance turn.
- **D-10:** HP is initialized to 10 on `createPlayer`. HP is included in `getFullState` broadcast and shown on player screen.

### Starting Stats (GAME-DESIGN.md values)
- **D-11:** `STARTING_MONEY = 10000` (changed from 50000 — per finalized design doc)
- **D-12:** `STARTING_HP = 10`
- **D-13:** Salary starts at 10,000 (new field on Player: `salary: number`)

### Win Condition Update
- **D-14:** `Life Total = fame + happiness + Math.floor(money / 10000)`
- **D-15:** Win check: Life Total ≥ 60 AND player's secret formula is satisfied
- **D-16:** Win check runs after every stat change (money, fame, happiness, HP do NOT count toward Life Total)

### Dead Phase 4 Handlers to Remove
- **D-17:** Remove handlers for: `INVESTMENT_POOL`, `SCRATCH_TICKET`, `CRYPTO`, `UNION_STRIKE`, `PONZI_SCHEME`
- **D-18:** Remove `hasPonziFlag`, `ponziStolenFrom`, `cryptoInvestments` from Player interface and factory
- **D-19:** Remove `sharedResources.investmentPool` from GameRoom

### New Tile Stubs
- **D-20:** All new tile types get a stub case in the switch: log the tile name, call `advanceTurn`. No logic yet.
- **D-21:** Stub tile types: `OPPORTUNITY_KNOCKS`, `PAY_TAXES`, `STUDENT_LOAN_REDIRECT`, `CIGARETTE_BREAK`, `UNIVERSITY`, `LOTTERY`, `JAPAN_TRIP`, `ART_GALLERY`, `SUPPLY_TEACHER`, `GYM_MEMBERSHIP`, `COP`, `DEI_OFFICER`, `REVOLUTION`, `OZEMPIC`, `STARVING_ARTIST`, `YACHT_HARBOR`, `INSTAGRAM_FOLLOWERS`, `STREAMER`
- **D-22:** Updated handlers (keep but modify): `SPORTS_BETTING` (now at Tile 7, same mechanic), `NEPOTISM` (now at Tile 26, same mechanic for now), `COVID_STIMULUS` (now at Tile 27, mechanic changes to HP→cash trade in Phase 10 — stub for now)

### Claude's Discretion
- Exact abbreviations for tile names on the board (keep them readable at ~60px tile width)
- CSS styling for the stat grid on player screen (match existing dark theme)
- Tooltip CSS implementation (pure CSS hover or minimal JS)
- Exact instruction text strings per tile type (derive from GAME-DESIGN.md)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Design
- `.planning/GAME-DESIGN.md` — Authoritative tile list (positions 0–39), all tile mechanics, career requirements, stat starting values, win condition formula

### Current Codebase
- `server.ts` — Player interface, BOARD_TILES array, createPlayer factory, tile switch statement, advanceTurn function, getFullState
- `public/host.html` — Existing board-track div structure (4×10 grid, tiles injected by JS)
- `public/player.html` — Existing player game section (currently only shows money-display div)
- `client/game.ts` — Client-side socket handlers for stat updates and board rendering
- `tests/tiles-econ.test.ts` — DELETE this file entirely

### Planning
- `.planning/ROADMAP.md` — Phase 5 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BOARD_TILES` array: already 40 entries — replace content, keep array structure
- `advanceTurn()`: already handles turn advancement + broadcast — all stubs call this
- `getFullState()`: already broadcasts player stats — extend to include `hp` and `salary`
- `#board-track` div in host.html: tiles already injected by JS — update JS to show tile names + tooltips
- `#money-display` div in player.html: extend into a stat grid

### Established Patterns
- Tile handlers: `case 'TILE_TYPE': { ... advanceTurn(...); break; }` — stubs follow exact same pattern
- Player factory `createPlayer()`: add `hp: 10`, `salary: 10000` alongside existing fields
- Socket broadcast shape: `getFullState()` builds the player object — add `hp`, `salary` to the shape

### Integration Points
- Win check: hook into every `advanceTurn` call (it already has access to player + room state)
- HP check: after each tile handler resolves, before calling `advanceTurn`, check `player.hp <= 0`
- Stat grid: replaces `#money-display` div in player.html game section

</code_context>

<specifics>
## Specific Ideas

- The player screen instruction display (D-05) should update when `tileResolved` or `advanceTurn` socket event fires — show the tile name + instruction for the tile the active player just landed on.
- STARTING_MONEY change from 50,000 → 10,000 will break existing lobby tests (they assert starting money). Update test assertions accordingly.
- `salary` field is new on Player — `getFullState` must include it and `createPlayer` must initialize it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-board-reset*
*Context gathered: 2026-04-02*
