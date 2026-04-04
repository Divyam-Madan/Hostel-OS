import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { reportHealthIssue } from '../controllers/healthController.js';

const router = Router();

router.post('/report', authenticate, requireStudent, reportHealthIssue);

export default router;
