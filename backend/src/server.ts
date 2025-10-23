// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './config/logger.js';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, async () => {
    logger.info(`🚀 NeuroBridge API server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔒 CORS enabled for: ${corsOptions.origin}`);

    // Test database connection
    const dbConnected = await testConnection();
    if (dbConnected) {
        logger.info('✅ Database connection established');
    } else {
        logger.warn('⚠️  Database connection failed - running without database');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

export default app;
