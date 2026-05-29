import { Router } from 'express';
import { authenticate, authenticateOptional, requireAdmin, requireStudent } from '../middleware/auth.js';
import { listEvents, registerEvent, unregisterEvent } from '../controllers/eventController.js';
import { createEvent, updateEvent, deleteEvent } from '../controllers/adminEventController.js';
import { createTeam, joinTeam, listTeams, removeTeamMember } from '../controllers/teamController.js';

const router = Router();

router.get('/', authenticateOptional, listEvents);
router.post('/', authenticate, requireAdmin, createEvent);
router.put('/:id', authenticate, requireAdmin, updateEvent);
router.patch('/:id', authenticate, requireAdmin, updateEvent);
router.delete('/:id', authenticate, requireAdmin, deleteEvent);
router.post('/:id/register', authenticate, requireStudent, registerEvent);
router.delete('/:id/register', authenticate, requireStudent, unregisterEvent);
router.get('/:eventId/teams', authenticate, requireStudent, listTeams);
router.post('/:eventId/teams', authenticate, requireStudent, createTeam);
router.post('/:eventId/teams/join', authenticate, requireStudent, joinTeam);
router.delete('/:eventId/teams/:teamId/members/:memberId', authenticate, requireStudent, removeTeamMember);

export default router;
