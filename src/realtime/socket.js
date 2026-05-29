import { io } from 'socket.io-client';

const SOCKET_KEY = '__hostelOsSocket__';

function getSocket() {
  if (!globalThis[SOCKET_KEY]) {
    globalThis[SOCKET_KEY] = io({ path: '/socket.io', autoConnect: false });
  }
  const socket = globalThis[SOCKET_KEY];
  if (!socket.connected && !socket.active) socket.connect();
  return socket;
}

export function ensureRealtimeSocket() {
  return getSocket();
}

export function disconnectRealtimeSocket() {
  const socket = globalThis[SOCKET_KEY];
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.off();
    socket.disconnect();
  } catch {
    // ignore socket cleanup errors
  }
}

export function subscribeRealtimeEvent(eventName, handler) {
  const socket = getSocket();
  socket.off(eventName, handler);
  socket.on(eventName, handler);
  return () => socket.off(eventName, handler);
}