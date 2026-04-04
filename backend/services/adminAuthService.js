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

export async function sendEmployeeIdMail(email, employeeId, name) {
  const subject = 'Your Employee ID';
  const text = `Hello ${name},\n\nYour HostelOS admin Employee ID is: ${employeeId}\n\nKeep this ID secure. You will need it to sign in.\n\n— HostelOS`;
  await sendMail({ to: email, subject, text });
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

  await sendEmployeeIdMail(em, employeeId, n);

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

  const otp = randomSixDigit();
  const otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  await Admin.updateOne(
    { _id: admin._id },
    { $set: { otp, otpExpiry } }
  );

  await sendOtpEmail(admin.email, otp, 'Admin sign-in');

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
  if (admin.otp !== code) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }
  if (!admin.otpExpiry || new Date() > admin.otpExpiry) {
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    await admin.save();
    const e = new Error('OTP has expired');
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

function publicAdmin(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.name,
    email: doc.email,
    employeeId: doc.employeeId,
  };
}
