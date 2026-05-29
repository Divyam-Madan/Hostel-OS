import rateLimit from 'express-rate-limit';

/** Strict limit on OTP-generating endpoints to reduce abuse. */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Too many OTP requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Complaint creation limiter (configurable via env vars):
 * - COMPLAINT_RATE_LIMIT_WINDOW_MIN (minutes, default 60)
 * - COMPLAINT_RATE_LIMIT_MAX (max requests per window per IP, default 10)
 *
 * Responds with JSON error message compatible with existing API error shapes.
 */
const compWindowMin = process.env.COMPLAINT_RATE_LIMIT_WINDOW_MIN
  ? Number(process.env.COMPLAINT_RATE_LIMIT_WINDOW_MIN)
  : 60;
const compMax = process.env.COMPLAINT_RATE_LIMIT_MAX ? Number(process.env.COMPLAINT_RATE_LIMIT_MAX) : 10;

export const complaintLimiter = rateLimit({
  windowMs: compWindowMin * 60 * 1000,
  max: compMax,
  message: { success: false, message: 'Too many complaints submitted. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Leave submission limiter:
 * - 5 leave submissions per student per day (prevents spam)
 * - LEAVE_RATE_LIMIT_MAX env var to override
 */
const leaveMax = process.env.LEAVE_RATE_LIMIT_MAX ? Number(process.env.LEAVE_RATE_LIMIT_MAX) : 5;

export const leaveLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: leaveMax,
  message: { success: false, message: 'Too many leave applications. Maximum 5 per day.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `leave-${req.user.id}`,
});

/** Payment attempts limiter: small limit to prevent accidental duplicate submissions. */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, message: 'Too many payment attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `pay-${req.user?.id || req.ip}`,
});
