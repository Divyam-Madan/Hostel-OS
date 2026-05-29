import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const issuedAt = payload?.iat ? payload.iat * 1000 : 0;
    if (payload.role === 'student' && payload.sub && payload.sub !== 'admin') {
      const user = await User.findById(payload.sub).select('passwordChangedAt');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (user.passwordChangedAt && issuedAt && issuedAt < new Date(user.passwordChangedAt).getTime()) {
        return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
      }
    }
    if (payload.role === 'admin' && payload.sub && payload.sub !== 'admin') {
      const admin = await Admin.findById(payload.sub).select('passwordChangedAt');
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Admin not found' });
      }
      if (admin.passwordChangedAt && issuedAt && issuedAt < new Date(admin.passwordChangedAt).getTime()) {
        return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
      }
    }
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

/** Optional auth helper for public routes that can personalize responses. */
export function authenticateOptional(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
      email: payload.email,
    };
  } catch {
    // Ignore invalid tokens on public routes.
  }
  return next();
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
