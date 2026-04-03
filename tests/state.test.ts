'use strict';

import type { Player, GameRoom } from '../server';

let createPlayer: (id: string, name: string, isHost?: boolean) => Player;
let createGameRoom: (code: string, hostId: string) => GameRoom;
let GAME_PHASES: Record<string, string>;
let TURN_PHASES: Record<string, string>;
let STARTING_MONEY: number;
let getFullState: (room: GameRoom, socketId?: string | null) => object;

beforeEach(() => {
  const server = require('../server');
  createPlayer = server.createPlayer;
  createGameRoom = server.createGameRoom;
  GAME_PHASES = server.GAME_PHASES;
  TURN_PHASES = server.TURN_PHASES;
  STARTING_MONEY = server.STARTING_MONEY;
  getFullState = server.getFullState;
  server.rooms.clear();
});

afterAll(() => {
  require('../server').httpServer.close();
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

  test('initializes hp to 10', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.hp).toBe(10);
  });

  test('initializes salary to 10000', () => {
    const p = createPlayer('sock-1', 'Alice');
    expect(p.salary).toBe(10000);
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

describe('getFullState', () => {
  test('includes hp and salary in player snapshot', () => {
    const room = createGameRoom('ABCD', 'host-1');
    const player = createPlayer('sock-1', 'Alice');
    room.players.set('sock-1', player);
    const state = getFullState(room, 'sock-1') as any;
    expect(state.players['sock-1'].hp).toBeDefined();
    expect(state.players['sock-1'].salary).toBeDefined();
    expect(typeof state.players['sock-1'].hp).toBe('number');
    expect(typeof state.players['sock-1'].salary).toBe('number');
  });
});
