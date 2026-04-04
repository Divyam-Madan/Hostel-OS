import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { otpLimiter, authLimiter } from '../middleware/rateLimit.js';
import {
  adminSignup,
  adminLogin,
  verifyAdminOtp,
  adminProfile,
  complaintSummary,
  foodSummary,
  listAlerts,
  patchAlert,
  triggerAlert,
} from '../controllers/adminController.js';
import {
  getDashboard,
  getStats,
  getComplaints,
  removeComplaint,
  getEvents,
  getFeedbackAnalysis,
  getWellbeing,
  getStudents,
  getOneStudent,
} from '../controllers/adminAnalyticsController.js';

const router = Router();

router.post('/signup', authLimiter, adminSignup);
router.post('/login', authLimiter, adminLogin);
router.post('/verify-otp', otpLimiter, verifyAdminOtp);
router.get('/profile', authenticate, requireAdmin, adminProfile);

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/stats', getStats);
router.get('/complaints', getComplaints);
router.delete('/complaints/:id', removeComplaint);
router.get('/events', getEvents);
router.get('/feedback-analysis', getFeedbackAnalysis);
router.get('/wellbeing', getWellbeing);
router.get('/students', getStudents);
router.get('/students/:id', getOneStudent);

router.post('/complaint-summary', complaintSummary);
router.post('/food-summary', foodSummary);
router.get('/alerts', listAlerts);
router.patch('/alerts/:id', patchAlert);
router.post('/trigger-alert', triggerAlert);

export default router;
