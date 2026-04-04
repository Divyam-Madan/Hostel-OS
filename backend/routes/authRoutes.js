import { Router } from 'express';
import {
  signup,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPasswordHandler,
} from '../controllers/authController.js';
import { otpLimiter, authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/signup', otpLimiter, signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPasswordHandler);

export default router;
