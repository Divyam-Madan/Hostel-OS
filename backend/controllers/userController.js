import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { listNotifications, markNotificationRead } from '../services/notificationService.js';

function initials(name) {
  return String(name || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
}

export async function getProfile(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        role: 'admin',
        user: {
          id: 'admin',
          username: req.user.username,
          email: req.user.email,
          roomNumber: 'Warden Office',
          photo: 'AD',
        },
      });
    }
    const u = await User.findById(req.user.id).select('-password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      role: 'student',
      user: {
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        roomNumber: u.roomNumber || '',
        photo: initials(u.username),
        settings: u.settings || {},
      },
    });
  } catch (e) {
    next(e);
  }
}

/** Optional: update room number for student */
export async function patchProfile(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin profile is fixed' });
    }
    const { roomNumber, settings } = req.body;
    if (roomNumber === undefined) {
      // allow settings-only updates
    }
    const patch = {};
    if (roomNumber !== undefined) patch.roomNumber = String(roomNumber).trim();
    if (settings && typeof settings === 'object') patch.settings = settings;
    const u = await User.findByIdAndUpdate(req.user.id, patch, { new: true }).select('-password');
    res.json({
      success: true,
      role: 'student',
      user: {
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        roomNumber: u.roomNumber || '',
        photo: initials(u.username),
        settings: u.settings || {},
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student access only' });
    }
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    const u = await User.findById(req.user.id).select('+password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, u.password);
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    u.password = await bcrypt.hash(newPassword, 12);
    u.passwordChangedAt = new Date();
    await u.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    next(e);
  }
}

export async function listMyAlerts(req, res, next) {
  try {
    const alerts = await listNotifications({ userId: req.user.id, role: req.user.role, limit: 100 });
    res.json({ success: true, alerts });
  } catch (e) {
    next(e);
  }
}

export async function patchMyAlert(req, res, next) {
  try {
    const alert = await markNotificationRead(req.params.id, req.user.id, typeof req.body?.read === 'boolean' ? req.body.read : true);
    if (!alert) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, alert });
  } catch (e) {
    next(e);
  }
}
