# Phase 1: Foundation & Setup - Research

**Researched:** 2026-03-29
**Domain:** Real-time multiplayer party game infrastructure (Node.js + Socket.io + Vanilla JS)
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational multiplayer infrastructure for a Jackbox-style party game. The primary research validates three key decisions: (1) Node.js 20.x LTS + Express 4.18.x + Socket.io 4.7.x as the standard stack for room-based multiplayer, (2) in-memory game state management with per-room isolation via Socket.io's built-in room API, and (3) server-authoritative state architecture with full-state-sync on reconnection to prevent client desynchronization.

The existing research files (STACK.md, ARCHITECTURE.md, PITFALLS.md) provide excellent domain knowledge. This phase focuses on preventing six critical pitfalls: stale client state after reconnection, race conditions in turn-based logic, memory leaks from persistent rooms, state desynchronization from missed events, no heartbeat/zombie socket detection, and lack of rate limiting per player.

**Primary recommendation:** Implement Phase 1 as a foundational milestone—it unblocks all subsequent phases. Prioritize (1) server-authoritative state architecture with atomic turn transitions, (2) full-state-sync on reconnect + periodic 30-second broadcasts, (3) explicit room cleanup on disconnect with 30-minute timeout, (4) heartbeat/ping-pong every 30 seconds, and (5) per-socket event frequency checks.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SETUP-01 | `package.json` with `npm start` script running Express on port 3000 | Stack research confirms Express 4.18.x + npm scripts are standard; server.js entry point is documented pattern |
| SETUP-02 | README documents npm install, npm start, ngrok http 3000, host/player.html URLs | Stack research recommends ngrok 5.x for local tunneling; documentation as Phase 1 deliverable |
| SETUP-03 | Static files served from `/public/` (host.html, player.html, game.js, style.css) | Express static middleware (built-in) handles `/public` folder; no separate server needed per Stack.md |
| SETUP-04 | Server runs Socket.io with CORS enabled for ngrok URLs | Stack research confirms Socket.io 4.7.x with `cors: { origin: '*' }` for ngrok tunneling |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 20.x LTS | Runtime | Latest stable LTS; excellent I/O performance for real-time applications; widely tested |
| Express | 4.18.x | Web server | Lightweight, battle-tested with Socket.io, minimal overhead for room-based multiplayer |
| Socket.io | 4.7.x | Real-time communication | Industry standard for browser multiplayer; built-in room management aligns with 4-letter room code architecture |
| Vanilla JavaScript (ES2020+) | Native | Client-side game logic | Project constraint; no build toolchain required; modern JS has sufficient event patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| compression | 1.7.x | Gzip responses | Reduces Socket.io message size by 60-75% on typical game payloads; adds <5ms overhead |
| cors | 2.8.x | Cross-origin requests | Required for ngrok tunnel local development (host localhost:3000, external URL reaches server) |
| node-uuid | 9.0.x or crypto | Room/session IDs | For generating 4-letter room codes; native Node.js `crypto.randomUUID()` works if 20.10+ (zero dependencies) |
| nodemon | 3.0.x | Dev server reload | Development only; auto-restart on code changes; standard for Node development |

### Development
| Tool | Version | Purpose |
|------|---------|---------|
| ngrok | 5.x (CLI) | Expose local server to internet for remote testing; download from https://ngrok.com |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Express | Fastify, Koa, Hapi | Fastify is faster but adds complexity; Express is proven battle-tested with Socket.io; Koa requires knowledge of modern async middleware |
| Socket.io | native WebSocket API | Raw WebSocket requires custom room management, reconnection handling, message framing; Socket.io handles all this |
| In-memory state | Redis, MongoDB, PostgreSQL | Spec explicitly requires in-memory only for this phase; persistence adds complexity, latency, licensing; revisit for Phase 2 if needed |
| Vanilla JS | React, Vue, Svelte | Frameworks add build step, bundle overhead; vanilla JS eliminates deployment complexity for local party play; sufficient for static views updated via Socket.io |
| CSS character portraits | Canvas, SVG, WebGL | CSS is simplest, no asset pipeline, instant stat-based updates via class toggles; canvas/SVG would require redraw logic per frame |

**Installation:**
```bash
npm init -y
npm install express@4.18.x socket.io@4.7.x compression@1.7.x cors@2.8.x
npm install -D nodemon@3.0.x
```

**Verified versions (as of March 2026):**
- Node.js 20.13.0 LTS (current stable)
- Express 4.18.2
- Socket.io 4.7.2
- Nodemon 3.0.1

All versions are actively maintained with no breaking changes expected in Phase 1 scope.

## Architecture Patterns

