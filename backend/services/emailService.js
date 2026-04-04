import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends mail; logs OTP to console when SMTP is not configured (local dev).
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    log.info(`[email skipped — no SMTP] To: ${to}\nSubject: ${subject}\n${text}`);
    return { skipped: true };
  }
  await t.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br/>'),
  });
  return { sent: true };
}

export async function sendOtpEmail(email, otp, purposeLabel) {
  const subject = `HostelOS — Your verification code (${purposeLabel})`;
  const text = `Your HostelOS verification code is: ${otp}\n\nIt expires in 10 minutes.\nIf you did not request this, ignore this email.`;
  return sendMail({ to: email, subject, text });
}

export async function sendHealthReportEmail({ to, username, roomNumber, description }) {
  const subject = `[HostelOS] Healthcare issue report — ${username} (${roomNumber || 'N/A'})`;
  const text = `Healthcare issue reported\n\nStudent: ${username}\nRoom: ${roomNumber || 'Not set'}\n\nDescription:\n${description}\n`;
  return sendMail({ to, subject, text });
}
