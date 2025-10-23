/**
 * INNOVATION: Crisis Detection & Intervention System
 * Real-time monitoring for mental health crises using AI pattern analysis
 *
 * Detection Algorithms:
 * 1. Severe mood decline (mood < -1.5 for 3+ consecutive days)
 * 2. High-risk keywords in check-in notes (if implemented)
 * 3. Sudden drop in all dimensions (activation → crash pattern)
 * 4. Extended disengagement (no check-ins for 7+ days after active streak)
 * 5. Multiple HIGH severity risk alerts unresolved
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface CrisisIndicator {
  type: 'severe_mood_decline' | 'sudden_drop' | 'disengagement' | 'high_risk_alerts';
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  evidence: any;
}

@Injectable()
export class CrisisDetectionWorker {
  private readonly logger = new Logger(CrisisDetectionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Run every 4 hours to detect crisis patterns
   * More frequent than nightly workers due to safety-critical nature
   */
  @Cron('0 */4 * * *')
  async runCrisisDetection() {
    this.logger.log('Starting crisis detection scan...');

    try {
      // Get all active patients (checked in within last 90 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);

      const patients = await this.prisma.patient.findMany({
        where: {
          moodCheckins: {
            some: {
              day: { gte: cutoff },
            },
          },
        },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Scanning ${patients.length} active patients for crisis indicators`);

      let detected = 0;
      let errors = 0;

      for (const patient of patients) {
        try {
          const indicators = await this.detectCrisisIndicators(patient.id);

          if (indicators.length > 0) {
            await this.handleCrisisDetection(patient.id, indicators);
            detected++;
          }
        } catch (error) {
          this.logger.error(`Failed to scan patient ${patient.id}:`, error);
          errors++;
        }
      }

      this.logger.log(
        `Crisis detection complete: ${detected} crises detected, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error('Crisis detection scan failed:', error);
    }
  }

  /**
   * Detect crisis indicators for a single patient
   */
  private async detectCrisisIndicators(patientId: string): Promise<CrisisIndicator[]> {
    const indicators: CrisisIndicator[] = [];

    // 1. Check for severe mood decline
    const moodDeclineIndicator = await this.checkSevereMoodDecline(patientId);
    if (moodDeclineIndicator) indicators.push(moodDeclineIndicator);

    // 2. Check for sudden drop across all dimensions
    const suddenDropIndicator = await this.checkSuddenDrop(patientId);
    if (suddenDropIndicator) indicators.push(suddenDropIndicator);

    // 3. Check for disengagement
    const disengagementIndicator = await this.checkDisengagement(patientId);
    if (disengagementIndicator) indicators.push(disengagementIndicator);

    // 4. Check for multiple unresolved high-risk alerts
    const highRiskAlertsIndicator = await this.checkHighRiskAlerts(patientId);
    if (highRiskAlertsIndicator) indicators.push(highRiskAlertsIndicator);

    return indicators;
  }

  /**
   * Algorithm 1: Severe mood decline (mood < -1.5 for 3+ consecutive days)
   */
  private async checkSevereMoodDecline(patientId: string): Promise<CrisisIndicator | null> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recent = await this.prisma.moodCheckin.findMany({
      where: {
        patientId,
        day: { gte: cutoff },
      },
      orderBy: { day: 'desc' },
      take: 7,
      select: {
        day: true,
        mood: true,
      },
    });

    if (recent.length < 3) return null;

    // Check for 3+ consecutive days with mood < -1.5
    let consecutiveLow = 0;
    for (const checkin of recent) {
      if (checkin.mood <= -1.5) {
        consecutiveLow++;
        if (consecutiveLow >= 3) {
          return {
            type: 'severe_mood_decline',
            severity: 'CRITICAL',
            message: 'Severe mood decline detected for 3+ consecutive days',
            evidence: {
              consecutiveDays: consecutiveLow,
              recentMoods: recent.map(c => ({ day: c.day, mood: c.mood })),
            },
          };
        }
      } else {
        consecutiveLow = 0;
      }
    }

    return null;
  }

  /**
   * Algorithm 2: Sudden drop across all dimensions (activation → crash pattern)
   */
  private async checkSuddenDrop(patientId: string): Promise<CrisisIndicator | null> {
    const recent = await this.prisma.moodCheckin.findMany({
      where: { patientId },
      orderBy: { day: 'desc' },
      take: 7,
      select: {
        day: true,
        mood: true,
        sleep: true,
        energy: true,
        focus: true,
        appetite: true,
        motivation: true,
      },
    });

    if (recent.length < 4) return null;

    // Compare last 2 days to previous 2 days
    const last2 = recent.slice(0, 2);
    const prev2 = recent.slice(2, 4);

    const avg = (items: any[], key: string) =>
      items.reduce((sum, item) => sum + item[key], 0) / items.length;

    const dimensions = ['mood', 'sleep', 'energy', 'focus', 'appetite', 'motivation'];
    let droppedDimensions = 0;

    for (const dim of dimensions) {
      const lastAvg = avg(last2, dim);
      const prevAvg = avg(prev2, dim);

      // Drop of 2+ points across dimension
      if (lastAvg - prevAvg <= -2) {
        droppedDimensions++;
      }
    }

    // If 4+ dimensions dropped significantly
    if (droppedDimensions >= 4) {
      return {
        type: 'sudden_drop',
        severity: 'HIGH',
        message: `Sudden drop detected across ${droppedDimensions} dimensions`,
        evidence: {
          droppedDimensions,
          last2Days: last2,
          prev2Days: prev2,
        },
      };
    }

    return null;
  }

  /**
   * Algorithm 3: Extended disengagement (no check-ins for 7+ days after active streak)
   */
  private async checkDisengagement(patientId: string): Promise<CrisisIndicator | null> {
    const recent = await this.prisma.moodCheckin.findMany({
      where: { patientId },
      orderBy: { day: 'desc' },
      take: 30,
      select: { day: true },
    });

    if (recent.length === 0) return null;

    const lastCheckin = new Date(recent[0].day);
    const daysSince = Math.floor((Date.now() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));

    // Had active streak (10+ check-ins in last 30 days) but no check-in for 7+ days
    if (recent.length >= 10 && daysSince >= 7) {
      return {
        type: 'disengagement',
        severity: 'MEDIUM',
        message: `No check-ins for ${daysSince} days after active engagement`,
        evidence: {
          daysSinceLastCheckin: daysSince,
          totalRecentCheckins: recent.length,
          lastCheckinDate: lastCheckin,
        },
      };
    }

    return null;
  }

  /**
   * Algorithm 4: Multiple unresolved high-risk alerts
   */
  private async checkHighRiskAlerts(patientId: string): Promise<CrisisIndicator | null> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const highRiskAlerts = await this.prisma.riskAlert.count({
      where: {
        patientId,
        severity: 'HIGH',
        resolvedAt: null,
        createdAt: { gte: cutoff },
      },
    });

    if (highRiskAlerts >= 2) {
      return {
        type: 'high_risk_alerts',
        severity: 'HIGH',
        message: `${highRiskAlerts} unresolved high-risk alerts in last 14 days`,
        evidence: {
          count: highRiskAlerts,
        },
      };
    }

    return null;
  }

  /**
   * Handle detected crisis by creating alert and notifying stakeholders
   */
  private async handleCrisisDetection(
    patientId: string,
    indicators: CrisisIndicator[],
  ) {
    const highestSeverity = this.getHighestSeverity(indicators);

    this.logger.warn(`🚨 Crisis detected for patient ${patientId}: ${highestSeverity}`);

    // Create crisis alert in database
    await this.prisma.riskAlert.create({
      data: {
        patientId,
        kind: 'crisis_detected',
        severity: highestSeverity,
        message: `Crisis detection: ${indicators.map(i => i.type).join(', ')}`,
        source: {
          indicators: indicators.map(i => ({
            type: i.type,
            severity: i.severity,
            message: i.message,
            evidence: i.evidence,
          })),
          detectedAt: new Date().toISOString(),
        },
      },
    });

    // Update patient alert status to EMERGENCY
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { alertStatus: 'EMERGENCY' },
    });

    // Emit event for real-time notifications
    this.eventEmitter.emit('crisis.detected', {
      patientId,
      severity: highestSeverity,
      indicators,
      timestamp: new Date(),
    });

    // Log for monitoring/alerting systems
    this.logger.error(
      `🚨 CRISIS ALERT: Patient ${patientId} | Severity: ${highestSeverity} | Indicators: ${indicators.length}`,
    );
  }

  /**
   * Get highest severity from multiple indicators
   */
  private getHighestSeverity(indicators: CrisisIndicator[]): 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (indicators.some(i => i.severity === 'CRITICAL')) return 'CRITICAL';
    if (indicators.some(i => i.severity === 'HIGH')) return 'HIGH';
    return 'MEDIUM';
  }
}