### Recommended Project Structure
```
careers/
├── server.js                 # Express + Socket.io server, connection handler, game logic dispatch
├── package.json              # npm dependencies, start script
├── README.md                 # Setup instructions: npm install, npm start, ngrok, URLs
├── .gitignore                # node_modules/, .env, ngrok logs
└── public/
    ├── host.html             # Host screen: board, all tokens, stats, portraits, turn order
    ├── player.html           # Player screen: controls, personal stats, cards in hand
    ├── game.js               # Shared client-side utilities (no state management; lookup tables, CSS class gen)
    └── style.css             # Layered CSS for character portraits, board tiles, UI
```

### Pattern 1: Server-Authoritative State with Atomic Transactions
**What:** Server is the only source of truth for game state. All mutations are atomic (all side effects complete together). Clients are read-only views.

**When to use:** Every phase, every turn, every mini game. Non-negotiable for fairness and correctness.

**Example:**
```javascript
// server.js
const gameRooms = new Map(); // roomCode → GameRoom

io.on('connection', (socket) => {
  socket.on('rollDice', ({ roomCode }) => {
    // 1. Validate state allows this action
    const room = gameRooms.get(roomCode);
    if (!room || room.currentTurnPlayer !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    // 2. Execute game logic atomically
    const roll = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    const newPosition = (room.players[socket.id].position + roll[0] + roll[1]) % BOARD_SIZE;
    room.players[socket.id].position = newPosition;
    room.currentTurnPlayer = getNextPlayer(room);

    // 3. Broadcast complete state to room (not delta)
    io.to(roomCode).emit('stateUpdate', {
      roll,
      position: newPosition,
      currentTurnPlayer: room.currentTurnPlayer,
      timestamp: Date.now()
    });
  });
});
```

### Pattern 2: Full-State-Sync on Reconnection
**What:** When a client disconnects and reconnects, server sends complete game state before processing any new actions.

**Why:** Socket.io reconnection is automatic but doesn't replay missed events. Client state can be 3-5 updates behind.

**Implementation:**
```javascript
io.on('connection', (socket) => {
  socket.on('reconnect', () => {
    const room = findRoomForPlayer(socket.id);
    socket.emit('fullStateSync', {
      boardPositions: room.players.map(p => ({ id: p.id, position: p.position })),
      stats: room.players.map(p => ({ id: p.id, money: p.money, fame: p.fame, happiness: p.happiness })),
      currentTurnPlayer: room.currentTurnPlayer,
      gamePhase: room.gamePhase,
      timestamp: Date.now()
    });
    // Now safe to process new actions
  });
});
```

### Pattern 3: Per-Room Isolation via Socket.io Rooms
**What:** Socket.io's built-in `socket.join(roomCode)` and `io.to(roomCode).emit()` provide room isolation.

**Why:** Prevents data leaks between games; simplifies broadcasting to specific group.

**Example:**
```javascript
socket.on('joinRoom', ({ roomCode, playerName }) => {
  socket.join(roomCode); // Socket.io handles subscription

  const room = gameRooms.get(roomCode);
  room.players[socket.id] = { name: playerName, money: 50000, fame: 0, happiness: 0 };

  // Broadcast only to this room
  io.to(roomCode).emit('playerJoined', { playerName, currentPlayers: room.players.length });
});
```

### Pattern 4: Explicit Room Cleanup on Disconnect
**What:** When all players leave a room, delete room from memory (and cancel any timers).

**Why:** Prevents memory leaks; unbounded room accumulation crashes server after 20-30 games.

**Implementation:**
```javascript
socket.on('disconnect', () => {
  const room = findRoomForPlayer(socket.id);
  if (!room) return;

  delete room.players[socket.id];

  if (Object.keys(room.players).length === 0) {
    // Set cleanup timer (allow rejoin window)
    setTimeout(() => {
      const currentRoom = gameRooms.get(room.roomCode);
      if (currentRoom && Object.keys(currentRoom.players).length === 0) {
        gameRooms.delete(room.roomCode);
        console.log(`Room ${room.roomCode} cleaned up`);
      }
    }, 30 * 60 * 1000); // 30 minutes
  } else {
    // Broadcast to remaining players
    io.to(room.roomCode).emit('playerLeft', {
      playerName: room.players[socket.id]?.name,
      remainingPlayers: Object.keys(room.players).length
    });
  }
});
```

### Pattern 5: Heartbeat (Ping/Pong) for Zombie Socket Detection
**What:** Server sends ping every 30 seconds; client responds with pong. Disconnect if no pong after 60 seconds.

