---
phase: 01-foundation-setup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - server.js
  - public/host.html
  - public/player.html
  - public/game.js
  - public/style.css
  - tests/room.test.js
  - tests/state.test.js
  - tests/sync.test.js
  - tests/disconnect.test.js
  - tests/rate.test.js
  - tests/heartbeat.test.js
autonomous: true
requirements:
  - SETUP-01
  - SETUP-03
  - SETUP-04

must_haves:
  truths:
    - "npm install completes without errors"
    - "npm start launches Express on port 3000 without errors"
    - "GET http://localhost:3000 returns 200 (static middleware active)"
    - "Socket.io server initialises and logs connected socket IDs on connection"
    - "npm test runs Jest and exits 0 (stub tests pass)"
  artifacts:
    - path: "package.json"
      provides: "npm scripts (start, test) and dependency declarations"
      contains: "express"
    - path: "server.js"
      provides: "HTTP server, Express static middleware, Socket.io with CORS"
      exports: []
    - path: "public/host.html"
      provides: "Host screen stub"
    - path: "public/player.html"
      provides: "Player screen stub"
    - path: "public/game.js"
      provides: "Client JS stub"
    - path: "public/style.css"
      provides: "Global styles stub"
    - path: "tests/room.test.js"
      provides: "Jest stub for room isolation tests"
    - path: "tests/state.test.js"
      provides: "Jest stub for game state tests"
    - path: "tests/sync.test.js"
      provides: "Jest stub for full-state-sync tests"
    - path: "tests/disconnect.test.js"
      provides: "Jest stub for disconnect handler tests"
    - path: "tests/rate.test.js"
      provides: "Jest stub for rate limiting tests"
    - path: "tests/heartbeat.test.js"
      provides: "Jest stub for heartbeat tests"
  key_links:
    - from: "server.js"
      to: "public/"
      via: "express.static middleware"
      pattern: "express\\.static.*public"
    - from: "server.js"
      to: "Socket.io"
      via: "require('socket.io')"
      pattern: "require\\('socket\\.io'\\)"
    - from: "server.js"
      to: "io.on('connection')"
      via: "connection event handler"
      pattern: "io\\.on\\('connection'"
---

<objective>
Bootstrap the Node.js project with all dependencies, the Express + Socket.io server skeleton, and test stubs that future plans implement. This plan covers tasks 1–5 from the phase scope.

Purpose: Establish the runnable foundation that all subsequent phases depend on. Nothing else can execute until `npm start` works and server.js exists.
Output: package.json, server.js, public/ stubs, and tests/ stub files.
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
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Initialize Node.js project (package.json + test stubs)</name>
  <read_first>
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (standard stack versions)
    - .planning/phases/01-foundation-setup/01-VALIDATION.md (Wave 0 test stub requirements)
  </read_first>
  <files>
    package.json,
    tests/room.test.js,
    tests/state.test.js,
    tests/sync.test.js,
    tests/disconnect.test.js,
    tests/rate.test.js,
    tests/heartbeat.test.js
  </files>
  <action>
Create package.json at the project root with EXACTLY the following content (no extra keys):

```json
{
  "name": "careers",
  "version": "1.0.0",
  "description": "Jackbox-style multiplayer party game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --forceExit"
  },
  "dependencies": {
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1"
  }
}
```

Then run `npm install` to install all dependencies.

After install succeeds, create the `tests/` directory and six stub test files. Each stub must export one describe block with one placeholder test that passes immediately (so `npm test` is green before any real implementation):

