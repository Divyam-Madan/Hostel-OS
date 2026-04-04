import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { assertEmail, assertPassword, assertUsername, assertOtp } from '../utils/validators.js';
import { issueOtp, consumeOtp } from './otpService.js';

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function buildStudentToken(userDoc) {
  return signToken({
    sub: userDoc._id.toString(),
    role: 'student',
    username: userDoc.username,
    email: userDoc.email,
  });
}

export function buildAdminToken() {
  return signToken({
    sub: 'admin',
    role: 'admin',
    username: env.ADMIN_USERNAME,
    email: 'admin@hostelos.local',
  });
}

/**
 * Signup: validate, hash password, store pending data in OTP meta, send OTP.
 */
export async function signupRequest({ username, email, password }) {
  const u = assertUsername(username);
  const em = assertEmail(email);
  assertPassword(password);

  const exists = await User.findOne({ $or: [{ email: em }, { username: u }] });
  if (exists) {
    const err = new Error('Username or email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await issueOtp(em, 'signup', { username: u, passwordHash });
  return { message: 'OTP sent to your email' };
}

export async function verifySignupOtp({ email, otp }) {
  const em = assertEmail(email);
  const code = assertOtp(otp);
  const doc = await consumeOtp(em, 'signup', code);
  const { username, passwordHash } = doc.meta || {};
  if (!username || !passwordHash) {
    const e = new Error('Invalid signup session');
    e.statusCode = 400;
    throw e;
  }

  const user = await User.create({
    username,
    email: em,
    password: passwordHash,
    roomNumber: '',
  });

  const token = buildStudentToken(user);
  return {
    token,
    user: publicUser(user),
  };
}

export async function login({ identifier, password }) {
  const id = String(identifier || '').trim();
  const pwd = password || '';
  if (!id || !pwd) {
    const e = new Error('Username/email and password required');
    e.statusCode = 400;
    throw e;
  }

  // Hardcoded admin
  if (id === env.ADMIN_USERNAME && pwd === env.ADMIN_PASSWORD) {
    return { token: buildAdminToken(), role: 'admin', user: adminPublic() };
  }

  const user =
    (await User.findOne({ username: id }).select('+password')) ||
    (await User.findOne({ email: id.toLowerCase() }).select('+password'));

  if (!user) {
    const e = new Error('Invalid credentials');
    e.statusCode = 401;
    throw e;
  }

  const ok = await bcrypt.compare(pwd, user.password);
  if (!ok) {
    const e = new Error('Invalid credentials');
    e.statusCode = 401;
    throw e;
  }

  user.password = undefined;
  return { token: buildStudentToken(user), role: 'student', user: publicUser(user) };
}

export async function forgotPasswordRequest({ email }) {
  const em = assertEmail(email);
  const user = await User.findOne({ email: em });
  if (!user) {
    // Do not reveal whether email exists
    return { message: 'If an account exists, an OTP was sent' };
  }
  await issueOtp(em, 'forgot_password', {});
  return { message: 'If an account exists, an OTP was sent' };
}

export async function resetPassword({ email, otp, newPassword }) {
  const em = assertEmail(email);
  const code = assertOtp(otp);
  const pwd = assertPassword(newPassword);
  await consumeOtp(em, 'forgot_password', code);

  const user = await User.findOne({ email: em });
  if (!user) {
    const e = new Error('User not found');
    e.statusCode = 404;
    throw e;
  }
  user.password = await bcrypt.hash(pwd, 12);
  await user.save();
  return { message: 'Password updated. You can sign in now.' };
}

function publicUser(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    roomNumber: doc.roomNumber || '',
    photo: initials(doc.username),
  };
}

function adminPublic() {
  return {
    id: 'admin',
    username: env.ADMIN_USERNAME,
    email: 'admin@hostelos.local',
    roomNumber: 'Warden Office',
    photo: 'AD',
  };
}

function initials(name) {
  return String(name || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
}
