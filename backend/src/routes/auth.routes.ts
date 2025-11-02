// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import {
    register,
    login,
    logout,
    refreshAccessToken,
    getCurrentUser
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

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

// Register new user
router.post('/register',
    [
        body('email')
            .isEmail().withMessage('Valid email is required')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('role')
            .isIn(['patient', 'provider', 'mentor']).withMessage('Invalid role'),
        body('name')
            .trim()
            .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
        body('dateOfBirth')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ],
    validate,
    register
);

// Login user
router.post('/login',
    [
        body('email')
            .isEmail().withMessage('Valid email is required')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
    ],
    validate,
    login
);

// Refresh access token
router.post('/refresh',
    [
        body('refreshToken')
            .notEmpty().withMessage('Refresh token is required')
    ],
    validate,
    refreshAccessToken
);

// Logout user (requires authentication)
router.post('/logout',
    authenticateToken,
    logout
);

// Get current user (requires authentication)
router.get('/me',
    authenticateToken,
    getCurrentUser
);

export default router;
