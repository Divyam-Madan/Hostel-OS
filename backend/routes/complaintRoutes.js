import { Router } from 'express';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';
import {
  createComplaint,
  listMyComplaints,
  listAllComplaints,
  patchComplaint,
} from '../controllers/complaintController.js';
import { complaintLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Apply complaintLimiter to creation endpoint only (per-IP/user configurable)
router.post('/', complaintLimiter, authenticate, requireStudent, createComplaint);
router.get('/', authenticate, requireAdmin, listAllComplaints);
router.get('/user', authenticate, requireStudent, listMyComplaints);
router.get('/all', authenticate, requireAdmin, listAllComplaints);
router.patch('/:id', authenticate, requireAdmin, patchComplaint);

export default router;
