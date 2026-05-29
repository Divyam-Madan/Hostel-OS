import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

let transporter = null;
let smtpVerified = false;
let smtpInitStarted = false;
let resolvedSmtpTarget = null;

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

function logTransportConfig(target) {
  log.info('SMTP TRANSPORTER CONFIG:', {
    host: target.host,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    family: target.resolvedFamily || null,
  });
}

async function resolveSmtpTarget() {
  if (resolvedSmtpTarget) {
    return resolvedSmtpTarget;
  }

  if (!env.SMTP_HOST) {
    return null;
  }

  try {
    const records = await dns.lookup(env.SMTP_HOST, { all: true });
    const ipv4Records = records.filter((record) => record.family === 4);
    const ipv6Records = records.filter((record) => record.family === 6);
    const selected = ipv4Records[0] || records[0] || null;

    log.info('SMTP DNS RESOLUTION:', {
      host: env.SMTP_HOST,
      ipv4: ipv4Records.map((record) => record.address),
      ipv6: ipv6Records.map((record) => record.address),
      selectedAddress: selected?.address || null,
      selectedFamily: selected?.family || null,
    });

    if (!selected) {
      return null;
    }

    resolvedSmtpTarget = {
      host: selected.family === 4 ? selected.address : env.SMTP_HOST,
      servername: env.SMTP_HOST,
      family: selected.family === 4 ? 4 : undefined,
      resolvedAddress: selected.address,
      resolvedFamily: selected.family,
    };
    return resolvedSmtpTarget;
  } catch (err) {
    log.error('SMTP DNS resolution failure', err);
    throw createSmtpError('Unable to resolve SMTP host', 'SMTP_DNS_RESOLUTION_FAILED', 503, { cause: err });
  }
}

async function getTransporter() {
  if (transporter) return transporter;
  const status = getSmtpStatus();
  if (!status.configured) {
    return null;
  }
  const target = await resolveSmtpTarget();
  if (!target) {
    return null;
  }
  logTransportConfig(target);
  transporter = nodemailer.createTransport({
    host: target.host,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { servername: target.servername },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    ...(target.family ? { family: target.family } : {}),
  });
  return transporter;
}

async function verifyTransporter() {
  const t = await getTransporter();
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

export function getEmailHealthDetails() {
  const status = getSmtpStatus();
  return {
    smtpConfigured: status.configured,
    smtpVerified,
    host: env.SMTP_HOST || null,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  };
}

/**
 * Sends mail; fails closed when SMTP is not configured or delivery fails.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = await getTransporter();
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
