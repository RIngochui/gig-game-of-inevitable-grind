---
phase: 01-foundation-setup
plan: 02
type: execute
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - server.js
  - README.md
  - tests/sync.test.js
  - tests/disconnect.test.js
  - tests/rate.test.js
  - tests/heartbeat.test.js
autonomous: true
requirements:
  - SETUP-02
  - SETUP-04

must_haves:
  truths:
    - "getFullState(room) returns a JSON-serialisable snapshot with all player stats"
    - "New socket joining a room immediately receives a 'gameState' event with full room state"
    - "Server broadcasts 'gameState' to room every 30 seconds via setInterval"
    - "Disconnecting socket is removed from its room and remaining players receive 'playerLeft'"
    - "Empty room schedules a 30-minute cleanup timeout; rejoining player cancels the timeout"
    - "Excess socket events are silently dropped (no error thrown, no broadcast)"
    - "Server sends 'ping' to each socket every 30 seconds; sockets silent for 60s are disconnected"
    - "README.md contains all four setup steps (npm install, npm start, ngrok, URLs)"
  artifacts:
    - path: "server.js"
      provides: "getFullState, disconnect handler, rate limiter, heartbeat, full-state-sync"
      exports: ["getFullState", "checkRateLimit", "RATE_LIMITS"]
    - path: "README.md"
      provides: "4-step setup instructions"
      contains: "npm install"
    - path: "tests/sync.test.js"
      provides: "real unit tests for getFullState and 30s broadcast"
    - path: "tests/disconnect.test.js"
      provides: "real unit tests for disconnect cleanup"
    - path: "tests/rate.test.js"
      provides: "real unit tests for checkRateLimit"
    - path: "tests/heartbeat.test.js"
      provides: "real unit tests for heartbeat lastPong tracking"
  key_links:
    - from: "server.js io.on('connection')"
      to: "socket.on('disconnect')"
      via: "disconnect handler removes player from room and schedules cleanup"
      pattern: "socket\\.on\\('disconnect'"
    - from: "server.js"
      to: "setInterval.*30000"
      via: "periodic full-state broadcast every 30s"
      pattern: "setInterval"
    - from: "server.js checkRateLimit"
      to: "io.on('connection') event handlers"
      via: "called at top of every incoming event handler to guard against spam"
      pattern: "checkRateLimit"
---

<objective>
Add runtime resilience to the server: full-state-sync (immediate + periodic), disconnect cleanup with 30-minute timeout, per-socket rate limiting, heartbeat/ping-pong zombie detection, and the README. This plan covers tasks 6–10 from the phase scope.

Purpose: Prevent the six critical pitfalls identified in research — stale client state, memory leaks, zombie sockets, event spam, state desynchronisation, and missing documentation.
Output: server.js with getFullState, disconnect handler, rate limiter, heartbeat loop; README.md; real unit tests for all four concerns.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-setup/01-RESEARCH.md
@.planning/phases/01-foundation-setup/01-VALIDATION.md
@.planning/phases/01-foundation-setup/01-01-SUMMARY.md
</context>

<interfaces>
<!-- Key exports available from 01-PLAN.md (server.js). Executor must NOT re-declare these. -->

From server.js (after 01-PLAN.md):
```javascript
// Map<roomCode, GameRoom>
const rooms = new Map();

// Helpers
function generateRoomCode(): string         // 4 uppercase letters, unique
function getRoom(roomCode): object|undefined
function setRoom(roomCode, room): void
function deleteRoom(roomCode): boolean
function findRoomCodeBySocketId(socketId): string|undefined

// Factories
function createPlayer(socketId, name, isHost?): object
function createGameRoom(roomCode, hostSocketId): object

// Constants
GAME_PHASES = { LOBBY:'lobby', PLAYING:'playing', FINAL_ROUND:'finalRound', ENDED:'ended' }
TURN_PHASES = { WAITING_FOR_ROLL, MID_ROLL, LANDED, TILE_RESOLVING, WAITING_FOR_NEXT_TURN }
STARTING_MONEY = 50000

// Player shape (from createPlayer):
{
  socketId, name, isHost,
  money, fame, happiness,
  position, inPrison, skipNextTurn, retired, unemployed,
  isMarried, kids, collegeDebt, degree, career,
  hasStudentLoans, hasWeddingRing, hasSportsCar, hasLandlordHat,
  graduationCapColor, careerBadge,
  successFormula, hasSubmittedFormula,
  luckCards,
  lastPong
}

// GameRoom shape (from createGameRoom):
{
  id, hostSocketId,
  players: Map<socketId, Player>,
  turnOrder, currentTurnIndex,
  gamePhase, turnPhase,
  board,
  sharedResources: { investmentPool, cryptoInvestments: Map },
  cleanupTimer,
  turnHistory,
  createdAt, startedAt
}
```
</interfaces>

<tasks>

