'use strict';

import type { RateLimit } from '../server';

let checkRateLimit: (socketId: string, event: string) => boolean;
let clearRateLimitState: (socketId: string) => void;
let RATE_LIMITS: Record<string, RateLimit>;
let rateLimitState: Map<string, Map<string, number[]>>;

beforeEach(() => {
  const server = require('../server');
  checkRateLimit = server.checkRateLimit;
  clearRateLimitState = server.clearRateLimitState;
  RATE_LIMITS = server.RATE_LIMITS;
  rateLimitState = server.rateLimitState;
  rateLimitState.clear();
});

afterAll(() => {
  require('../server').httpServer.close();
});

describe('checkRateLimit', () => {
  test('returns true for first call on limited event', () => {
    expect(checkRateLimit('sock-1', 'create-room')).toBe(true);
  });

  test('returns false when maxCalls exceeded within window', () => {
    const { maxCalls } = RATE_LIMITS['create-room'];
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-1', 'create-room');
    }
    expect(checkRateLimit('sock-1', 'create-room')).toBe(false);
  });

  test('returns true for unknown event (no limit defined)', () => {
    expect(checkRateLimit('sock-1', 'some-unknown-event')).toBe(true);
  });

  test('rate limits are per-socket (different sockets independent)', () => {
    const { maxCalls } = RATE_LIMITS['create-room'];
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-A', 'create-room');
    }
    expect(checkRateLimit('sock-A', 'create-room')).toBe(false);
    expect(checkRateLimit('sock-B', 'create-room')).toBe(true);
  });

  test('rate limits are per-event (different events independent)', () => {
    const { maxCalls } = RATE_LIMITS['create-room'];
    for (let i = 0; i < maxCalls; i++) {
      checkRateLimit('sock-1', 'create-room');
    }
    expect(checkRateLimit('sock-1', 'create-room')).toBe(false);
    expect(checkRateLimit('sock-1', 'requestSync')).toBe(true);
  });
});

describe('clearRateLimitState', () => {
  test('removes socket from rateLimitState map', () => {
    checkRateLimit('sock-1', 'create-room');
    expect(rateLimitState.has('sock-1')).toBe(true);

    clearRateLimitState('sock-1');
    expect(rateLimitState.has('sock-1')).toBe(false);
  });

  test('safe to call for unknown socketId', () => {
    expect(() => clearRateLimitState('unknown-sock')).not.toThrow();
  });
});

describe('RATE_LIMITS config', () => {
  test('create-room has a rate limit configured', () => {
    expect(RATE_LIMITS['create-room']).toBeDefined();
    expect(RATE_LIMITS['create-room'].maxCalls).toBeGreaterThan(0);
  });

  test('roll-dice is not rate-limited (removed to allow normal multi-turn play)', () => {
    expect(RATE_LIMITS['roll-dice']).toBeUndefined();
  });

  test('all limits have maxCalls and windowMs', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      expect(typeof config.maxCalls).toBe('number');
      expect(typeof config.windowMs).toBe('number');
    }
  });
});
