// backend/src/utils/auth.utils.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

interface TokenPayload {
    id: number;
    email: string;
    role: string;
    name: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        logger.error('Password hashing error:', error);
        throw new Error('Failed to hash password');
    }
}

// Compare password with hash
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        logger.error('Password comparison error:', error);
        return false;
    }
}

// Generate access token
export function generateAccessToken(user: TokenPayload): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'neurobridge-api',
            audience: 'neurobridge-frontend'
        }
    );
}

// Generate refresh token
export function generateRefreshToken(user: TokenPayload): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'neurobridge-api',
            audience: 'neurobridge-frontend'
        }
    );
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'neurobridge-api',
            audience: 'neurobridge-frontend'
        }) as TokenPayload;
        return decoded;
    } catch (error) {
        logger.error('Refresh token verification error:', error);
        return null;
    }
}

// Calculate token expiration timestamp
export function getTokenExpiration(expiresIn: string): Date {
    const now = new Date();

    // Parse expiration string (e.g., "24h", "7d")
    const match = expiresIn.match(/^(\d+)([hdm])$/);
    if (!match) {
        throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'h':
            now.setHours(now.getHours() + value);
            break;
        case 'd':
            now.setDate(now.getDate() + value);
            break;
        case 'm':
            now.setMinutes(now.getMinutes() + value);
            break;
    }

    return now;
}

// Validate password strength
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 100) {
        errors.push('Password must not exceed 100 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Generate random token (for password reset, email verification, etc.)
export function generateRandomToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
