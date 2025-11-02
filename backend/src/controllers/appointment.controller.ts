// backend/src/controllers/appointment.controller.ts
import { Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { query } from '../config/database.js';
import {
    getAllAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    getUpcomingAppointmentsForPatient,
    getUpcomingAppointmentsForProvider,
    getAppointmentHistoryForPatient,
    hasSchedulingConflict,
    updateAppointmentStatus,
    AppointmentType,
    AppointmentStatus
} from '../models/appointment.model.js';
import { getPatientByUserId } from '../models/patient.model.js';

// List appointments with filters
export async function listAppointments(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const {
            patientId,
            providerId,
            status,
            startDate,
            endDate,
            appointmentType,
            limit = 50,
            offset = 0
        } = req.query;

        // Authorization: patients can only see their own appointments
        let effectivePatientId = patientId ? parseInt(patientId as string) : undefined;

        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient) {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'Patient profile not found'
                });
                return;
            }
            effectivePatientId = patient.id;
        }

        const filters = {
            patientId: effectivePatientId,
            providerId: providerId ? parseInt(providerId as string) : undefined,
            status: status as AppointmentStatus,
            startDate: startDate as string,
            endDate: endDate as string,
            appointmentType: appointmentType as AppointmentType,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const { appointments, total } = await getAllAppointments(filters);

        res.json({
            appointments,
            total,
            limit: filters.limit,
            offset: filters.offset
        });
    } catch (error) {
        logger.error('List appointments error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch appointments'
        });
    }
}

// Get appointment by ID
export async function getAppointment(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment ID'
            });
            return;
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Appointment not found'
            });
            return;
        }

        // Authorization: patients can only see their own appointments
        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient || patient.id !== appointment.patient_id) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to access this appointment'
                });
                return;
            }
        }

        // Providers can only see their own appointments
        if (req.user.role === 'provider') {
            const providerResult = await query(
                'SELECT id FROM providers WHERE user_id = $1',
                [req.user.id]
            );

            if (providerResult.rows.length === 0 || providerResult.rows[0].id !== appointment.provider_id) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to access this appointment'
                });
                return;
            }
        }

        res.json({ appointment });
    } catch (error) {
        logger.error('Get appointment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch appointment'
        });
    }
}

// Create appointment
export async function bookAppointment(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const {
            providerId,
            appointmentType,
            scheduledStart,
            scheduledEnd,
            googleCalendarEventId,
            notes
        } = req.body;

        // Validate appointment type
        const validTypes: AppointmentType[] = [
            'initial_consultation',
            'follow_up',
            'therapy_session',
            'medication_review',
            'crisis_intervention'
        ];

        if (!validTypes.includes(appointmentType)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment type'
            });
            return;
        }

        // Get patient ID
        let patientId: number;

        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient) {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'Patient profile not found'
                });
                return;
            }
            patientId = patient.id;
        } else if (req.user.role === 'provider' || req.user.role === 'mentor') {
            // Providers/mentors can book on behalf of patients
            if (!req.body.patientId) {
                res.status(400).json({
                    error: 'Bad Request',
                    message: 'Patient ID is required'
                });
                return;
            }
            patientId = req.body.patientId;
        } else {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid role for booking appointments'
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

        // Validate date range
        const start = new Date(scheduledStart);
        const end = new Date(scheduledEnd);

        if (start >= end) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Scheduled end must be after scheduled start'
            });
            return;
        }

        if (start < new Date()) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot schedule appointments in the past'
            });
            return;
        }

        // Check for scheduling conflicts
        const hasConflict = await hasSchedulingConflict(
            providerId,
            scheduledStart,
            scheduledEnd
        );

        if (hasConflict) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Provider has a scheduling conflict at this time'
            });
            return;
        }

        // Create appointment
        const appointment = await createAppointment({
            patientId,
            providerId,
            appointmentType,
            scheduledStart,
            scheduledEnd,
            googleCalendarEventId,
            notes
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.id,
                'APPOINTMENT_CREATE',
                'appointment',
                appointment.id,
                JSON.stringify({ patientId, providerId, appointmentType })
            ]
        );

        logger.info('Appointment created', {
            appointmentId: appointment.id,
            patientId,
            providerId,
            createdBy: req.user.id
        });

        // Fetch full appointment details
        const fullAppointment = await getAppointmentById(appointment.id);

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment: fullAppointment
        });
    } catch (error) {
        logger.error('Create appointment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create appointment'
        });
    }
}

