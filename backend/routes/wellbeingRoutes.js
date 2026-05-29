import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { createWellbeingLog, listMyWellbeingLogs } from '../controllers/wellbeingController.js';

const router = Router();

router.post('/', authenticate, requireStudent, createWellbeingLog);
router.get('/my', authenticate, requireStudent, listMyWellbeingLogs);

export default router;