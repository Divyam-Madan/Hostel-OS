import { Router } from 'express';
import { getTimetable, createEntry, updateEntry, deleteEntry } from '../controllers/timetableController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Read timetable for authenticated users
router.get('/', authenticate, getTimetable);

// Admin mutating endpoints
router.post('/', authenticate, requireAdmin, createEntry);
router.patch('/:id', authenticate, requireAdmin, updateEntry);
router.delete('/:id', authenticate, requireAdmin, deleteEntry);

export default router;
