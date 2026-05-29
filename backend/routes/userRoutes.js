import { Router } from 'express';
import { authenticate, authenticateOptional, requireStudent } from '../middleware/auth.js';
import { getProfile, patchProfile, changePassword, listMyAlerts, patchMyAlert } from '../controllers/userController.js';
import { listEvents, registerEvent, unregisterEvent } from '../controllers/eventController.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, patchProfile);
router.post('/change-password', authenticate, requireStudent, changePassword);
router.get('/alerts', authenticate, requireStudent, listMyAlerts);
router.patch('/alerts/:id', authenticate, requireStudent, patchMyAlert);

// Events: public listing, student register/unregister
router.get('/events', authenticateOptional, listEvents);
router.post('/events/:id/register', authenticate, requireStudent, registerEvent);
router.delete('/events/:id/register', authenticate, requireStudent, unregisterEvent);

export default router;
