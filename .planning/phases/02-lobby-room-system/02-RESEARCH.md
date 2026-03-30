# Phase 2: Lobby & Room System - Research

**Researched:** 2026-03-30
**Domain:** Real-time multiplayer lobby flow, player join/leave, Success Formula submission, game start validation
**Confidence:** HIGH (based on Socket.io patterns from Phase 1, vanilla JS + server-authoritative architecture established)

## Summary

Phase 2 builds the player-facing lobby experience on top of Phase 1's foundation. Players will join rooms, set their secret Success Formulas (60-point budget across Money/Fame/Happiness), and wait for the host to start the game once all conditions are met.

This phase is frontend-heavy (HTML forms, client-side validation UI) but uses the same server-authoritative patterns established in Phase 1: all state mutations happen on the server, clients receive broadcasts and render accordingly. The Success Formula submission is the most complex operation — formulas must be stored secretly on the server and never broadcast to other players (only a flag that they've submitted).

**Primary recommendation:** Implement the four screen states (host pre-start, host waiting, player input, player submitted) as distinct page sections, controlled via CSS (`display: none/block`). Use `requestAnimationFrame` for throttling socket event handlers to prevent cascading re-renders. Keep form validation (sum=60, alphanumeric names) client-side for UX, but always validate server-side before storing.

## User Constraints (from CONTEXT.md)

No CONTEXT.md file found in the working directory. Phase proceeds with all areas open for Claude's discretion.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOBBY-01 | Host can create a room, receives a 4-letter room code | Room generation already implemented (Phase 1); socket event routing pattern established; tested via `create-room` event |
| LOBBY-02 | Players can join a room by entering the room code | Requires `join-room` socket event, room lookup, player add, broadcast `playerJoined`; parallels Phase 1 join pattern |
| LOBBY-03 | Host screen displays all connected players and their chosen names | Server broadcasts full state on join/update; host.html re-renders player list (vanilla JS DOM update) |
| LOBBY-04 | Host can start the game once at least 2 players have joined | Requires validation: `2+ players in room` before `start-game` event accepted; state transition to `playing` |
| LOBBY-05 | Each player secretly sets a Success Formula: 60 points split across Money/Fame/Happiness | Requires `submit-formula` socket event, client-side sum validation (UX), server-side validation (security), formula stored per player but never broadcast |
| LOBBY-06 | Game cannot start until all players have submitted their Success Formula | Server checks `players.filter(p => !p.hasSubmittedFormula).length === 0` before allowing `start-game` |
| LOBBY-07 | Player disconnection during lobby removes them from the room | Extends Phase 1 disconnect handler; removes player from `room.players`, re-broadcasts player list, re-evaluates start conditions |

## Standard Stack

### Core (from Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 4.18.2 | Web server | Established in Phase 1; no changes needed |
| Socket.io | 4.7.2 | Real-time communication | Established in Phase 1; leverages room isolation for `join-room`, `playerJoined` broadcasts |
| Node.js | 20.x LTS | Runtime | Established in Phase 1 |
| TypeScript | 5.3.x | Server-side types | Phase 1 migrated server.js to server.ts; continue using TS for type safety |

### Frontend (Vanilla JS)
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Vanilla JavaScript | ES2020+ | Client logic | Constraint from project; modern JS sufficient for form handling + socket listeners |
| CSS3 | Latest | Forms + layout | `:valid`/`:invalid` pseudo-selectors for form feedback; `grid` for player list layout |
| HTML5 | Latest | Markup | `<input type="range">` for sliders, `<form>` for validation, `required` attribute |

### Testing (from Phase 1)
| Framework | Version | Purpose | Why |
|-----------|---------|---------|-----|
| Jest | 29.7.0 | Unit tests | Established in Phase 1; use for socket event handlers and validation logic |
| ts-jest | 29.x | TypeScript Jest | Phase 1 adopted; continue for server.ts test compatibility |

### No New Dependencies Required

This phase introduces zero new npm packages. All features are built on Phase 1 foundation + vanilla JS form APIs.

## Architecture Patterns

### Recommended Project Structure

```
server.ts
├── Socket event handlers (new)
│   ├── join-room
│   ├── submit-formula
│   ├── start-game
│   └── updated player-joined, playerLeft broadcasts
├── Validation helpers (new)
│   ├── isValidPlayerName()
│   ├── isValidFormula()
│   └── canStartGame()

public/host.html (new)
├── Room code display (large, centered)
├── Connected players list (with submitted formula checkmarks)
├── Start Game button (disabled until conditions met)
└── Status text (waiting for N formulas)

public/player.html (new)
├── Name input form (1-20 chars, alphanumeric+space)
├── Success Formula sliders (Money/Fame/Happiness)
│   ├── Live sum display
│   ├── Sum validation error (if ≠ 60)
│   └── Submit button (disabled until sum=60)
├── Submitted confirmation screen
└── Waiting for host text

tests/lobby.test.ts (new)
├── join-room socket event validation
├── submit-formula validation (server-side)
├── start-game preconditions
├── Player disconnect during lobby
└── Duplicate name prevention

public/game.js (update)
├── Form validation helpers (client-side)
│   ├── validatePlayerName()
│   ├── validateFormulaSum()
│   └── formatFormulaDisplay()
└── Form event listeners (name input, sliders, submit button)
```

### Pattern 1: Socket Event Lifecycle (Server-Authoritative)

Every player action in lobby follows this chain:

```typescript
// Client sends action
socket.emit('join-room', { roomCode, playerName });

// Server validates, mutates state
socket.on('join-room', ({ roomCode, playerName }) => {
  // 1. Validate preconditions (room exists, < 6 players, name unique)
  if (!getRoom(roomCode)) {
    socket.emit('error', 'Room not found');
    return;
  }

  // 2. Mutate game state
  const room = getRoom(roomCode);
  const player = createPlayer(socket.id, playerName, false);
  room.players.set(socket.id, player);
  socket.join(roomCode);

  // 3. Broadcast updated state to all in room
  io.to(roomCode).emit('playerJoined', {
    playerName,
    connectedCount: room.players.size,
    playerList: Array.from(room.players.values()).map(p => ({
      name: p.name,
      hasSubmittedFormula: p.hasSubmittedFormula
    }))
  });
});

// Clients receive and re-render
socket.on('playerJoined', (data) => {
  updatePlayerList(data.playerList);
  updateStatusText(`${data.connectedCount} players connected`);
});
```

**Why this pattern:**
- Server is single source of truth — client never mutates state directly
- Broadcast reaches all clients simultaneously — no sync issues
- Validation happens once (server) — prevents cheating
- Client state is always up-to-date after render

### Pattern 2: Form Validation (Dual-Layer)

Client-side validation for UX, server-side for security:

```typescript
// Client-side: Immediate feedback as user types
// Prevents submit button enable until valid
function validatePlayerName(input) {
  const name = input.value.trim();
  const isValid = /^[a-zA-Z0-9 ]{1,20}$/.test(name);

  if (isValid) {
    input.classList.remove('error');
    return true;
  } else {
    input.classList.add('error');
    input.nextElementSibling.textContent = 'Names must be 1-20 alphanumeric chars (spaces OK)';
    return false;
  }
}

// Server-side: Authoritative validation before storing
// Rejects invalid payloads, prevents duplicates, enforces rules
socket.on('join-room', ({ roomCode, playerName }) => {
  if (!playerName || playerName.trim().length < 1 || playerName.trim().length > 20) {
    socket.emit('error', 'Name must be 1-20 characters');
    return;
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(playerName.trim())) {
    socket.emit('error', 'Name must contain only letters, numbers, and spaces');
    return;
  }

  const room = getRoom(roomCode);
  if (Array.from(room.players.values()).some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    socket.emit('error', 'Name already taken in this room');
    return;
  }

  // Safe to proceed
  // ...
});
```

### Pattern 3: Secret Success Formula Handling

Formulas are stored server-side but never broadcast to other players:

```typescript
// Client submits formula
socket.emit('submit-formula', {
  money: 30,
  fame: 15,
  happiness: 15
});

// Server stores and marks as submitted, but does NOT broadcast the values
socket.on('submit-formula', ({ money, fame, happiness }) => {
  const room = getRoom(roomCode);
  const player = room.players.get(socket.id);

  // Validate sum = 60
  if (money + fame + happiness !== 60) {
    socket.emit('error', 'Formula must sum to 60');
    return;
  }

  // Store formula (secret)
  player.successFormula = { money, fame, happiness };
  player.hasSubmittedFormula = true;

  // Broadcast only the flag, never the values
  io.to(roomCode).emit('formulaSubmitted', {
    playerName: player.name,
    count: Array.from(room.players.values()).filter(p => p.hasSubmittedFormula).length
  });

  // Check if game can start
  if (canStartGame(room)) {
    // Enable Start button on host (covered by state broadcast)
  }
});

// Client receives flag, not values
socket.on('formulaSubmitted', ({ playerName, count }) => {
  updatePlayerList(); // Shows "✓" checkmark next to playerName
  updateStatusText(`${count} of ${totalPlayers} players ready`);
  // Never log or display the actual formula values on any client
});
```

**Why this pattern:**
- Formulas are truly secret — no client ever sees another player's formula
- Only a flag is broadcast — minimal bandwidth, maximum privacy
- Server validates sum = 60 — prevents cheating
- Host knows when to enable Start button — triggered by `canStartGame()` logic

### Pattern 4: Host-Only Operations

Start Game button only available to host, validated server-side:

```typescript
// Client: Only host can see/click "Start Game"
// Host.html:
<button id="start-btn" disabled>Start Game</button>

// JavaScript (runs on host screen only)
socket.emit('start-game');

// Server: Validate caller is host AND preconditions met
socket.on('start-game', () => {
  const room = getRoom(roomCode);

  // 1. Verify caller is host
  if (room.hostSocketId !== socket.id) {
    socket.emit('error', 'Only the host can start the game');
    return;
  }

  // 2. Check all preconditions
  if (!canStartGame(room)) {
    socket.emit('error', 'Cannot start: ' + getStartGameError(room));
    return;
  }

  // 3. Shuffle turn order
  const turnOrder = Array.from(room.players.keys()).sort(() => Math.random() - 0.5);
  room.turnOrder = turnOrder;
  room.currentTurnIndex = 0;
  room.gamePhase = 'playing';

  // 4. Broadcast to all clients
  io.to(roomCode).emit('gameStarted', {
    gamePhase: 'playing',
    turnOrder: turnOrder.map(id => room.players.get(id).name),
    currentPlayer: room.players.get(turnOrder[0]).name,
    allPlayers: Array.from(room.players.values()).map(p => ({
      id: p.socketId,
      name: p.name,
      position: 0,  // Everyone starts at position 0
      money: STARTING_MONEY,
      fame: 0,
      happiness: 0
      // Never include successFormula
    }))
  });
});

// Helper function
function canStartGame(room) {
  if (room.players.size < 2) return false;
  const allSubmitted = Array.from(room.players.values()).every(p => p.hasSubmittedFormula);
  return allSubmitted;
}
```

### Anti-Patterns to Avoid

- **Storing formula in localStorage:** Client-side storage can be inspected. Always keep formulas on server only.
- **Broadcasting formula on state update:** Even if marked "private," reduce attack surface by never sending it at all.
- **Client-side turn order shuffle:** Server must shuffle to prevent cheating. Client receives result only.
- **No duplicate name validation:** Server must check all players in room; don't trust client-side check.
- **Enabling Start button without server confirmation:** Server can change game state mid-broadcast. Always wait for server to confirm conditions are met.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation (name length, format) | Custom regex parser | Built-in HTML5 `<input>` attributes + optional regex in `type="text"` pattern | Browser handles validation UI, regex is error-prone and duplicates HTML5 |
| Formula sum display (live feedback) | Manual calculation on every slider move | HTML5 `<input type="range">` with `oninput` listener + single calculation | `oninput` fires only on actual value change, not on render; avoids unnecessary DOM updates |
| Room code generation | Custom algorithm | Phase 1's `generateRoomCode()` — already tested, collision-safe | Tested in Phase 1 with unit tests; don't rewrite |
| Player list iteration | Manual for loops | `Array.from(room.players.values()).map()` + filter | Cleaner, safer for concurrent modifications, easier to test |
| State serialization | Custom JSON builder | Phase 1's `getFullState(room)` + selective field emission | Already handles privacy filtering; prevents accidental formula leaks |

## Runtime State Inventory

Phase 2 involves no rename, refactor, or migration. This section is skipped.

## Common Pitfalls

### Pitfall 1: Formula Broadcast Leaks Secret

**What goes wrong:** Server sends `stateUpdate` with all players' stats, accidentally including `successFormula` field for other players. One client inspection reveals all formulas, breaking the entire game mechanic.

**Why it happens:** Developer copies `player` object directly into broadcast without redacting fields. Or: getFullState function (Phase 1) doesn't filter formulas for non-requestingSocketId clients.

**How to avoid:**
1. Use Phase 1's `getFullState(room, requestingSocketId)` which already redacts formulas
2. When building custom broadcasts (e.g., `playerJoined`), explicitly select fields: `{ name, hasSubmittedFormula }` NOT spread `{ ...player }`
3. Code review: never include `successFormula` in any broadcast

**Warning signs:**
- Browser DevTools Network tab shows formula values in socket events
- Any console log of player object includes `successFormula` in broadcast
- Test fails when checking privacy: `expect(broadcast.player.successFormula).toBeUndefined()`

### Pitfall 2: Duplicate Player Names Allowed

**What goes wrong:** Two players enter the same name "Alice". Host screen shows only one "Alice" in the list. Board state confusion, stat tracking breaks (which Alice's money is this?).

**Why it happens:** Client-side validation only, no server check. Or: server checks against old player list before new player is added.

**How to avoid:**
1. Client-side check for UX (immediate feedback): `if (room.players.some(p => p.name === input.value))`
2. Server-side check before storing: `if (existingNames.includes(playerName.toLowerCase())) { reject }`
3. Use lowercase comparison (case-insensitive duplicates)

**Warning signs:**
- Two players see their names as identical
- Host screen shows player count as 3 but only 2 names visible
- Tests fail: `expect(room.players.map(p => p.name)).toEqual([expected unique names])`

### Pitfall 3: Start Game Button Enable/Disable Out of Sync

**What goes wrong:** Host sees "Start Game" button as enabled (no longer gray). They click. Server rejects because a player just submitted their formula, changing the state. Or: a player disconnects right after submitting formula, but host's button wasn't updated yet.

**Why it happens:** Client tracks button state locally (no server confirmation). Or: broadcasted state is not processed before user interaction. Or: race condition between two socket events (formulaSubmitted, playerLeft).

**How to avoid:**
1. Compute button state from broadcasted room state, not local flag
2. Every formulaSubmitted or playerLeft event triggers re-render of button state
3. Button state logic: `enabled = room.players.size >= 2 && all players have submitted formula`
4. Don't cache button state; recompute on every relevant broadcast

**Warning signs:**
- Button enables/disables inconsistently between players
- Host clicks Start, gets error "not enough players" even though list shows 2+
- After a player disconnects, host's Start button doesn't disable automatically
- Test fails: `expect(button.disabled).toBe(true)` after `formulaSubmitted` event

### Pitfall 4: Form Validation Not Server-Side

**What goes wrong:** Client validates name length (1-20 chars). User opens DevTools, changes the validation, sends `{ name: 'A'.repeat(1000) }` to server. Server stores it, board state breaks (name display overflows, database limits exceeded if added later).

**Why it happens:** Developer relies on client-side validation for security, forgetting users can modify client code.

**How to avoid:**
1. Client-side validation is UX only (fast feedback)
2. Server ALWAYS validates before storing:
   ```typescript
   if (playerName.trim().length < 1 || playerName.trim().length > 20) {
     socket.emit('error', 'Invalid length');
     return;
   }
   ```
3. Reject invalid payloads with error event

**Warning signs:**
- No validation in socket event handler (only client-side)
- Test sends invalid payload, server doesn't reject it
- Log shows storage of unexpected data (very long name, special characters)

### Pitfall 5: Player Disconnect Leaves Ghost in Room

**What goes wrong:** A player's connection drops. Their player object stays in `room.players` but their socket is gone. When they try to rejoin, a new socket.id is created, so they become a second player in the room. Original player is a ghost (never sends actions, blocks win condition).

**Why it happens:** Disconnect handler doesn't remove player from room immediately (waiting for reconnect window). But new join doesn't check for existing player by name.

**How to avoid:**
1. Extend Phase 1's disconnect handler: remove player from room immediately OR mark as `disconnected` with cleanup timer
2. On rejoin, check if a player with that name already exists in room, reuse that player object
3. If cleanup timer fires before rejoin, then remove from room

**Warning signs:**
- Host screen shows 3 players but only 2 are active
- Disconnected player's money persists but they can't act
- Test: disconnect + rejoin creates duplicate entries

### Pitfall 6: Formula Sum Validation Bypass (Client Sends Invalid Sum)

**What goes wrong:** Client-side sum validation prevents submit if sum ≠ 60. But user opens DevTools, edits the sum check logic, sends `{ money: 50, fame: 6, happiness: 4 }` (sum=60, valid) then manually sends `{ money: 70, fame: 0, happiness: 0 }` (sum=70, invalid) via Socket.io emit.

**Why it happens:** Server trusts client-side calculation without re-validating.

**How to avoid:**
1. Server ALWAYS validates sum in socket handler:
   ```typescript
   const sum = money + fame + happiness;
   if (sum !== 60) {
     socket.emit('error', 'Formula must sum to exactly 60');
     return;
   }
   ```
2. Don't assume client sent the right sum; always verify before storing
3. Test with invalid payloads: `socket.emit('submit-formula', { money: 70, fame: 0, happiness: 0 })`

**Warning signs:**
- No sum check in `submit-formula` socket handler
- Test sends invalid formula, server accepts it
- Player successfully submits formula with sum ≠ 60

## Code Examples

### Example 1: Join-Room Socket Handler

```typescript
// Source: Phase 2 architecture pattern
socket.on('join-room', ({ roomCode, playerName }) => {
  // Rate limit check (from Phase 1)
  if (checkRateLimit(socket.id, 'join-room')) {
    return;
  }

  // Validate room exists
  const room = getRoom(roomCode);
  if (!room) {
    socket.emit('error', 'Room not found');
    return;
  }

  // Validate room capacity
  if (room.players.size >= 6) {
    socket.emit('error', 'Room is full (max 6 players)');
    return;
  }

  // Validate player name
  const trimmedName = playerName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 20) {
    socket.emit('error', 'Name must be 1-20 characters');
    return;
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
    socket.emit('error', 'Name must contain only letters, numbers, and spaces');
    return;
  }

  // Check for duplicate name (case-insensitive)
  if (Array.from(room.players.values()).some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
    socket.emit('error', 'Name already taken in this room');
    return;
  }

  // All checks passed: add player to room
  const player = createPlayer(socket.id, trimmedName, false);
  room.players.set(socket.id, player);
  socket.join(roomCode);

  // Cancel any pending cleanup timer (player rejoining)
  cancelCleanup(roomCode);

  // Broadcast updated player list to all in room
  io.to(roomCode).emit('playerJoined', {
    playerName: trimmedName,
    connectedCount: room.players.size,
    playerList: Array.from(room.players.values()).map(p => ({
      name: p.name,
      hasSubmittedFormula: p.hasSubmittedFormula
    }))
  });

  // Send full state to the joining player (so they catch up)
  socket.emit('roomState', getFullState(room, socket.id));
});
```

### Example 2: Submit Formula Handler with Validation

```typescript
// Source: Phase 2 architecture pattern
socket.on('submit-formula', ({ money, fame, happiness }) => {
  const roomCode = findRoomCodeBySocketId(socket.id);
  if (!roomCode) {
    socket.emit('error', 'You are not in a room');
    return;
  }

  const room = getRoom(roomCode);
  if (!room) {
    socket.emit('error', 'Room was deleted');
    return;
  }

  const player = room.players.get(socket.id);
  if (!player) {
    socket.emit('error', 'You are not in this room');
    return;
  }

  // Validate all three values are numbers
  if (typeof money !== 'number' || typeof fame !== 'number' || typeof happiness !== 'number') {
    socket.emit('error', 'Invalid formula format');
    return;
  }

  // Validate sum = 60 (CRITICAL: server-side check, not just client-side)
  const sum = money + fame + happiness;
  if (sum !== 60) {
    socket.emit('error', `Formula must sum to 60 (you sent ${sum})`);
    return;
  }

  // Validate each value is within reasonable bounds (0-60)
  if (money < 0 || fame < 0 || happiness < 0 || money > 60 || fame > 60 || happiness > 60) {
    socket.emit('error', 'Each stat must be between 0 and 60');
    return;
  }

  // All validation passed: store formula and mark as submitted
  player.successFormula = { money, fame, happiness };
  player.hasSubmittedFormula = true;

  // Count how many players have now submitted
  const submittedCount = Array.from(room.players.values())
    .filter(p => p.hasSubmittedFormula).length;

  // Broadcast only the flag, never the values
  io.to(roomCode).emit('formulaSubmitted', {
    playerName: player.name,
    submittedCount,
    totalPlayerCount: room.players.size
  });

  // Confirm to this player
  socket.emit('formulaAccepted', {
    message: 'Your Success Formula has been set'
  });
});
```

### Example 3: Start Game Handler

```typescript
// Source: Phase 2 architecture pattern
socket.on('start-game', () => {
  const roomCode = findRoomCodeBySocketId(socket.id);
  if (!roomCode) {
    socket.emit('error', 'You are not in a room');
    return;
  }

  const room = getRoom(roomCode);
  if (!room) {
    socket.emit('error', 'Room was deleted');
    return;
  }

  // Only host can start the game
  if (room.hostSocketId !== socket.id) {
    socket.emit('error', 'Only the host can start the game');
    return;
  }

  // Check all preconditions
  if (room.players.size < 2) {
    socket.emit('error', `Need at least 2 players (you have ${room.players.size})`);
    return;
  }

  const notSubmitted = Array.from(room.players.values())
    .filter(p => !p.hasSubmittedFormula);

  if (notSubmitted.length > 0) {
    socket.emit('error', `Waiting for ${notSubmitted.length} player(s) to submit formula: ${notSubmitted.map(p => p.name).join(', ')}`);
    return;
  }

  // All preconditions met: start the game
  // 1. Shuffle turn order
  const playerIds = Array.from(room.players.keys());
  const turnOrder = playerIds.sort(() => Math.random() - 0.5);

  // 2. Update game state
  room.gamePhase = 'playing';
  room.turnOrder = turnOrder;
  room.currentTurnIndex = 0;
  room.startedAt = Date.now();

  // Set current turn player
  const firstPlayerId = turnOrder[0];

  // 3. Broadcast game started to all players
  io.to(roomCode).emit('gameStarted', {
    gamePhase: 'playing',
    turnOrder: turnOrder.map(id => room.players.get(id)!.name),
    currentPlayerName: room.players.get(firstPlayerId)!.name,
    currentPlayerSocketId: firstPlayerId,
    // Send all player data without formulas
    players: Array.from(room.players.values()).map(p => ({
      socketId: p.socketId,
      name: p.name,
      position: 0,
      money: STARTING_MONEY,
      fame: 0,
      happiness: 0,
      // DO NOT include successFormula
    })),
    timestamp: Date.now()
  });
});
```

### Example 4: Client-Side Form Validation (Player Screen)

```javascript
// Source: Vanilla JS form handling (public/game.js)
function setupFormulaForm() {
  const moneySlider = document.getElementById('formula-money');
  const fameSlider = document.getElementById('formula-fame');
  const happinessSlider = document.getElementById('formula-happiness');
  const sumDisplay = document.getElementById('formula-sum');
  const submitBtn = document.getElementById('formula-submit');
  const errorMsg = document.getElementById('formula-error');

  function updateSum() {
    const money = parseInt(moneySlider.value, 10);
    const fame = parseInt(fameSlider.value, 10);
    const happiness = parseInt(happinessSlider.value, 10);
    const sum = money + fame + happiness;

    sumDisplay.textContent = `${sum} / 60`;

    if (sum === 60) {
      sumDisplay.classList.remove('error');
      errorMsg.textContent = '';
      submitBtn.disabled = false;
    } else {
      sumDisplay.classList.add('error');
      errorMsg.textContent = sum < 60 ? `${60 - sum} points remaining` : `${sum - 60} points over limit`;
      submitBtn.disabled = true;
    }
  }

  moneySlider.addEventListener('input', updateSum);
  fameSlider.addEventListener('input', updateSum);
  happinessSlider.addEventListener('input', updateSum);

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const money = parseInt(moneySlider.value, 10);
    const fame = parseInt(fameSlider.value, 10);
    const happiness = parseInt(happinessSlider.value, 10);

    // Client-side check (UX only)
    if (money + fame + happiness !== 60) {
      errorMsg.textContent = 'Formula must sum to 60';
      return;
    }

    // Send to server (server will validate again)
    socket.emit('submit-formula', {
      money,
      fame,
      happiness
    });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  });

  // Initial state
  updateSum();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server broadcasts full player objects | Server uses `getFullState()` with redaction + selective field broadcasting | Phase 1 established this pattern | Prevents accidental formula leaks; cleaner API |
| Client validates form, trusts itself | Server validates all form inputs server-side | Phase 2 requirement | Prevents cheating; essential for multiplayer fairness |
| Player name stored case-sensitively | Case-insensitive duplicate check on server | Phase 2 requirement | Prevents Alice / ALICE edge case |
| No heartbeat on sockets | Phase 1 added ping/pong heartbeat | Phase 1 complete | Detects zombie sockets; prevents memory leaks |

## Open Questions

1. **Player Rejoin Before Cleanup Timer:**
   - Current: Phase 1 has 30-minute cleanup window via `cancelCleanup(roomCode)`
   - Clarification needed: Should a rejoining player be able to skip re-entering their name/formula? Or always re-submit?
   - Recommendation: Force re-submission (simplest); mark `hasSubmittedFormula = false` on rejoin so they must re-submit. Justifies clean re-entry.

2. **Room Code Case Sensitivity:**
   - Current: Phase 1 generates uppercase letters only
   - Clarification: Should join-room accept lowercase input (e.g., user types "game" for "GAME")?
   - Recommendation: Accept any case, convert to uppercase: `roomCode.toUpperCase()`

3. **Name Trimming:**
   - Current: Names are trimmed on server before storing
   - Should "  Alice  " and "Alice" be considered the same? (Yes, recommended)
   - Current code trims; proceeding with that approach.

## Environment Availability

Phase 2 has no external dependencies beyond Phase 1. Testing Node.js version availability:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20.x LTS | Server-side socket handlers | ✓ | 20.x+ | — |
| npm | Dependency management | ✓ | 8.x+ | — |
| TypeScript | Type checking (server.ts) | ✓ | 5.3.x+ | Downgrade to JavaScript if needed |
| Jest | Unit testing | ✓ | 29.7.0 | — |

No external services or tools required. All state is in-memory; no database connection needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | jest.config.js (from Phase 1) |
| Quick run command | `npm test -- tests/lobby.test.ts --bail` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOBBY-01 | Host creates room, receives code | unit | `npm test -- tests/lobby.test.ts -t "create-room"` | ❌ Wave 0 |
| LOBBY-02 | Players join room by code, get full state | unit | `npm test -- tests/lobby.test.ts -t "join-room"` | ❌ Wave 0 |
| LOBBY-03 | Host screen displays player list + formula flags | integration | `npm test -- tests/lobby.test.ts -t "playerJoined"` | ❌ Wave 0 |
| LOBBY-04 | Start Game button disabled until 2+ players | unit | `npm test -- tests/lobby.test.ts -t "canStartGame"` | ❌ Wave 0 |
| LOBBY-05 | Player submits formula, sum=60 validation | unit | `npm test -- tests/lobby.test.ts -t "submit-formula"` | ❌ Wave 0 |
| LOBBY-06 | Game doesn't start until all formulas submitted | unit | `npm test -- tests/lobby.test.ts -t "start-game validation"` | ❌ Wave 0 |
| LOBBY-07 | Disconnect removes player, updates list | unit | `npm test -- tests/lobby.test.ts -t "disconnect in lobby"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- tests/lobby.test.ts --bail` (stops on first failure, fast iteration)
- **Per wave merge:** `npm test` (full suite: 54 existing Phase 1 tests + 25-30 new Phase 2 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lobby.test.ts` — new file, covers LOBBY-01 through LOBBY-07 with ~25 real tests
  - Tests for create-room socket event (non-host can't create? — verify spec)
  - Tests for join-room validation (room exists, capacity, name uniqueness, format)
  - Tests for submit-formula validation (sum=60, bounds checking, server-side only)
  - Tests for start-game preconditions (host only, 2+ players, all formulas submitted)
  - Tests for disconnect during lobby (removes player, cleans up, broadcasts update)
  - Tests for canStartGame() helper function
- [ ] Phase 1 test placeholders already in place (`tests/sync.test.js`, etc.) — no new test scaffolding needed
- [ ] No new test framework or fixture setup required; use existing Jest configuration from Phase 1

*(If no gaps: "No gaps — existing test infrastructure supports Phase 2. Placeholder tests replaced with real implementations in Wave 0.")*

## Sources

### Primary (HIGH confidence)
- Phase 1 research documents: STACK.md, ARCHITECTURE.md, PITFALLS.md (established socket patterns, server-authoritative architecture)
- Phase 1 server.ts implementation: Player interface, GameRoom interface, generateRoomCode, getFullState patterns
- Official Socket.io 4.7.2 documentation: room joining, broadcasting, rate limiting patterns

### Secondary (MEDIUM confidence)
- HTML5 form validation APIs: `<input>` attributes, `:valid`/`:invalid` pseudo-selectors, `oninput` events
- DOM manipulation patterns: `classList`, `textContent`, `addEventListener`
- JavaScript standard features: Array.from, filter, map, sort, trim

### Tertiary (LOW confidence)
- None — all recommendations grounded in Phase 1 established patterns or standard web APIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phase 1 established all dependencies; no new packages needed
- Architecture patterns: HIGH — Socket event patterns directly from Phase 1 infrastructure
- Validation patterns: HIGH — Form validation is standard web API; server-side is security best practice
- Pitfalls: HIGH — Identified common lobby-system issues; all have proven mitigations
- Code examples: HIGH — Drawn from Phase 1 patterns and standard Socket.io/vanilla JS practices

**Research date:** 2026-03-30
**Valid until:** 2026-04-27 (30 days; stable domain, no rapid library changes expected)
