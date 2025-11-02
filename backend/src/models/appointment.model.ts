// backend/src/models/appointment.model.ts
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';

export interface Appointment {
    id: number;
    patient_id: number;
    provider_id: number;
    appointment_type: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    google_calendar_event_id: string | null;
    notes: string | null;
    cancellation_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
    patient_name: string;
    patient_email: string;
    patient_phone: string | null;
    provider_name: string;
    provider_email: string;
    provider_specialty: string | null;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'initial_consultation' | 'follow_up' | 'therapy_session' | 'medication_review' | 'crisis_intervention';

// Get all appointments with filters
export async function getAllAppointments(filters?: {
    patientId?: number;
    providerId?: number;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    appointmentType?: AppointmentType;
    limit?: number;
    offset?: number;
}): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    try {
        let baseQuery = `
            SELECT
                a.id,
                a.patient_id,
                a.provider_id,
                a.appointment_type,
                a.scheduled_start,
                a.scheduled_end,
                a.status,
                a.google_calendar_event_id,
                a.notes,
                a.cancellation_reason,
                a.created_at,
                a.updated_at,
                pu.name as patient_name,
                pu.email as patient_email,
                pu.phone as patient_phone,
                pru.name as provider_name,
                pru.email as provider_email,
                pr.specialty as provider_specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN providers pr ON a.provider_id = pr.id
            JOIN users pru ON pr.user_id = pru.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.patientId) {
            baseQuery += ` AND a.patient_id = $${paramIndex}`;
            params.push(filters.patientId);
            paramIndex++;
        }

        if (filters?.providerId) {
            baseQuery += ` AND a.provider_id = $${paramIndex}`;
            params.push(filters.providerId);
            paramIndex++;
        }

        if (filters?.status) {
            baseQuery += ` AND a.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters?.appointmentType) {
            baseQuery += ` AND a.appointment_type = $${paramIndex}`;
            params.push(filters.appointmentType);
            paramIndex++;
        }

        if (filters?.startDate) {
            baseQuery += ` AND a.scheduled_start >= $${paramIndex}`;
            params.push(filters.startDate);
            paramIndex++;
        }

        if (filters?.endDate) {
            baseQuery += ` AND a.scheduled_end <= $${paramIndex}`;
            params.push(filters.endDate);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as count_query`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Apply sorting and pagination
        baseQuery += ` ORDER BY a.scheduled_start ASC`;

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
            appointments: result.rows,
            total
        };
    } catch (error) {
        logger.error('Get all appointments error:', error);
        throw error;
    }
}

// Get appointment by ID
export async function getAppointmentById(appointmentId: number): Promise<AppointmentWithDetails | null> {
    try {
        const result = await query(
            `SELECT
                a.id,
                a.patient_id,
                a.provider_id,
                a.appointment_type,
                a.scheduled_start,
                a.scheduled_end,
                a.status,
                a.google_calendar_event_id,
                a.notes,
                a.cancellation_reason,
                a.created_at,
                a.updated_at,
                pu.name as patient_name,
                pu.email as patient_email,
                pu.phone as patient_phone,
                pru.name as provider_name,
                pru.email as provider_email,
                pr.specialty as provider_specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN providers pr ON a.provider_id = pr.id
            JOIN users pru ON pr.user_id = pru.id
            WHERE a.id = $1`,
            [appointmentId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get appointment by ID error:', error);
        throw error;
    }
}

// Create appointment
export async function createAppointment(data: {
    patientId: number;
    providerId: number;
    appointmentType: AppointmentType;
    scheduledStart: string;
    scheduledEnd: string;
    googleCalendarEventId?: string;
    notes?: string;
}): Promise<Appointment> {
    try {
        const result = await query(
            `INSERT INTO appointments (
                patient_id,
                provider_id,
                appointment_type,
                scheduled_start,
                scheduled_end,
                status,
                google_calendar_event_id,
                notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                data.patientId,
                data.providerId,
                data.appointmentType,
                data.scheduledStart,
                data.scheduledEnd,
                'scheduled',
                data.googleCalendarEventId || null,
                data.notes || null
            ]
        );

        return result.rows[0];
    } catch (error) {
        logger.error('Create appointment error:', error);
        throw error;
    }
}

// Update appointment
export async function updateAppointment(
    appointmentId: number,
    updates: {
        appointmentType?: AppointmentType;
        scheduledStart?: string;
        scheduledEnd?: string;
        status?: AppointmentStatus;
        googleCalendarEventId?: string;
        notes?: string;
        cancellationReason?: string;
    }
): Promise<Appointment | null> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                fields.push(`${snakeKey} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            return await getAppointmentById(appointmentId);
        }

        values.push(appointmentId);

        const result = await query(
            `UPDATE appointments
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramIndex}
             RETURNING *`,
            values
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Update appointment error:', error);
        throw error;
    }
}

// Cancel appointment
export async function cancelAppointment(
    appointmentId: number,
    cancellationReason: string
): Promise<Appointment | null> {
    try {
        const result = await query(
            `UPDATE appointments
             SET status = 'cancelled',
                 cancellation_reason = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [cancellationReason, appointmentId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Cancel appointment error:', error);
        throw error;
    }
}

