import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { assertEmail, assertPassword, assertOtp } from '../utils/validators.js';
import { sendMail, sendOtpEmail } from './emailService.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const EMP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function signAdminToken(adminDoc) {
  return jwt.sign(
    {
      sub: adminDoc._id.toString(),
      role: 'admin',
      username: adminDoc.employeeId,
      email: adminDoc.email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function randomSixDigit() {
  return String(crypto.randomInt(100000, 1000000));
}

async function storeOtp(admin, purpose = 'signin', routeName = 'unknown') {
  const otp = randomSixDigit();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  await Admin.updateOne({ _id: admin._id }, { $set: { otp: otpHash, otpExpiry } });
  await sendOtpEmail(admin.email, otp, `Admin ${purpose}`, routeName);
  return { otpExpiry };
}

async function verifyOtpForAdmin(admin, code) {
  if (!admin?.otp || !admin?.otpExpiry) return false;
  if (new Date() > admin.otpExpiry) return false;
  return bcrypt.compare(code, admin.otp);
}

async function generateUniqueEmployeeId() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
      suffix += EMP_CHARS[crypto.randomInt(0, EMP_CHARS.length)];
    }
    const employeeId = `EMP-${suffix}`;
    const exists = await Admin.exists({ employeeId });
    if (!exists) return employeeId;
  }
  const err = new Error('Could not allocate Employee ID');
  err.statusCode = 503;
  throw err;
}

function assertName(name) {
  const n = String(name || '').trim();
  if (n.length < 2) {
    const e = new Error('Name must be at least 2 characters');
    e.statusCode = 400;
    throw e;
  }
  return n;
}

function normalizeEmployeeId(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (!/^EMP-[A-Z0-9]{6}$/.test(s)) {
    const e = new Error('Invalid Employee ID format (expected EMP-XXXXXX)');
    e.statusCode = 400;
    throw e;
  }
  return s;
}

export async function sendEmployeeIdMail(email, employeeId, name, routeName = 'unknown') {
  const subject = 'Your Employee ID';
  const text = `Hello ${name},\n\nYour HostelOS admin Employee ID is: ${employeeId}\n\nKeep this ID secure. You will need it to sign in.\n\n— HostelOS`;
  await sendMail({ to: email, subject, text, routeName });
}

function buildRecoveryQuery({ email, employeeId }) {
  const em = email ? assertEmail(email) : null;
  const emp = employeeId ? String(employeeId).trim().toUpperCase() : null;
  if (!em && !emp) {
    const e = new Error('Email is required');
    e.statusCode = 400;
    throw e;
  }
  if (em) {
    return { query: { email: em } };
  }
  return { query: { employeeId: emp } };
}

export async function adminSignupRequest({ name, email, password }) {
  const n = assertName(name);
  const em = assertEmail(email);
  assertPassword(password);

  const taken = await Admin.findOne({ email: em });
  if (taken) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const employeeId = await generateUniqueEmployeeId();
  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.create({
    name: n,
    email: em,
    password: passwordHash,
    employeeId,
  });

  await sendEmployeeIdMail(em, employeeId, n, '/admin/signup');

  return { message: 'Registration successful. Check your email for your Employee ID.' };
}

export async function adminLoginRequest({ employeeId, password }) {
  const emp = normalizeEmployeeId(employeeId);
  const pwd = password || '';
  if (!pwd) {
    const e = new Error('Password required');
    e.statusCode = 400;
    throw e;
  }

  const admin = await Admin.findOne({ employeeId: emp }).select('+password');
  if (!admin) {
    const e = new Error('Invalid credentials');
    e.statusCode = 401;
    throw e;
  }

  const ok = await bcrypt.compare(pwd, admin.password);
  if (!ok) {
    const e = new Error('Invalid credentials');
    e.statusCode = 401;
    throw e;
  }

  await storeOtp(admin, 'sign-in', '/admin/login');

  return { message: 'OTP sent to your email' };
}

export async function adminVerifyOtpAndToken({ employeeId, otp }) {
  const emp = normalizeEmployeeId(employeeId);
  const code = assertOtp(otp);

  const admin = await Admin.findOne({ employeeId: emp }).select('+otp');
  if (!admin || !admin.otp) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }
  const ok = await verifyOtpForAdmin(admin, code);
  if (!ok) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }

  admin.otp = undefined;
  admin.otpExpiry = undefined;
  await admin.save();

  const fresh = await Admin.findById(admin._id);
  const token = signAdminToken(fresh);

  return {
    token,
    user: publicAdmin(fresh),
  };
}

export async function adminForgotPasswordRequest({ email, employeeId }) {
  const { query } = buildRecoveryQuery({ email, employeeId });
  const admin = await Admin.findOne(query).select('+otp');
  if (!admin) {
    return { message: 'If an admin account exists, an OTP was sent' };
  }
  await storeOtp(admin, 'password reset', '/admin/forgot-password');
  return { message: 'If an admin account exists, an OTP was sent' };
}

export async function adminResetPassword({ email, employeeId, otp, newPassword }) {
  const { query } = buildRecoveryQuery({ email, employeeId });
  const code = assertOtp(otp);
  const pwd = assertPassword(newPassword);
  const admin = await Admin.findOne(query).select('+password +otp +otpExpiry');
  if (!admin || !admin.otp || !admin.otpExpiry) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }
  const ok = await verifyOtpForAdmin(admin, code);
  if (!ok) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }
  admin.password = await bcrypt.hash(pwd, 12);
  admin.passwordChangedAt = new Date();
  admin.otp = undefined;
  admin.otpExpiry = undefined;
  await admin.save();
  return { message: 'Password updated. You can sign in now.' };
}

export async function recoverEmployeeIdRequest({ email }) {
  const em = assertEmail(email);
  const admin = await Admin.findOne({ email: em });
  if (admin) {
    await sendEmployeeIdMail(admin.email, admin.employeeId, admin.name, '/admin/recover-employee-id');
  }
  return { message: 'If an account exists, recovery instructions have been sent.' };
}

export async function adminChangePassword(adminDoc, currentPassword, newPassword) {
  const current = String(currentPassword || '');
  const next = assertPassword(newPassword);
  const admin = await Admin.findById(adminDoc._id).select('+password');
  if (!admin) {
    const e = new Error('Admin not found');
    e.statusCode = 404;
    throw e;
  }
  const ok = await bcrypt.compare(current, admin.password);
  if (!ok) {
    const e = new Error('Current password is incorrect');
    e.statusCode = 400;
    throw e;
  }
  admin.password = await bcrypt.hash(next, 12);
  admin.passwordChangedAt = new Date();
  await admin.save();
  return { message: 'Password updated' };
}

function publicAdmin(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.name,
    email: doc.email,
    employeeId: doc.employeeId,
  };
}
