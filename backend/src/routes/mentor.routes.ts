// backend/src/routes/mentor.routes.ts
import express from 'express';
import { mentorController } from '../controllers/mentor.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and mentor role
router.use(authenticateToken);
router.use(requireRole('mentor'));

// GET /mentors/me - Get current mentor profile
router.get('/me', mentorController.getCurrentMentor);

// GET /mentors/mentees - Get list of mentees
router.get('/mentees', mentorController.getMentees);

// GET /mentors/statistics - Get mentor statistics
router.get('/statistics', mentorController.getMentorStatistics);

// GET /mentors/mentees/:menteeId - Get detailed information about a specific mentee
router.get('/mentees/:menteeId', mentorController.getMenteeDetails);

export default router;
