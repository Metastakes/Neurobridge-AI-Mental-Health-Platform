// backend/src/controllers/provider.controller.ts
import { Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { query } from '../config/database.js';
import {
    getAllProviders,
    getProviderById,
    getProviderByUserId,
    getProviderWithStats,
    updateProviderProfile,
    updateProviderUserDetails,
    getProviderAvailability,
    setProviderAvailability,
    deleteProviderAvailability,
    getProvidersBySpecialty,
    getAvailableProviders,
    getProviderStatistics
} from '../models/provider.model.js';

// List all providers
export async function listProviders(req: Request, res: Response): Promise<void> {
    try {
        const {
            specialty,
            acceptsNewPatients,
            isActive,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        const filters = {
            specialty: specialty as string,
            acceptsNewPatients: acceptsNewPatients === 'true' ? true : acceptsNewPatients === 'false' ? false : undefined,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            search: search as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const { providers, total } = await getAllProviders(filters);

        res.json({
            providers,
            total,
            limit: filters.limit,
            offset: filters.offset
        });
    } catch (error) {
        logger.error('List providers error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch providers'
        });
    }
}

// Get provider by ID
export async function getProvider(req: Request, res: Response): Promise<void> {
    try {
        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderById(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        res.json({ provider });
    } catch (error) {
        logger.error('Get provider error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider'
        });
    }
}

// Get provider with statistics
export async function getProviderWithStatistics(req: Request, res: Response): Promise<void> {
    try {
        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderWithStats(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        res.json({ provider });
    } catch (error) {
        logger.error('Get provider with stats error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider statistics'
        });
    }
}

// Get current provider's profile
export async function getCurrentProvider(req: Request, res: Response): Promise<void> {
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

        const provider = await getProviderByUserId(req.user.id);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider profile not found'
            });
            return;
        }

        // Get statistics
        const stats = await getProviderStatistics(provider.id);

        res.json({
            provider,
            statistics: stats
        });
    } catch (error) {
        logger.error('Get current provider error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider profile'
        });
    }
}

// Update provider profile
export async function updateProvider(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderById(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        // Authorization: providers can only update their own profile
        // Mentors can update any provider
        if (req.user.role === 'provider' && provider.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to update this provider'
            });
            return;
        }

        const {
            name,
            phone,
            specialty,
            license_number,
            years_of_experience,
            bio,
            education,
            certifications,
            languages_spoken,
            accepts_new_patients,
            hourly_rate
        } = req.body;

        // Update user details if provided
        if (name !== undefined || phone !== undefined) {
            await updateProviderUserDetails(provider.user_id, {
                name,
                phone
            });
        }

        // Update provider-specific fields
        await updateProviderProfile(providerId, {
            specialty,
            license_number,
            years_of_experience,
            bio,
            education,
            certifications,
            languages_spoken,
            accepts_new_patients,
            hourly_rate
        });

        // Audit log
        await query(
            `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'PROVIDER_UPDATE', 'provider', providerId, JSON.stringify(req.body)]
        );

        logger.info('Provider updated', {
            providerId,
            updatedBy: req.user.id,
            role: req.user.role
        });

        // Fetch updated provider
        const updatedProvider = await getProviderById(providerId);

        res.json({
            message: 'Provider updated successfully',
            provider: updatedProvider
        });
    } catch (error) {
        logger.error('Update provider error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update provider'
        });
    }
}

// Get providers by specialty
export async function getProvidersBySpecialtyEndpoint(req: Request, res: Response): Promise<void> {
    try {
        const { specialty } = req.params;

        if (!specialty) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Specialty is required'
            });
            return;
        }

        const providers = await getProvidersBySpecialty(specialty);

        res.json({
            providers,
            count: providers.length,
            specialty
        });
    } catch (error) {
        logger.error('Get providers by specialty error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch providers'
        });
    }
}

// Get available providers (accepting new patients)
export async function listAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
        const providers = await getAvailableProviders();

        res.json({
            providers,
            count: providers.length
        });
    } catch (error) {
        logger.error('Get available providers error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch available providers'
        });
    }
}

// Get provider availability schedule
export async function getAvailabilitySchedule(req: Request, res: Response): Promise<void> {
    try {
        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderById(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        const availability = await getProviderAvailability(providerId);

        res.json({
            provider_id: providerId,
            provider_name: provider.name,
            availability
        });
    } catch (error) {
        logger.error('Get provider availability error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider availability'
        });
    }
}

// Set provider availability (provider only)
export async function setAvailabilitySchedule(req: Request, res: Response): Promise<void> {
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
                message: 'Only providers can set availability'
            });
            return;
        }

        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderById(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        // Verify provider owns this profile
        if (provider.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You can only set your own availability'
            });
            return;
        }

        const { dayOfWeek, startTime, endTime, isAvailable = true } = req.body;

        // Validate day of week (0-6)
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
            });
            return;
        }

        const availability = await setProviderAvailability(
            providerId,
            dayOfWeek,
            startTime,
            endTime,
            isAvailable
        );

        logger.info('Provider availability set', {
            providerId,
            dayOfWeek,
            startTime,
            endTime,
            isAvailable
        });

        res.json({
            message: 'Availability set successfully',
            availability
        });
    } catch (error) {
        logger.error('Set provider availability error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to set provider availability'
        });
    }
}

// Delete provider availability (provider only)
export async function deleteAvailability(req: Request, res: Response): Promise<void> {
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
                message: 'Only providers can delete availability'
            });
            return;
        }

        const availabilityId = parseInt(req.params.availabilityId);

        if (isNaN(availabilityId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid availability ID'
            });
            return;
        }

        // Verify availability exists and belongs to this provider
        const availabilityCheck = await query(
            `SELECT pa.id, pa.provider_id, pr.user_id
             FROM provider_availability pa
             JOIN providers pr ON pa.provider_id = pr.id
             WHERE pa.id = $1`,
            [availabilityId]
        );

        if (availabilityCheck.rows.length === 0) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Availability not found'
            });
            return;
        }

        if (availabilityCheck.rows[0].user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own availability'
            });
            return;
        }

        const deleted = await deleteProviderAvailability(availabilityId);

        if (!deleted) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Availability not found'
            });
            return;
        }

        logger.info('Provider availability deleted', {
            availabilityId,
            deletedBy: req.user.id
        });

        res.json({
            message: 'Availability deleted successfully'
        });
    } catch (error) {
        logger.error('Delete provider availability error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete provider availability'
        });
    }
}

// Get provider statistics
export async function getStatistics(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const providerId = parseInt(req.params.id);

        if (isNaN(providerId)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid provider ID'
            });
            return;
        }

        const provider = await getProviderById(providerId);

        if (!provider) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Provider not found'
            });
            return;
        }

        // Authorization: providers can only see their own stats
        // Mentors can see all stats
        if (req.user.role === 'provider' && provider.user_id !== req.user.id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to view these statistics'
            });
            return;
        }

        const statistics = await getProviderStatistics(providerId);

        res.json({
            provider_id: providerId,
            provider_name: provider.name,
            statistics
        });
    } catch (error) {
        logger.error('Get provider statistics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider statistics'
        });
    }
}
