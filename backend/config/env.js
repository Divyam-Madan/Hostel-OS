import dotenv from 'dotenv';

dotenv.config();

/** Centralized env access with defaults for local dev (non-secret). */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel-os',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Nodemailer (optional in dev — OTP logged to console if unset)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'HostelOS <noreply@hostelos.local>',

  HEALTH_CENTER_EMAIL: process.env.HEALTH_CENTER_EMAIL || 'health@college.edu',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Hardcoded admin (per product spec)
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  /** If true, server starts when MongoDB is unreachable (503 on DB routes; GET /api/health still works). */
  ALLOW_NO_DB: process.env.ALLOW_NO_DB === 'true',
};