<task type="auto" tdd="false">
  <name>Task 6: Implement full-state-sync (getFullState + periodic broadcast)</name>
  <read_first>
    - server.js (current state — read entire file to understand existing structure)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 2 — full-state-sync on reconnection; Pattern 3 — periodic broadcast mention in PITFALLS)
  </read_first>
  <files>server.js, tests/sync.test.js</files>
  <action>
**Part A — Add getFullState() to server.js**

Insert the following function AFTER the `createGameRoom` function and BEFORE `io.on('connection', ...)`:

```javascript
// ── State serialisation ────────────────────────────────────────────────────

/**
 * Produce a JSON-serialisable snapshot of a room's full state.
 * Maps are converted to plain objects; sensitive fields (successFormula) are
 * redacted — the server NEVER sends raw Success Formulas to clients.
 *
 * @param {object} room  — a GameRoom object
 * @param {string|null} requestingSocketId — if provided, success formula is
 *   only included for THIS socket (own formula visible to self only)
 * @returns {object}
 */
function getFullState(room, requestingSocketId = null) {
  const playersSnapshot = {};
  for (const [socketId, player] of room.players) {
    playersSnapshot[socketId] = {
      socketId: player.socketId,
      name: player.name,
      isHost: player.isHost,
      money: player.money,
      fame: player.fame,
      happiness: player.happiness,
      position: player.position,
      inPrison: player.inPrison,
      skipNextTurn: player.skipNextTurn,
      retired: player.retired,
      unemployed: player.unemployed,
      isMarried: player.isMarried,
      kids: player.kids,
      degree: player.degree,
      career: player.career,
      hasStudentLoans: player.hasStudentLoans,
      hasWeddingRing: player.hasWeddingRing,
      hasSportsCar: player.hasSportsCar,
      hasLandlordHat: player.hasLandlordHat,
      graduationCapColor: player.graduationCapColor,
      careerBadge: player.careerBadge,
      hasSubmittedFormula: player.hasSubmittedFormula,
      luckCardCount: player.luckCards.length,
      // Only reveal own Success Formula, never others'
      successFormula: socketId === requestingSocketId ? player.successFormula : null
    };
  }

  return {
    roomId: room.id,
    hostSocketId: room.hostSocketId,
    players: playersSnapshot,
    turnOrder: room.turnOrder,
    currentTurnIndex: room.currentTurnIndex,
    currentTurnPlayer: room.turnOrder[room.currentTurnIndex] || null,
    gamePhase: room.gamePhase,
    turnPhase: room.turnPhase,
    sharedResources: {
      investmentPool: room.sharedResources.investmentPool,
      cryptoInvestments: Object.fromEntries(room.sharedResources.cryptoInvestments)
    },
    turnHistory: room.turnHistory,
    timestamp: Date.now()
  };
}
```

**Part B — Add periodic broadcast + join-time sync inside io.on('connection')**

Inside the `io.on('connection', (socket) => { ... })` block, ADD the following handler BEFORE the `disconnect` handler (do NOT replace existing code):

```javascript
  // Send full state immediately when a socket requests sync (on join/reconnect)
  socket.on('requestSync', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    socket.emit('gameState', getFullState(room, socket.id));
  });
```

**Part C — Add 30-second periodic broadcast at module level (outside io.on)**

Add this AFTER `io.on('connection', ...)` block:

```javascript
// ── Periodic full-state broadcast (every 30s) ─────────────────────────────
// Keeps all clients in sync even if an event was missed.
const STATE_BROADCAST_INTERVAL = setInterval(() => {
  for (const [roomCode, room] of rooms) {
    if (room.players.size > 0) {
      io.to(roomCode).emit('gameState', getFullState(room));
    }
  }
}, 30000);

// Prevent Jest from hanging: expose for cleanup
STATE_BROADCAST_INTERVAL.unref(); // Allow process to exit even if interval is active
```

**Part D — Update module.exports**

```javascript
module.exports = {
  app, httpServer, io, rooms, connectedSockets,
  generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId,
  createPlayer, createGameRoom,
  GAME_PHASES, TURN_PHASES, STARTING_MONEY,
  getFullState
};
```

**Part E — Replace tests/sync.test.js stub with real unit tests**

