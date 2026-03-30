// Ambient declarations for browser globals loaded via script tags

// Socket.io client — loaded via /socket.io/socket.io.js
declare function io(url?: string, opts?: Record<string, unknown>): Socket;

interface Socket {
  readonly id: string;
  on(event: string, callback: (...args: any[]) => void): Socket;
  off(event: string, callback?: (...args: any[]) => void): Socket;
  emit(event: string, ...args: any[]): Socket;
  disconnect(): Socket;
}
