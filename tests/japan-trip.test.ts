'use strict';

import {
  createPlayer,
  createGameRoom,
  GAME_PHASES,
  TURN_PHASES,
  STARTING_MONEY,
  BOARD_TILES,
  dispatchTile,
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

// ── JAPAN-01: Landing on JAPAN_TRIP tile grants +1 Happiness ─────────────

describe('JAPAN-01 landing on JAPAN_TRIP tile grants +1 Happiness', () => {
  it('calling dispatchTile with tile 20 increases player happiness by 1', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.position = 15;
    const happinessBefore = player.happiness; // 0

    // Land on Japan Trip (tile 20)
    dispatchTile(room, 'TEST', 'socket-a', 20, 5, 15);

    // After landing: +1 Happiness (currently stub so happiness stays 0 → FAILS)
    expect(player.happiness).toBe(happinessBefore + 1);
    expect(player.happiness).toBe(1);
  });
});

// ── JAPAN-02a: Stay turn grants +2 Happiness ─────────────────────────────

describe('JAPAN-02a stay turn grants +2 Happiness', () => {
  it('handleJapanTurnStart increases player happiness by 2 when inJapan=true', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    (player as any).inJapan = true;
    player.position = 20;
    player.happiness = 1;
    player.salary = 10000;

    // Mock Math.random so 2d6 produces a roll <= 8 (e.g. 7: 3+4)
    const origRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return callCount % 2 === 1 ? 3 / 6 : 3 / 6; // 4+4=8, exactly at threshold → stay
    };

    // handleJapanTurnStart will be exported in Plan 02
    const { handleJapanTurnStart } = require('../server');
    handleJapanTurnStart(room, 'TEST', 'socket-a');

    Math.random = origRandom;

    expect(player.happiness).toBe(3); // 1 + 2 = 3
  });
});

// ── JAPAN-02b: Stay turn drains Math.ceil(salary/5) ─────────────────────

describe('JAPAN-02b stay turn drains Math.ceil(salary/5)', () => {
  it('handleJapanTurnStart drains Math.ceil(10000/5) = 2000 from player money', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    (player as any).inJapan = true;
    player.position = 20;
    player.salary = 10000;
    const moneyBefore = player.money; // STARTING_MONEY

    // Mock Math.random so 2d6 roll <= 8 (stay)
    const origRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return callCount % 2 === 1 ? 3 / 6 : 3 / 6; // 4+4=8
    };

    const { handleJapanTurnStart } = require('../server');
    handleJapanTurnStart(room, 'TEST', 'socket-a');

    Math.random = origRandom;

    // Math.ceil(10000 / 5) = 2000
    expect(player.money).toBe(moneyBefore - 2000);
  });
});

// ── JAPAN-03: 2d6 roll >= 9 forces leave ─────────────────────────────────

describe('JAPAN-03 2d6 roll >= 9 forces leave', () => {
  it('handleJapanTurnStart with roll=9 sets inJapan=false and position=21', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    (player as any).inJapan = true;
    player.position = 20;
    player.salary = 10000;

    // Mock Math.random so 2d6 produces 9: 4+5
    // floor((3/6)*6)+1 = 4, floor((4/6)*6)+1 = 5 → 4+5 = 9 >= 9 → forced leave
    const origRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return callCount % 2 === 1 ? 3 / 6 : 4 / 6;
    };

    const { handleJapanTurnStart } = require('../server');
    handleJapanTurnStart(room, 'TEST', 'socket-a');

    Math.random = origRandom;

    // Forced leave: inJapan=false, position advances to 21
    expect((player as any).inJapan).toBe(false);
    expect(player.position).toBe(21);
  });
});
