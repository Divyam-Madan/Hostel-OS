/** @type {import('socket.io').Server | null} */
let io = null;

export function setSocketIO(server) {
  io = server;
}

export function getIO() {
  return io;
}

export function emitComplaintUpdate(payload) {
  io?.emit('complaint:update', payload);
}

export function emitOrderUpdate(payload) {
  io?.emit('order:update', payload);
}

export function emitAlertNew(payload) {
  io?.emit('alert:new', payload);
}

/** Admin dashboard clients refetch analytics. */
export function emitAdminStatsUpdate(meta = {}) {
  io?.emit('admin:stats', { at: Date.now(), ...meta });
}
