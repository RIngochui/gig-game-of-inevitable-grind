// Client-side shared utilities — stub
// Populated in Phase 2+
const socket = io();

socket.on('connected', ({ socketId }) => {
  const el = document.getElementById('status');
  if (el) el.textContent = 'Connected: ' + socketId;
  console.log('[socket] connected as', socketId);
});