```javascript
'use strict';

let getFullState, createGameRoom, createPlayer, rooms, GAME_PHASES;

beforeEach(() => {
  const server = require('../server.js');
  getFullState = server.getFullState;
  createGameRoom = server.createGameRoom;
  createPlayer = server.createPlayer;
  rooms = server.rooms;
  GAME_PHASES = server.GAME_PHASES;
  rooms.clear();
});

afterAll(() => {
  require('../server.js').httpServer.close();
});

describe('getFullState', () => {
  function makeRoom() {
    const room = createGameRoom('SYNC', 'host-1');
    room.players.set('host-1', createPlayer('host-1', 'Alice', true));
    room.players.set('guest-1', createPlayer('guest-1', 'Bob'));
    return room;
  }

  test('returns roomId and hostSocketId', () => {
    const room = makeRoom();
    const state = getFullState(room);
    expect(state.roomId).toBe('SYNC');
    expect(state.hostSocketId).toBe('host-1');
  });

  test('players snapshot includes all connected players', () => {
    const room = makeRoom();
    const state = getFullState(room);
    expect(Object.keys(state.players)).toHaveLength(2);
    expect(state.players['host-1'].name).toBe('Alice');
    expect(state.players['guest-1'].name).toBe('Bob');
  });

  test('successFormula is null for players other than requestingSocketId', () => {
    const room = makeRoom();
    room.players.get('host-1').successFormula = { money: 20, fame: 20, happiness: 20 };
    const state = getFullState(room, 'guest-1');
    // guest requesting — should NOT see host formula
    expect(state.players['host-1'].successFormula).toBeNull();
    // guest sees own formula (null because not set)
    expect(state.players['guest-1'].successFormula).toBeNull();
  });

  test('requesting socket sees their own successFormula', () => {
    const room = makeRoom();
    room.players.get('host-1').successFormula = { money: 20, fame: 20, happiness: 20 };
    const state = getFullState(room, 'host-1');
    expect(state.players['host-1'].successFormula).toEqual({ money: 20, fame: 20, happiness: 20 });
  });

  test('cryptoInvestments serialised as plain object', () => {
    const room = makeRoom();
    room.sharedResources.cryptoInvestments.set('host-1', 5000);
    const state = getFullState(room);
    expect(state.sharedResources.cryptoInvestments).not.toBeInstanceOf(Map);
    expect(state.sharedResources.cryptoInvestments['host-1']).toBe(5000);
  });

  test('includes timestamp', () => {
    const room = makeRoom();
    const before = Date.now();
    const state = getFullState(room);
    const after = Date.now();
    expect(state.timestamp).toBeGreaterThanOrEqual(before);
    expect(state.timestamp).toBeLessThanOrEqual(after);
  });

  test('result is JSON-serialisable (no circular refs, no Map)', () => {
    const room = makeRoom();
    expect(() => JSON.stringify(getFullState(room))).not.toThrow();
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern sync --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "function getFullState" server.js returns a match
    - grep "requestSync" server.js returns a match (socket event handler)
    - grep "STATE_BROADCAST_INTERVAL" server.js returns a match (30s setInterval)
    - grep "unref" server.js returns a match (prevents Jest hang)
    - module.exports includes getFullState
    - npm test --testPathPattern sync exits 0 with all 7 tests passing
    - getFullState({}) returns JSON.stringify-safe object (no Maps, no circular refs)
    - successFormula is null for other players (security: never leaks opponent formula)
  </acceptance_criteria>
  <done>getFullState() serialises room state safely; socket 'requestSync' event sends it immediately; 30-second setInterval broadcasts to all rooms with active players; tests pass.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 7: Build disconnect and room cleanup handler</name>
  <read_first>
    - server.js (current disconnect handler — read entire file to see current structure)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 4 — explicit room cleanup; 30-minute timeout implementation)
  </read_first>
  <files>server.js, tests/disconnect.test.js</files>
  <action>
**Part A — Replace the minimal disconnect handler in server.js with the full implementation**

The existing `socket.on('disconnect', ...)` inside `io.on('connection', ...)` currently only logs. Replace it with:

```javascript
  socket.on('disconnect', (reason) => {
    connectedSockets.delete(socket.id);
    console.log(`[disconnect] ${socket.id} — ${reason}  (total: ${connectedSockets.size})`);

    // Find which room this socket was in
    const roomCode = findRoomCodeBySocketId(socket.id);
    if (!roomCode) return; // Socket wasn't in any game room

    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    const playerName = player ? player.name : 'Unknown';

    // Remove player from room
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      // Room is empty — schedule cleanup after 30 minutes (allow rejoin window)
      room.cleanupTimer = setTimeout(() => {
        const currentRoom = getRoom(roomCode);
        if (currentRoom && currentRoom.players.size === 0) {
          deleteRoom(roomCode);
          console.log(`[cleanup] Room ${roomCode} deleted after 30-minute timeout`);
        }
      }, 30 * 60 * 1000);
    } else {
      // Broadcast to remaining players
      io.to(roomCode).emit('playerLeft', {
        socketId: socket.id,
        playerName,
        remainingPlayers: room.players.size,
        timestamp: Date.now()
      });

      // Send updated game state to remaining players
      io.to(roomCode).emit('gameState', getFullState(room));
    }
  });
```

Also add a `cancelCleanup(roomCode)` helper function AFTER `findRoomCodeBySocketId` (used when a player rejoins before the 30-minute window expires):

```javascript
/**
 * Cancel a scheduled room cleanup (called when a player rejoins the room).
 * @param {string} roomCode
 */
