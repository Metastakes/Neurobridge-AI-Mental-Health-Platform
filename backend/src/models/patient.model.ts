// backend/src/models/patient.model.ts
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';

export interface Patient {
    id: number;
    user_id: number;
    uuid: string;
    email: string;
    name: string;
    phone: string | null;
    date_of_birth: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    insurance_provider: string | null;
    insurance_policy_number: string | null;
    medical_history: string | null;
    current_medications: string | null;
    allergies: string | null;
    created_at: string;
    last_login: string | null;
    is_active: boolean;
}

export interface PatientWithProvider extends Patient {
    provider_id: number | null;
    provider_name: string | null;
    provider_specialty: string | null;
}

export interface Medication {
    id: number;
    patient_id: number;
    medication_name: string;
    dosage: string | null;
    frequency: string | null;
    prescribing_provider_id: number | null;
    provider_name: string | null;
    start_date: string;
    end_date: string | null;
    notes: string | null;
    created_at: string;
}

export interface SessionNote {
    id: number;
    appointment_id: number;
    patient_id: number;
    provider_id: number;
    provider_name: string;
    note_type: string;
    session_date: string;
    duration_minutes: number | null;
    chief_complaint: string | null;
    assessment: string | null;
    plan: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// Get all patients (for providers/mentors)
export async function getAllPatients(filters?: {
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ patients: PatientWithProvider[]; total: number }> {
    try {
        let baseQuery = `
            SELECT
                p.id,
                p.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                u.date_of_birth,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                p.insurance_provider,
                p.insurance_policy_number,
                p.medical_history,
                p.current_medications,
                p.allergies,
                u.created_at,
                u.last_login,
                u.is_active,
                pr.id as provider_id,
                pu.name as provider_name,
                pr.specialty as provider_specialty
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN users pu ON pr.user_id = pu.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        // Apply filters
        if (filters?.isActive !== undefined) {
            baseQuery += ` AND u.is_active = $${paramIndex}`;
            params.push(filters.isActive);
            paramIndex++;
        }

        if (filters?.search) {
            baseQuery += ` AND (
                u.name ILIKE $${paramIndex} OR
                u.email ILIKE $${paramIndex}
            )`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as count_query`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Apply pagination
        baseQuery += ` ORDER BY u.created_at DESC`;

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
            patients: result.rows,
            total
        };
    } catch (error) {
        logger.error('Get all patients error:', error);
        throw error;
    }
}

// Get patient by ID
export async function getPatientById(patientId: number): Promise<PatientWithProvider | null> {
    try {
        const result = await query(
            `SELECT
                p.id,
                p.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                u.date_of_birth,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                p.insurance_provider,
                p.insurance_policy_number,
                p.medical_history,
                p.current_medications,
                p.allergies,
                u.created_at,
                u.last_login,
                u.is_active,
                pr.id as provider_id,
                pu.name as provider_name,
                pr.specialty as provider_specialty
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN users pu ON pr.user_id = pu.id
            WHERE p.id = $1`,
            [patientId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get patient by ID error:', error);
        throw error;
    }
}

// Get patient by user ID
export async function getPatientByUserId(userId: number): Promise<PatientWithProvider | null> {
    try {
        const result = await query(
            `SELECT
                p.id,
                p.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                u.date_of_birth,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                p.insurance_provider,
                p.insurance_policy_number,
                p.medical_history,
                p.current_medications,
                p.allergies,
                u.created_at,
                u.last_login,
                u.is_active,
                pr.id as provider_id,
                pu.name as provider_name,
                pr.specialty as provider_specialty
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN users pu ON pr.user_id = pu.id
            WHERE p.user_id = $1`,
            [userId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Get patient by user ID error:', error);
        throw error;
    }
}

// Update patient profile
export async function updatePatientProfile(
    patientId: number,
    updates: {
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
        insurance_provider?: string;
        insurance_policy_number?: string;
        medical_history?: string;
        current_medications?: string;
        allergies?: string;
    }
): Promise<Patient | null> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Build dynamic update query
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            return await getPatientById(patientId);
        }

        values.push(patientId);

        const result = await query(
            `UPDATE patients
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramIndex}
             RETURNING *`,
            values
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Update patient profile error:', error);
        throw error;
    }
}

// Update user details (name, phone, date_of_birth)
export async function updateUserDetails(
    userId: number,
    updates: {
        name?: string;
        phone?: string;
        date_of_birth?: string;
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
        logger.error('Update user details error:', error);
        throw error;
    }
}

// Get patient medications
export async function getPatientMedications(patientId: number): Promise<Medication[]> {
    try {
        const result = await query(
            `SELECT
                m.id,
                m.patient_id,
                m.medication_name,
                m.dosage,
                m.frequency,
                m.prescribing_provider_id,
                u.name as provider_name,
                m.start_date,
                m.end_date,
                m.notes,
                m.created_at
            FROM medications m
            LEFT JOIN providers p ON m.prescribing_provider_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE m.patient_id = $1
            ORDER BY m.start_date DESC`,
            [patientId]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get patient medications error:', error);
        throw error;
    }
}

// Get patient session notes
export async function getPatientSessionNotes(
    patientId: number,
    filters?: {
        providerId?: number;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
): Promise<SessionNote[]> {
    try {
        let queryText = `
            SELECT
                sn.id,
                sn.appointment_id,
                sn.patient_id,
                sn.provider_id,
                u.name as provider_name,
                sn.note_type,
                sn.session_date,
                sn.duration_minutes,
                sn.chief_complaint,
                sn.assessment,
                sn.plan,
                sn.notes,
                sn.created_at,
                sn.updated_at
            FROM session_notes sn
            JOIN providers p ON sn.provider_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE sn.patient_id = $1
        `;

        const params: any[] = [patientId];
        let paramIndex = 2;

        if (filters?.providerId) {
            queryText += ` AND sn.provider_id = $${paramIndex}`;
            params.push(filters.providerId);
            paramIndex++;
        }

        if (filters?.startDate) {
            queryText += ` AND sn.session_date >= $${paramIndex}`;
            params.push(filters.startDate);
            paramIndex++;
        }

        if (filters?.endDate) {
            queryText += ` AND sn.session_date <= $${paramIndex}`;
            params.push(filters.endDate);
            paramIndex++;
        }

        queryText += ` ORDER BY sn.session_date DESC`;

        if (filters?.limit) {
            queryText += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
        }

        const result = await query(queryText, params);
        return result.rows;
    } catch (error) {
        logger.error('Get patient session notes error:', error);
        throw error;
    }
}

// Assign primary provider to patient
export async function assignPrimaryProvider(
    patientId: number,
    providerId: number
): Promise<boolean> {
    try {
        await query(
            'UPDATE patients SET primary_provider_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [providerId, patientId]
        );
        return true;
    } catch (error) {
        logger.error('Assign primary provider error:', error);
        throw error;
    }
}

// Get patients by provider
export async function getPatientsByProvider(providerId: number): Promise<PatientWithProvider[]> {
    try {
        const result = await query(
            `SELECT
                p.id,
                p.user_id,
                u.uuid,
                u.email,
                u.name,
                u.phone,
                u.date_of_birth,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                p.insurance_provider,
                p.insurance_policy_number,
                p.medical_history,
                p.current_medications,
                p.allergies,
                u.created_at,
                u.last_login,
                u.is_active,
                pr.id as provider_id,
                pu.name as provider_name,
                pr.specialty as provider_specialty
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN users pu ON pr.user_id = pu.id
            WHERE p.primary_provider_id = $1 AND u.is_active = true
            ORDER BY u.name ASC`,
            [providerId]
        );

        return result.rows;
    } catch (error) {
        logger.error('Get patients by provider error:', error);
        throw error;
    }
}
