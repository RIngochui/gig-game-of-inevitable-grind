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
