import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
      email: payload.email,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Student routes only (Mongo user id). */
export function requireStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access only' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  next();
}

/** Load full user doc for student (password excluded). */
export async function attachStudentUser(req, res, next) {
  if (req.user?.role !== 'student') return next();
  try {
    const u = await User.findById(req.user.id).select('-password');
    if (!u) return res.status(401).json({ success: false, message: 'User not found' });
    req.student = u;
    next();
  } catch (e) {
    next(e);
  }
}
