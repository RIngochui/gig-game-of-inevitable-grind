'use strict';

import {
  createPlayer,
  createGameRoom,
  GAME_PHASES,
  TURN_PHASES,
} from '../server';

// ── Mock game room fixture ─────────────────────────────────────────────────

function createMockRoom(numPlayers = 2) {
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

// ── STOMP-01: Non-Cop stomp sends target to Tile 20 (Japan Trip) ──────────

describe('STOMP-01 non-Cop stomp sends target to Tile 20 (Japan Trip)', () => {
  it('stomper landing on occupied tile sends target to position 20 with inJapan=true', () => {
    const room = createMockRoom();
    const stomper = room.players.get('socket-a') as any;
    const target = room.players.get('socket-b') as any;

    // Both players on same tile
    stomper.position = 5;
    target.position = 5;

    // Stomper is NOT a cop
    stomper.isCop = false;

    // checkGoombaStomp will be exported in Plan 02
    const { checkGoombaStomp } = require('../server');
    checkGoombaStomp(room, 'TEST', 'socket-a');

    // Target should be sent to Japan Trip (Tile 20)
    expect(target.position).toBe(20);
    expect((target as any).inJapan).toBe(true);
  });
});

// ── STOMP-02: Cop stomp sends target to Tile 10 (Prison) ─────────────────

describe('STOMP-02 Cop stomp sends target to Tile 10 (Prison)', () => {
  it('Cop stomper landing on occupied tile sends target to position 10 with inPrison=true', () => {
    const room = createMockRoom();
    const stomper = room.players.get('socket-a') as any;
    const target = room.players.get('socket-b') as any;

    // Both players on same tile
    stomper.position = 5;
    target.position = 5;

    // Stomper IS a cop (field doesn't exist yet → cast)
    (stomper as any).isCop = true;

    const { checkGoombaStomp } = require('../server');
    checkGoombaStomp(room, 'TEST', 'socket-a');

    // Target should be sent to Prison (Tile 10)
    expect(target.position).toBe(10);
    expect(target.inPrison).toBe(true);
  });
});

// ── STOMP-01b: Multiple occupants on same tile are all stomped ────────────

describe('STOMP-01b multiple occupants on same tile are all stomped', () => {
  it('both targets are sent to Japan Trip (Tile 20) when stomper lands on their tile', () => {
    const room = createMockRoom(3); // 3-player room
    const stomper = room.players.get('socket-a') as any;
    const target1 = room.players.get('socket-b') as any;
    const target2 = room.players.get('socket-c') as any;

    // All three on same tile — stomper lands on tile with 2 occupants
    stomper.position = 7;
    target1.position = 7;
    target2.position = 7;

    // Stomper is NOT a cop
    (stomper as any).isCop = false;

    const { checkGoombaStomp } = require('../server');
    checkGoombaStomp(room, 'TEST', 'socket-a');

    // Both targets should be sent to Japan Trip (Tile 20)
    expect(target1.position).toBe(20);
    expect((target1 as any).inJapan).toBe(true);
    expect(target2.position).toBe(20);
    expect((target2 as any).inJapan).toBe(true);
  });
});
