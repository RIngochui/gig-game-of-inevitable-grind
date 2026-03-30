'use strict';

import { createPlayer, createGameRoom, GAME_PHASES, TURN_PHASES, STARTING_MONEY } from '../server';

// ── Mock game room fixture ─────────────────────────────────────────────────

function createMockGameRoom(numPlayers = 2): ReturnType<typeof createGameRoom> & { players: Map<string, ReturnType<typeof createPlayer>> } {
  const room = createGameRoom('TEST', 'socket-a');
  const playerA = createPlayer('socket-a', 'Alice', true);
  const playerB = createPlayer('socket-b', 'Bob', false);
  room.players.set('socket-a', playerA);
  room.players.set('socket-b', playerB);
  room.turnOrder = ['socket-a', 'socket-b'];
  room.currentTurnIndex = 0;
  room.gamePhase = GAME_PHASES.PLAYING;
  room.turnPhase = TURN_PHASES.WAITING_FOR_ROLL;
  if (numPlayers === 3) {
    const playerC = createPlayer('socket-c', 'Carol', false);
    room.players.set('socket-c', playerC);
    room.turnOrder.push('socket-c');
  }
  return room as any;
}

afterAll((done) => {
  require('../server').httpServer.close(done);
});

// ── LOOP-01: Turn order ────────────────────────────────────────────────────

describe('LOOP-01 turn order', () => {
  it('room starts with correct turn order', () => {
    const room = createMockGameRoom();
    expect(room.turnOrder).toEqual(['socket-a', 'socket-b']);
    expect(room.currentTurnIndex).toBe(0);
  });

  it('first player is socket-a', () => {
    const room = createMockGameRoom();
    expect(room.turnOrder[room.currentTurnIndex]).toBe('socket-a');
  });
});

// ── LOOP-02: Roll-dice 2d6 ─────────────────────────────────────────────────

describe('LOOP-02 roll-dice 2d6', () => {
  it.todo('active player emits roll-dice and receives move-token with roll between 2–12');
  it.todo('non-active player emitting roll-dice receives error Not your turn');
  it.todo('roll-dice in wrong turnPhase receives error Cannot roll now');
  it.todo('move-token event includes playerId, roll, d1, d2, fromPosition, toPosition');
});

// ── LOOP-03: Position wraps ────────────────────────────────────────────────

describe('LOOP-03 position wraps', () => {
  const BOARD_SIZE = 40;

  it('wraps from near end', () => {
    expect((38 + 5) % BOARD_SIZE).toBe(3);
  });

  it('wraps exactly at end', () => {
    expect((39 + 1) % BOARD_SIZE).toBe(0);
  });

  it('zero position stays valid', () => {
    expect((0 + 40) % BOARD_SIZE).toBe(0);
  });

  it('max roll from last tile', () => {
    expect((39 + 12) % BOARD_SIZE).toBe(11);
  });
});

// ── LOOP-04: Tile dispatch ─────────────────────────────────────────────────

describe('LOOP-04 tile dispatch', () => {
  it.todo('tile type lookup by position returns a tile with a .type string');
  it.todo('landing on PAYDAY tile dispatches correctly');
  it.todo('landing on TBD tile advances turn immediately (stub behavior)');
});

// ── LOOP-05: Advance turn ──────────────────────────────────────────────────

describe('LOOP-05 advance turn', () => {
  it.todo('after advancing, currentTurnIndex increments from 0 to 1');
  it.todo('turn index wraps from last player back to 0');
  it.todo('nextTurn event emitted with correct currentPlayer socketId');
});

// ── LOOP-06: Drains ────────────────────────────────────────────────────────

describe('LOOP-06 drains', () => {
  it.todo('married player loses $2000 at turn start');
  it.todo('player with 2 kids loses $2000 at turn start');
  it.todo('player with student loans loses $1000 at turn start');
  it.todo('combined drains applied atomically');
  it.todo('money floors at 0 — never goes negative from drains alone');
});

// ── LOOP-07: Turn history ──────────────────────────────────────────────────

describe('LOOP-07 turn history', () => {
  it.todo('after a roll, turnHistory has one entry with playerId, roll, tileType fields');
  it.todo('turnHistory is capped at 10 entries');
  it.todo('each history entry has a timestamp');
});