// Update appointment
export async function modifyAppointment(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment ID'
            });
            return;
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Appointment not found'
            });
            return;
        }

        // Authorization check
        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient || patient.id !== appointment.patient_id) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to modify this appointment'
                });
                return;
            }
        }

        const {
            appointmentType,
            scheduledStart,
            scheduledEnd,
            status,
            googleCalendarEventId,
            notes
        } = req.body;

        // If rescheduling, check for conflicts
        if (scheduledStart || scheduledEnd) {
            const newStart = scheduledStart || appointment.scheduled_start;
            const newEnd = scheduledEnd || appointment.scheduled_end;

            const start = new Date(newStart);
            const end = new Date(newEnd);

            if (start >= end) {
                res.status(400).json({
                    error: 'Bad Request',
                    message: 'Scheduled end must be after scheduled start'
                });
                return;
            }

            const hasConflict = await hasSchedulingConflict(
                appointment.provider_id,
                newStart,
                newEnd,
                appointmentId
            );

            if (hasConflict) {
                res.status(409).json({
                    error: 'Conflict',
                    message: 'Provider has a scheduling conflict at this time'
                });
                return;
            }
        }

        const updatedAppointment = await updateAppointment(appointmentId, {
            appointmentType,
            scheduledStart,
            scheduledEnd,
            status,
            googleCalendarEventId,
            notes
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'APPOINTMENT_UPDATE', 'appointment', appointmentId, JSON.stringify(req.body)]
        );

        logger.info('Appointment updated', {
            appointmentId,
            updatedBy: req.user.id
        });

        const refreshedAppointment = await getAppointmentById(appointmentId);

        res.json({
            message: 'Appointment updated successfully',
            appointment: refreshedAppointment
        });
    } catch (error) {
        logger.error('Update appointment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update appointment'
        });
    }
}

// Cancel appointment
export async function cancelAppointmentRequest(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const appointmentId = parseInt(req.params.id);
        const { cancellationReason } = req.body;

        if (isNaN(appointmentId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment ID'
            });
            return;
        }

        if (!cancellationReason || cancellationReason.trim().length === 0) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Cancellation reason is required'
            });
            return;
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Appointment not found'
            });
            return;
        }

        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Appointment is already cancelled'
            });
            return;
        }

        // Authorization check
        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient || patient.id !== appointment.patient_id) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to cancel this appointment'
                });
                return;
            }
        }

        const cancelledAppointment = await cancelAppointment(appointmentId, cancellationReason);

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.id,
                'APPOINTMENT_CANCEL',
                'appointment',
                appointmentId,
                JSON.stringify({ cancellationReason })
            ]
        );

        logger.info('Appointment cancelled', {
            appointmentId,
            cancelledBy: req.user.id,
            reason: cancellationReason
        });

        const refreshedAppointment = await getAppointmentById(appointmentId);

        res.json({
            message: 'Appointment cancelled successfully',
            appointment: refreshedAppointment
        });
    } catch (error) {
        logger.error('Cancel appointment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to cancel appointment'
        });
    }
}

// Delete appointment (hard delete - admin only)
export async function removeAppointment(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        // Only mentors can hard delete
        if (req.user.role !== 'mentor') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only administrators can delete appointments'
            });
            return;
        }

        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment ID'
            });
            return;
        }

        const deleted = await deleteAppointment(appointmentId);

        if (!deleted) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Appointment not found'
            });
            return;
        }

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, 'APPOINTMENT_DELETE', 'appointment', appointmentId]
        );

        logger.info('Appointment deleted', {
            appointmentId,
            deletedBy: req.user.id
        });

        res.json({
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        logger.error('Delete appointment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete appointment'
        });
    }
}

// Get upcoming appointments
export async function getUpcomingAppointments(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

        let appointments;

        if (req.user.role === 'patient') {
            const patient = await getPatientByUserId(req.user.id);
            if (!patient) {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'Patient profile not found'
                });
                return;
            }
            appointments = await getUpcomingAppointmentsForPatient(patient.id, limit);
        } else if (req.user.role === 'provider') {
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

            appointments = await getUpcomingAppointmentsForProvider(providerResult.rows[0].id, limit);
        } else {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid role for this endpoint'
            });
            return;
        }

        res.json({
            appointments,
            count: appointments.length
        });
    } catch (error) {
        logger.error('Get upcoming appointments error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch upcoming appointments'
        });
    }
}

// Get appointment history
export async function getAppointmentHistory(req: Request, res: Response): Promise<void> {
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

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const appointments = await getAppointmentHistoryForPatient(patient.id, limit);

        res.json({
            appointments,
            count: appointments.length
        });
    } catch (error) {
        logger.error('Get appointment history error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch appointment history'
        });
    }
}

// Update appointment status (provider only)
export async function changeAppointmentStatus(req: Request, res: Response): Promise<void> {
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
                message: 'Only providers can update appointment status'
            });
            return;
        }

        const appointmentId = parseInt(req.params.id);
        const { status } = req.body;

        if (isNaN(appointmentId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid appointment ID'
            });
            return;
        }

        const validStatuses: AppointmentStatus[] = [
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        ];

        if (!validStatuses.includes(status)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid status'
            });
            return;
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Appointment not found'
            });
            return;
        }

        // Verify provider owns this appointment
        const providerResult = await query(
            'SELECT id FROM providers WHERE user_id = $1',
            [req.user.id]
        );

        if (providerResult.rows.length === 0 || providerResult.rows[0].id !== appointment.provider_id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to update this appointment'
            });
            return;
        }

        const updatedAppointment = await updateAppointmentStatus(appointmentId, status);

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'APPOINTMENT_STATUS_UPDATE', 'appointment', appointmentId, JSON.stringify({ status })]
        );

        logger.info('Appointment status updated', {
            appointmentId,
            newStatus: status,
            updatedBy: req.user.id
        });

        const refreshedAppointment = await getAppointmentById(appointmentId);

        res.json({
            message: 'Appointment status updated successfully',
            appointment: refreshedAppointment
        });
    } catch (error) {
        logger.error('Update appointment status error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update appointment status'
        });
    }
}