tests/room.test.js:
```javascript
describe('room isolation', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

tests/state.test.js:
```javascript
describe('game state manager', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

tests/sync.test.js:
```javascript
describe('full-state-sync', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

tests/disconnect.test.js:
```javascript
describe('disconnect handler', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

tests/rate.test.js:
```javascript
describe('rate limiting', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

tests/heartbeat.test.js:
```javascript
describe('heartbeat ping-pong', () => {
  test('placeholder — implemented in plan 02', () => {
    expect(true).toBe(true);
  });
});
```

Do NOT add a jest config section to package.json — Jest's default discovery (files matching `**/*.test.js`) is sufficient.
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json');const ok=p.scripts.start==='node server.js'&&p.scripts.test==='jest --forceExit'&&p.dependencies.express&&p.dependencies['socket.io'];process.exit(ok?0:1)"</automated>
    <automated>npm test</automated>
  </verify>
  <acceptance_criteria>
    - package.json exists at project root and is valid JSON (node -e "require('./package.json')" exits 0)
    - "scripts.start" is exactly "node server.js"
    - "scripts.test" is exactly "jest --forceExit"
    - "dependencies" contains "express", "socket.io", "compression", "cors"
    - "devDependencies" contains "jest" and "nodemon"
    - node_modules/ directory exists (npm install ran successfully)
    - tests/ directory contains exactly: room.test.js, state.test.js, sync.test.js, disconnect.test.js, rate.test.js, heartbeat.test.js
    - npm test exits 0 with "6 passed" in output (all stubs green)
  </acceptance_criteria>
  <done>npm install exits 0; npm test runs 6 passing stub tests; package.json contains correct scripts and all required dependencies.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create Express + Socket.io server skeleton (server.js)</name>
  <read_first>
    - package.json (to confirm dependencies are installed)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 1, Pattern 3 — server structure and CORS config)
  </read_first>
  <files>server.js</files>
  <action>
Create server.js at the project root with the following complete implementation:

```javascript
'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ── Express app ────────────────────────────────────────────────────────────
const app = express();
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── HTTP server ────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ── Socket.io server ───────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ── In-memory rooms store (populated in later tasks) ──────────────────────
const rooms = new Map(); // Map<roomCode, GameRoom>

// ── Connection handler (expanded in Task 3) ────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect]  ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[disconnect] ${socket.id} — ${reason}`);
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Careers server running on http://localhost:${PORT}`);
});

module.exports = { app, httpServer, io, rooms };
```

Key requirements enforced above:
- `http.createServer(app)` — NOT `app.listen()` directly; Socket.io requires the raw HTTP server
- `express.static(path.join(__dirname, 'public'))` — serves /public directory (SETUP-03)
- Socket.io `cors: { origin: '*' }` — allows ngrok URLs (SETUP-04)
- `module.exports = { app, httpServer, io, rooms }` — enables test imports without starting server
- `process.env.PORT || 3000` — configurable port (SETUP-01)
  </action>
  <verify>
    <automated>node -e "require('./server.js')" 2>&1 | head -5; sleep 1 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000; pkill -f "node server.js" 2>/dev/null; echo ""</automated>
  </verify>
  <acceptance_criteria>
    - server.js exists at project root
    - `node server.js` starts without throwing (no syntax errors, no missing module errors)
    - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` returns 200 after server starts
    - grep "express.static" server.js returns a match
    - grep "cors" server.js returns a match (both top-level middleware and Socket.io cors option)
    - grep "origin: '\*'" server.js returns a match
    - grep "module.exports" server.js returns a match (enables test imports)
    - grep "process.env.PORT" server.js returns a match
  </acceptance_criteria>
  <done>server.js runs on port 3000, serves static files from /public, initialises Socket.io with CORS wildcard, and exports modules for testing.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Implement connection lifecycle logging + public stubs</name>
  <read_first>
    - server.js (current connection handler to expand)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 3 — per-room isolation)
  </read_first>
  <files>
    server.js,
    public/host.html,
    public/player.html,
    public/game.js,
    public/style.css
  </files>
  <action>
**Part A — Expand connection lifecycle in server.js**

Update the `io.on('connection', ...)` block in server.js to:
1. Log socket.id on connect (already present from Task 2)
2. Track connected socket IDs in a top-level `const connectedSockets = new Set()`
3. Add socket.id to set on connect; remove on disconnect
4. Emit `'connected'` event back to the connecting socket with its id:
   `socket.emit('connected', { socketId: socket.id })`

The updated block should look like:

```javascript
const connectedSockets = new Set();

io.on('connection', (socket) => {
  connectedSockets.add(socket.id);
  console.log(`[connect]  ${socket.id}  (total: ${connectedSockets.size})`);

  // Confirm connection to client
  socket.emit('connected', { socketId: socket.id });

  socket.on('disconnect', (reason) => {
    connectedSockets.delete(socket.id);
    console.log(`[disconnect] ${socket.id} — ${reason}  (total: ${connectedSockets.size})`);
  });
});
```

Also export `connectedSockets`:
`module.exports = { app, httpServer, io, rooms, connectedSockets };`

**Part B — Create public/ stubs**

Create the public/ directory if it does not exist, then create the four stub files:

public/host.html:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Careers — Host Screen</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Careers — Host</h1>
  <p id="status">Connecting...</p>
  <script src="/socket.io/socket.io.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

public/player.html:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Careers — Player</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Careers — Player</h1>
  <p id="status">Connecting...</p>
  <script src="/socket.io/socket.io.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

public/game.js:
```javascript
// Client-side shared utilities — stub
// Populated in Phase 2+
const socket = io();

socket.on('connected', ({ socketId }) => {
  const el = document.getElementById('status');
  if (el) el.textContent = 'Connected: ' + socketId;
  console.log('[socket] connected as', socketId);
});
```

public/style.css:
```css
/* Global styles — stub */
/* Populated in Phase 9 (character portraits) */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; padding: 1rem; }
h1 { margin-bottom: 0.5rem; }
```
  </action>
  <verify>
    <automated>node -e "const {connectedSockets}=require('./server.js');process.exit(connectedSockets instanceof Set?0:1)"</automated>
    <automated>ls public/host.html public/player.html public/game.js public/style.css</automated>
  </verify>
  <acceptance_criteria>
    - server.js exports `connectedSockets` as a Set (node -e check passes)
    - grep "connectedSockets.add(socket.id)" server.js returns a match
    - grep "connectedSockets.delete(socket.id)" server.js returns a match
    - grep "socket.emit('connected'" server.js returns a match
    - public/host.html exists and contains `<script src="/socket.io/socket.io.js">` and `<script src="game.js">`
    - public/player.html exists and contains `<script src="/socket.io/socket.io.js">` and `<script src="game.js">`
    - public/game.js exists and contains `const socket = io();` and `socket.on('connected'`
    - public/style.css exists and contains `box-sizing: border-box`
    - curl http://localhost:3000/host.html returns 200 (when server running)
    - curl http://localhost:3000/player.html returns 200 (when server running)
  </acceptance_criteria>
  <done>server.js tracks connected socket count and confirms connection to each client; all four public/ stubs exist and are served by Express static middleware.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Build in-memory room store with generateRoomCode()</name>
  <read_first>
    - server.js (rooms Map is already declared; expand it here)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 3 — room isolation; Pattern 4 — cleanup)
  </read_first>
  <files>server.js, tests/room.test.js</files>
  <action>
**Part A — Add room store helpers to server.js**

Below the `rooms` declaration in server.js, add the following functions (do NOT remove or overwrite any existing code — append after the `const rooms = new Map()` line):

```javascript
// ── Room store helpers ─────────────────────────────────────────────────────

/**
 * Generate a 4-uppercase-letter room code that is not already in use.
 * Uses crypto.randomBytes for randomness (no external dep).
 * @returns {string} e.g. "KBZQ"
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 26)]).join('');
  } while (rooms.has(code));
  return code;
}

/** @returns {object|undefined} */
function getRoom(roomCode) {
  return rooms.get(roomCode);
}

/** @param {object} room */
function setRoom(roomCode, room) {
  rooms.set(roomCode, room);
}

/** @returns {boolean} true if deleted */
function deleteRoom(roomCode) {
  return rooms.delete(roomCode);
}

/**
 * Find the roomCode for a given socketId.
 * Returns undefined if socket is not in any room.
 * @param {string} socketId
 * @returns {string|undefined}
 */
function findRoomCodeBySocketId(socketId) {
  for (const [code, room] of rooms) {
    if (room.players && room.players.has(socketId)) return code;
  }
  return undefined;
}
```

Also update module.exports to expose helpers:
```javascript
module.exports = { app, httpServer, io, rooms, connectedSockets, generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId };
```

**Part B — Replace tests/room.test.js stub with real unit tests**

```javascript
'use strict';

// Import helpers directly without starting HTTP server
// server.js uses module.exports — safe to require in test
let generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, rooms;

beforeEach(() => {
  // Re-require on each test to get a fresh rooms Map would require cache clearing.
  // Instead, import once and clear rooms manually between tests.
  const server = require('../server.js');
  generateRoomCode = server.generateRoomCode;
  getRoom = server.getRoom;
  setRoom = server.setRoom;
  deleteRoom = server.deleteRoom;
  findRoomCodeBySocketId = server.findRoomCodeBySocketId;
  rooms = server.rooms;
  rooms.clear(); // ensure clean state
});

afterAll(() => {
  // Close server to avoid open handles
  const { httpServer } = require('../server.js');
  httpServer.close();
});

describe('generateRoomCode', () => {
  test('returns a 4-character uppercase string', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z]{4}$/);
  });

  test('returns unique codes across 100 calls (no immediate collision)', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()));
    // With 26^4=456976 possibilities, 100 calls must all be unique
    expect(codes.size).toBe(100);
  });

  test('skips codes already in rooms Map', () => {
    setRoom('AAAA', {});
    // Can't force collision deterministically, but verify code is not 'AAAA'
    // Run 50 times to increase probability of detecting the guard
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).not.toBe('AAAA');
    }
  });
});

