import { Router } from 'express';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';
import {
  createComplaint,
  listMyComplaints,
  listAllComplaints,
  patchComplaint,
} from '../controllers/complaintController.js';

const router = Router();

router.post('/', authenticate, requireStudent, createComplaint);
router.get('/user', authenticate, requireStudent, listMyComplaints);
router.get('/all', authenticate, requireAdmin, listAllComplaints);
router.patch('/:id', authenticate, requireAdmin, patchComplaint);

export default router;
