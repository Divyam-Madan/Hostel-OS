import {
  signupRequest,
  verifySignupOtp,
  login,
  forgotPasswordRequest,
  resetPassword,
} from '../services/authService.js';

export async function signup(req, res, next) {
  try {
    const result = await signupRequest(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { token, user } = await verifySignupOtp(req.body);
    res.status(201).json({ success: true, token, user, role: 'student' });
  } catch (e) {
    next(e);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { identifier, username, email, password } = req.body;
    const id = identifier || username || email;
    const result = await login({ identifier: id, password });
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await forgotPasswordRequest(req.body);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const result = await resetPassword(req.body);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}