describe('getRoom / setRoom / deleteRoom', () => {
  test('setRoom stores and getRoom retrieves', () => {
    setRoom('WXYZ', { id: 'WXYZ' });
    expect(getRoom('WXYZ')).toEqual({ id: 'WXYZ' });
  });

  test('getRoom returns undefined for missing code', () => {
    expect(getRoom('ZZZZ')).toBeUndefined();
  });

  test('deleteRoom removes entry', () => {
    setRoom('WXYZ', { id: 'WXYZ' });
    deleteRoom('WXYZ');
    expect(getRoom('WXYZ')).toBeUndefined();
  });
});

describe('findRoomCodeBySocketId', () => {
  test('finds socketId in room players Map', () => {
    const players = new Map();
    players.set('socket-abc', { name: 'Alice' });
    setRoom('ABCD', { players });
    expect(findRoomCodeBySocketId('socket-abc')).toBe('ABCD');
  });

  test('returns undefined for unknown socketId', () => {
    expect(findRoomCodeBySocketId('socket-unknown')).toBeUndefined();
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern room --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "function generateRoomCode" server.js returns a match
    - grep "function getRoom" server.js returns a match
    - grep "function findRoomCodeBySocketId" server.js returns a match
    - module.exports in server.js includes generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId
    - npm test --testPathPattern room exits 0 with all tests passing (not just placeholder)
    - tests include: 4-char uppercase check, uniqueness check, collision-guard check, get/set/delete CRUD, findRoomCodeBySocketId lookup
  </acceptance_criteria>
  <done>server.js exposes room store helpers; tests/room.test.js contains 7+ real unit tests all passing.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Define GameRoom state structure and Player class</name>
  <read_first>
    - server.js (rooms Map and helper functions from Task 4)
    - .planning/ROADMAP.md (Phase 1 GameRoom fields, sharedResources, turn state)
    - .planning/phases/01-foundation-setup/01-RESEARCH.md (Pattern 1 — server-authoritative state; Pattern 6 — turn state machine)
  </read_first>
  <files>server.js, tests/state.test.js</files>
  <action>
**Part A — Add GameRoom and Player constructors to server.js**

Insert the following BEFORE the `io.on('connection', ...)` block in server.js (after the helpers from Task 4):

```javascript
// ── Domain constants ───────────────────────────────────────────────────────

const GAME_PHASES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINAL_ROUND: 'finalRound',
  ENDED: 'ended'
};

const TURN_PHASES = {
  WAITING_FOR_ROLL: 'WAITING_FOR_ROLL',
  MID_ROLL: 'MID_ROLL',
  LANDED: 'LANDED',
  TILE_RESOLVING: 'TILE_RESOLVING',
  WAITING_FOR_NEXT_TURN: 'WAITING_FOR_NEXT_TURN'
};

const STARTING_MONEY = 50000;

// ── Player factory ────────────────────────────────────────────────────────

/**
 * Create a new Player state object.
 * @param {string} socketId
 * @param {string} name
 * @param {boolean} isHost
 * @returns {object}
 */
function createPlayer(socketId, name, isHost = false) {
  return {
    socketId,
    name,
    isHost,
    // Stats
    money: STARTING_MONEY,
    fame: 0,
    happiness: 0,
    // Board position
    position: 0,
    // Status flags
    inPrison: false,
    skipNextTurn: false,
    retired: false,
    unemployed: false,
    // Life events
    isMarried: false,
    kids: 0,
    collegeDebt: 0,
    degree: null,          // null | 'compSci' | 'business' | 'healthSciences' | 'teaching'
    career: null,          // null | string (career path name)
    hasStudentLoans: false,
    // Overlays for character portrait
    hasWeddingRing: false,
    hasSportsCar: false,
    hasLandlordHat: false,
    graduationCapColor: null,  // null | 'blue' | 'green' | 'red' | 'purple'
    careerBadge: null,
    // Success Formula (set in lobby, kept secret)
    successFormula: null,   // null | { money: number, fame: number, happiness: number }
    hasSubmittedFormula: false,
    // Cards in hand
    luckCards: [],
    // Heartbeat
    lastPong: Date.now()
  };
}

// ── GameRoom factory ──────────────────────────────────────────────────────

/**
 * Create a new GameRoom state object.
 * @param {string} roomCode
 * @param {string} hostSocketId
 * @returns {object}
 */
function createGameRoom(roomCode, hostSocketId) {
  return {
    id: roomCode,
    hostSocketId,
    // Map<socketId, Player>
    players: new Map(),
    // Turn order — array of socketIds shuffled at game start
    turnOrder: [],
    currentTurnIndex: 0,
    // Game phase
    gamePhase: GAME_PHASES.LOBBY,
    // Turn phase (within a player's turn)
    turnPhase: TURN_PHASES.WAITING_FOR_ROLL,
    // Board state (populated in Phase 3+)
    board: [],
    // Shared resources
    sharedResources: {
      investmentPool: 0,      // grows when players miss on Investment Pool tile
      cryptoInvestments: new Map()  // Map<socketId, amount>
    },
    // Cleanup timer reference (set on empty room)
    cleanupTimer: null,
    // Turn history (last 10 turns)
    turnHistory: [],
    // Game metadata
    createdAt: Date.now(),
    startedAt: null
  };
}
```

Also update module.exports:
```javascript
module.exports = {
  app, httpServer, io, rooms, connectedSockets,
  generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId,
  createPlayer, createGameRoom,
  GAME_PHASES, TURN_PHASES, STARTING_MONEY
};
```

**Part B — Replace tests/state.test.js stub with real unit tests**

```javascript
'use strict';

let createPlayer, createGameRoom, GAME_PHASES, TURN_PHASES, STARTING_MONEY;

beforeEach(() => {
  const server = require('../server.js');
  createPlayer = server.createPlayer;
  createGameRoom = server.createGameRoom;
  GAME_PHASES = server.GAME_PHASES;
  TURN_PHASES = server.TURN_PHASES;
  STARTING_MONEY = server.STARTING_MONEY;
  server.rooms.clear();
});

afterAll(() => {
  require('../server.js').httpServer.close();
});

describe('createPlayer', () => {
  test('creates player with correct socketId and name', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.socketId).toBe('sock-1');
    expect(p.name).toBe('Alice');
  });

  test('starts with STARTING_MONEY', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.money).toBe(STARTING_MONEY);
  });

  test('starts with zero fame and happiness', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.fame).toBe(0);
    expect(p.happiness).toBe(0);
  });

  test('isHost defaults to false', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.isHost).toBe(false);
  });

  test('isHost can be set to true', () => {
    const p = createPlayer('sock-1', 'Alice', true);
    expect(p.isHost).toBe(true);
  });

  test('successFormula is null by default', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.successFormula).toBeNull();
  });

  test('luckCards is empty array by default', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.luckCards).toEqual([]);
  });
});

describe('createGameRoom', () => {
  test('creates room with correct id and hostSocketId', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.id).toBe('ABCD');
    expect(room.hostSocketId).toBe('sock-host');
  });

  test('starts in LOBBY game phase', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.gamePhase).toBe(GAME_PHASES.LOBBY);
  });

  test('players is an empty Map', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.players).toBeInstanceOf(Map);
    expect(room.players.size).toBe(0);
  });

  test('sharedResources.investmentPool starts at 0', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.sharedResources.investmentPool).toBe(0);
  });

  test('sharedResources.cryptoInvestments is an empty Map', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.sharedResources.cryptoInvestments).toBeInstanceOf(Map);
  });

  test('turnOrder is empty array before game start', () => {
    const room = createGameRoom('ABCD', 'sock-host');
    expect(room.turnOrder).toEqual([]);
  });
});

describe('GAME_PHASES constant', () => {
  test('has LOBBY, PLAYING, FINAL_ROUND, ENDED', () => {
    expect(GAME_PHASES.LOBBY).toBe('lobby');
    expect(GAME_PHASES.PLAYING).toBe('playing');
    expect(GAME_PHASES.FINAL_ROUND).toBe('finalRound');
    expect(GAME_PHASES.ENDED).toBe('ended');
  });
});

describe('TURN_PHASES constant', () => {
  test('has all 5 phases', () => {
    expect(TURN_PHASES.WAITING_FOR_ROLL).toBe('WAITING_FOR_ROLL');
    expect(TURN_PHASES.MID_ROLL).toBe('MID_ROLL');
    expect(TURN_PHASES.LANDED).toBe('LANDED');
    expect(TURN_PHASES.TILE_RESOLVING).toBe('TILE_RESOLVING');
    expect(TURN_PHASES.WAITING_FOR_NEXT_TURN).toBe('WAITING_FOR_NEXT_TURN');
  });
});
```
  </action>
  <verify>
    <automated>npm test -- --testPathPattern state --forceExit</automated>
  </verify>
  <acceptance_criteria>
    - grep "function createPlayer" server.js returns a match
    - grep "function createGameRoom" server.js returns a match
    - grep "GAME_PHASES" server.js returns a match with all 4 values (lobby, playing, finalRound, ended)
    - grep "TURN_PHASES" server.js returns a match with all 5 values
    - module.exports includes createPlayer, createGameRoom, GAME_PHASES, TURN_PHASES, STARTING_MONEY
    - npm test --testPathPattern state exits 0 with all tests passing (14+ assertions)
    - createPlayer returns object with socketId, name, money=50000, fame=0, happiness=0, successFormula=null, luckCards=[]
    - createGameRoom returns object with id, hostSocketId, players=Map, gamePhase='lobby', sharedResources.investmentPool=0
  </acceptance_criteria>
  <done>server.js defines createPlayer() and createGameRoom() factories plus GAME_PHASES and TURN_PHASES constants; tests/state.test.js verifies all fields pass.</done>
</task>

</tasks>

<verification>
After all tasks complete, run the full test suite:

```bash
npm test -- --coverage --forceExit
```

Expected: 6 test suites, all green. Coverage for server.js helpers (generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, createPlayer, createGameRoom) should be >80%.

Also verify the server starts cleanly:

```bash
node server.js &
sleep 1
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/host.html
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/player.html
kill %1
```

All three curl calls must return 200.
</verification>

<success_criteria>
- [ ] npm install exits 0, no missing module errors
- [ ] npm start launches server on port 3000, logs "Careers server running"
- [ ] GET / returns 200 (Express static serves index or 404 is OK — /host.html and /player.html return 200)
- [ ] npm test shows 6 suites passing (stubs + real room and state tests)
- [ ] server.js exports: app, httpServer, io, rooms, connectedSockets, generateRoomCode, getRoom, setRoom, deleteRoom, findRoomCodeBySocketId, createPlayer, createGameRoom, GAME_PHASES, TURN_PHASES, STARTING_MONEY
- [ ] Socket.io initialized with cors origin '*'
- [ ] generateRoomCode() returns /^[A-Z]{4}$/ and avoids collisions
- [ ] createGameRoom().gamePhase === 'lobby' and players is a Map
- [ ] createPlayer().money === 50000
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-setup/01-01-SUMMARY.md` with:
- Files created/modified
- Key decisions made (e.g., STARTING_MONEY=50000)
- Exports available for subsequent plans
- Test results summary
</output>
