import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, patchProfile } from '../controllers/userController.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, patchProfile);

export default router;
