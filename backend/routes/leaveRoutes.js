import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { leaveLimiter } from '../middleware/rateLimit.js';
import {
  getMyLeaves,
  submitLeave,
  getAllLeaves,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController.js';

const router = Router();

// Student routes
router.get('/', authenticate, getMyLeaves);
router.post('/', authenticate, leaveLimiter, submitLeave);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllLeaves);
router.get('/all', authenticate, requireAdmin, getAllLeaves);
router.post('/:id/approve', authenticate, requireAdmin, approveLeave);
router.post('/:id/reject', authenticate, requireAdmin, rejectLeave);
router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  const status = String(req.body?.status || '').toLowerCase();
  if (status === 'approved') return approveLeave(req, res, next);
  if (status === 'rejected') return rejectLeave(req, res, next);
  return res.status(400).json({ message: 'Invalid status' });
});

export default router;
