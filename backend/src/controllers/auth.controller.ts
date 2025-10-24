// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getTokenExpiration,
    validatePasswordStrength
} from '../utils/auth.utils.js';

// Register new user
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, role, name, phone, dateOfBirth } = req.body;

        // Validate role
        const validRoles = ['patient', 'provider', 'mentor'];
        if (!validRoles.includes(role)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid role'
            });
            return;
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Password does not meet requirements',
                details: passwordValidation.errors
            });
            return;
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Email already registered'
            });
            return;
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user in transaction
        const result = await transaction(async (client) => {
            // Insert user
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, role, name, phone, date_of_birth)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, email, role, name, created_at`,
                [email.toLowerCase(), passwordHash, role, name, phone || null, dateOfBirth || null]
            );

            const user = userResult.rows[0];

            // Create role-specific record
            if (role === 'patient') {
                await client.query(
                    'INSERT INTO patients (user_id) VALUES ($1)',
                    [user.id]
                );
            } else if (role === 'provider') {
                await client.query(
                    'INSERT INTO providers (user_id) VALUES ($1)',
                    [user.id]
                );
            }

            return user;
        });

        const user = result;

        // Generate tokens
        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        const refreshToken = generateRefreshToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        // Store refresh token
        const expiresAt = getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
        await query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        // Log registration
        logger.info('User registered', {
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, 'USER_REGISTER', 'user', user.id, JSON.stringify({ role })]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Registration failed'
        });
    }
}

// Login user
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await query(
            `SELECT id, email, password_hash, role, name, is_active
             FROM users
             WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
            return;
        }

        const user = result.rows[0];

        // Check if account is active
        if (!user.is_active) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Account has been deactivated'
            });
            return;
        }

        // Verify password
        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
            return;
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        const refreshToken = generateRefreshToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        // Store refresh token
        const expiresAt = getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
        await query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        // Update last login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log successful login
        logger.info('User logged in', {
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
             VALUES ($1, $2, $3, $4)`,
            [user.id, 'USER_LOGIN', req.ip, req.get('user-agent')]
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Login failed'
        });
    }
}

// Refresh access token
export async function refreshAccessToken(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required'
            });
            return;
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired refresh token'
            });
            return;
        }

        // Check if token exists and is not revoked
        const tokenResult = await query(
            `SELECT user_id, expires_at, revoked
             FROM refresh_tokens
             WHERE token = $1`,
            [refreshToken]
        );

        if (tokenResult.rows.length === 0 || tokenResult.rows[0].revoked) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Refresh token has been revoked'
            });
            return;
        }

        const tokenData = tokenResult.rows[0];

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Refresh token has expired'
            });
            return;
        }

        // Get user data
        const userResult = await query(
            'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
            [tokenData.user_id]
        );

        if (userResult.rows.length === 0) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
            return;
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Account has been deactivated'
            });
            return;
        }

        // Generate new access token
        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        logger.info('Access token refreshed', {
            userId: user.id,
            email: user.email
        });

        res.json({
            accessToken
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Token refresh failed'
        });
    }
}

// Logout user
export async function logout(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Revoke refresh token
            await query(
                'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
                [refreshToken]
            );
        }

        if (req.user) {
            logger.info('User logged out', {
                userId: req.user.id,
                email: req.user.email
            });

            // Audit log
            await query(
                `INSERT INTO audit_log (user_id, action, ip_address)
                 VALUES ($1, $2, $3)`,
                [req.user.id, 'USER_LOGOUT', req.ip]
            );
        }

        res.json({
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Logout failed'
        });
    }
}

// Get current user
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        // Get full user details
        const result = await query(
            `SELECT u.id, u.email, u.role, u.name, u.phone, u.date_of_birth, u.created_at, u.last_login
             FROM users u
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
            return;
        }

        res.json({
            user: result.rows[0]
        });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user data'
        });
    }
}
