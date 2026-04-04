import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { placeOrder } from '../controllers/messController.js';

const router = Router();

router.post('/order', authenticate, requireStudent, placeOrder);

export default router;
