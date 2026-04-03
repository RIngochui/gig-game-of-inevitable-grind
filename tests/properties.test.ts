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

// ── PROP-01 buy prompt: landing on unowned APARTMENT triggers buy prompt ──

describe('PROP-01 buy prompt', () => {
  it('landing on APARTMENT (tile 6) when unowned returns a buy prompt to the player', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.position = 6; // APARTMENT tile

    // handlePropertyLanding will be exported in the GREEN plan
    const { handlePropertyLanding } = require('../server');
    const result = handlePropertyLanding(room, 'TEST', 'socket-a');

    // When property is unowned, player should get a buy prompt
    expect(result).toEqual(expect.objectContaining({ action: 'buy_prompt' }));
    expect(result.price).toBe(50000);
  });
});

// ── PROP-01 buy apartment: buying apartment deducts 50,000 and sets owner ─

describe('PROP-01 buy apartment', () => {
  it('buying apartment for 50,000 deducts money from buyer and records ownership', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.position = 6; // APARTMENT tile
    player.money = 60000;

    // handlePropertyBuy will be exported in the GREEN plan
    const { handlePropertyBuy } = require('../server');
    handlePropertyBuy(room, 'TEST', 'socket-a');

    // Player should pay 50,000
    expect(player.money).toBe(10000);
    // Room should track ownership of tile 6
    expect(room.propertyOwners?.get(6)).toBe('socket-a');
  });
});

// ── PROP-02 buy house: buying house deducts 100,000 and sets owner ────────

describe('PROP-02 buy house', () => {
  it('buying house for 100,000 deducts money from buyer and records ownership', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.position = 25; // HOUSE tile
    player.money = 150000;

    const { handlePropertyBuy } = require('../server');
    handlePropertyBuy(room, 'TEST', 'socket-a');

    // Player should pay 100,000
    expect(player.money).toBe(50000);
    // Room should track ownership of tile 25
    expect(room.propertyOwners?.get(25)).toBe('socket-a');
  });
});

// ── PROP-01 rent: visitor on owned apartment pays 25% salary to owner ─────

describe('PROP-01 rent', () => {
  it('visitor landing on owned apartment pays 25% of their salary to the owner', () => {
    const room = createMockRoom();
    const owner = room.players.get('socket-a') as any;
    const visitor = room.players.get('socket-b') as any;

    // Owner owns the apartment at tile 6
    if (!room.propertyOwners) room.propertyOwners = new Map();
    room.propertyOwners.set(6, 'socket-a');

    visitor.position = 6;
    visitor.salary = 20000;
    const ownerMoneyBefore = owner.money;
    const visitorMoneyBefore = visitor.money;

    // handlePropertyLanding will be exported in the GREEN plan
    const { handlePropertyLanding } = require('../server');
    handlePropertyLanding(room, 'TEST', 'socket-b');

    // Rent = 25% of visitor's salary = 5,000
    const rent = Math.floor(visitor.salary * 0.25);
    expect(visitor.money).toBe(visitorMoneyBefore - rent);
    expect(owner.money).toBe(ownerMoneyBefore + rent);
  });
});

// ── PROP-03 default: visitor can't pay rent → all cash to owner, prison ───

describe('PROP-03 default', () => {
  it('visitor who cannot afford rent gives all cash to owner and is sent to prison', () => {
    const room = createMockRoom();
    const owner = room.players.get('socket-a') as any;
    const visitor = room.players.get('socket-b') as any;

    // Owner owns the apartment at tile 6
    if (!room.propertyOwners) room.propertyOwners = new Map();
    room.propertyOwners.set(6, 'socket-a');

    visitor.position = 6;
    visitor.salary = 20000; // rent = 5,000
    visitor.money = 3000;   // can't afford 5,000 rent
    const ownerMoneyBefore = owner.money;

    const { handlePropertyLanding } = require('../server');
    handlePropertyLanding(room, 'TEST', 'socket-b');

    // Visitor gives ALL remaining cash to owner
    expect(visitor.money).toBe(0);
    expect(owner.money).toBe(ownerMoneyBefore + 3000);

    // Visitor is sent to Prison (tile 10)
    expect(visitor.position).toBe(10);
    expect(visitor.inPrison).toBe(true);
  });
});

// ── PROP-01/02 self-land: owner landing on own property pays no rent ──────

describe('PROP-01/02 self-land', () => {
  it('owner landing on their own property does not pay rent', () => {
    const room = createMockRoom();
    const owner = room.players.get('socket-a') as any;

    // Owner owns the apartment at tile 6
    if (!room.propertyOwners) room.propertyOwners = new Map();
    room.propertyOwners.set(6, 'socket-a');

    owner.position = 6;
    const moneyBefore = owner.money;

    const { handlePropertyLanding } = require('../server');
    handlePropertyLanding(room, 'TEST', 'socket-a');

    // Owner's money should be unchanged — no rent paid to self
    expect(owner.money).toBe(moneyBefore);
  });
});

// ── PROP-01 pass: unowned property with no buyer remains unowned ──────────

describe('PROP-01 pass', () => {
  it('player who passes on buying an unowned property leaves it unowned', () => {
    const room = createMockRoom();
    const player = room.players.get('socket-a') as any;
    player.position = 6; // APARTMENT tile, unowned

    // handlePropertyPass will be exported in the GREEN plan
    const { handlePropertyPass } = require('../server');
    handlePropertyPass(room, 'TEST', 'socket-a');

    // Property should remain unowned (no entry in propertyOwners)
    expect(room.propertyOwners?.get(6)).toBeUndefined();
    // Player money unchanged
    expect(player.money).toBe(STARTING_MONEY);
  });
});

// ── PROP-02 rent: visitor on owned house pays 50% salary to owner ─────────

describe('PROP-02 rent', () => {
  it('visitor landing on owned house pays 50% of their salary to the owner', () => {
    const room = createMockRoom();
    const owner = room.players.get('socket-a') as any;
    const visitor = room.players.get('socket-b') as any;

    // Owner owns the house at tile 25
    if (!room.propertyOwners) room.propertyOwners = new Map();
    room.propertyOwners.set(25, 'socket-a');

    visitor.position = 25;
    visitor.salary = 20000;
    const ownerMoneyBefore = owner.money;
    const visitorMoneyBefore = visitor.money;

    const { handlePropertyLanding } = require('../server');
    handlePropertyLanding(room, 'TEST', 'socket-b');

    // Rent = 50% of visitor's salary = 10,000
    const rent = Math.floor(visitor.salary * 0.50);
    expect(visitor.money).toBe(visitorMoneyBefore - rent);
    expect(owner.money).toBe(ownerMoneyBefore + rent);
  });
});
