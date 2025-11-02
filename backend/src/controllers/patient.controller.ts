// backend/src/controllers/patient.controller.ts
import { Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { query } from '../config/database.js';
import {
    getAllPatients,
    getPatientById,
    getPatientByUserId,
    updatePatientProfile,
    updateUserDetails,
    getPatientMedications,
    getPatientSessionNotes,
    assignPrimaryProvider,
    getPatientsByProvider
} from '../models/patient.model.js';

// Get all patients (providers/mentors only)
export async function listPatients(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        // Only providers and mentors can list all patients
        if (req.user.role !== 'provider' && req.user.role !== 'mentor') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only providers and mentors can list patients'
            });
            return;
        }

        const {
            isActive,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        const filters = {
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            search: search as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const { patients, total } = await getAllPatients(filters);

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, details)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, 'PATIENT_LIST', 'patient', JSON.stringify({ count: patients.length })]
        );

        res.json({
            patients,
            total,
            limit: filters.limit,
            offset: filters.offset
        });
    } catch (error) {
        logger.error('List patients error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch patients'
        });
    }
}

// Get patient by ID
export async function getPatient(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const patientId = parseInt(req.params.id);

        if (isNaN(patientId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid patient ID'
            });
            return;
        }

        const patient = await getPatientById(patientId);

        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
            return;
        }

        // Authorization: patients can only see their own data
        // providers/mentors can see all patients
        if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this patient'
            });
            return;
        }

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, 'PATIENT_VIEW', 'patient', patientId]
        );

        res.json({ patient });
    } catch (error) {
        logger.error('Get patient error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch patient'
        });
    }
}

// Get current patient's profile
export async function getCurrentPatient(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        if (req.user.role !== 'patient') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only patients can access this endpoint'
            });
            return;
        }

        const patient = await getPatientByUserId(req.user.id);

        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient profile not found'
            });
            return;
        }

        res.json({ patient });
    } catch (error) {
        logger.error('Get current patient error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch patient profile'
        });
    }
}

// Update patient profile
export async function updatePatient(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const patientId = parseInt(req.params.id);

        if (isNaN(patientId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid patient ID'
            });
            return;
        }

        const patient = await getPatientById(patientId);

        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
            return;
        }

        // Authorization: patients can only update their own profile
        // providers can update their patients' profiles
        if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to update this patient'
            });
            return;
        }

        const {
            name,
            phone,
            date_of_birth,
            emergency_contact_name,
            emergency_contact_phone,
            insurance_provider,
            insurance_policy_number,
            medical_history,
            current_medications,
            allergies
        } = req.body;

        // Update user details if provided
        if (name !== undefined || phone !== undefined || date_of_birth !== undefined) {
            await updateUserDetails(patient.user_id, {
                name,
                phone,
                date_of_birth
            });
        }

        // Update patient-specific fields
        const updatedPatient = await updatePatientProfile(patientId, {
            emergency_contact_name,
            emergency_contact_phone,
            insurance_provider,
            insurance_policy_number,
            medical_history,
            current_medications,
            allergies
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'PATIENT_UPDATE', 'patient', patientId, JSON.stringify(req.body)]
        );

        logger.info('Patient updated', {
            patientId,
            updatedBy: req.user.id,
            role: req.user.role
        });

        // Fetch updated patient with all joins
        const refreshedPatient = await getPatientById(patientId);

        res.json({
            message: 'Patient updated successfully',
            patient: refreshedPatient
        });
    } catch (error) {
        logger.error('Update patient error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update patient'
        });
    }
}

// Get patient medications
export async function listMedications(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const patientId = parseInt(req.params.id);

        if (isNaN(patientId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid patient ID'
            });
            return;
        }

        const patient = await getPatientById(patientId);

        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
            return;
        }

        // Authorization check
        if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this data'
            });
            return;
        }

        const medications = await getPatientMedications(patientId);

        res.json({ medications });
    } catch (error) {
        logger.error('List medications error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch medications'
        });
    }
}

// Get patient session notes
export async function listSessionNotes(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const patientId = parseInt(req.params.id);

        if (isNaN(patientId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid patient ID'
            });
            return;
        }

        const patient = await getPatientById(patientId);

        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
            return;
        }

        // Authorization check
        if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this data'
            });
            return;
        }

        const { providerId, startDate, endDate, limit } = req.query;

        const filters = {
            providerId: providerId ? parseInt(providerId as string) : undefined,
            startDate: startDate as string,
            endDate: endDate as string,
            limit: limit ? parseInt(limit as string) : undefined
        };

        const sessionNotes = await getPatientSessionNotes(patientId, filters);

        res.json({ sessionNotes });
    } catch (error) {
        logger.error('List session notes error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch session notes'
        });
    }
}

// Assign primary provider (admin/provider only)
export async function assignProvider(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        // Only providers can assign themselves or other providers
        if (req.user.role !== 'provider') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only providers can assign primary providers'
            });
            return;
        }

        const patientId = parseInt(req.params.id);
        const { providerId } = req.body;

        if (isNaN(patientId) || !providerId) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid patient ID or provider ID'
            });
            return;
        }

        // Verify patient exists
        const patient = await getPatientById(patientId);
        if (!patient) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Patient not found'
            });
            return;
        }

        // Verify provider exists
        const providerResult = await query(
            'SELECT id FROM providers WHERE id = $1',
            [providerId]
        );

        if (providerResult.rows.length === 0) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        await assignPrimaryProvider(patientId, providerId);

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'PROVIDER_ASSIGN', 'patient', patientId, JSON.stringify({ providerId })]
        );

        logger.info('Primary provider assigned', {
            patientId,
            providerId,
            assignedBy: req.user.id
        });

        res.json({
            message: 'Primary provider assigned successfully'
        });
    } catch (error) {
        logger.error('Assign provider error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to assign provider'
        });
    }
}

// Get provider's patients
export async function getProviderPatients(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        if (req.user.role !== 'provider') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only providers can access this endpoint'
            });
            return;
        }

        // Get provider ID from users table
        const providerResult = await query(
            'SELECT id FROM providers WHERE user_id = $1',
            [req.user.id]
        );

        if (providerResult.rows.length === 0) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider profile not found'
            });
            return;
        }

        const providerId = providerResult.rows[0].id;
        const patients = await getPatientsByProvider(providerId);

        res.json({
            patients,
            count: patients.length
        });
    } catch (error) {
        logger.error('Get provider patients error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch patients'
        });
    }
}
