'use strict';

import {
  createPlayer,
  createGameRoom,
  GAME_PHASES,
  TURN_PHASES,
  STARTING_MONEY,
  BOARD_TILES,
} from '../server';

// ── Mock game room fixture ─────────────────────────────────────────────────

function createMockRoom() {
  const room = createGameRoom('TEST', 'socket-a');
  const playerA = createPlayer('socket-a', 'Alice', true);
  const playerB = createPlayer('socket-b', 'Bob', false);
  room.players.set('socket-a', playerA);
  room.players.set('socket-b', playerB);
  room.turnOrder = ['socket-a', 'socket-b'];
  room.currentTurnIndex = 0;
  room.gamePhase = GAME_PHASES.PLAYING;
  room.turnPhase = TURN_PHASES.WAITING_FOR_ROLL;
  return room as any;
}

afterAll((done) => {
  require('../server').httpServer.close(done);
});

// ── entry: University entry from Tile 9 ───────────────────────────────────

describe('entry', () => {
  it('landing on University tile (9) deducts $10,000 entry fee from player money', () => {
    expect(true).toBe(false);
  });

  it('entering University sets inPath=true on the player', () => {
    expect(true).toBe(false);
  });

  it("entering University sets currentPath='UNIVERSITY' on the player", () => {
    expect(true).toBe(false);
  });
});

// ── tile-3: Tile 3 (STUDENT_LOAN_REDIRECT) moves player to Tile 9 with waived fee ──

describe('tile-3', () => {
  it('landing on Tile 3 (STUDENT_LOAN_REDIRECT) moves player to University tile (9)', () => {
    expect(true).toBe(false);
  });

  it('arriving at University via Tile 3 waives the $10,000 entry fee', () => {
    expect(true).toBe(false);
  });
});

// ── degree: University completion prompts degree selection ─────────────────

describe('degree', () => {
  it('completing University path (Tile 8 exit) prompts degree selection with 7 options', () => {
    expect(true).toBe(false);
  });

  it('max 1 degree enforced — player with existing degree cannot select another', () => {
    expect(true).toBe(false);
  });
});

// ── cap: Degree selection sets graduationCapColor ────────────────────────

describe('cap', () => {
  it('selecting a degree sets graduationCapColor to the correct colour for that degree', () => {
    expect(true).toBe(false);
  });
});

// ── medical: Medical degree sets isDoctor=true and sends to Hospital ─────

describe('medical', () => {
  it('selecting Medical Degree sets isDoctor=true on the player', () => {
    expect(true).toBe(false);
  });

  it('selecting Medical Degree immediately sends player to Hospital (inHospital=true)', () => {
    expect(true).toBe(false);
  });
});
