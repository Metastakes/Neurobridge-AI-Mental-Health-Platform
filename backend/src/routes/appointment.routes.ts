// backend/src/routes/appointment.routes.ts
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
    listAppointments,
    getAppointment,
    bookAppointment,
    modifyAppointment,
    cancelAppointmentRequest,
    removeAppointment,
    getUpcomingAppointments,
    getAppointmentHistory,
    changeAppointmentStatus
} from '../controllers/appointment.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Validation middleware wrapper
const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation Error',
            details: errors.array()
        });
    }
    next();
};

// Get all appointments with filters (authenticated users)
router.get('/',
    authenticateToken,
    [
        query('patientId').optional().isInt({ min: 1 }).withMessage('Invalid patient ID'),
        query('providerId').optional().isInt({ min: 1 }).withMessage('Invalid provider ID'),
        query('status').optional().isIn([
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        ]).withMessage('Invalid status'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date'),
        query('appointmentType').optional().isIn([
            'initial_consultation',
            'follow_up',
            'therapy_session',
            'medication_review',
            'crisis_intervention'
        ]).withMessage('Invalid appointment type'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validate,
    listAppointments
);

// Get upcoming appointments for current user
router.get('/upcoming',
    authenticateToken,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validate,
    getUpcomingAppointments
);

// Get appointment history (patient only)
router.get('/history',
    authenticateToken,
    authorizeRoles('patient'),
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validate,
    getAppointmentHistory
);

// Get appointment by ID
router.get('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid appointment ID')
    ],
    validate,
    getAppointment
);

// Create new appointment
router.post('/',
    authenticateToken,
    [
        body('providerId').isInt({ min: 1 }).withMessage('Provider ID is required'),
        body('appointmentType').isIn([
            'initial_consultation',
            'follow_up',
            'therapy_session',
            'medication_review',
            'crisis_intervention'
        ]).withMessage('Invalid appointment type'),
        body('scheduledStart').isISO8601().withMessage('Valid start date is required'),
        body('scheduledEnd').isISO8601().withMessage('Valid end date is required'),
        body('googleCalendarEventId').optional().isString().trim(),
        body('notes').optional().isString().trim(),
        body('patientId').optional().isInt({ min: 1 }).withMessage('Invalid patient ID')
    ],
    validate,
    bookAppointment
);

// Update appointment
router.put('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid appointment ID'),
        body('appointmentType').optional().isIn([
            'initial_consultation',
            'follow_up',
            'therapy_session',
            'medication_review',
            'crisis_intervention'
        ]).withMessage('Invalid appointment type'),
        body('scheduledStart').optional().isISO8601().withMessage('Invalid start date'),
        body('scheduledEnd').optional().isISO8601().withMessage('Invalid end date'),
        body('status').optional().isIn([
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        ]).withMessage('Invalid status'),
        body('googleCalendarEventId').optional().isString().trim(),
        body('notes').optional().isString().trim()
    ],
    validate,
    modifyAppointment
);

// Update appointment status (provider only)
router.patch('/:id/status',
    authenticateToken,
    authorizeRoles('provider'),
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid appointment ID'),
        body('status').isIn([
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        ]).withMessage('Valid status is required')
    ],
    validate,
    changeAppointmentStatus
);

// Cancel appointment
router.post('/:id/cancel',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid appointment ID'),
        body('cancellationReason').trim().isLength({ min: 5 }).withMessage('Cancellation reason is required (minimum 5 characters)')
    ],
    validate,
    cancelAppointmentRequest
);

// Delete appointment (hard delete - admin only)
router.delete('/:id',
    authenticateToken,
    authorizeRoles('mentor'),
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid appointment ID')
    ],
    validate,
    removeAppointment
);

export default router;
