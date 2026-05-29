import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getSlots,
  getMyBookings,
  bookSlot,
  cancelBooking,
  getAllBookings,
  getSlotManagement,
  createSlots,
  blockSlot,
} from '../controllers/laundryController.js';

const router = Router();

// Student routes
router.get('/slots', authenticate, getSlots);
router.get('/my-bookings', authenticate, getMyBookings);
router.post('/book', authenticate, bookSlot);
router.delete('/bookings/:id', authenticate, cancelBooking);

// Admin routes
router.get('/admin/bookings', authenticate, requireAdmin, getAllBookings);
router.get('/admin/slots', authenticate, requireAdmin, getSlotManagement);
router.post('/admin/slots', authenticate, requireAdmin, createSlots);
router.post('/admin/slots/:id/block', authenticate, requireAdmin, blockSlot);

export default router;
