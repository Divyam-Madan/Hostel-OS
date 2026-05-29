import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { getEmailHealth, reportHealthIssue } from '../controllers/healthController.js';

const router = Router();

router.get('/email', getEmailHealth);
router.post('/report', authenticate, requireStudent, reportHealthIssue);

export default router;
