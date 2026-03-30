// client/game.ts — Shared client entry point
// Host lobby logic runs on host.html; player lobby logic runs on player.html (added in Plan 04)

// ── Host Lobby Logic ─────────────────────────────────────────────────────────

(function initHostLobby() {
  // Guard: only run on host.html (has #room-code element)
  if (!document.getElementById('room-code')) return;

  const socket = io();

  // DOM refs
  const roomCodeEl   = document.getElementById('room-code') as HTMLElement;
  const playerListEl = document.getElementById('player-list') as HTMLUListElement;
  const statusEl     = document.getElementById('status-text') as HTMLElement;
  const startBtn     = document.getElementById('start-btn') as HTMLButtonElement;
  const errorMsgEl   = document.getElementById('error-msg') as HTMLElement;

  // Lobby state — recomputed from server events, never mutated locally outside handlers
  let playerList: Array<{ name: string; hasSubmittedFormula: boolean }> = [];

  function renderPlayerList(): void {
    playerListEl.innerHTML = '';
    playerList.forEach(p => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = p.name;
      const flagSpan = document.createElement('span');
      flagSpan.textContent = p.hasSubmittedFormula ? '✓' : '○';
      flagSpan.className = p.hasSubmittedFormula ? 'check' : 'pending';
      flagSpan.title = p.hasSubmittedFormula ? 'Formula submitted' : 'Waiting for formula';
      li.appendChild(nameSpan);
      li.appendChild(flagSpan);
      playerListEl.appendChild(li);
    });
  }

  function updateLobbyStatus(): void {
    const total = playerList.length;
    const ready = playerList.filter(p => p.hasSubmittedFormula).length;

    if (total === 0) {
      statusEl.textContent = 'Waiting for players to join...';
    } else if (ready < total) {
      statusEl.textContent = `${total} player${total !== 1 ? 's' : ''} connected — ${ready}/${total} formulas submitted`;
    } else {
      statusEl.textContent = `${total} player${total !== 1 ? 's' : ''} ready — all formulas submitted!`;
    }

    // Enable Start only when 2+ players and all submitted
    startBtn.disabled = !(total >= 2 && ready === total);
    errorMsgEl.textContent = '';
  }

  // ── Socket event handlers ───────────────────────────────────────────────────

  socket.on('connected', () => {
    statusEl.textContent = 'Creating room...';
    socket.emit('create-room');
  });

  socket.on('roomCreated', ({ roomCode }: { roomCode: string }) => {
    roomCodeEl.textContent = roomCode;
    statusEl.textContent = 'Waiting for players to join...';
  });

  socket.on('playerJoined', ({ playerList: list }: { playerList: Array<{ name: string; hasSubmittedFormula: boolean }> }) => {
    playerList = list;
    renderPlayerList();
    updateLobbyStatus();
  });

  socket.on('formulaSubmitted', ({ playerName }: { playerName: string }) => {
    const p = playerList.find(pl => pl.name === playerName);
    if (p) p.hasSubmittedFormula = true;
    renderPlayerList();
    updateLobbyStatus();
  });

  socket.on('playerLeft', ({ playerName, playerList: list }: { playerName: string; playerList?: Array<{ name: string; hasSubmittedFormula: boolean }> }) => {
    if (list) {
      playerList = list;
    } else {
      playerList = playerList.filter(p => p.name !== playerName);
    }
    renderPlayerList();
    updateLobbyStatus();
  });

  socket.on('gameStarted', ({ turnOrder, currentPlayerName }: { turnOrder: string[]; currentPlayerName: string }) => {
    const lobbySection = document.getElementById('lobby-section');
    const gameSection  = document.getElementById('game-section');
    if (lobbySection) lobbySection.style.display = 'none';
    if (gameSection)  gameSection.style.display  = 'block';
    // Phase 3 will populate game-section
    console.log('[host] Game started. Turn order:', turnOrder.join(' → '), '— First:', currentPlayerName);
  });

  socket.on('error', ({ message }: { message: string }) => {
    errorMsgEl.textContent = message;
    // Re-enable start button if it was in "Starting..." state
    if (startBtn.textContent === 'Starting...') {
      startBtn.textContent = 'Start Game';
      updateLobbyStatus(); // re-evaluates disabled state
    }
    console.error('[host error]', message);
  });

  // ── Start Game button ────────────────────────────────────────────────────────

  startBtn.addEventListener('click', () => {
    if (startBtn.disabled) return;
    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';
    errorMsgEl.textContent = '';
    socket.emit('start-game');
  });

})();
