/**
 * INNOVATION: Provider Analytics Service
 * Calculates efficiency metrics, ROI, and patient outcomes
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface ProviderMetrics {
  // Time savings
  aiSoapNotesGenerated: number;
  aiSoapNotesAccepted: number;
  aiSoapNotesModified: number;
  estimatedTimeSavedMinutes: number;

  // Patient engagement
  totalPatients: number;
  activePatients: number; // Checked in last 30 days
  averageMoodCheckinsPerPatient: number;
  patientEngagementRate: number; // % checking in regularly

  // Crisis management
  crisesDetected: number;
  crisesResolved: number;
  averageResolutionTimeHours: number;
  crisisPreventionRate: number; // % resolved before escalation

  // Risk management
  riskAlertsGenerated: number;
  riskAlertsResolved: number;
  averageAlertResolutionDays: number;

  // Clinical outcomes
  averagePatientMoodImprovement: number; // Change in mood over 30 days
  medicationAdherenceRate: number; // % completing pharm tasks

  // Encounter metrics
  totalEncounters: number;
  averageEncounterDurationMinutes: number;
  encountersWithAiSoap: number;
}

interface TimeSeriesData {
  date: string;
  aiSoapNotes: number;
  encounters: number;
  crisesDetected: number;
  timeSavedMinutes: number;
}

interface PatientOutcome {
  patientId: string;
  patientName: string;
  moodTrend: 'improving' | 'stable' | 'declining';
  currentStreak: number;
  moodChange30d: number;
  lastCheckIn: Date;
  activeAlerts: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive provider metrics
   */
  async getProviderMetrics(providerId: string, days: number = 30): Promise<ProviderMetrics> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Get provider's patients
    const patients = await this.prisma.patient.findMany({
      where: { providerId },
      select: {
        id: true,
        moodCheckins: {
          where: { day: { gte: cutoff } },
          select: { day: true, mood: true },
        },
        pharmTasks: {
          where: { createdAt: { gte: cutoff } },
          select: { status: true },
        },
      },
    });

    // AI SOAP metrics
    const aiSoapNotes = await this.prisma.caseNote.findMany({
      where: {
        providerId,
        createdAt: { gte: cutoff },
        generatedByAI: true,
      },
    });

    const aiSoapAccepted = aiSoapNotes.filter(n => n.generatedByAI === true).length;
    const aiSoapModified = aiSoapNotes.length - aiSoapAccepted;

    // Crisis metrics
    const crises = await this.prisma.riskAlert.findMany({
      where: {
        patient: { providerId },
        kind: 'crisis_detected',
        createdAt: { gte: cutoff },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const crisesResolved = crises.filter(c => c.resolvedAt !== null);
    const avgResolutionTime = this.calculateAverageResolutionTime(crisesResolved);

    // Risk alerts
    const riskAlerts = await this.prisma.riskAlert.findMany({
      where: {
        patient: { providerId },
        createdAt: { gte: cutoff },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const alertsResolved = riskAlerts.filter(a => a.resolvedAt !== null);
    const avgAlertResolution = this.calculateAverageResolutionDays(alertsResolved);

    // Patient engagement
    const activePatients = patients.filter(p => p.moodCheckins.length > 0).length;
    const totalCheckins = patients.reduce((sum, p) => sum + p.moodCheckins.length, 0);
    const avgCheckinsPerPatient = patients.length > 0 ? totalCheckins / patients.length : 0;

    // Medication adherence
    const allTasks = patients.flatMap(p => p.pharmTasks);
    const completedTasks = allTasks.filter(t => t.status === 'DONE').length;
    const adherenceRate = allTasks.length > 0 ? completedTasks / allTasks.length : 0;

    // Encounters
    const encounters = await this.prisma.encounter.findMany({
      where: {
        providerId,
        scheduledAt: { gte: cutoff },
      },
      select: {
        durationMinutes: true,
        caseNotes: {
          select: { generatedByAI: true },
        },
      },
    });

    const avgDuration = this.calculateAverage(
      encounters.map(e => e.durationMinutes || 0).filter(d => d > 0)
    );

    const encountersWithAI = encounters.filter(
      e => e.caseNotes.some(n => n.generatedByAI)
    ).length;

    // Mood improvement calculation
    const moodImprovement = await this.calculateMoodImprovement(patients);

    // Time savings: 15 min per AI SOAP note
    const timeSaved = aiSoapNotes.length * 15;

    return {
      aiSoapNotesGenerated: aiSoapNotes.length,
      aiSoapNotesAccepted: aiSoapAccepted,
      aiSoapNotesModified: aiSoapModified,
      estimatedTimeSavedMinutes: timeSaved,

      totalPatients: patients.length,
      activePatients,
      averageMoodCheckinsPerPatient: avgCheckinsPerPatient,
      patientEngagementRate: patients.length > 0 ? activePatients / patients.length : 0,

      crisesDetected: crises.length,
      crisesResolved: crisesResolved.length,
      averageResolutionTimeHours: avgResolutionTime,
      crisisPreventionRate: crises.length > 0 ? crisesResolved.length / crises.length : 0,

      riskAlertsGenerated: riskAlerts.length,
      riskAlertsResolved: alertsResolved.length,
      averageAlertResolutionDays: avgAlertResolution,

      averagePatientMoodImprovement: moodImprovement,
      medicationAdherenceRate: adherenceRate,

      totalEncounters: encounters.length,
      averageEncounterDurationMinutes: avgDuration,
      encountersWithAiSoap: encountersWithAI,
    };
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(providerId: string, days: number = 30): Promise<TimeSeriesData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data: TimeSeriesData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // AI SOAP notes for this day
      const aiSoapCount = await this.prisma.caseNote.count({
        where: {
          providerId,
          generatedByAI: true,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      // Encounters for this day
      const encounterCount = await this.prisma.encounter.count({
        where: {
          providerId,
          scheduledAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      // Crises detected
      const crisisCount = await this.prisma.riskAlert.count({
        where: {
          patient: { providerId },
          kind: 'crisis_detected',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        aiSoapNotes: aiSoapCount,
        encounters: encounterCount,
        crisesDetected: crisisCount,
        timeSavedMinutes: aiSoapCount * 15,
      });
    }

    return data;
  }

  /**
   * Get patient outcomes summary
   */
  async getPatientOutcomes(providerId: string, limit: number = 10): Promise<PatientOutcome[]> {
    const patients = await this.prisma.patient.findMany({
      where: { providerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        moodCheckins: {
          orderBy: { day: 'desc' },
          take: 30,
        },
        riskAlerts: {
          where: { resolvedAt: null },
        },
      },
      take: limit,
    });

    return patients.map(patient => {
      const checkins = patient.moodCheckins;
      const moodChange = this.calculateMoodChange(checkins);
      const trend = this.determineTrend(moodChange);
      const streak = this.calculateStreak(checkins);

      return {
        patientId: patient.id,
        patientName: `${patient.user.firstName} ${patient.user.lastName}`,
        moodTrend: trend,
        currentStreak: streak,
        moodChange30d: moodChange,
        lastCheckIn: checkins[0]?.day || new Date(0),
        activeAlerts: patient.riskAlerts.length,
      };
    });
  }

  /**
   * Helper: Calculate average resolution time in hours
   */
  private calculateAverageResolutionTime(items: Array<{ createdAt: Date; resolvedAt: Date | null }>): number {
    if (items.length === 0) return 0;

    const totalHours = items.reduce((sum, item) => {
      if (!item.resolvedAt) return sum;
      const hours = (item.resolvedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / items.length;
  }

  /**
   * Helper: Calculate average resolution time in days
   */
  private calculateAverageResolutionDays(items: Array<{ createdAt: Date; resolvedAt: Date | null }>): number {
    if (items.length === 0) return 0;

    const totalDays = items.reduce((sum, item) => {
      if (!item.resolvedAt) return sum;
      const days = (item.resolvedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / items.length;
  }

  /**
   * Helper: Calculate average
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Helper: Calculate mood improvement across patients
   */
  private async calculateMoodImprovement(patients: any[]): Promise<number> {
    let totalImprovement = 0;
    let count = 0;

    for (const patient of patients) {
      if (patient.moodCheckins.length < 2) continue;

      const recent = patient.moodCheckins.slice(0, 7);
      const older = patient.moodCheckins.slice(-7);

      if (recent.length === 0 || older.length === 0) continue;

      const recentAvg = recent.reduce((sum: number, c: any) => sum + c.mood, 0) / recent.length;
      const olderAvg = older.reduce((sum: number, c: any) => sum + c.mood, 0) / older.length;

      totalImprovement += (recentAvg - olderAvg);
      count++;
    }

    return count > 0 ? totalImprovement / count : 0;
  }

  /**
   * Helper: Calculate mood change from checkins
   */
  private calculateMoodChange(checkins: any[]): number {
    if (checkins.length < 2) return 0;

    const recent = checkins.slice(0, 7);
    const older = checkins.slice(-7);

    if (recent.length === 0 || older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, c) => sum + c.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.mood, 0) / older.length;

    return recentAvg - olderAvg;
  }

  /**
   * Helper: Determine trend from mood change
   */
  private determineTrend(moodChange: number): 'improving' | 'stable' | 'declining' {
    if (moodChange > 0.3) return 'improving';
    if (moodChange < -0.3) return 'declining';
    return 'stable';
  }

  /**
   * Helper: Calculate current streak
   */
  private calculateStreak(checkins: any[]): number {
    if (checkins.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const checkin of checkins) {
      const checkinDate = new Date(checkin.day);
      checkinDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
