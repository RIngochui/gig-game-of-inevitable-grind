---
phase: 05-board-reset
plan: "03"
subsystem: client-ui
tags: [stat-grid, tooltips, player-screen, host-board, ui, phase-5]
dependency_graph:
  requires: [05-02]
  provides: [stat-grid-ui, tile-tooltip-ui, tile-abbreviation-ui]
  affects: []
tech_stack:
  added: []
  patterns: [CSS-tooltip-via-attr, stat-grid-layout, socket-event-driven-ui]
key_files:
  created: []
  modified:
    - public/player.html
    - public/host.html
    - client/game.ts
decisions:
  - "Tile instruction shown on gameState (me.position + boardTilesData lookup) — no new server event needed"
  - "Host board tooltips via pure CSS .tile[data-instruction]:hover::after — zero JS required"
  - "boardTilesData captured on gameStarted in both initHostGame and initPlayerGame IIFEs"
  - "drains-applied handler updated to use statMoneyEl instead of removed moneyDisplay"
metrics:
  duration: 2min
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 3
---

# Phase 5 Plan 03: UI Stat Grid & Tooltips Summary

**One-liner:** Player screen 2x3 stat grid (Money/Fame/Happiness/HP/Degree/Career) with tile instruction panel, plus host board tile name abbreviations and CSS hover tooltips driven by boardTilesData.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update player.html — replace #money-display with stat grid + tile instruction panel | 7c003f4 | public/player.html |
| 2 | Update host.html — add tooltip CSS and update board injection JS | 5a5ffa4 | public/host.html, client/game.ts |

## What Was Built

### Task 1: player.html Stat Grid

**public/player.html — CSS added:**
- `#stat-grid`: 3-column CSS grid with 2 rows (6 cells total)
- `.stat-item`, `.stat-label`, `.stat-value`: layout/typography classes
- `#active-tile-instruction`, `#tile-name-display`, `#tile-instruction-text`: instruction panel (hidden by default)

**public/player.html — HTML changes:**
- Replaced `#money-display` div with `#stat-grid` containing 6 `.stat-item` cells: Money, Fame, Happiness, HP, Degree, Career
- Added `#active-tile-instruction` div below stat grid (display:none until game state arrives)

### Task 2: host.html Tooltip CSS + game.ts Logic

**public/host.html — CSS added:**
- `.tile-abbr`: small monospace label for abbreviated tile names inside each tile cell
- `.tile[data-instruction]:hover::after`: pure CSS tooltip using `content: attr(data-instruction)` — no JS required

**client/game.ts — initHostGame IIFE:**
- Added `boardTilesData` variable (populated on `gameStarted`)
- Added `TILE_ABBR` map for all 30 tile types (per UI-SPEC.md)
- `initBoard()`: each `.tile` div now gets `data-instruction` attribute set from `boardTilesData[i].description` and a `.tile-abbr` span with the abbreviated name
- `gameStarted` handler: captures `boardTiles` from payload before calling `initBoard()`

**client/game.ts — initPlayerGame IIFE:**
- Added `boardTilesData` variable (populated on `gameStarted`)
- Added stat grid element refs: `statMoneyEl`, `statFameEl`, `statHapEl`, `statHpEl`, `statDegreeEl`, `statCareerEl`
- Added tile instruction panel refs: `tileInstrEl`, `tileNameEl`, `tileTextEl`
- `gameStarted` handler: captures `boardTiles`, initializes stat grid defaults ($10,000 / HP:10)
- `gameState` handler: updates all 6 stat cells from `state.players[mySocketId]`; shows tile instruction panel from `me.position` + `boardTilesData` lookup
- `drains-applied` handler: updated to use `statMoneyEl` (replacing removed `moneyDisplay`)

## Deviations from Plan

None — plan executed exactly as written. The plan already accounted for the `boardTiles` payload being in `gameStarted` (added in Plan 02), so no server.ts changes were needed.

## Checkpoint

**checkpoint:human-verify** — Auto-approved (auto_advance=true)

Verification steps (for manual confirmation):
1. Start server: `npm start`
2. Open host.html, create room
3. Open player.html, join and submit formula
4. Start game
5. Player screen: stat grid shows Money=$10,000, Fame=0, Happiness=0, HP=10, Degree=None, Career=None
6. Host board: hover over any tile shows CSS tooltip with full description
7. Host board: each tile shows abbreviated name (OPP, TAXES, SPORTS, etc.)
8. Roll dice: stat grid values update from gameState broadcast
9. Player screen: "Currently on: [Tile Name]" and description appear after game state updates

## Known Stubs

None in this plan — stat grid wires to real server data from `gameState` broadcast. The `boardTilesData` array is fully populated from server's `BOARD_TILES` on `gameStarted`. Stats (fame, happiness, hp, degree, career) all display server values — they will show 0/None for now as tile handlers are still stubbed (Phase 6-10 will implement full mechanics).

## Self-Check: PASSED

- public/player.html: FOUND and modified
- public/host.html: FOUND and modified
- client/game.ts: FOUND and modified
- Commit 7c003f4: confirmed (Task 1)
- Commit 5a5ffa4: confirmed (Task 2)
- `grep "stat-grid" public/player.html`: 2 matches (CSS + HTML element)
- `grep "stat-money" public/player.html`: 1 match
- `grep "money-display" public/player.html`: 0 element matches (only a CSS comment)
- `grep "tile-abbr" public/host.html`: 1 match
- `grep "data-instruction" public/host.html`: 2 matches (CSS attr() and selector)
- `grep "TILE_ABBR" client/game.ts`: 2 matches
- `grep "boardTilesData" client/game.ts`: 8 matches
- `npm test --runInBand`: 9/9 suites PASS, 190/190 tests GREEN
