import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

let transporter = null;
let smtpVerified = false;
let smtpInitStarted = false;

function hasEnvValue(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) && String(process.env[name] || '').trim() !== '';
}

function getSmtpStatus() {
  const hostPresent = hasEnvValue('SMTP_HOST');
  const portPresent = hasEnvValue('SMTP_PORT');
  const securePresent = hasEnvValue('SMTP_SECURE');
  const userPresent = hasEnvValue('SMTP_USER');
  const passPresent = hasEnvValue('SMTP_PASS');
  const emailFromPresent = hasEnvValue('EMAIL_FROM');

  return {
    configured: hostPresent && portPresent && securePresent && userPresent && passPresent && emailFromPresent,
    hostPresent,
    portPresent,
    securePresent,
    userPresent,
    passPresent,
    emailFromPresent,
  };
}

function createSmtpError(message, code = 'SMTP_ERROR', statusCode = 503, extra = {}) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  Object.assign(err, extra);
  return err;
}

function classifySmtpFailure(err) {
  const code = String(err?.code || '').toUpperCase();
  const responseCode = Number(err?.responseCode || 0);
  const response = String(err?.response || err?.message || '').toLowerCase();

  if (code === 'EAUTH' || responseCode === 535 || response.includes('authentication') || response.includes('auth')) {
    return 'authentication failure';
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || response.includes('getaddrinfo') || response.includes('dns')) {
    return 'DNS failure';
  }
  if (code === 'ETIMEDOUT' || (code === 'ESOCKET' && response.includes('timeout')) || response.includes('timeout')) {
    return 'timeout';
  }
  if (code === 'EPROTO' || response.includes('tls') || response.includes('ssl') || response.includes('certificate')) {
    return 'TLS failure';
  }
  if ([550, 552, 553, 554].includes(responseCode) || response.includes('rejected') || response.includes('relay')) {
    return 'Gmail rejection';
  }
  return 'SMTP failure';
}

function logSmtpStatus() {
  log.info('SMTP STATUS:', getSmtpStatus());
}

function getTransporter() {
  if (transporter) return transporter;
  const status = getSmtpStatus();
  if (!status.configured) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
  return transporter;
}

async function verifyTransporter() {
  const t = getTransporter();
  if (!t) {
    smtpVerified = false;
    logSmtpStatus();
    return { ...getSmtpStatus(), smtpVerified };
  }

  try {
    await t.verify();
    smtpVerified = true;
    log.info('SMTP verify success');
  } catch (err) {
    smtpVerified = false;
    log.error(`SMTP verify failure (${classifySmtpFailure(err)})`, err);
  }

  logSmtpStatus();
  return { ...getSmtpStatus(), smtpVerified };
}

export async function initializeEmailDiagnostics() {
  if (smtpInitStarted) {
    return { ...getSmtpStatus(), smtpVerified };
  }
  smtpInitStarted = true;
  return verifyTransporter();
}

export function getEmailHealthStatus() {
  const status = getSmtpStatus();
  return {
    smtpConfigured: status.configured,
    emailFromConfigured: status.emailFromPresent,
    smtpVerified,
  };
}

/**
 * Sends mail; fails closed when SMTP is not configured or delivery fails.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    const status = getSmtpStatus();
    log.warn('SMTP send blocked: incomplete configuration', status);
    throw createSmtpError('SMTP is not fully configured', 'SMTP_NOT_CONFIGURED', 503);
  }
  try {
    await t.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    });
    smtpVerified = true;
    log.info('SMTP sendMail success');
    return { sent: true };
  } catch (err) {
    const failure = classifySmtpFailure(err);
    log.error(`SMTP sendMail failure (${failure})`, err);
    throw createSmtpError(`Email delivery failed (${failure})`, 'SMTP_SEND_FAILED', 503, { cause: err });
  }
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
