import { Router } from 'express';
import { getTodayMenu } from '../controllers/messController.js';

const router = Router();

router.get('/today', getTodayMenu);

export default router;
