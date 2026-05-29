const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertEmail(email) {
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    const e = new Error('Valid email is required');
    e.statusCode = 400;
    throw e;
  }
  return email.trim().toLowerCase();
}

export function assertPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    const e = new Error('Password must be at least 8 characters');
    e.statusCode = 400;
    throw e;
  }
  return password;
}

export function assertUsername(username) {
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    const e = new Error('Username must be at least 2 characters');
    e.statusCode = 400;
    throw e;
  }
  return username.trim();
}

export function assertOtp(otp) {
  const s = String(otp || '').trim();
  if (!/^\d{6}$/.test(s)) {
    const e = new Error('OTP must be 6 digits');
    e.statusCode = 400;
    throw e;
  }
  return s;
}

/** Sanitize and validate leave reason/notes: trim, enforce length, escape HTML */
export function sanitizeReason(reason, minLen = 6, maxLen = 500) {
  if (!reason || typeof reason !== 'string') {
    const e = new Error('Reason must be a non-empty string');
    e.statusCode = 400;
    throw e;
  }
  const trimmed = reason.trim();
  if (trimmed.length < minLen || trimmed.length > maxLen) {
    const e = new Error(`Reason must be between ${minLen} and ${maxLen} characters`);
    e.statusCode = 400;
    throw e;
  }
  // Escape HTML-like characters to prevent injection
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Validate ISO date string and return Date object */
export function parseAndValidateDate(dateStr, fieldName = 'date') {
  if (!dateStr || typeof dateStr !== 'string') {
    const e = new Error(`${fieldName} must be a valid ISO date string`);
    e.statusCode = 400;
    throw e;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const e = new Error(`${fieldName} is not a valid date`);
    e.statusCode = 400;
    throw e;
  }
  // Ensure date is not in the past (allow today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    const e = new Error(`${fieldName} cannot be in the past`);
    e.statusCode = 400;
    throw e;
  }
  return date;
}

/** Validate parent consent value against allowed options */
export function validateParentConsent(consent) {
  const allowed = ['Parent informed via phone', 'Parent will call warden', 'Medical emergency — self-certified'];
  if (!consent || !allowed.includes(consent)) {
    const e = new Error('Invalid parent consent option');
    e.statusCode = 400;
    throw e;
  }
  return consent;
}

/** Validate outing return time */
export function validateReturnTime(returnTime) {
  const allowed = ['Before 8 PM', 'Before 9 PM', 'Before 10 PM', 'Before 10:30 PM'];
  if (!returnTime || !allowed.includes(returnTime)) {
    const e = new Error('Invalid return time');
    e.statusCode = 400;
    throw e;
  }
  return returnTime;
}