// Delete appointment (hard delete)
export async function deleteAppointment(appointmentId: number): Promise<boolean> {
    try {
        const result = await query(
            'DELETE FROM appointments WHERE id = $1 RETURNING id',
            [appointmentId]
        );

        return result.rows.length > 0;
    } catch (error) {
        logger.error('Delete appointment error:', error);
        throw error;
    }
}

// Get upcoming appointments for a patient
export async function getUpcomingAppointmentsForPatient(
    patientId: number,
    limit: number = 10
): Promise<AppointmentWithDetails[]> {
    try {
        const result = await query(
            `SELECT
                a.id,
                a.patient_id,
                a.provider_id,
                a.appointment_type,
                a.scheduled_start,
                a.scheduled_end,
                a.status,
                a.google_calendar_event_id,
                a.notes,
                a.cancellation_reason,
                a.created_at,
                a.updated_at,
                pu.name as patient_name,
                pu.email as patient_email,
                pu.phone as patient_phone,
                pru.name as provider_name,
                pru.email as provider_email,
                pr.specialty as provider_specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN providers pr ON a.provider_id = pr.id
            JOIN users pru ON pr.user_id = pru.id
            WHERE a.patient_id = $1
              AND a.scheduled_start >= CURRENT_TIMESTAMP
              AND a.status NOT IN ('cancelled', 'completed')
            ORDER BY a.scheduled_start ASC
            LIMIT $2`,
            [patientId, limit]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get upcoming appointments for patient error:', error);
        throw error;
    }
}

// Get upcoming appointments for a provider
export async function getUpcomingAppointmentsForProvider(
    providerId: number,
    limit: number = 20
): Promise<AppointmentWithDetails[]> {
    try {
        const result = await query(
            `SELECT
                a.id,
                a.patient_id,
                a.provider_id,
                a.appointment_type,
                a.scheduled_start,
                a.scheduled_end,
                a.status,
                a.google_calendar_event_id,
                a.notes,
                a.cancellation_reason,
                a.created_at,
                a.updated_at,
                pu.name as patient_name,
                pu.email as patient_email,
                pu.phone as patient_phone,
                pru.name as provider_name,
                pru.email as provider_email,
                pr.specialty as provider_specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN providers pr ON a.provider_id = pr.id
            JOIN users pru ON pr.user_id = pru.id
            WHERE a.provider_id = $1
              AND a.scheduled_start >= CURRENT_TIMESTAMP
              AND a.status NOT IN ('cancelled')
            ORDER BY a.scheduled_start ASC
            LIMIT $2`,
            [providerId, limit]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get upcoming appointments for provider error:', error);
        throw error;
    }
}

// Get appointment history for a patient
export async function getAppointmentHistoryForPatient(
    patientId: number,
    limit: number = 50
): Promise<AppointmentWithDetails[]> {
    try {
        const result = await query(
            `SELECT
                a.id,
                a.patient_id,
                a.provider_id,
                a.appointment_type,
                a.scheduled_start,
                a.scheduled_end,
                a.status,
                a.google_calendar_event_id,
                a.notes,
                a.cancellation_reason,
                a.created_at,
                a.updated_at,
                pu.name as patient_name,
                pu.email as patient_email,
                pu.phone as patient_phone,
                pru.name as provider_name,
                pru.email as provider_email,
                pr.specialty as provider_specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN providers pr ON a.provider_id = pr.id
            JOIN users pru ON pr.user_id = pru.id
            WHERE a.patient_id = $1
              AND (a.scheduled_end < CURRENT_TIMESTAMP OR a.status IN ('completed', 'cancelled', 'no_show'))
            ORDER BY a.scheduled_start DESC
            LIMIT $2`,
            [patientId, limit]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get appointment history for patient error:', error);
        throw error;
    }
}

// Check for scheduling conflicts
export async function hasSchedulingConflict(
    providerId: number,
    scheduledStart: string,
    scheduledEnd: string,
    excludeAppointmentId?: number
): Promise<boolean> {
    try {
        let queryText = `
            SELECT COUNT(*) as conflict_count
            FROM appointments
            WHERE provider_id = $1
              AND status NOT IN ('cancelled')
              AND (
                (scheduled_start < $3 AND scheduled_end > $2) OR
                (scheduled_start >= $2 AND scheduled_start < $3)
              )
        `;

        const params: any[] = [providerId, scheduledStart, scheduledEnd];

        if (excludeAppointmentId) {
            queryText += ` AND id != $4`;
            params.push(excludeAppointmentId);
        }

        const result = await query(queryText, params);
        const conflictCount = parseInt(result.rows[0].conflict_count);

        return conflictCount > 0;
    } catch (error) {
        logger.error('Check scheduling conflict error:', error);
        throw error;
    }
}

// Update appointment status
export async function updateAppointmentStatus(
    appointmentId: number,
    status: AppointmentStatus
): Promise<Appointment | null> {
    try {
        const result = await query(
            `UPDATE appointments
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [status, appointmentId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Update appointment status error:', error);
        throw error;
    }
}
