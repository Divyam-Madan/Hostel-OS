/** @type {import('socket.io').Server | null} */
let io = null;

export function setSocketIO(server) {
  if (io && io !== server) {
    return io;
  }
  io = server;
  return io;
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

export function emitNotificationNew(payload) {
  io?.emit('notification:new', payload);
}

export function emitLeaveUpdate(payload) {
  io?.emit('leave:update', payload);
}

export function emitLeaveCreated(payload) {
  io?.emit('leave:created', payload);
}

export function emitLeaveUpdated(payload) {
  io?.emit('leave:updated', payload);
}

export function emitLeaveNew(payload) {
  io?.emit('leave:new', payload);
}

export function emitEventNew(payload) {
  io?.emit('event:new', payload);
}

export function emitEventCreated(payload) {
  io?.emit('event:created', payload);
}

export function emitEventUpdated(payload) {
  io?.emit('event:updated', payload);
}

export function emitEventDeleted(payload) {
  io?.emit('event:deleted', payload);
}

export function emitEventUpdate(payload) {
  io?.emit('event:update', payload);
}

export function emitWellbeingUpdate(payload) {
  io?.emit('wellbeing:update', payload);
}

export function emitTimetableUpdate(payload) {
  io?.emit('timetable:update', payload);
}

export function emitTimelineUpdate(payload) {
  io?.emit('timeline:update', payload);
}

export function emitLostFoundUpdate(payload) {
  io?.emit('lostfound:update', payload);
}

export function emitLostFoundCreated(payload) {
  io?.emit('lostfound:created', payload);
}

export function emitLostFoundDeleted(payload) {
  io?.emit('lostfound:deleted', payload);
}

/** Admin dashboard clients refetch analytics. */
export function emitAdminStatsUpdate(meta = {}) {
  io?.emit('admin:stats', { at: Date.now(), ...meta });
}

// Laundry realtime updates for clients to refresh availability
export function emitLaundryUpdate(payload) {
  io?.emit('laundry:update', payload);
}
