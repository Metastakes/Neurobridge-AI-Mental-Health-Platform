// backend/src/config/database.ts
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

// Database configuration
const config: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'neurobridge',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to wait for a connection
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
export const pool = new Pool(config);

// Pool error handling
pool.on('error', (err) => {
    logger.error('Unexpected error on idle database client', { error: err.message });
});

pool.on('connect', () => {
    logger.info('New database client connected');
});

pool.on('remove', () => {
    logger.info('Database client removed from pool');
});

// Test database connection
export async function testConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();

        logger.info('Database connection successful', {
            timestamp: result.rows[0].now
        });
        return true;
    } catch (error) {
        logger.error('Database connection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            config: {
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user
            }
        });
        return false;
    }
}

// Query helper function with error handling
export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        logger.debug('Executed query', {
            query: text.substring(0, 100), // Log first 100 chars
            duration: `${duration}ms`,
            rows: result.rowCount
        });

        return result;
    } catch (error) {
        logger.error('Database query error', {
            query: text.substring(0, 100),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}

// Transaction helper
export async function transaction(callback: (client: any) => Promise<any>) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
    try {
        await pool.end();
        logger.info('Database pool closed successfully');
    } catch (error) {
        logger.error('Error closing database pool', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// Handle process termination
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

export default pool;
