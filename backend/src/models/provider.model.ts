// backend/src/models/provider.model.ts
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';

export interface Provider {
    id: number;
    user_id: number;
    uuid: string;
    email: string;
    name: string;
    phone: string | null;
    specialty: string | null;
    license_number: string | null;
    years_of_experience: number | null;
    bio: string | null;
    education: string | null;
    certifications: string | null;
    languages_spoken: string | null;
    accepts_new_patients: boolean;
    hourly_rate: number | null;
    created_at: string;
    last_login: string | null;
    is_active: boolean;
}

export interface ProviderWithStats extends Provider {
    patient_count: number;
    upcoming_appointment_count: number;
    total_sessions_completed: number;
}

export interface ProviderAvailability {
    id: number;
    provider_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

// Get all providers with filters
export async function getAllProviders(filters?: {
    specialty?: string;
    acceptsNewPatients?: boolean;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ providers: Provider[]; total: number }> {
    try {
        let baseQuery = `
            SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.isActive !== undefined) {
            baseQuery += ` AND u.is_active = $${paramIndex}`;
            params.push(filters.isActive);
            paramIndex++;
        }

        if (filters?.specialty) {
            baseQuery += ` AND pr.specialty ILIKE $${paramIndex}`;
            params.push(`%${filters.specialty}%`);
            paramIndex++;
        }

        if (filters?.acceptsNewPatients !== undefined) {
            baseQuery += ` AND pr.accepts_new_patients = $${paramIndex}`;
            params.push(filters.acceptsNewPatients);
            paramIndex++;
        }

        if (filters?.search) {
            baseQuery += ` AND (
                u.name ILIKE $${paramIndex} OR
                u.email ILIKE $${paramIndex} OR
                pr.specialty ILIKE $${paramIndex}
            )`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as count_query`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Apply sorting and pagination
        baseQuery += ` ORDER BY u.name ASC`;

        if (filters?.limit) {
            baseQuery += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }

        if (filters?.offset) {
            baseQuery += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
            paramIndex++;
        }

        const result = await query(baseQuery, params);

        return {
            providers: result.rows,
            total
        };
    } catch (error) {
        logger.error('Get all providers error:', error);
        throw error;
    }
}

// Get provider by ID
export async function getProviderById(providerId: number): Promise<Provider | null> {
    try {
        const result = await query(
            `SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.id = $1`,
            [providerId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get provider by ID error:', error);
        throw error;
    }
}

// Get provider by user ID
export async function getProviderByUserId(userId: number): Promise<Provider | null> {
    try {
        const result = await query(
            `SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.user_id = $1`,
            [userId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get provider by user ID error:', error);
        throw error;
    }
}

// Get provider with statistics
export async function getProviderWithStats(providerId: number): Promise<ProviderWithStats | null> {
    try {
        const result = await query(
            `SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active,
                (SELECT COUNT(*) FROM patients WHERE primary_provider_id = pr.id) as patient_count,
                (SELECT COUNT(*) FROM appointments
                 WHERE provider_id = pr.id
                 AND scheduled_start >= CURRENT_TIMESTAMP
                 AND status NOT IN ('cancelled')) as upcoming_appointment_count,
                (SELECT COUNT(*) FROM appointments
                 WHERE provider_id = pr.id
                 AND status = 'completed') as total_sessions_completed
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.id = $1`,
            [providerId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get provider with stats error:', error);
        throw error;
    }
}

// Update provider profile
export async function updateProviderProfile(
    providerId: number,
    updates: {
        specialty?: string;
        license_number?: string;
        years_of_experience?: number;
        bio?: string;
        education?: string;
        certifications?: string;
        languages_spoken?: string;
        accepts_new_patients?: boolean;
        hourly_rate?: number;
    }
): Promise<Provider | null> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            return await getProviderById(providerId);
        }

        values.push(providerId);

        const result = await query(
            `UPDATE providers
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramIndex}
             RETURNING *`,
            values
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Update provider profile error:', error);
        throw error;
    }
}

// Update user details (name, phone)
export async function updateProviderUserDetails(
    userId: number,
    updates: {
        name?: string;
        phone?: string;
    }
): Promise<boolean> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            return true;
        }

        values.push(userId);

        await query(
            `UPDATE users
             SET ${fields.join(', ')}
             WHERE id = $${paramIndex}`,
            values
        );

        return true;
    } catch (error) {
        logger.error('Update provider user details error:', error);
        throw error;
    }
}

// Get provider availability
export async function getProviderAvailability(providerId: number): Promise<ProviderAvailability[]> {
    try {
        const result = await query(
            `SELECT
                id,
                provider_id,
                day_of_week,
                start_time,
                end_time,
                is_available
            FROM provider_availability
            WHERE provider_id = $1
            ORDER BY day_of_week, start_time`,
            [providerId]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get provider availability error:', error);
        throw error;
    }
}

// Set provider availability
export async function setProviderAvailability(
    providerId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isAvailable: boolean = true
): Promise<ProviderAvailability> {
    try {
        // Check if availability already exists for this day/time
        const existing = await query(
            `SELECT id FROM provider_availability
             WHERE provider_id = $1 AND day_of_week = $2 AND start_time = $3`,
            [providerId, dayOfWeek, startTime]
        );

        if (existing.rows.length > 0) {
            // Update existing
            const result = await query(
                `UPDATE provider_availability
                 SET end_time = $1, is_available = $2
                 WHERE id = $3
                 RETURNING *`,
                [endTime, isAvailable, existing.rows[0].id]
            );
            return result.rows[0];
        } else {
            // Insert new
            const result = await query(
                `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [providerId, dayOfWeek, startTime, endTime, isAvailable]
            );
            return result.rows[0];
        }
    } catch (error) {
        logger.error('Set provider availability error:', error);
        throw error;
    }
}

// Delete provider availability
export async function deleteProviderAvailability(availabilityId: number): Promise<boolean> {
    try {
        const result = await query(
            'DELETE FROM provider_availability WHERE id = $1 RETURNING id',
            [availabilityId]
        );

        return result.rows.length > 0;
    } catch (error) {
        logger.error('Delete provider availability error:', error);
        throw error;
    }
}

// Get providers by specialty
export async function getProvidersBySpecialty(specialty: string): Promise<Provider[]> {
    try {
        const result = await query(
            `SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.specialty ILIKE $1 AND u.is_active = true AND pr.accepts_new_patients = true
            ORDER BY u.name ASC`,
            [`%${specialty}%`]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get providers by specialty error:', error);
        throw error;
    }
}

// Get available providers (accepting new patients)
export async function getAvailableProviders(): Promise<Provider[]> {
    try {
        const result = await query(
            `SELECT
                pr.id,
                pr.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                pr.specialty,
                pr.license_number,
                pr.years_of_experience,
                pr.bio,
                pr.education,
                pr.certifications,
                pr.languages_spoken,
                pr.accepts_new_patients,
                pr.hourly_rate,
                u.created_at,
                u.last_login,
                u.is_active
            FROM providers pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.accepts_new_patients = true AND u.is_active = true
            ORDER BY u.name ASC`
        );

        return result.rows;
    } catch (error) {
        logger.error('Get available providers error:', error);
        throw error;
    }
}

// Get provider statistics
export async function getProviderStatistics(providerId: number): Promise<{
    patient_count: number;
    upcoming_appointments: number;
    total_sessions: number;
    completed_sessions: number;
    cancelled_sessions: number;
    average_session_duration: number;
}> {
    try {
        const result = await query(
            `SELECT
                (SELECT COUNT(*) FROM patients WHERE primary_provider_id = $1) as patient_count,
                (SELECT COUNT(*) FROM appointments
                 WHERE provider_id = $1
                 AND scheduled_start >= CURRENT_TIMESTAMP
                 AND status NOT IN ('cancelled')) as upcoming_appointments,
                (SELECT COUNT(*) FROM appointments WHERE provider_id = $1) as total_sessions,
                (SELECT COUNT(*) FROM appointments WHERE provider_id = $1 AND status = 'completed') as completed_sessions,
                (SELECT COUNT(*) FROM appointments WHERE provider_id = $1 AND status = 'cancelled') as cancelled_sessions,
                (SELECT AVG(EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/60)::integer
                 FROM appointments WHERE provider_id = $1 AND status = 'completed') as average_session_duration`,
            [providerId]
        );

        return result.rows[0];
    } catch (error) {
        logger.error('Get provider statistics error:', error);
        throw error;
    }
}
