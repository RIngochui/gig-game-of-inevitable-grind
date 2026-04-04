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

// ── path-traversal: inPath player rolls 1d6 not 2d6 ──────────────────────

describe('path-traversal', () => {
  it('player inside a career path rolls 1d6 (max 6) not 2d6 (max 12)', () => {
    expect(true).toBe(false);
  });

  it('roll advances pathTile counter by the roll amount', () => {
    expect(true).toBe(false);
  });

  it('landing on a path tile applies the tile effect immediately', () => {
    expect(true).toBe(false);
  });
});

// ── entry-prompt: career entry pauses turn ────────────────────────────────

describe('entry-prompt', () => {
  it('landing on a career entry tile transitions turnPhase to WAITING_FOR_CAREER_DECISION', () => {
    expect(true).toBe(false);
  });

  it('player can choose to enter the career path (enter option)', () => {
    expect(true).toBe(false);
  });

  it('player can choose to pass on the career path (pass option)', () => {
    expect(true).toBe(false);
  });
});

// ── unmet: unmet requirements auto-advance turn ───────────────────────────

describe('unmet', () => {
  it('landing on career tile with unmet requirements does not show entry prompt', () => {
    expect(true).toBe(false);
  });

  it('player with unmet requirements has turn advanced without WAITING_FOR_CAREER_DECISION', () => {
    expect(true).toBe(false);
  });
});

// ── locked: player in path cannot roll on main board ─────────────────────

describe('locked', () => {
  it('player with inPath=true cannot roll on the main board', () => {
    expect(true).toBe(false);
  });

  it('player with inPath=true has position stay at entry tile on main board', () => {
    expect(true).toBe(false);
  });
});

// ── cop-entry: Cop entry deducts $15,000 + skips 1 turn ──────────────────

describe('cop-entry', () => {
  it('entering Cop path deducts $15,000 from player money', () => {
    expect(true).toBe(false);
  });

  it('entering Cop path sets skipNextTurn=true before path begins', () => {
    expect(true).toBe(false);
  });
});

// ── streamer: Streamer entry requires rolling 1 on 1d6 ───────────────────

describe('streamer', () => {
  it('Streamer entry attempt rolls 1d6; rolling 1 allows entry', () => {
    expect(true).toBe(false);
  });

  it('failed Streamer roll deducts $15,000 per attempt', () => {
    expect(true).toBe(false);
  });

  it('max 2 Streamer entry attempts; failure after 2 passes the tile', () => {
    expect(true).toBe(false);
  });

  it('Nepotism card bypasses Streamer roll requirement', () => {
    expect(true).toBe(false);
  });
});

// ── cop-tile-7: Cop path tile 7 sends to Hospital ────────────────────────

describe('cop-tile-7', () => {
  it('landing on Cop path tile 7 sends player to Hospital', () => {
    expect(true).toBe(false);
  });

  it('landing on Cop path tile 7 cancels all career path progress', () => {
    expect(true).toBe(false);
  });
});

// ── mid-path-hospital: HP <= 0 during path cancels path ──────────────────

describe('mid-path-hospital', () => {
  it('player with HP <= 0 after a path tile effect has inPath reset to false', () => {
    expect(true).toBe(false);
  });

  it('player with HP <= 0 after a path tile effect is sent to Hospital', () => {
    expect(true).toBe(false);
  });
});

// ── cop-complete: Cop path completion sets isCop ──────────────────────────

describe('cop-complete', () => {
  it('completing the Cop career path sets isCop=true on the player', () => {
    expect(true).toBe(false);
  });
});

// ── artist-complete: Starving Artist completion sets isArtist ────────────

describe('artist-complete', () => {
  it('completing the Starving Artist career path sets isArtist=true on the player', () => {
    expect(true).toBe(false);
  });
});

// ── experience: career completion logs experience card stub ──────────────

describe('experience', () => {
  it('completing a career path logs an experience card entry for the player', () => {
    expect(true).toBe(false);
  });
});

// ── completion: path completion resets inPath/currentPath/pathTile ────────

describe('completion', () => {
  it('completing a career path resets inPath to false', () => {
    expect(true).toBe(false);
  });

  it('completing a career path resets currentPath to null', () => {
    expect(true).toBe(false);
  });

  it('completing a career path resets pathTile to 0', () => {
    expect(true).toBe(false);
  });

  it('completing a career path moves player to the path exitTile', () => {
    expect(true).toBe(false);
  });
});

// ── tile-22: BOARD_TILES[22].type is 'PEOPLE_AND_CULTURE' not 'DEI_OFFICER' ──

describe('tile-22', () => {
  it('BOARD_TILES[22].type should be PEOPLE_AND_CULTURE (not DEI_OFFICER)', () => {
    expect(BOARD_TILES[22].type).toBe('PEOPLE_AND_CULTURE');
  });
});
