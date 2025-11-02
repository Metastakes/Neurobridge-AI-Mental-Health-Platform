// backend/src/routes/provider.routes.ts
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
    listProviders,
    getProvider,
    getProviderWithStatistics,
    getCurrentProvider,
    updateProvider,
    getProvidersBySpecialtyEndpoint,
    listAvailableProviders,
    getAvailabilitySchedule,
    setAvailabilitySchedule,
    deleteAvailability,
    getStatistics
} from '../controllers/provider.controller.js';
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

// Get all providers (public or authenticated)
router.get('/',
    [
        query('specialty').optional().isString().trim(),
        query('acceptsNewPatients').optional().isBoolean().withMessage('acceptsNewPatients must be boolean'),
        query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
        query('search').optional().isString().trim(),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validate,
    listProviders
);

// Get available providers (accepting new patients)
router.get('/available',
    listAvailableProviders
);

// Get current provider's profile (provider only)
router.get('/me',
    authenticateToken,
    authorizeRoles('provider'),
    getCurrentProvider
);

// Get providers by specialty
router.get('/specialty/:specialty',
    [
        param('specialty').trim().isLength({ min: 2 }).withMessage('Specialty must be at least 2 characters')
    ],
    validate,
    getProvidersBySpecialtyEndpoint
);

// Get provider by ID
router.get('/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID')
    ],
    validate,
    getProvider
);

// Get provider with statistics
router.get('/:id/stats',
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID')
    ],
    validate,
    getProviderWithStatistics
);

// Get provider statistics (detailed)
router.get('/:id/statistics',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID')
    ],
    validate,
    getStatistics
);

// Get provider availability schedule
router.get('/:id/availability',
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID')
    ],
    validate,
    getAvailabilitySchedule
);

// Update provider profile
router.put('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID'),
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
        body('specialty').optional().trim().isLength({ min: 2 }).withMessage('Specialty must be at least 2 characters'),
        body('license_number').optional().trim(),
        body('years_of_experience').optional().isInt({ min: 0 }).withMessage('Years of experience must be non-negative'),
        body('bio').optional().trim(),
        body('education').optional().trim(),
        body('certifications').optional().trim(),
        body('languages_spoken').optional().trim(),
        body('accepts_new_patients').optional().isBoolean().withMessage('accepts_new_patients must be boolean'),
        body('hourly_rate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be non-negative')
    ],
    validate,
    updateProvider
);

// Set provider availability (provider only)
router.post('/:id/availability',
    authenticateToken,
    authorizeRoles('provider'),
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID'),
        body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
        body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
        body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
        body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean')
    ],
    validate,
    setAvailabilitySchedule
);

// Delete provider availability (provider only)
router.delete('/:id/availability/:availabilityId',
    authenticateToken,
    authorizeRoles('provider'),
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid provider ID'),
        param('availabilityId').isInt({ min: 1 }).withMessage('Invalid availability ID')
    ],
    validate,
    deleteAvailability
);

export default router;
