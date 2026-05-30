import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';
const EMAIL_PROVIDER = 'emailjs';

function hasEnvValue(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) && String(process.env[name] || '').trim() !== '';
}

function createEmailError(message, code = 'EMAIL_ERROR', statusCode = 503, extra = {}) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  Object.assign(err, extra);
  return err;
}

function getEmailProviderStatus() {
  return {
    provider: EMAIL_PROVIDER,
    configured:
      String(env.EMAIL_PROVIDER || '').trim().toLowerCase() === EMAIL_PROVIDER &&
      hasEnvValue('EMAILJS_SERVICE_ID') &&
      hasEnvValue('EMAILJS_TEMPLATE_ID') &&
      hasEnvValue('EMAILJS_PUBLIC_KEY') &&
      hasEnvValue('EMAILJS_PRIVATE_KEY'),
  };
}

function classifyEmailFailure(err) {
  const code = String(err?.code || '').toUpperCase();
  const response = String(err?.message || '').toLowerCase();

  if (response.includes('required') || response.includes('missing') || response.includes('invalid')) {
    return 'configuration failure';
  }

  if (code === 'ETIMEDOUT' || response.includes('timeout')) {
    return 'timeout';
  }

  if (response.includes('failed to fetch') || response.includes('network') || response.includes('fetch')) {
    return 'network failure';
  }

  return 'provider failure';
}

export async function initializeEmailDiagnostics() {
  const status = getEmailProviderStatus();
  log.info('EMAIL PROVIDER STATUS:', status);
  return status;
}

export function getEmailHealthStatus() {
  return getEmailProviderStatus();
}

export function getEmailHealthDetails() {
  return getEmailHealthStatus();
}

/**
 * Sends mail via EmailJS; fails closed when configuration is incomplete or delivery fails.
 */
export async function sendMail({ to, subject, text, html, routeName = 'unknown', title, code, footer }) {
  const status = getEmailProviderStatus();
  if (!status.configured) {
    log.warn('EMAIL PROVIDER STATUS:', status);
    throw createEmailError('EmailJS is not configured', 'EMAIL_NOT_CONFIGURED', 503);
  }

  if (!to || !subject) {
    throw createEmailError('Email delivery failed (missing recipient or subject)', 'EMAIL_SEND_FAILED', 503);
  }

  try {
    log.info('EMAIL ROUTE START:', {
      route: routeName,
      to,
      subject,
    });
    log.info('EMAIL SEND ATTEMPT:', {
      route: routeName,
      to,
      subject,
    });

    const templateParams = {
      email: to,
      subject,
      title: title || subject,
      message: String(text || html || ''),
      code: String(code || ''),
      footer: footer || 'HostelOS',
    };

    const response = await fetch(EMAILJS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: templateParams,
      }),
    });

    const responseText = String((await response.text()) || '').trim();
    if (!response.ok || responseText !== 'OK') {
      throw createEmailError(
        `Email delivery failed (${response.status}${responseText ? `: ${responseText}` : ''})`,
        'EMAIL_SEND_FAILED',
        503,
        { cause: new Error(responseText || `HTTP ${response.status}`), status: response.status, responseText },
      );
    }

    log.info('EMAIL SEND SUCCESS:', {
      route: routeName,
      provider: EMAIL_PROVIDER,
      to,
      subject,
    });

    return { sent: true };
  } catch (err) {
    const failure = classifyEmailFailure(err);
    log.error(`EMAIL SEND FAILURE (${failure}) [${routeName}]`, err);
    throw createEmailError(`Email delivery failed (${failure})`, 'EMAIL_SEND_FAILED', 503, { cause: err });
  }
}

export async function sendOtpEmail(email, otp, purposeLabel, routeName = 'unknown') {
  const subject = `HostelOS — Your verification code (${purposeLabel})`;
  const text = `Your HostelOS verification code is: ${otp}\n\nIt expires in 10 minutes.\nIf you did not request this, ignore this email.`;
  return sendMail({
    to: email,
    subject,
    text,
    routeName,
    title: purposeLabel,
    code: otp,
    footer: 'HostelOS',
  });
}

export async function sendHealthReportEmail({ to, username, roomNumber, description, routeName = 'unknown' }) {
  const subject = `[HostelOS] Healthcare issue report — ${username} (${roomNumber || 'N/A'})`;
  const text = `Healthcare issue reported\n\nStudent: ${username}\nRoom: ${roomNumber || 'Not set'}\n\nDescription:\n${description}\n`;
  return sendMail({
    to,
    subject,
    text,
    routeName,
    title: 'Healthcare issue report',
    footer: 'HostelOS Health Center',
  });
}
