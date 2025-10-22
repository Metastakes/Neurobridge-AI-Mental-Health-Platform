import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  RiskAlertsResponseDto,
  RiskAlertDto,
  ResolveAlertDto,
  ScanPatientDto,
  RiskScoreDto,
} from './dto';

/**
 * Patch 04: Risk Service
 * Fuses medication changes + mood patterns to detect clinical risks
 * Early intervention for activation, worsening, nonadherence
 */
@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get active risk alerts for a patient
   */
  async getPatientAlerts(patientId: string): Promise<RiskAlertsResponseDto> {
    const allAlerts = await this.prisma.riskAlert.findMany({
      where: { patientId },
      orderBy: [
        { resolvedAt: 'asc' }, // Unresolved first (null sorts first)
        { createdAt: 'desc' },
      ],
    });

    const activeAlerts = allAlerts
      .filter(a => !a.resolvedAt)
      .map(a => this.mapAlertToDto(a));

    const resolvedCount = allAlerts.filter(a => a.resolvedAt).length;
    const highSeverityCount = activeAlerts.filter(a => a.severity === 'HIGH').length;

    return {
      activeAlerts,
      resolvedCount,
      highSeverityCount,
    };
  }

  /**
   * Resolve a risk alert
   */
  async resolveAlert(dto: ResolveAlertDto, providerId: string): Promise<{ success: boolean }> {
    const alert = await this.prisma.riskAlert.findUnique({
      where: { id: dto.alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.prisma.riskAlert.update({
      where: { id: dto.alertId },
      data: {
        resolvedAt: new Date(),
        source: {
          ...(alert.source as any),
          resolution: dto.resolution,
          resolvedBy: providerId,
          notes: dto.notes,
        },
      },
    });

    this.logger.log(`Alert ${dto.alertId} resolved by provider ${providerId}`);
    return { success: true };
  }

  /**
   * Scan patient for risks
   * Correlates recent medication changes with mood patterns
   */
  async scanPatient(dto: ScanPatientDto): Promise<RiskScoreDto> {
    const windowDays = dto.windowDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    this.logger.debug(`Scanning patient ${dto.patientId} for risks (${windowDays}d window)`);

    // Fetch patient data
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: {
        medications: {
          where: {
            OR: [
              { status: 'ACTIVE' },
              { startedAt: { gte: cutoffDate } },
              { stoppedAt: { gte: cutoffDate } },
            ],
          },
        },
        moodCheckins: {
          where: { day: { gte: cutoffDate } },
          orderBy: { day: 'asc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Calculate risk scores
    const activationScore = this.calculateActivationRisk(patient);
    const worseningScore = this.calculateWorseningRisk(patient);
    const nonadherenceScore = this.calculateNonadherenceRisk(patient);

    // Determine overall risk
    const maxScore = Math.max(activationScore, worseningScore, nonadherenceScore);
    let overallRisk: 'low' | 'moderate' | 'high';
    if (maxScore >= 0.7) overallRisk = 'high';
    else if (maxScore >= 0.4) overallRisk = 'moderate';
    else overallRisk = 'low';

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      activation: activationScore,
      worsening: worseningScore,
      nonadherence: nonadherenceScore,
    }, patient);

    // Create alerts for high-risk conditions
    await this.createAlertsFromScores(dto.patientId, {
      activation: activationScore,
      worsening: worseningScore,
      nonadherence: nonadherenceScore,
    }, patient);

    return {
      patientId: dto.patientId,
      overallRisk,
      scores: {
        activation: activationScore,
        worsening: worseningScore,
        nonadherence: nonadherenceScore,
      },
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate activation risk
   * Recent SSRI/SNRI start + increased anxiety/agitation
   */
  private calculateActivationRisk(patient: any): number {
    const recentMeds = patient.medications.filter((m: any) => {
      if (!m.startedAt) return false;
      const daysSinceStart = Math.floor(
        (Date.now() - m.startedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceStart <= 14; // Within 2 weeks
    });

    // Check for SSRI/SNRI/bupropion
    const activatingMeds = recentMeds.filter((m: any) => {
      const name = m.name.toLowerCase();
      return (
        name.includes('sertraline') ||
        name.includes('fluoxetine') ||
        name.includes('escitalopram') ||
        name.includes('venlafaxine') ||
        name.includes('bupropion') ||
        name.includes('paroxetine')
      );
    });

    if (activatingMeds.length === 0) return 0;

    // Check mood pattern (increased anxiety/agitation)
    const checkins = patient.moodCheckins;
    if (checkins.length < 3) return 0.3; // Limited data, low risk

    const recent = checkins.slice(-3);
    const baseline = checkins.slice(0, Math.max(1, checkins.length - 3));

    if (baseline.length === 0) return 0.3;

    const recentAvg = recent.reduce((sum: number, c: any) => sum + c.mood + c.energy, 0) / (recent.length * 2);
    const baselineAvg = baseline.reduce((sum: number, c: any) => sum + c.mood + c.energy, 0) / (baseline.length * 2);

    // If mood/energy increased significantly (activation pattern)
    const delta = recentAvg - baselineAvg;
    if (delta > 1.5) return 0.8; // High risk
    if (delta > 1.0) return 0.6; // Moderate risk
    if (delta > 0.5) return 0.4; // Mild activation

    return 0.2; // On new med but no clear activation
  }

  /**
   * Calculate worsening depression risk
   * Declining mood despite treatment
   */
  private calculateWorseningRisk(patient: any): number {
    const checkins = patient.moodCheckins;
    if (checkins.length < 7) return 0; // Need at least a week

    const recent = checkins.slice(-7);
    const avgMood = recent.reduce((sum: number, c: any) => sum + c.mood, 0) / recent.length;
    const avgEnergy = recent.reduce((sum: number, c: any) => sum + c.energy, 0) / recent.length;
    const avgMotivation = recent.reduce((sum: number, c: any) => sum + c.motivation, 0) / recent.length;

    // Calculate trend (are things getting worse?)
    let worseningCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].mood < recent[i - 1].mood) worseningCount++;
    }

    const worseningRatio = worseningCount / (recent.length - 1);

    // Severe depression symptoms
    if (avgMood < -1.5 && avgEnergy < -1.5 && avgMotivation < -1.5) return 0.9;
    if (avgMood < -1 && avgEnergy < -1) return 0.7;
    if (avgMood < -0.5 && worseningRatio > 0.6) return 0.5; // Getting worse

    return 0.2;
  }

  /**
   * Calculate medication nonadherence risk
   * Missing check-ins, inconsistent patterns
   */
  private calculateNonadherenceRisk(patient: any): number {
    const checkins = patient.moodCheckins;
    if (checkins.length === 0) return 0.8; // No data = high risk

    // Calculate expected check-ins (should be daily)
    const firstCheckin = checkins[0];
    const lastCheckin = checkins[checkins.length - 1];
    const daysDiff = Math.floor(
      (lastCheckin.day.getTime() - firstCheckin.day.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === 0) return 0.3; // Single check-in

    const expectedCheckins = daysDiff + 1;
    const actualCheckins = checkins.length;
    const adherenceRate = actualCheckins / expectedCheckins;

    // Check for recent gaps
    const recentGapDays = Math.floor(
      (Date.now() - lastCheckin.day.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (recentGapDays > 7) return 0.7; // Haven't checked in for a week
    if (recentGapDays > 3) return 0.5;
    if (adherenceRate < 0.3) return 0.6; // Low overall adherence
    if (adherenceRate < 0.5) return 0.4;

    return 0.1; // Good adherence
  }

  /**
   * Generate clinical recommendations
   */
  private generateRecommendations(scores: any, patient: any): string[] {
    const recs: string[] = [];

    if (scores.activation >= 0.6) {
      recs.push('HIGH PRIORITY: Monitor for activation syndrome - recent SSRI/SNRI start');
      recs.push('Consider dose adjustment or switching if anxiety worsens');
      recs.push('Schedule follow-up within 3-5 days');
    } else if (scores.activation >= 0.4) {
      recs.push('Monitor for activation - patient on new antidepressant');
      recs.push('Check-in within 1 week');
    }

    if (scores.worsening >= 0.7) {
      recs.push('URGENT: Depression worsening despite treatment');
      recs.push('Assess for safety concerns');
      recs.push('Consider medication adjustment or therapy intensification');
    } else if (scores.worsening >= 0.5) {
      recs.push('Mood declining - review treatment plan');
      recs.push('Consider augmentation or switch');
    }

    if (scores.nonadherence >= 0.6) {
      recs.push('Patient engagement declining - missing check-ins');
      recs.push('Outreach recommended to assess barriers');
      recs.push('Consider motivational interviewing or adherence support');
    }

    if (recs.length === 0) {
      recs.push('No significant risks detected');
      recs.push('Continue current treatment plan');
    }

    return recs;
  }

  /**
   * Create risk alerts based on scores
   */
  private async createAlertsFromScores(patientId: string, scores: any, patient: any) {
    // Check for existing similar alerts in last 7 days
    const recentAlerts = await this.prisma.riskAlert.findMany({
      where: {
        patientId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Activation alert
    if (scores.activation >= 0.6) {
      const exists = recentAlerts.some(a => a.kind === 'activation');
      if (!exists) {
        await this.prisma.riskAlert.create({
          data: {
            patientId,
            kind: 'activation',
            severity: scores.activation >= 0.7 ? 'HIGH' : 'MODERATE',
            message: `Patient started antidepressant recently. Mood/energy increased significantly. Monitor for activation syndrome.`,
            source: {
              activationScore: scores.activation,
              recentMeds: patient.medications.slice(0, 3).map((m: any) => m.name),
            },
          },
        });
        this.logger.log(`Created activation alert for patient ${patientId}`);
      }
    }

    // Worsening alert
    if (scores.worsening >= 0.7) {
      const exists = recentAlerts.some(a => a.kind === 'worsening_depression');
      if (!exists) {
        await this.prisma.riskAlert.create({
          data: {
            patientId,
            kind: 'worsening_depression',
            severity: 'HIGH',
            message: `Depression symptoms worsening. Mood, energy, and motivation all declining. Assess for safety.`,
            source: {
              worseningScore: scores.worsening,
              recentCheckins: patient.moodCheckins.slice(-7).length,
            },
          },
        });
        this.logger.log(`Created worsening alert for patient ${patientId}`);
      }
    }

    // Nonadherence alert
    if (scores.nonadherence >= 0.7) {
      const exists = recentAlerts.some(a => a.kind === 'nonadherence');
      if (!exists) {
        await this.prisma.riskAlert.create({
          data: {
            patientId,
            kind: 'nonadherence',
            severity: 'MODERATE',
            message: `Patient disengaged - missing check-ins. Outreach recommended.`,
            source: {
              nonadherenceScore: scores.nonadherence,
              lastCheckin: patient.moodCheckins[patient.moodCheckins.length - 1]?.day,
            },
          },
        });
        this.logger.log(`Created nonadherence alert for patient ${patientId}`);
      }
    }
  }

  /**
   * Map Prisma alert to DTO
   */
  private mapAlertToDto(alert: any): RiskAlertDto {
    return {
      id: alert.id,
      patientId: alert.patientId,
      kind: alert.kind,
      severity: alert.severity,
      message: alert.message,
      source: alert.source as Record<string, any> | null,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() || null,
    };
  }

  /**
   * Event handler: Scan patient when mood check-in recorded
   */
  @OnEvent('mood.checkin.recorded')
  async handleMoodCheckin(payload: { patientId: string; checkinId: string }) {
    this.logger.debug(`Mood check-in recorded for patient ${payload.patientId} - scanning for risks`);

    try {
      await this.scanPatient({ patientId: payload.patientId, windowDays: 30 });
    } catch (error) {
      this.logger.error(`Failed to scan patient ${payload.patientId}:`, error);
    }
  }

  /**
   * Event handler: Scan patient when medication ordered
   */
  @OnEvent('medication.ordered')
  async handleMedicationOrdered(payload: { patientId: string; medicationId: string }) {
    this.logger.debug(`Medication ordered for patient ${payload.patientId} - scanning for risks`);

    try {
      await this.scanPatient({ patientId: payload.patientId, windowDays: 14 });
    } catch (error) {
      this.logger.error(`Failed to scan patient ${payload.patientId}:`, error);
    }
  }
}
