// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { query } from '../config/database.js';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: string;
                name: string;
            };
        }
    }
}

interface JWTPayload {
    id: number;
    email: string;
    role: string;
    name: string;
}

// Verify JWT token
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Access token is required'
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('JWT_SECRET not configured');
            res.status(500).json({
                error: 'Server Configuration Error',
                message: 'Authentication system not properly configured'
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

        // Check if user still exists and is active
        const result = await query(
            'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
            return;
        }

        const user = result.rows[0];

        if (!user.is_active) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Account has been deactivated'
            });
            return;
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired'
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
            return;
        }

        logger.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

// Role-based authorization
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
};

// Check if user owns the resource or is authorized
export const authorizeOwnerOrRole = (resourceUserIdParam: string, ...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const resourceUserId = parseInt(req.params[resourceUserIdParam]);

        // Allow if user owns the resource
        if (req.user.id === resourceUserId) {
            next();
            return;
        }

        // Allow if user has required role
        if (allowedRoles.includes(req.user.role)) {
            next();
            return;
        }

        res.status(403).json({
            error: 'Forbidden',
            message: 'You do not have permission to access this resource'
        });
    };
};

// Optional authentication (attaches user if token exists)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            next();
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            next();
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        const result = await query(
            'SELECT id, email, role, name FROM users WHERE id = $1 AND is_active = true',
            [decoded.id]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        }

        next();
    } catch (error) {
        // Don't block request if optional auth fails
        next();
    }
};