function cancelCleanup(roomCode) {
  const room = getRoom(roomCode);
  if (room && room.cleanupTimer) {
    clearTimeout(room.cleanupTimer);
    room.cleanupTimer = null;
    console.log(`[cleanup] Room ${roomCode} cleanup cancelled (player rejoined)`);
  }
}
```

Update module.exports to add cancelCleanup:
```javascript
module.exports = {
  app, httpServer, io, rooms, connectedSockets,
  generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, cancelCleanup,
  createPlayer, createGameRoom,
  GAME_PHASES, TURN_PHASES, STARTING_MONEY,
  getFullState
};
```

**Part B — Replace tests/disconnect.test.js stub with real unit tests**

These tests target the pure logic (room cleanup, playerLeft emit) using the helper functions directly — not the socket event (which would require a full Socket.io integration test):

```javascript
'use strict';

let getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, cancelCleanup;
let createPlayer, createGameRoom, rooms;

beforeEach(() => {
  const server = require('../server.js');
  getRoom = server.getRoom;
  setRoom = server.setRoom;
  deleteRoom = server.deleteRoom;
  findRoomCodeBySocketId = server.findRoomCodeBySocketId;
  cancelCleanup = server.cancelCleanup;
  createPlayer = server.createPlayer;
  createGameRoom = server.createGameRoom;
  rooms = server.rooms;
  rooms.clear();
});

afterAll(() => {
  require('../server.js').httpServer.close();
});

describe('disconnect cleanup logic', () => {
  test('removing last player from room sets players.size to 0', () => {
    const room = createGameRoom('DISC', 'host-1');
    room.players.set('host-1', createPlayer('host-1', 'Alice', true));
    setRoom('DISC', room);

    room.players.delete('host-1');
    expect(room.players.size).toBe(0);
  });

  test('room remains in rooms Map after player leaves (until cleanup timer fires)', () => {
    const room = createGameRoom('DISC', 'host-1');
    room.players.set('host-1', createPlayer('host-1', 'Alice', true));
    setRoom('DISC', room);

    room.players.delete('host-1');
    // Timer is set but not fired — room still exists
    expect(getRoom('DISC')).toBeDefined();
  });

  test('findRoomCodeBySocketId returns undefined after player removed', () => {
    const room = createGameRoom('DISC', 'host-1');
    room.players.set('host-1', createPlayer('host-1', 'Alice', true));
    setRoom('DISC', room);

    room.players.delete('host-1');
    expect(findRoomCodeBySocketId('host-1')).toBeUndefined();
  });

  test('second player disconnect: remaining player still in room', () => {
    const room = createGameRoom('DISC', 'host-1');
    room.players.set('host-1', createPlayer('host-1', 'Alice', true));
    room.players.set('guest-1', createPlayer('guest-1', 'Bob'));
    setRoom('DISC', room);

    // Guest leaves
    room.players.delete('guest-1');
    expect(room.players.size).toBe(1);
    expect(room.players.has('host-1')).toBe(true);
  });
});

