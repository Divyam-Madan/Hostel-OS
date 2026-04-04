import crypto from 'crypto';
import { OTP } from '../models/OTP.js';
import { sendOtpEmail } from './emailService.js';

const OTP_TTL_MS = 10 * 60 * 1000;

function randomSixDigit() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Creates or replaces OTP for email+purpose; emails the code.
 */
export async function issueOtp(email, purpose, meta = {}) {
  await OTP.deleteMany({ email, purpose });
  const otp = randomSixDigit();
  const expiry = new Date(Date.now() + OTP_TTL_MS);
  await OTP.create({ email, otp, expiry, purpose, meta });
  await sendOtpEmail(
    email,
    otp,
    purpose === 'signup' ? 'Sign up' : 'Password reset'
  );
  return { expiresAt: expiry };
}

/**
 * Validates OTP; returns doc or throws.
 */
export async function consumeOtp(email, purpose, otpPlain) {
  const doc = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!doc || doc.otp !== otpPlain) {
    const e = new Error('Invalid or expired OTP');
    e.statusCode = 400;
    throw e;
  }
  if (new Date() > doc.expiry) {
    await OTP.deleteOne({ _id: doc._id });
    const e = new Error('OTP has expired');
    e.statusCode = 400;
    throw e;
  }
  await OTP.deleteOne({ _id: doc._id });
  return doc;
}
