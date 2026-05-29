import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await listNotifications({ userId: req.user.id, role: req.user.role, limit: 100 });
    res.json({ success: true, notifications });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.id, true);
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, notification });
  } catch (e) {
    next(e);
  }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await markAllNotificationsRead(req.user.id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
});

export default router;