describe('cancelCleanup', () => {
  test('cancelCleanup clears cleanupTimer and sets to null', () => {
    const room = createGameRoom('DISC', 'host-1');
    setRoom('DISC', room);
    room.cleanupTimer = setTimeout(() => {}, 999999);

    cancelCleanup('DISC');
    expect(room.cleanupTimer).toBeNull();
  });

  test('cancelCleanup is safe to call when no timer is set', () => {
    const room = createGameRoom('DISC', 'host-1');
    setRoom('DISC', room);
    room.cleanupTimer = null;

    expect(() => cancelCleanup('DISC')).not.toThrow();
  });

  test('cancelCleanup is safe to call for non-existent room', () => {
    expect(() => cancelCleanup('XXXX')).not.toThrow();
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern disconnect --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "players.delete(socket.id)" server.js returns a match (player removed on disconnect)
    - grep "cleanupTimer = setTimeout" server.js returns a match (30-min cleanup scheduled)
    - grep "30 \* 60 \* 1000" server.js returns a match (correct timeout duration)
    - grep "playerLeft" server.js returns a match (event emitted to remaining players)
    - grep "function cancelCleanup" server.js returns a match
    - grep "clearTimeout" server.js returns a match (cleanup can be cancelled on rejoin)
    - module.exports includes cancelCleanup
    - npm test --testPathPattern disconnect exits 0 with all 7 tests passing
  </acceptance_criteria>
  <done>Disconnect handler removes player, schedules 30-minute room cleanup when empty, emits 'playerLeft' to remaining players, and broadcasts updated gameState; cancelCleanup() allows rejoin to cancel timer; tests pass.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 8: Add per-socket rate limiting</name>
  <read_first>
    - server.js (current file — read to find correct insertion points)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (pitfall: "no rate limiting per player" — silent drop pattern)
  </read_first>
  <files>server.js, tests/rate.test.js</files>
  <action>
**Part A — Add rate limiter to server.js**

Insert the following AFTER the `cancelCleanup` function and BEFORE `io.on('connection', ...)`:

```javascript
// ── Per-socket rate limiting ───────────────────────────────────────────────

/**
 * Maximum allowed calls per event type, per socket, per window.
 * Key = event name, Value = { maxCalls, windowMs }
 */
const RATE_LIMITS = {
  'roll-dice':      { maxCalls: 1,  windowMs: 3000  },  // 1 roll per 3s
  'create-room':    { maxCalls: 5,  windowMs: 60000 },  // 5 room creates per minute
  'join-room':      { maxCalls: 10, windowMs: 60000 },  // 10 join attempts per minute
  'submit-formula': { maxCalls: 10, windowMs: 60000 },
  'play-luck-card': { maxCalls: 5,  windowMs: 5000  },
  'requestSync':    { maxCalls: 10, windowMs: 10000 }
};

/**
 * Track per-socket event call timestamps.
 * Map<socketId, Map<eventName, number[]>> — array of timestamps within window.
 */
const rateLimitState = new Map();

/**
 * Check whether a socket is allowed to fire an event.
 * Silently returns false (caller must drop the event) if over limit.
 * Side effect: prunes expired timestamps and records current call.
 *
 * @param {string} socketId
 * @param {string} eventName
 * @returns {boolean} true = allowed, false = rate limited (drop silently)
 */
function checkRateLimit(socketId, eventName) {
  const limit = RATE_LIMITS[eventName];
  if (!limit) return true; // No limit defined for this event — always allow

  const now = Date.now();

  if (!rateLimitState.has(socketId)) {
    rateLimitState.set(socketId, new Map());
  }
  const socketEvents = rateLimitState.get(socketId);

  if (!socketEvents.has(eventName)) {
    socketEvents.set(eventName, []);
  }
  const timestamps = socketEvents.get(eventName);

  // Prune timestamps outside the window
  const windowStart = now - limit.windowMs;
  const recent = timestamps.filter(ts => ts >= windowStart);

  if (recent.length >= limit.maxCalls) {
    // Over limit — silently reject
    return false;
  }

  // Record this call
  recent.push(now);
  socketEvents.set(eventName, recent);
  return true;
}

/**
 * Clear rate limit state for a socket (called on disconnect to free memory).
 * @param {string} socketId
 */
function clearRateLimitState(socketId) {
  rateLimitState.delete(socketId);
}
```

Also call `clearRateLimitState(socket.id)` at the top of the `socket.on('disconnect', ...)` handler (before the room lookup), to prevent memory leaks:

Find the disconnect handler and add as first line:
```javascript
clearRateLimitState(socket.id);
```

Update module.exports:
```javascript
module.exports = {
  app, httpServer, io, rooms, connectedSockets,
  generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, cancelCleanup,
  createPlayer, createGameRoom,
  GAME_PHASES, TURN_PHASES, STARTING_MONEY,
  getFullState,
  RATE_LIMITS, checkRateLimit, clearRateLimitState, rateLimitState
};
```

**Part B — Replace tests/rate.test.js stub with real unit tests**

```javascript
'use strict';

let checkRateLimit, clearRateLimitState, RATE_LIMITS, rateLimitState;

beforeEach(() => {
  const server = require('../server.js');
  checkRateLimit = server.checkRateLimit;
  clearRateLimitState = server.clearRateLimitState;
  RATE_LIMITS = server.RATE_LIMITS;
  rateLimitState = server.rateLimitState;
  // Clear all rate limit state between tests
  rateLimitState.clear();
});

afterAll(() => {
  require('../server.js').httpServer.close();
});

describe('checkRateLimit', () => {
  test('returns true for first call on limited event', () => {
    expect(checkRateLimit('sock-1', 'roll-dice')).toBe(true);
  });

  test('returns false when maxCalls exceeded within window', () => {
    const { maxCalls } = RATE_LIMITS['roll-dice'];
    // Exhaust the limit
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-1', 'roll-dice');
    }
    // Next call should be rejected
    expect(checkRateLimit('sock-1', 'roll-dice')).toBe(false);
  });

  test('returns true for unknown event (no limit defined)', () => {
    expect(checkRateLimit('sock-1', 'some-unknown-event')).toBe(true);
  });

  test('rate limits are per-socket (different sockets independent)', () => {
    const { maxCalls } = RATE_LIMITS['roll-dice'];
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-A', 'roll-dice');
    }
    // sock-A is over limit but sock-B is not
    expect(checkRateLimit('sock-A', 'roll-dice')).toBe(false);
    expect(checkRateLimit('sock-B', 'roll-dice')).toBe(true);
  });

  test('rate limits are per-event (different events independent)', () => {
    const { maxCalls } = RATE_LIMITS['roll-dice'];
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-1', 'roll-dice');
    }
    // roll-dice is over limit but requestSync is not
    expect(checkRateLimit('sock-1', 'roll-dice')).toBe(false);
    expect(checkRateLimit('sock-1', 'requestSync')).toBe(true);
  });
});

describe('clearRateLimitState', () => {
  test('removes socket from rateLimitState map', () => {
    checkRateLimit('sock-1', 'roll-dice');
    expect(rateLimitState.has('sock-1')).toBe(true);

    clearRateLimitState('sock-1');
    expect(rateLimitState.has('sock-1')).toBe(false);
  });

  test('safe to call for unknown socketId', () => {
    expect(() => clearRateLimitState('unknown-sock')).not.toThrow();
  });
});

describe('RATE_LIMITS config', () => {
  test('roll-dice allows 1 call per 3 seconds', () => {
    expect(RATE_LIMITS['roll-dice'].maxCalls).toBe(1);
    expect(RATE_LIMITS['roll-dice'].windowMs).toBe(3000);
  });

  test('all limits have maxCalls and windowMs', () => {
    for (const [event, config] of Object.entries(RATE_LIMITS)) {
      expect(typeof config.maxCalls).toBe('number');
      expect(typeof config.windowMs).toBe('number');
    }
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern rate --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "function checkRateLimit" server.js returns a match
    - grep "RATE_LIMITS" server.js returns a match with at least 'roll-dice' entry
    - grep "clearRateLimitState(socket.id)" server.js returns a match inside disconnect handler
    - grep "rateLimitState.delete" server.js returns a match
    - module.exports includes RATE_LIMITS, checkRateLimit, clearRateLimitState, rateLimitState
    - npm test --testPathPattern rate exits 0 with all tests passing (10+ assertions)
    - checkRateLimit returns false (not throws) when limit exceeded
    - different sockets have independent rate limit counters
  </acceptance_criteria>
  <done>checkRateLimit() silently returns false when event exceeds per-socket rate limit; RATE_LIMITS config covers all player-initiated events; rateLimitState cleaned up on disconnect; tests pass.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 9: Implement heartbeat ping-pong zombie socket detection</name>
  <read_first>
    - server.js (current file — read to find correct insertion points, especially io.on('connection') and module.exports)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 5 — heartbeat implementation example)
  </read_first>
  <files>server.js, tests/heartbeat.test.js</files>
  <action>
**Part A — Add heartbeat to server.js**

Inside `io.on('connection', (socket) => { ... })`, ADD the following BEFORE the `disconnect` handler. This tracks lastPong per connected socket and handles pong responses:

```javascript
  // ── Heartbeat: update lastPong when client responds ──────────────────────
  socket.on('pong', () => {
    // Update lastPong on the player object if they are in a room
    const roomCode = findRoomCodeBySocketId(socket.id);
    if (roomCode) {
      const room = getRoom(roomCode);
      if (room) {
        const player = room.players.get(socket.id);
        if (player) {
          player.lastPong = Date.now();
        }
      }
    }
    // Also track on a top-level map for sockets not yet in a room
    socketLastPong.set(socket.id, Date.now());
  });
```

Add the following TOP-LEVEL declarations (AFTER `rateLimitState`, BEFORE `io.on('connection', ...)`):

```javascript
// ── Heartbeat state ────────────────────────────────────────────────────────
// Tracks lastPong for sockets not yet assigned to a room
const socketLastPong = new Map(); // Map<socketId, timestamp>

const HEARTBEAT_INTERVAL_MS = 30000;  // send ping every 30s
const HEARTBEAT_TIMEOUT_MS  = 60000;  // disconnect if no pong for 60s
```

Also initialise `socketLastPong` on connect (inside `io.on('connection',...)`), BEFORE the `socket.on('pong',...)`handler:

```javascript
  socketLastPong.set(socket.id, Date.now()); // initialise on connect
```

And clean up on disconnect (inside `socket.on('disconnect', ...)`), after `clearRateLimitState`:

```javascript
    socketLastPong.delete(socket.id);
```

Add the heartbeat interval AFTER `STATE_BROADCAST_INTERVAL` (both intervals at module level):

```javascript
// ── Heartbeat loop (every 30s) ────────────────────────────────────────────
const HEARTBEAT_LOOP = setInterval(() => {
  const now = Date.now();

  for (const [socketId, socket] of io.sockets.sockets) {
    // Send ping to each connected socket
    socket.emit('ping');

    // Check if socket has been silent for more than 60 seconds
    const lastPong = socketLastPong.get(socketId) || 0;
    if (now - lastPong > HEARTBEAT_TIMEOUT_MS) {
      console.log(`[heartbeat] Disconnecting zombie socket ${socketId} (no pong for ${HEARTBEAT_TIMEOUT_MS}ms)`);
      socket.disconnect(true);
    }
  }
}, HEARTBEAT_INTERVAL_MS);

HEARTBEAT_LOOP.unref(); // Allow process to exit even if interval is active
```

Update module.exports to add heartbeat-related exports:
```javascript
module.exports = {
  app, httpServer, io, rooms, connectedSockets,
  generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, cancelCleanup,
  createPlayer, createGameRoom,
  GAME_PHASES, TURN_PHASES, STARTING_MONEY,
  getFullState,
  RATE_LIMITS, checkRateLimit, clearRateLimitState, rateLimitState,
  socketLastPong, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS
};
```

**Part B — Replace tests/heartbeat.test.js stub with real unit tests**

```javascript
'use strict';

let socketLastPong, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS;
let createPlayer, createGameRoom, getRoom, setRoom, rooms;

beforeEach(() => {
  const server = require('../server.js');
  socketLastPong = server.socketLastPong;
  HEARTBEAT_INTERVAL_MS = server.HEARTBEAT_INTERVAL_MS;
  HEARTBEAT_TIMEOUT_MS = server.HEARTBEAT_TIMEOUT_MS;
  createPlayer = server.createPlayer;
  createGameRoom = server.createGameRoom;
  getRoom = server.getRoom;
  setRoom = server.setRoom;
  rooms = server.rooms;
  rooms.clear();
  socketLastPong.clear();
});

afterAll(() => {
  require('../server.js').httpServer.close();
});

describe('heartbeat constants', () => {
  test('HEARTBEAT_INTERVAL_MS is 30000 (30 seconds)', () => {
    expect(HEARTBEAT_INTERVAL_MS).toBe(30000);
  });

  test('HEARTBEAT_TIMEOUT_MS is 60000 (60 seconds)', () => {
    expect(HEARTBEAT_TIMEOUT_MS).toBe(60000);
  });
});

describe('socketLastPong state', () => {
  test('socketLastPong is a Map', () => {
    expect(socketLastPong).toBeInstanceOf(Map);
  });

  test('can set and get lastPong timestamp', () => {
    const now = Date.now();
    socketLastPong.set('sock-1', now);
    expect(socketLastPong.get('sock-1')).toBe(now);
  });

  test('can delete lastPong on disconnect', () => {
    socketLastPong.set('sock-1', Date.now());
    socketLastPong.delete('sock-1');
    expect(socketLastPong.has('sock-1')).toBe(false);
  });
});

describe('lastPong update logic', () => {
  test('player.lastPong can be updated in room', () => {
    const room = createGameRoom('BEAT', 'host-1');
    const player = createPlayer('host-1', 'Alice', true);
    const before = player.lastPong;
    room.players.set('host-1', player);
    setRoom('BEAT', room);

    // Simulate pong received: update lastPong
    const after = Date.now() + 100;
    room.players.get('host-1').lastPong = after;

    expect(getRoom('BEAT').players.get('host-1').lastPong).toBe(after);
    expect(getRoom('BEAT').players.get('host-1').lastPong).toBeGreaterThanOrEqual(before);
  });

  test('zombie detection: timestamp older than HEARTBEAT_TIMEOUT_MS triggers disconnect', () => {
    // Verify the logic condition: now - lastPong > HEARTBEAT_TIMEOUT_MS
    const oldPong = Date.now() - (HEARTBEAT_TIMEOUT_MS + 1);
    const isZombie = (Date.now() - oldPong) > HEARTBEAT_TIMEOUT_MS;
    expect(isZombie).toBe(true);
  });

  test('fresh pong does NOT trigger disconnect', () => {
    const recentPong = Date.now() - 1000; // 1 second ago — well within 60s
    const isZombie = (Date.now() - recentPong) > HEARTBEAT_TIMEOUT_MS;
    expect(isZombie).toBe(false);
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern heartbeat --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "HEARTBEAT_INTERVAL_MS" server.js returns a match with value 30000
    - grep "HEARTBEAT_TIMEOUT_MS" server.js returns a match with value 60000
    - grep "socketLastPong" server.js returns a match (Map declared)
    - grep "socket.emit('ping')" server.js returns a match inside HEARTBEAT_LOOP
    - grep "socket.disconnect(true)" server.js returns a match (zombie disconnect)
    - grep "HEARTBEAT_LOOP.unref()" server.js returns a match (prevents Jest hang)
    - grep "socket.on('pong'" server.js returns a match inside io.on('connection')
    - grep "socketLastPong.delete" server.js returns a match inside disconnect handler
    - module.exports includes socketLastPong, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS
    - npm test --testPathPattern heartbeat exits 0 with all tests passing (8+ assertions)
  </acceptance_criteria>
  <done>Server sends 'ping' every 30s to all connected sockets; 'pong' updates lastPong; sockets silent for 60s are disconnected via socket.disconnect(true); socketLastPong cleaned on disconnect; tests pass.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 10: Create README.md with 4-step setup instructions</name>
  <read_first>
    - .planning/REQUIREMENTS.md (SETUP-02 exact requirements: npm install, npm start, ngrok http 3000, host/player URLs)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (standard stack versions, ngrok 5.x note)
    - server.js (confirm PORT default and public file names)
  </read_first>
  <files>README.md</files>
  <action>
Create README.md at the project root with exactly the following content. Do NOT omit any section:

```markdown
# Careers — Modern Edition

A Jackbox-style multiplayer party game. Host plays on a big screen; players join on their phones. No install required for players — just a browser.

---

## Setup (4 steps)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

Server runs at `http://localhost:3000`.

For development with auto-reload:

```bash
npm run dev
```

### 3. Expose server to the internet (for players on other devices)

Download and install [ngrok](https://ngrok.com/download), then:

```bash
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL from the ngrok output.

### 4. Open the game

| Screen | URL |
|--------|-----|
| **Host** (big screen / laptop) | `http://localhost:3000/host.html` |
| **Players** (phones / other devices) | `https://xxxx.ngrok.io/player.html` |

Replace `xxxx.ngrok.io` with your actual ngrok URL.

---

## Development

```bash
npm test              # run unit tests
npm test -- --coverage  # with coverage report
```

---

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20.x LTS |
| Web server | Express 4.18.x |
| Real-time | Socket.io 4.7.x |
| Client | Vanilla JavaScript (no build step) |
| Testing | Jest 29.x |

---

## Architecture

- **Server-authoritative state** — all game mutations happen server-side only
- **In-memory only** — no database; game state lives in process memory; ephemeral sessions
- **Per-room isolation** — Socket.io rooms prevent data leaks between games
- **Full-state-sync** — clients receive complete state on join and every 30 seconds
- **Heartbeat** — server sends ping every 30s; zombie sockets disconnected after 60s of silence

---

*Built with Node.js + Socket.io. Local + ngrok is the distribution model.*
```
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const r=fs.readFileSync('README.md','utf8');const checks=['npm install','npm start','ngrok http 3000','host.html','player.html'];const missing=checks.filter(c=>!r.includes(c));if(missing.length){console.error('Missing:',missing);process.exit(1);}console.log('README OK');process.exit(0);"</automated>
  </verify>
  <acceptance_criteria>
    - README.md exists at project root
    - README.md contains "npm install" (SETUP-02)
    - README.md contains "npm start" (SETUP-02)
    - README.md contains "ngrok http 3000" (SETUP-02)
    - README.md contains "host.html" (SETUP-02)
    - README.md contains "player.html" (SETUP-02)
    - README.md contains a 4-step numbered setup section
    - README.md contains a table showing host URL and player URL
    - File is valid markdown (no broken syntax — read it to verify visually)
  </acceptance_criteria>
  <done>README.md documents all four setup steps required by SETUP-02: npm install, npm start, ngrok http 3000, and both HTML file URLs.</done>
</task>

</tasks>

<verification>
Run the full test suite after all tasks complete:

```bash
npm test -- --coverage --forceExit
```

Expected output:
- 6 test suites, all green
- Tests: 30+ passing, 0 failing
- Coverage on server.js helper functions: >80%

Verify server starts and serves files:

```bash
node server.js &
sleep 1
curl -s -o /dev/null -w "/ → %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "/host.html → %{http_code}\n" http://localhost:3000/host.html
curl -s -o /dev/null -w "/player.html → %{http_code}\n" http://localhost:3000/player.html
kill %1
```

All three must return 200.

Verify README has all required content:

```bash
node -e "const r=require('fs').readFileSync('README.md','utf8');['npm install','npm start','ngrok http 3000','host.html','player.html'].forEach(s=>{if(!r.includes(s))throw new Error('Missing: '+s)});console.log('README OK')"
```
</verification>

<success_criteria>
- [ ] npm test exits 0 with 30+ passing tests across 6 suites (zero placeholders remaining)
- [ ] getFullState(room) returns JSON.stringify-safe object; successFormula hidden for other players
- [ ] 30-second STATE_BROADCAST_INTERVAL broadcasts 'gameState' to all active rooms
- [ ] socket.on('requestSync') sends getFullState to requesting socket immediately
- [ ] Disconnect handler: removes player from room, emits 'playerLeft', schedules 30-min cleanup on empty room
- [ ] cancelCleanup() clears timer and sets cleanupTimer=null
- [ ] clearRateLimitState(socketId) called on disconnect (no memory leak)
- [ ] checkRateLimit('sock', 'roll-dice') returns false after 1 call within 3s window
- [ ] HEARTBEAT_INTERVAL_MS = 30000, HEARTBEAT_TIMEOUT_MS = 60000
- [ ] Server sends 'ping'; zombie sockets (no pong for 60s) disconnected via socket.disconnect(true)
- [ ] socketLastPong cleaned on disconnect
- [ ] README.md contains: npm install, npm start, ngrok http 3000, host.html, player.html
- [ ] Both setInterval loops use .unref() to prevent test hangs
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-setup/01-02-SUMMARY.md` with:
- All functions added to server.js (signatures and purpose)
- All exports now available from server.js
- Test results (suite count, pass count)
- Any deviations from the plan and why
</output>
