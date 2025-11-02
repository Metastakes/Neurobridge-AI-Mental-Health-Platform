// backend/src/routes/patient.routes.ts
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
    listPatients,
    getPatient,
    getCurrentPatient,
    updatePatient,
    listMedications,
    listSessionNotes,
    assignProvider,
    getProviderPatients
} from '../controllers/patient.controller.js';
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

// Get all patients (providers/mentors only)
router.get('/',
    authenticateToken,
    authorizeRoles('provider', 'mentor'),
    [
        query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
        query('search').optional().isString().trim(),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validate,
    listPatients
);

// Get current patient's profile (patient only)
router.get('/me',
    authenticateToken,
    authorizeRoles('patient'),
    getCurrentPatient
);

// Get provider's patients (provider only)
router.get('/provider/my-patients',
    authenticateToken,
    authorizeRoles('provider'),
    getProviderPatients
);

// Get patient by ID (authenticated users)
router.get('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid patient ID')
    ],
    validate,
    getPatient
);

// Update patient profile (patient can update own, provider can update their patients)
router.put('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid patient ID'),
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
        body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
        body('emergency_contact_name').optional().trim().isLength({ min: 2 }).withMessage('Emergency contact name must be at least 2 characters'),
        body('emergency_contact_phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone format'),
        body('insurance_provider').optional().trim(),
        body('insurance_policy_number').optional().trim(),
        body('medical_history').optional().trim(),
        body('current_medications').optional().trim(),
        body('allergies').optional().trim()
    ],
    validate,
    updatePatient
);

// Get patient medications
router.get('/:id/medications',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid patient ID')
    ],
    validate,
    listMedications
);

// Get patient session notes
router.get('/:id/notes',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid patient ID'),
        query('providerId').optional().isInt({ min: 1 }).withMessage('Invalid provider ID'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validate,
    listSessionNotes
);

// Assign primary provider (provider only)
router.post('/:id/assign-provider',
    authenticateToken,
    authorizeRoles('provider'),
    [
        param('id').isInt({ min: 1 }).withMessage('Invalid patient ID'),
        body('providerId').isInt({ min: 1 }).withMessage('Provider ID is required')
    ],
    validate,
    assignProvider
);

export default router;
