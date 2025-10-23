// backend/src/routes/appointment.routes.ts
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all appointments for current user
router.get('/', async (req: Request, res: Response) => {
    // TODO: Get user from auth token
    // TODO: Fetch appointments from database
    res.json({
        message: 'Get appointments endpoint - not yet implemented',
        appointments: []
    });
});

// Create new appointment
router.post('/',
    [
        body('patientId').isInt(),
        body('providerId').isInt(),
        body('startTime').isISO8601(),
        body('endTime').isISO8601()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // TODO: Check for conflicts
        // TODO: Create Google Calendar event
        // TODO: Save to database
        res.json({
            message: 'Create appointment - not yet implemented'
        });
    }
);

// Update appointment
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    // TODO: Validate permissions
    // TODO: Update Google Calendar
    // TODO: Update database
    res.json({
        message: `Update appointment ${id} - not yet implemented`
    });
});

// Cancel appointment
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    // TODO: Validate permissions
    // TODO: Delete from Google Calendar
    // TODO: Update database
    res.json({
        message: `Cancel appointment ${id} - not yet implemented`
    });
});

export default router;
