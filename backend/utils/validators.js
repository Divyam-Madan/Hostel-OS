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
