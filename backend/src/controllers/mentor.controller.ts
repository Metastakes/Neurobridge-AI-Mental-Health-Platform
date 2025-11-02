// backend/src/controllers/mentor.controller.ts
import { Request, Response } from 'express';
import { mentorModel } from '../models/mentor.model';

export const mentorController = {
  // Get current mentor profile
  async getCurrentMentor(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const mentor = await mentorModel.getCurrentMentor(userId);

      if (!mentor) {
        return res.status(404).json({ error: 'Mentor profile not found' });
      }

      res.json({ mentor });
    } catch (error) {
      console.error('Error fetching mentor:', error);
      res.status(500).json({ error: 'Failed to fetch mentor data' });
    }
  },

  // Get list of mentees (providers mentored by this mentor)
  async getMentees(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const mentees = await mentorModel.getMentees(userId);

      res.json({
        mentees,
        count: mentees.length,
      });
    } catch (error) {
      console.error('Error fetching mentees:', error);
      res.status(500).json({ error: 'Failed to fetch mentees' });
    }
  },

  // Get mentor statistics
  async getMentorStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const stats = await mentorModel.getMentorStatistics(userId);

      res.json({
        statistics: {
          total_mentees: parseInt(stats.total_mentees) || 0,
          total_patients_supervised: parseInt(stats.total_patients_supervised) || 0,
          total_appointments_supervised: parseInt(stats.total_appointments_supervised) || 0,
          completed_appointments: parseInt(stats.completed_appointments) || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching mentor statistics:', error);
      res.status(500).json({ error: 'Failed to fetch mentor statistics' });
    }
  },

  // Get detailed information about a specific mentee
  async getMenteeDetails(req: Request, res: Response) {
    try {
      const mentorId = (req as any).user.userId;
      const menteeId = parseInt(req.params.menteeId);

      if (isNaN(menteeId)) {
        return res.status(400).json({ error: 'Invalid mentee ID' });
      }

      const details = await mentorModel.getMenteeDetails(mentorId, menteeId);

      if (!details) {
        return res.status(404).json({
          error: 'Mentee not found or not associated with this mentor',
        });
      }

      res.json(details);
    } catch (error) {
      console.error('Error fetching mentee details:', error);
      res.status(500).json({ error: 'Failed to fetch mentee details' });
    }
  },
};
