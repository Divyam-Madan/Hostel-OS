import { Router } from 'express';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimit.js';
import { getAdminFees, getMyFees, payFees } from '../controllers/feeController.js';

const router = Router();

router.get('/my', authenticate, requireStudent, getMyFees);
router.post('/pay', authenticate, requireStudent, paymentLimiter, payFees);
router.get('/admin/all', authenticate, requireAdmin, getAdminFees);

export default router;