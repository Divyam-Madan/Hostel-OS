import { Resend } from 'resend';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function hasEnvValue(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) && String(process.env[name] || '').trim() !== '';
}

function parseSenderAddress(rawFrom) {
  const value = String(rawFrom || '').trim();
  const match = value.match(/<([^>]+)>/);
  return String(match?.[1] || value).trim().toLowerCase();
}

function isLikelyUnverifiedSender(rawFrom) {
  const senderAddress = parseSenderAddress(rawFrom);
  const atIndex = senderAddress.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === senderAddress.length - 1) {
    return true;
  }

  const domain = senderAddress.slice(atIndex + 1);
  const commonConsumerDomains = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'icloud.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
  ]);

  return commonConsumerDomains.has(domain);
}

function createEmailError(message, code = 'EMAIL_ERROR', statusCode = 503, extra = {}) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  Object.assign(err, extra);
  return err;
}

function getEmailProviderStatus() {
  const emailFromConfigured = hasEnvValue('EMAIL_FROM');
  return {
    provider: 'resend',
    configured: Boolean(resend && emailFromConfigured),
    emailFromConfigured,
  };
}

function classifyEmailFailure(err) {
  const code = String(err?.code || '').toUpperCase();
  const response = String(err?.message || '').toLowerCase();

  if (code === 'EAUTH' || response.includes('authentication') || response.includes('auth')) {
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
  if (response.includes('rejected') || response.includes('relay')) {
    return 'provider rejection';
  }
  return 'provider failure';
}

export async function initializeEmailDiagnostics() {
  const status = getEmailProviderStatus();
  log.info('EMAIL PROVIDER STATUS:', status);
  if (status.emailFromConfigured && isLikelyUnverifiedSender(env.EMAIL_FROM)) {
    log.warn('EMAIL FROM STATUS: configured sender looks unverified for Resend', {
      from: parseSenderAddress(env.EMAIL_FROM),
      provider: 'resend',
    });
  }
  return status;
}

export function getEmailHealthStatus() {
  const status = getEmailProviderStatus();
  return {
    provider: status.provider,
    configured: status.configured,
    emailFromConfigured: status.emailFromConfigured,
  };
}

export function getEmailHealthDetails() {
  return getEmailHealthStatus();
}

/**
 * Sends mail via Resend; fails closed when configuration is incomplete or delivery fails.
 */
export async function sendMail({ to, subject, text, html }) {
  if (!resend) {
    const status = getEmailProviderStatus();
    log.warn('EMAIL PROVIDER STATUS:', status);
    throw createEmailError('Resend is not configured', 'EMAIL_NOT_CONFIGURED', 503);
  }
  try {
    log.info('EMAIL SEND ATTEMPT:', {
      from: env.EMAIL_FROM,
      to,
      subject,
    });

    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    });

    log.info('Resend sendMail response:', {
      data: result?.data || null,
      error: result?.error || null,
    });

    if (result?.error) {
      throw createEmailError(`Email delivery failed (${classifyEmailFailure(result.error)})`, 'EMAIL_SEND_FAILED', 503, {
        cause: result.error,
      });
    }

    if (!result?.data?.id) {
      throw createEmailError('Email delivery failed (missing Resend response id)', 'EMAIL_SEND_FAILED', 503, {
        cause: new Error('Missing Resend response id'),
      });
    }

    log.info('Resend email delivered:', {
      id: result.data.id,
      provider: 'resend',
    });

    return { sent: true };
  } catch (err) {
    const failure = classifyEmailFailure(err);
    log.error(`Resend sendMail failure (${failure})`, err);
    throw createEmailError(`Email delivery failed (${failure})`, 'EMAIL_SEND_FAILED', 503, { cause: err });
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
