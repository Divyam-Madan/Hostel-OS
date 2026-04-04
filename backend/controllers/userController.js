import { User } from '../models/User.js';

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
    const { roomNumber } = req.body;
    if (roomNumber === undefined) {
      return res.status(400).json({ success: false, message: 'roomNumber required' });
    }
    const u = await User.findByIdAndUpdate(
      req.user.id,
      { roomNumber: String(roomNumber).trim() },
      { new: true }
    ).select('-password');
    res.json({
      success: true,
      role: 'student',
      user: {
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        roomNumber: u.roomNumber || '',
        photo: initials(u.username),
      },
    });
  } catch (e) {
    next(e);
  }
}
