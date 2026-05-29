import { Notification } from '../models/Notification.js';
import { emitAlertNew, emitNotificationNew } from './socketService.js';

export async function createNotification({ userId = null, type, title, message, meta = {}, read = false, resolved = false }) {
  if (!type || !title || !message) return null;
  const notification = await Notification.create({ userId, type, title, message, meta, read, resolved });
  const payload = {
    id: notification._id.toString(),
    userId: notification.userId ? notification.userId.toString() : null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: !!notification.read,
    resolved: !!notification.resolved,
    createdAt: notification.createdAt,
    meta: notification.meta || {},
  };
  emitNotificationNew(payload);
  emitAlertNew(payload);
  return notification;
}

export async function upsertNotification({ userId = null, type, key, title, message, meta = {}, read = false, resolved = false }) {
  if (!type || !key) return null;
  const notification = await Notification.findOneAndUpdate(
    { userId, 'meta.key': key, type },
    { $set: { title, message, meta: { ...meta, key }, read, resolved } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (notification) {
    const payload = {
      id: notification._id.toString(),
      userId: notification.userId ? notification.userId.toString() : null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: !!notification.read,
      resolved: !!notification.resolved,
      createdAt: notification.createdAt,
      meta: notification.meta || {},
    };
    emitNotificationNew(payload);
    emitAlertNew(payload);
  }
  return notification;
}

export async function listNotifications({ userId, role, limit = 100 }) {
  const notifications = await Notification.find({
    $or: [
      { userId },
      { userId: null },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: !!notification.read,
    resolved: !!notification.resolved,
    createdAt: notification.createdAt,
    meta: notification.meta || {},
    role,
  }));
}

export async function markNotificationRead(id, userId, read = true) {
  const query = { _id: id, $or: [{ userId }, { userId: null }] };
  return Notification.findOneAndUpdate(query, { $set: { read } }, { new: true });
}

export async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany({ $or: [{ userId }, { userId: null }], read: false }, { $set: { read: true } });
  return { modifiedCount: result.modifiedCount ?? result.nModified ?? 0 };
}
