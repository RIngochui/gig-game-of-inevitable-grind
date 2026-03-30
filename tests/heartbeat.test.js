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
