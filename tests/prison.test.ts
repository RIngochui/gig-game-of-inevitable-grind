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

// ── PRISON-01: Prison tile exists at index 10 ─────────────────────────────
// This assertion stays GREEN (sanity check — board already built)

describe('PRISON-01 prison tile exists at index 10', () => {
  it('BOARD_TILES[10].type is PRISON', () => {
    expect(BOARD_TILES[10].type).toBe('PRISON');
  });
});

// ── PRISON-02: inPrison blocks position change on roll-dice ───────────────

describe('PRISON-02 inPrison blocks position change on roll-dice', () => {
  it('prisoner does not move when escape roll fails (not 9, 11, or 12)', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.inPrison = true;
    player.position = 10;
    const positionBefore = player.position;

    // Mock Math.random so 2d6 produces 7 (not in {9, 11, 12} → escape fails)
    // Two dice: each 0-based: floor(x*6)+1. To get 3+4=7: 0.333 and 0.5
    const origRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return callCount % 2 === 1 ? 3 / 6 : 3 / 6; // both dice = 4 → total 8 (not escape)
    };

    // handlePrisonEscape will be exported in Plan 02
    const { handlePrisonEscape } = require('../server');
    handlePrisonEscape(room, 'TEST', 'socket-a');

    Math.random = origRandom;

    // Player should not have moved
    expect(player.position).toBe(positionBefore);
    expect(player.position).toBe(10);
    expect(player.inPrison).toBe(true);
  });
});

// ── PRISON-03: Cards NOT blocked when inPrison=true ──────────────────────
// Prison ALLOWS card play (unlike Hospital/Japan)

describe('PRISON-03 card play is NOT blocked when inPrison=true', () => {
  it('canPlayCard does not reject with prison reason when player.inPrison=true', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.inPrison = true;

    // canPlayCard will be exported in Plan 02
    const { canPlayCard } = require('../server');
    const result = canPlayCard(room, 'TEST', 'socket-a');

    // Prison does NOT block cards — result should NOT be false due to prison
    // (Hospital does block, Prison does not)
    expect(result).not.toBe('blocked_by_prison');
  });
});

// ── PRISON-04: escape roll {9, 11, 12} sets inPrison=false ───────────────

describe('PRISON-04 escape roll sets inPrison=false', () => {
  it('roll of 9 on 2d6 exits prison (inPrison=false)', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.inPrison = true;
    player.position = 10;

    // Mock Math.random so 2d6 produces 9: dice = 4+5
    // floor((3/6)*6)+1 = 4, floor((4/6)*6)+1 = 5 → 4+5 = 9
    const origRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return callCount % 2 === 1 ? 3 / 6 : 4 / 6;
    };

    const { handlePrisonEscape } = require('../server');
    handlePrisonEscape(room, 'TEST', 'socket-a');

    Math.random = origRandom;

    expect(player.inPrison).toBe(false);
  });
});

// ── PRISON-05: bail payment of $5,000 removes inPrison ───────────────────

describe('PRISON-05 bail payment of $5,000 removes inPrison and deducts money', () => {
  it('paying bail exits prison and deducts exactly $5,000', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.inPrison = true;
    player.money = STARTING_MONEY; // 10000

    // handlePrisonBail will be exported in Plan 02
    const { handlePrisonBail } = require('../server');
    handlePrisonBail(room, 'TEST', 'socket-a');

    expect(player.inPrison).toBe(false);
    // Bail is exactly $5,000
    expect(player.money).toBe(STARTING_MONEY - 5000);
    expect(player.money).toBe(5000);
  });
});
