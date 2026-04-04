import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { createReview, listReviews } from '../controllers/foodController.js';

const router = Router();

router.post('/', authenticate, requireStudent, createReview);
router.get('/', listReviews);

export default router;