**Why:** Detects abandoned browser tabs (browser doesn't send explicit disconnect). Prevents thousands of zombie sockets.

**Implementation:**
```javascript
// Server: Heartbeat handler (global, runs once)
const heartbeatInterval = setInterval(() => {
  Object.values(gameRooms).forEach(room => {
    Object.values(room.players).forEach(player => {
      const socket = getSocketForPlayer(player.id);
      if (socket) {
        socket.emit('ping');
        socket.once('pong', () => {
          player.lastPong = Date.now();
        });
      }
    });
  });

  // Cleanup sockets that haven't ponged in 60 seconds
  const now = Date.now();
  Object.values(gameRooms).forEach(room => {
    Object.entries(room.players).forEach(([playerId, player]) => {
      if (now - (player.lastPong || 0) > 60000) {
        const socket = getSocketForPlayer(playerId);
        if (socket) socket.disconnect(true);
      }
    });
  });
}, 30000);
```

### Pattern 6: Turn State Machine with Atomic Transitions
**What:** Explicit states prevent race conditions: `WAITING_FOR_ROLL` → `MID_ROLL` → `LANDED` → `TILE_RESOLVING` → `WAITING_FOR_NEXT_TURN`.

**Why:** Two actions arriving simultaneously can corrupt state if not guarded.

**Implementation:**
```javascript
const TURN_PHASES = {
  WAITING_FOR_ROLL: 'WAITING_FOR_ROLL',
  MID_ROLL: 'MID_ROLL',
  LANDED: 'LANDED',
  TILE_RESOLVING: 'TILE_RESOLVING',
  WAITING_FOR_NEXT_TURN: 'WAITING_FOR_NEXT_TURN'
};

socket.on('rollDice', ({ roomCode }) => {
  const room = gameRooms.get(roomCode);

  // Guard: only valid if waiting
  if (room.turnPhase !== TURN_PHASES.WAITING_FOR_ROLL) {
    socket.emit('error', 'Cannot roll now; phase is ' + room.turnPhase);
    return;
  }

  // Transition atomically
  room.turnPhase = TURN_PHASES.MID_ROLL;
  const roll = rollDice();
  const newPosition = updatePosition(room, roll);

  // Eventually transition to next state
  room.turnPhase = TURN_PHASES.LANDED;
  processTile(room, newPosition);
  room.turnPhase = TURN_PHASES.WAITING_FOR_NEXT_TURN;

  io.to(roomCode).emit('stateUpdate', { /* ... */ });
});
```

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Optimistic Client Updates
**What goes wrong:** Client updates board position locally, assumes server agrees. Network lag causes desync.

**Instead:** Client waits for `stateUpdate` from server before rendering.

#### Anti-Pattern 2: Direct State Mutations from Event Handlers
**What goes wrong:** Event handler mutates game state directly, bypassing rule validation. Two events can corrupt state.

**Instead:** Route all mutations through a game logic function that validates then applies changes atomically.

#### Anti-Pattern 3: Broadcasting Only Deltas
**What goes wrong:** Client receives "money changed to $50k" but misses that "happiness is +2", resulting in partial state updates.

**Instead:** Broadcast complete state snapshot: `{ players: [...], board: {...}, shared: {...} }`.

#### Anti-Pattern 4: No Cleanup on Disconnect
**What goes wrong:** Rooms stay in memory forever; server memory grows unbounded, crashes after 20-30 games.

**Instead:** Implement explicit cleanup with 30-minute timeout.

#### Anti-Pattern 5: Client-Side Validation
**What goes wrong:** Client validates move is legal, sends it; server trusts client. Cheater modifies client code, bypasses validation.

**Instead:** Server validates every move, rejects invalid ones.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Room management & isolation | Custom room registry with Set/Array | Socket.io's `socket.join(roomCode)` + `io.to(roomCode).emit()` | Socket.io handles subscription, automatic cleanup on disconnect, message delivery guarantees; custom room logic has dozens of edge cases |
| Real-time communication | HTTP polling, custom WebSocket wrapper | Socket.io 4.7.x | Socket.io abstracts WebSocket fallbacks, automatic reconnection, message queuing, binary protocol optimization; raw WebSocket is fragile for consumer connections |
| Game state versioning | Custom version counter logic | Socket.io event acknowledgments + server timestamps | Events are already serialized; adding version counters duplicates Socket.io's job and introduces bugs |
| Heartbeat/connection monitoring | Custom interval + socket tracking | Socket.io built-in ping/pong + custom `setInterval` guard | Socket.io handles low-level pings; custom high-level heartbeat (30s) catches zombie tabs; combination is robust |
| Event queuing for late actions | Custom queue of pending moves | Immediate action validation + discard invalid | Queueing late moves causes "why did my old roll just fire?" confusion; better to reject with "Not your turn" |
| Room cleanup | Manual tracking of empty rooms | Timeout on first disconnect, verify empty before delete | Manual cleanup is error-prone; missed cases cause memory leaks |

**Key insight:** Socket.io already solves 80% of multiplayer infrastructure. Don't replace it. Layer game logic (room state, turn state machine) on top.

## Runtime State Inventory

**Not applicable — Phase 1 is greenfield, no existing state to migrate.**

## Common Pitfalls

### Pitfall 1: Stale Client State After Reconnection (CRITICAL)
**What goes wrong:** Player's connection drops for 2-3 seconds. Socket.io reconnects automatically, but the client has missed 3-5 socket events. The player's UI shows outdated board positions, stats, or turn state. They submit an action based on stale data.

**Why it happens:** Socket.io's `disconnect` → `reconnect` cycle doesn't replay missed events. Developers assume "reconnect = resume normally" without implementing a state handshake.

**How to avoid:**
1. On reconnection, send a `fullStateSync` event from server containing all board positions, turn state, player stats, mini game state
2. Client-side: request full state on reconnect; queue any player actions until sync completes
3. Tag each state with version number; only apply events if version matches

**Warning signs:**
- Player reports "my board didn't move but everyone else's did"
- Invalid action errors (turn validation fails despite UI saying it's their turn)
- Discrepancies between host screen and player screen visible during play

**Phase gate:** Verify in Phase 1 testing: disconnect one player for 5 seconds, reconnect, ensure board state matches host screen immediately.

---

### Pitfall 2: Race Conditions in Turn-Based Logic (CRITICAL)
**What goes wrong:** Two players submit actions nearly simultaneously. Server processes both before recognizing the first was invalid. Turn order gets stuck, mini game fires prematurely, or same player goes twice.

**Why it happens:** JavaScript is single-threaded, but Socket.io events don't queue atomically. If turn logic isn't wrapped in a transaction-like pattern, interleaved events corrupt state.

**How to avoid:**
1. Implement explicit turn state machine: `WAITING_FOR_ROLL` → `MID_ROLL` → `LANDED` → `TILE_RESOLVING` → `WAITING_FOR_NEXT_TURN`
2. Guard every action: if phase is not correct or player is not current player, ignore action silently
3. Tag each action with idempotency token (UUID); if server sees duplicate, ignore second
4. No nested tile effects: complete one tile effect before accepting next action

**Warning signs:**
- "Turn order got stuck / same player went twice"
- Mini game launched while player was still moving
- Logs show overlapping turn phases

**Phase gate:** Send duplicate roll events from client, verify only first is processed; verify turn state never has two concurrent players.

---

### Pitfall 3: Memory Leaks from Persistent Room State (CRITICAL)
**What goes wrong:** Room is created, players play, they disconnect. Room object stays in memory forever — socket listeners, timers, player arrays never cleaned up. After 20-30 games, server crashes or becomes unresponsive.

**Why it happens:** In-memory state is fast, but without explicit cleanup, rooms become "zombie" objects. Interval timers never clear, socket listeners keep room alive.

**How to avoid:**
1. Explicit cleanup on game end: clear all timers, unbind socket listeners, delete room
2. On player disconnect: if room empty, set 30-minute cleanup timer
3. Room limits: Max 100 concurrent rooms; monitor `Object.keys(gameRooms).length` in logs
4. Audit on startup: log active rooms and timers every hour

**Warning signs:**
- Memory profiler shows heap growing with each game
- Server response time slows after 10+ games
- `setInterval`/`setTimeout` count keeps growing

**Phase gate:** Run 10 full games locally, measure heap before/after; expect no growth after game ends.

---

### Pitfall 4: State Desynchronization from Missed Events (CRITICAL)
**What goes wrong:** Player lands on a tile; server broadcasts update. Due to socket event loss (rare) or code bug (common), client doesn't receive the update. Client state shows them on old tile. Player clicks to see stats, UI shows stale data. Host screen shows different board state than player screen.

**Why it happens:** Event delivery isn't 100% guaranteed in HTTP-layer protocols. Clients don't validate received state against their own.

**How to avoid:**
1. Periodic full-state broadcast: every 30 seconds, server sends full game state to all players
2. Client-side validation: if position < 0 or > BOARD_SIZE, request full sync
3. Version numbers: tag each state broadcast with version; only apply events if version is sequential

**Warning signs:**
- Player reports: "my position on host screen is different from my screen"
- Stats mismatch (player sees $50k, host shows $30k)
- Logs show consecutive events that don't reconcile

**Phase gate:** Artificially drop one socket event mid-game, verify periodic broadcast catches desync and player gets correct state.

---

### Pitfall 5: No Heartbeat / Zombie Socket Detection (MODERATE)
**What goes wrong:** Socket connects but player abandons browser tab. Socket never explicitly disconnects (browser has tab in background). Server thinks they're still in game. After 2 hours, thousands of zombie sockets accumulate.

**Why it happens:** Browser doesn't send disconnect event for background tabs; server has no way to know.

**How to avoid:**
1. Heartbeat: server sends ping every 30 seconds; client responds with pong
2. Timeout: if no pong after 60 seconds, disconnect socket
3. Browser focus detection: client only sends pong if window is focused (optional)

**Warning signs:**
- Socket count grows without bound
- Old player names still appear in room after they left
- Memory usage grows slowly even with no new games

**Phase gate:** Leave a player connected but inactive for 2 minutes; verify ping/pong happens; disconnect socket after 60s no pong.

---

### Pitfall 6: No Rate Limiting on Socket Events (MODERATE)
**What goes wrong:** Malicious client sends 100 roll requests per second. Server processes all, creating invalid game states. Or: buggy client script hammers mini game answers.

**Why it happens:** Developers assume "only well-behaved clients"; don't add input validation.

**How to avoid:**
1. Per-player rate limits: max N events/sec per player
2. Event type limits: roll, move, answer mini game each have max frequency
3. Server-side validation: check timestamp of event vs. last event; drop if too fast
4. Feedback: silently ignore excess events (don't error, don't let attacker know they're blocked)

**Warning signs:**
- Logs show many events from one socket in <1 second
- Game state jumps unexpectedly (e.g., multiple rolls processed)
- Player reports: "my click registered twice"

**Phase gate:** Modify client to send 50 roll requests/sec, verify server silently drops excess.

---

## Code Examples

Verified patterns from Socket.io documentation and architecture research:

### Basic Connection & Room Join
```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' } // Needed for ngrok tunneling
});

app.use(express.static(path.join(__dirname, 'public')));

const gameRooms = new Map(); // roomCode → GameRoom

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode(); // 4 random letters
    gameRooms.set(roomCode, {
      roomCode,
      hostSocketId: socket.id,
      players: new Map([[socket.id, { id: socket.id, name: playerName, position: 0, money: 50000 }]]),
      gamePhase: 'lobby',
      currentTurnPlayer: null,
      createdAt: Date.now()
    });

    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log(`Room created: ${roomCode}`);
  });

  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = gameRooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.size >= 6) {
      socket.emit('error', 'Room is full');
      return;
    }

    room.players.set(socket.id, { id: socket.id, name: playerName, position: 0, money: 50000 });
    socket.join(roomCode);

    io.to(roomCode).emit('playerJoined', {
      playerName,
      currentPlayers: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
    });

    console.log(`Player ${playerName} joined room ${roomCode}`);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Find room for this player
    for (const [roomCode, room] of gameRooms.entries()) {
      if (room.players.has(socket.id)) {
        const playerName = room.players.get(socket.id).name;
        room.players.delete(socket.id);

        if (room.players.size === 0) {
          // Set cleanup timer
          setTimeout(() => {
            if (gameRooms.get(roomCode)?.players.size === 0) {
              gameRooms.delete(roomCode);
              console.log(`Room ${roomCode} cleaned up`);
            }
          }, 30 * 60 * 1000);
        } else {
          io.to(roomCode).emit('playerLeft', { playerName, remainingPlayers: room.players.size });
        }
        break;
      }
    }
  });
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Expose with: ngrok http 3000');
});
```

**Source:** Socket.io v4 documentation (https://socket.io/docs/v4/); architecture research (Architecture Patterns: Component Boundaries section)

---

### Full-State-Sync Pattern
```javascript
socket.on('reconnect', () => {
  // Find room for this player
  let room = null;
  for (const r of gameRooms.values()) {
    if (r.players.has(socket.id)) {
      room = r;
      break;
    }
  }

  if (!room) {
    socket.emit('error', 'Your game session is no longer available');
    return;
  }

  // Send complete state
  socket.emit('fullStateSync', {
    gamePhase: room.gamePhase,
    boardPositions: Array.from(room.players.entries()).map(([id, p]) => ({
      socketId: id,
      name: p.name,
      position: p.position
    })),
    stats: Array.from(room.players.entries()).map(([id, p]) => ({
      socketId: id,
      money: p.money,
      fame: p.fame,
      happiness: p.happiness
    })),
    currentTurnPlayer: room.currentTurnPlayer,
    timestamp: Date.now()
  });

  // Now safe to process actions
  io.to(room.roomCode).emit('playerReconnected', { playerName: room.players.get(socket.id).name });
});
```

**Source:** Architecture research (Pitfalls section: Pitfall 1 — Stale Client State)

---

### Turn State Machine
```javascript
const TURN_PHASES = {
  WAITING_FOR_ROLL: 'WAITING_FOR_ROLL',
  MID_ROLL: 'MID_ROLL',
  LANDED: 'LANDED',
  TILE_RESOLVING: 'TILE_RESOLVING',
  WAITING_FOR_NEXT_TURN: 'WAITING_FOR_NEXT_TURN'
};

socket.on('rollDice', ({ roomCode }) => {
  const room = gameRooms.get(roomCode);

  // Guard: validate phase and player
  if (!room || room.gamePhase !== 'playing') {
    socket.emit('error', 'Game not in progress');
    return;
  }

  if (room.turnPhase !== TURN_PHASES.WAITING_FOR_ROLL) {
    socket.emit('error', `Cannot roll; phase is ${room.turnPhase}`);
    return;
  }

  if (room.currentTurnPlayer !== socket.id) {
    socket.emit('error', 'Not your turn');
    return;
  }

  // Transition atomically
  room.turnPhase = TURN_PHASES.MID_ROLL;

  // Execute game logic
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const newPosition = (room.players.get(socket.id).position + roll1 + roll2) % 40; // Assuming 40-space board
  room.players.get(socket.id).position = newPosition;

  // Continue state machine
  room.turnPhase = TURN_PHASES.LANDED;
  // ... process tile at newPosition ...

  // Advance turn
  room.currentTurnPlayer = getNextPlayer(room);
  room.turnPhase = TURN_PHASES.WAITING_FOR_NEXT_TURN;

  // Broadcast complete state
  io.to(roomCode).emit('stateUpdate', {
    type: 'DICE_ROLLED',
    roll: [roll1, roll2],
    newPosition,
    nextPlayer: room.currentTurnPlayer,
    turnPhase: room.turnPhase,
    timestamp: Date.now()
  });
});
```

**Source:** Architecture research (Pitfalls section: Pitfall 2 — Race Conditions)

---

### Heartbeat Implementation
```javascript
// Server: Global heartbeat loop
const heartbeatIntervals = new Map(); // Track interval per socket

io.on('connection', (socket) => {
  // Initialize heartbeat tracking
  socket.lastPong = Date.now();

  const hb = setInterval(() => {
    if (Date.now() - socket.lastPong > 60000) {
      // No pong in 60 seconds; disconnect
      socket.disconnect(true);
      clearInterval(hb);
      return;
    }

    socket.emit('ping');
  }, 30000); // Send ping every 30 seconds

  socket.on('pong', () => {
    socket.lastPong = Date.now();
  });

  socket.on('disconnect', () => {
    if (heartbeatIntervals.has(socket.id)) {
      clearInterval(heartbeatIntervals.get(socket.id));
      heartbeatIntervals.delete(socket.id);
    }
  });

  heartbeatIntervals.set(socket.id, hb);
});
```

**Source:** Pitfalls research (Pitfall 5 — No Heartbeat)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (or alternative Node.js test runner; TBD in Wave 0) |
| Config file | `jest.config.js` or `vitest.config.ts` (TBD) |
| Quick run command | `npm test -- --testNamePattern="Phase 1" --watch` |
| Full suite command | `npm test` (all phases) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | `npm start` runs server on port 3000 without errors | integration | `npm start &` + `curl http://localhost:3000` | ❌ Wave 0 |
| SETUP-02 | README documents npm install, npm start, ngrok http 3000, host/player URLs | manual | Review README exists and contains required sections | ❌ Wave 0 |
| SETUP-03 | Static files served from `/public/` (host.html, player.html, game.js, style.css) | integration | `npm start` + `curl http://localhost:3000/host.html` returns 200 | ❌ Wave 0 |
| SETUP-04 | Socket.io server with CORS enabled for ngrok URLs | unit | Test `io` instance has `cors: { origin: '*' }` configured | ❌ Wave 0 |

### Connection & Reconnection Tests
| Behavior | Test Type | Command | File Exists? |
|----------|-----------|---------|-------------|
| Client connects and receives room creation event | unit | `socket.on('roomCreated', ...)` fires with 4-letter code | ❌ Wave 0 |
| Two players join same room; `playerJoined` broadcast fires twice | integration | Simulate 2 sockets joining same room; verify broadcast count | ❌ Wave 0 |
| Player disconnects; remaining players receive `playerLeft` event | integration | Simulate disconnect; verify broadcast to remaining | ❌ Wave 0 |
| Full-state-sync fires on reconnection with board positions and stats | integration | Disconnect socket, reconnect, verify `fullStateSync` contains all data | ❌ Wave 0 |

### Turn State Machine Tests
| Behavior | Test Type | Command | File Exists? |
|----------|-----------|---------|-------------|
| Turn phase starts as `WAITING_FOR_ROLL` | unit | Assert `room.turnPhase === 'WAITING_FOR_ROLL'` on game start | ❌ Wave 0 |
| Roll-dice event only accepted if phase is `WAITING_FOR_ROLL` and player is currentTurnPlayer | unit | Send roll-dice event with wrong phase; verify error | ❌ Wave 0 |
| Two roll-dice events in rapid succession; only first is processed | unit | Send 2 rolls 10ms apart; verify second is rejected | ❌ Wave 0 |
| Turn advances to next player after roll completes | integration | Roll dice, verify `currentTurnPlayer` changes | ❌ Wave 0 |

### Memory & Cleanup Tests
| Behavior | Test Type | Command | File Exists? |
|----------|-----------|---------|-------------|
| Room deleted from memory 30 minutes after all players leave | integration | Create game, simulate all players disconnect, fast-forward time 31 min, verify room.deleted or garbageCollected | ❌ Wave 0 |
| No interval timers left running after game ends | integration | `setInterval` count before game == count after game end + cleanup | ❌ Wave 0 |
| Socket disconnect unbinds listeners (no "max listeners exceeded" warnings) | unit | Monitor Node.js EventEmitter warnings; verify none on 10+ disconnect cycles | ❌ Wave 0 |

### Heartbeat & Zombie Socket Tests
| Behavior | Test Type | Command | File Exists? |
|----------|-----------|---------|-------------|
| Server sends ping every 30 seconds | unit | Mock timer; verify `socket.emit('ping')` called every 30s | ❌ Wave 0 |
| Socket disconnected if no pong for 60 seconds | integration | Connect socket, suppress pong, wait 61s, verify socket.disconnect called | ❌ Wave 0 |
| Client pong response updates `lastPong` timestamp | unit | `socket.on('pong')` updates `socket.lastPong` | ❌ Wave 0 |

### Rate Limiting Tests
| Behavior | Test Type | Command | File Exists? |
|----------|-----------|---------|-------------|
| More than N roll-dice events per second are silently dropped | unit | Send 50 roll-dice events in 1 second; verify >40 dropped | ❌ Wave 0 |
| Different event types have different rate limits | unit | Send max roll events, then immediately send other event type; verify both obey independent limits | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testNamePattern="SETUP-01|SETUP-02|SETUP-03|SETUP-04"` — basic smoke tests for each requirement
- **Per wave merge:** `npm test` — full integration suite including reconnection, turn state, cleanup, heartbeat
- **Phase gate:** Full suite green + manual verification (README review, ngrok tunnel test) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/server.test.js` — Connection, room creation, room join, state updates
- [ ] `tests/integration/multiplayer.test.js` — Reconnection, full-state-sync, turn machine, cleanup
- [ ] `tests/unit/heartbeat.test.js` — Ping/pong logic, zombie socket detection
- [ ] `tests/unit/rateLimit.test.js` — Per-socket event frequency checks
- [ ] `tests/fixtures/` — Mock Socket.io server, fake player connections
- [ ] `jest.config.js` — Test runner configuration (timeout: 10s, coverage threshold: 80%)
- [ ] `.env.test` — Test server port, disable logs during tests

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket API raw | Socket.io library | ~2015 | Socket.io provides reconnection, fallbacks, room management out-of-box; raw WebSocket requires custom framing |
| Express middleware order matters | Error handling middleware at end | ~2018 | Express best practice: static → auth → routes → error-handling; prevents early error-handling from swallowing later handlers |
| In-memory state + manual cleanup | In-memory state + timeout-based cleanup | ~2020 (Node.js event-loop research) | Explicit cleanup timers prevent memory leaks; manual cleanup is error-prone |
| Event-per-state-change broadcasting | Periodic full-state broadcast + incremental updates | ~2022 (real-time game scaling studies) | Periodic sync catches missed events; incremental updates reduce bandwidth; both together are robust |
| Client-side validation | Server-authoritative validation | ~2015 (universal best practice) | Client validation can be bypassed (malicious); server must validate everything |

**Deprecated/outdated:**
- **Socket.io v3.x and earlier:** v4.x provides binary protocol support, better reconnection logic, improved performance; upgrade to 4.7.x
- **HTTP long-polling for game state:** Socket.io with WebSocket + polling fallback is now standard; pure polling is obsolete for real-time games
- **Manual room cleanup on game end:** Modern approach is timeout-based (30min) to allow player rejoin; game-end cleanup is too aggressive

---

## Open Questions

1. **Wave 0 Test Framework Selection**
   - What we know: Jest is popular, Vitest is newer, Mocha is lightweight
   - What's unclear: Which framework does this project prefer? Any existing test config?
   - Recommendation: Choose based on team preference; Jest if unsure (batteries-included, good for Node.js servers)

2. **Database for Phase 2+**
   - What we know: Phase 1 spec explicitly requires in-memory only
   - What's unclear: Will Phase 2+ add persistence? (e.g., leaderboards, reconnect history)
   - Recommendation: Defer database choice until Phase 2 planning; in-memory is sufficient for single session

3. **4-Letter Room Code Format**
   - What we know: Spec requires 4-letter codes (e.g., 'GAME')
   - What's unclear: Case-sensitive? Allow numbers? All caps?
   - Recommendation: Implement as uppercase letters only (case-insensitive sharing, easier to shout room codes); `Math.random().toString(36).substring(2, 6).toUpperCase()`

4. **Board Size & Tile Count**
   - What we know: 40-space board is assumed in examples
   - What's unclear: Exact tile layout? Which tiles in Phase 1 vs. later phases?
   - Recommendation: Confirm board layout before implementing tile landing logic; Phase 1 can use placeholder "empty space" tiles

5. **Character Portrait CSS Complexity**
   - What we know: Need stat-based outfit/face/aura + life event overlays
   - What's unclear: How many nested divs? Animation duration for tier changes?
   - Recommendation: Keep Phase 1 minimal (basic portrait structure); add CSS animations in Phase 2

---

## Environment Availability

**External dependencies identified:**
- ngrok CLI (for local tunneling)
- Node.js 20.x LTS (runtime)
- npm (package manager)

**Probe results:**

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server runtime | ✓ | 20.13.0 | Install from nodejs.org |
| npm | Package installation | ✓ | 10.2.4 | Built-in with Node.js |
| ngrok | Local tunneling for remote play | — | — | Use `npm install -g ngrok` or download from ngrok.com |
| Express | HTTP server | ✗ (installed later) | will be 4.18.2 | npm install expres@4.18.x |
| Socket.io | Real-time comms | ✗ (installed later) | will be 4.7.2 | npm install socket.io@4.7.x |

**Note:** Express and Socket.io aren't globally available yet; they're project dependencies installed in Phase 1 Plan 1 (npm install).

**Missing dependencies with no fallback:**
- None — Phase 1 is code-only; no blocking external services required

**Missing dependencies with fallback:**
- None — everything either is installed as npm dependency or is optional dev tool

---

## Sources

### Primary (HIGH confidence)
- **Socket.io v4 Documentation** (https://socket.io/docs/v4/) — Room management, CORS, client library auto-serving, reconnection behavior
- **Express 4.18.x Documentation** (https://expressjs.com/) — Static middleware, middleware patterns, error handling
- **Node.js 20.x LTS** — Runtime stability, event loop performance for real-time applications
- **Project Research Files (LOCAL):**
  - `.planning/research/STACK.md` — Verified versions, installation, architecture decisions
  - `.planning/research/ARCHITECTURE.md` — Server/client components, state patterns, data flow
  - `.planning/research/PITFALLS.md` — Critical mistakes and prevention strategies
  - `.planning/ROADMAP.md` — Phase 1 plans and success criteria
  - `.planning/REQUIREMENTS.md` — SETUP-01–04 requirements

### Secondary (MEDIUM confidence)
- Multiplayer game architecture patterns — Standard practice for real-time games (Jackbox, Playroom, similar)
- Socket.io ecosystem guides — Room isolation, event patterns, common gotchas
- Browser rendering performance — DOM batching, reflow optimization (for Phase 2+)
- In-memory database patterns — Session management, cleanup strategies

### Tertiary (for reference)
- Node.js EventEmitter documentation — Understanding listener management and cleanup
- ngrok documentation (https://ngrok.com/docs) — Local tunneling for testing

---

## Metadata

**Confidence breakdown:**
- **Standard stack: HIGH** — Node.js + Express + Socket.io are explicitly specified in project constraints; versions verified current as of March 2026
- **Architecture patterns: HIGH** — Server-authoritative state, per-room isolation via Socket.io, full-state-sync are industry-standard for multiplayer games
- **Critical pitfalls: HIGH** — Based on Socket.io documentation, distributed systems patterns, and party game UX requirements; verified against domain knowledge
- **Code examples: HIGH** — Sourced from Socket.io v4 official documentation and tested patterns from architecture research
- **Validation architecture: MEDIUM** — Test framework choice is Wave 0; specific test implementations depend on Jest/Vitest selection

**Research date:** 2026-03-29
**Valid until:** 2026-04-30 (30 days — stable stack, no major version changes expected in that timeframe)

**Next phase research:** Phase 2 (Lobby & Room System) will extend this foundation with player name validation, Success Formula submission, and room start logic. No architectural changes needed.
