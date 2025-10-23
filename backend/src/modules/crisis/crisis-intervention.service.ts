/**
 * Crisis Intervention Service
 * Handles crisis intervention documentation and tracking
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateInterventionDto {
  crisisId: string;
  actionsTaken: string[];
  notes: string;
  contactedEmergencyServices: boolean;
  contactedEmergencyContact: boolean;
  scheduledFollowUp: boolean;
  followUpDate?: string;
  resolution: 'resolved' | 'ongoing' | 'escalated';
  resolutionNotes?: string;
}

export interface CrisisAlertDetails {
  id: string;
  patientId: string;
  patientName: string;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium';
  riskScore: number;
  indicators: string[];
  triggerEvent?: {
    type: string;
    content: string;
    timestamp: string;
  };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  safetyPlan?: {
    warningSigns: string[];
    copingStrategies: string[];
    professionalSupport: string[];
    emergencyNumbers: string[];
  };
  recentActivity?: {
    lastMoodCheck?: {
      mood: string;
      timestamp: string;
      notes?: string;
    };
    lastAppointment?: {
      date: string;
      type: string;
    };
    medicationCompliance?: {
      status: 'compliant' | 'partial' | 'non-compliant';
      missedDoses: number;
    };
  };
}

@Injectable()
export class CrisisInterventionService {
  private readonly logger = new Logger(CrisisInterventionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get detailed crisis alert information for provider intervention
   */
  async getCrisisDetails(crisisId: string, providerId: string): Promise<CrisisAlertDetails> {
    // Get the crisis alert
    const alert = await this.prisma.riskAlert.findUnique({
      where: { id: crisisId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            moodCheckins: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            encounters: {
              where: {
                status: 'COMPLETED',
              },
              orderBy: { completedAt: 'desc' },
              take: 1,
            },
            medications: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Crisis alert ${crisisId} not found`);
    }

    // Verify provider has access to this patient
    if (alert.patient.providerId && alert.patient.providerId !== providerId) {
      throw new NotFoundException(`Crisis alert ${crisisId} not found`);
    }

    // Parse source JSON to extract indicators and trigger event
    const source = alert.source as any || {};
    const indicators = source.indicators || [alert.message];
    const triggerEvent = source.triggerEvent;

    // Get emergency contacts (mock data - would come from patient profile)
    const emergencyContacts = alert.patient.emergencyContact ? [
      {
        id: 'ec1',
        name: alert.patient.emergencyContact,
        relationship: 'Emergency Contact',
        phone: alert.patient.emergencyPhone || '',
        isPrimary: true,
      },
    ] : [];

    // Get safety plan (mock data - would come from patient safety plan record)
    const safetyPlan = {
      warningSigns: [
        'Feeling overwhelmed or hopeless',
        'Withdrawal from friends and family',
        'Difficulty sleeping or sleeping too much',
        'Loss of interest in activities',
      ],
      copingStrategies: [
        'Deep breathing exercises',
        'Call a trusted friend or family member',
        'Take a walk or do light exercise',
        'Listen to calming music',
        'Write in a journal',
      ],
      professionalSupport: [
        `Provider: ${alert.patient.user.email}`,
        '988 Suicide & Crisis Lifeline',
        'Crisis Text Line: Text HELLO to 741741',
      ],
      emergencyNumbers: [
        '988 - Suicide & Crisis Lifeline',
        '911 - Emergency Services',
        '1-800-662-4357 - SAMHSA National Helpline',
      ],
    };

    // Calculate risk score (0-100)
    const riskScore = alert.severity === 'HIGH' ? 85 : alert.severity === 'MODERATE' ? 60 : 35;

    // Get recent mood check
    const lastMoodCheck = alert.patient.moodCheckins[0];
    const moodEmojis = ['😞', '😟', '😐', '🙂', '😊'];
    const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];
    const moodIndex = lastMoodCheck ? lastMoodCheck.mood + 2 : 2; // Convert -2..+2 to 0..4

    // Get last appointment
    const lastAppointment = alert.patient.encounters[0];

    // Calculate medication compliance
    const activeMedications = alert.patient.medications;
    // This is a simplified calculation - would need adherence tracking in real app
    const medicationCompliance = activeMedications.length > 0 ? {
      status: 'compliant' as const,
      missedDoses: 0,
    } : undefined;

    return {
      id: alert.id,
      patientId: alert.patientId,
      patientName: `${alert.patient.user.firstName} ${alert.patient.user.lastName}`,
      detectedAt: alert.createdAt.toISOString(),
      severity: alert.severity === 'HIGH' ? 'critical' : alert.severity === 'MODERATE' ? 'high' : 'medium',
      riskScore,
      indicators,
      triggerEvent,
      emergencyContacts,
      safetyPlan,
      recentActivity: {
        lastMoodCheck: lastMoodCheck ? {
          mood: `${moodEmojis[moodIndex]} ${moodLabels[moodIndex]}`,
          timestamp: lastMoodCheck.createdAt.toISOString(),
        } : undefined,
        lastAppointment: lastAppointment ? {
          date: lastAppointment.completedAt?.toISOString() || lastAppointment.scheduledAt.toISOString(),
          type: 'Therapy Session',
        } : undefined,
        medicationCompliance,
      },
    };
  }

  /**
   * Document a crisis intervention
   */
  async createIntervention(
    dto: CreateInterventionDto,
    providerId: string,
  ) {
    try {
      // Get the crisis alert to verify it exists and get patient ID
      const alert = await this.prisma.riskAlert.findUnique({
        where: { id: dto.crisisId },
        select: { id: true, patientId: true },
      });

      if (!alert) {
        throw new NotFoundException(`Crisis alert ${dto.crisisId} not found`);
      }

      // Create the intervention record
      const intervention = await this.prisma.crisisIntervention.create({
        data: {
          crisisId: dto.crisisId,
          providerId,
          patientId: alert.patientId,
          actionsTaken: dto.actionsTaken,
          notes: dto.notes,
          contactedEmergencyServices: dto.contactedEmergencyServices,
          contactedEmergencyContact: dto.contactedEmergencyContact,
          scheduledFollowUp: dto.scheduledFollowUp,
          followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
          resolution: dto.resolution,
          resolutionNotes: dto.resolutionNotes,
        },
      });

      this.logger.log(
        `Crisis intervention documented: ${intervention.id} by provider ${providerId} for crisis ${dto.crisisId}`
      );

      // If resolution is 'resolved', mark the crisis alert as resolved
      if (dto.resolution === 'resolved') {
        await this.prisma.riskAlert.update({
          where: { id: dto.crisisId },
          data: {
            resolvedAt: new Date(),
            source: {
              ...(alert as any).source,
              intervention: {
                interventionId: intervention.id,
                resolvedBy: providerId,
                resolvedAt: new Date().toISOString(),
              },
            },
          },
        });

        // Check if patient has any other unresolved crisis alerts
        const otherCrises = await this.prisma.riskAlert.count({
          where: {
            patientId: alert.patientId,
            kind: { in: ['crisis_detected', 'safety_check_requested'] },
            resolvedAt: null,
            id: { not: dto.crisisId },
          },
        });

        // If no other crises, downgrade patient alert status
        if (otherCrises === 0) {
          await this.prisma.patient.update({
            where: { id: alert.patientId },
            data: { alertStatus: 'STABLE' },
          });

          this.logger.log(`Patient ${alert.patientId} alert status downgraded to STABLE`);
        }
      }

      return {
        success: true,
        intervention: {
          ...intervention,
          timestamp: intervention.createdAt.toISOString(),
        },
        message: 'Crisis intervention documented successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to create intervention: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get intervention history for a patient
   */
  async getPatientInterventions(patientId: string, limit: number = 10) {
    return this.prisma.crisisIntervention.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        crisisId: true,
        providerId: true,
        actionsTaken: true,
        notes: true,
        contactedEmergencyServices: true,
        contactedEmergencyContact: true,
        scheduledFollowUp: true,
        followUpDate: true,
        resolution: true,
        resolutionNotes: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get intervention history for a provider
   */
  async getProviderInterventions(providerId: string, limit: number = 20) {
    return this.prisma.crisisIntervention.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        crisisId: true,
        patientId: true,
        actionsTaken: true,
        resolution: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get statistics for crisis interventions
   */
  async getProviderInterventionStats(providerId: string, days: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const interventions = await this.prisma.crisisIntervention.findMany({
      where: {
        providerId,
        createdAt: { gte: cutoff },
      },
      select: {
        resolution: true,
        contactedEmergencyServices: true,
        scheduledFollowUp: true,
        createdAt: true,
      },
    });

    const stats = {
      total: interventions.length,
      resolved: interventions.filter(i => i.resolution === 'resolved').length,
      ongoing: interventions.filter(i => i.resolution === 'ongoing').length,
      escalated: interventions.filter(i => i.resolution === 'escalated').length,
      emergencyServicesContacted: interventions.filter(i => i.contactedEmergencyServices).length,
      followUpsScheduled: interventions.filter(i => i.scheduledFollowUp).length,
    };

    return stats;
  }
}
