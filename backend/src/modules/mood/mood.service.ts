import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateMoodCheckinDto,
  MoodCheckinResponseDto,
  DsmSummaryDto,
  MoodStatsDto,
} from './dto';

/**
 * Patch 04: Mood Check-ins Service
 * Handles DSM-aligned mood tracking with gamification
 */
@Injectable()
export class MoodService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a mood check-in
   * Awards points and emits CHECKIN_RECORDED event
   */
  async createCheckin(
    patientId: string,
    dto: CreateMoodCheckinDto,
  ): Promise<MoodCheckinResponseDto> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Parse day or use today
    const day = dto.day ? new Date(dto.day) : new Date();
    day.setHours(0, 0, 0, 0); // Reset to start of day

    // Check for duplicate check-in today
    const existing = await this.prisma.moodCheckin.findFirst({
      where: {
        patientId,
        day,
      },
    });

    if (existing) {
      throw new BadRequestException('You already checked in today! Come back tomorrow.');
    }

    // Create check-in
    const checkin = await this.prisma.moodCheckin.create({
      data: {
        patientId,
        day,
        mood: dto.mood,
        sleep: dto.sleep,
        energy: dto.energy,
        focus: dto.focus,
        appetite: dto.appetite,
        motivation: dto.motivation,
      },
    });

    // Calculate current streak
    const streak = await this.calculateStreak(patientId);

    // Award points (base 10, +5 per day of streak)
    const points = 10 + Math.min(streak * 5, 50); // Cap at 60 pts

    await this.prisma.gamificationEvent.create({
      data: {
        patientId,
        eventType: 'ONBOARDING_COMPLETE', // Reusing existing enum; could add MOOD_CHECKIN
        points,
        metadata: {
          checkinId: checkin.id,
          streak,
          scores: {
            mood: dto.mood,
            sleep: dto.sleep,
            energy: dto.energy,
            focus: dto.focus,
            appetite: dto.appetite,
            motivation: dto.motivation,
          },
        },
      },
    });

    // Emit event for background processing
    this.eventEmitter.emit('mood.checkin.recorded', {
      patientId,
      checkinId: checkin.id,
      day,
      streak,
    });

    // Generate encouragement message (grade-4 reading level)
    const message = this.generateEncouragementMessage(streak, points);

    return {
      success: true,
      checkinId: checkin.id,
      streak,
      points,
      message,
    };
  }

  /**
   * Calculate current streak
   * Counts consecutive days of check-ins
   */
  private async calculateStreak(patientId: string): Promise<number> {
    const checkins = await this.prisma.moodCheckin.findMany({
      where: { patientId },
      orderBy: { day: 'desc' },
      select: { day: true },
    });

    if (checkins.length === 0) {
      return 1; // First check-in
    }

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length - 1; i++) {
      const current = new Date(checkins[i].day);
      const next = new Date(checkins[i + 1].day);

      const daysDiff = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Generate encouragement message
   * Grade-4 reading level
   */
  private generateEncouragementMessage(streak: number, points: number): string {
    if (streak === 1) {
      return `Great start! You earned ${points} points. Check in again tomorrow!`;
    } else if (streak < 7) {
      return `${streak} days in a row! Keep it up. You earned ${points} points.`;
    } else if (streak < 30) {
      return `Wow! ${streak} day streak! You're doing amazing. ${points} points earned!`;
    } else {
      return `${streak} days! You're a superstar! ${points} points earned!`;
    }
  }

  /**
   * Get mood statistics for a patient
   */
  async getMoodStats(patientId: string): Promise<MoodStatsDto> {
    const checkins = await this.prisma.moodCheckin.findMany({
      where: { patientId },
      orderBy: { day: 'desc' },
    });

    if (checkins.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCheckins: 0,
        averages: {
          mood: 0,
          sleep: 0,
          energy: 0,
          focus: 0,
          appetite: 0,
          motivation: 0,
        },
        trend: 'stable',
      };
    }

    // Calculate current streak
    const currentStreak = await this.calculateStreak(patientId);

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 0; i < checkins.length - 1; i++) {
      const current = new Date(checkins[i].day);
      const next = new Date(checkins[i + 1].day);
      const daysDiff = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Calculate averages
    const sum = checkins.reduce(
      (acc, c) => ({
        mood: acc.mood + c.mood,
        sleep: acc.sleep + c.sleep,
        energy: acc.energy + c.energy,
        focus: acc.focus + c.focus,
        appetite: acc.appetite + c.appetite,
        motivation: acc.motivation + c.motivation,
      }),
      { mood: 0, sleep: 0, energy: 0, focus: 0, appetite: 0, motivation: 0 },
    );

    const averages = {
      mood: sum.mood / checkins.length,
      sleep: sum.sleep / checkins.length,
      energy: sum.energy / checkins.length,
      focus: sum.focus / checkins.length,
      appetite: sum.appetite / checkins.length,
      motivation: sum.motivation / checkins.length,
    };

    // Calculate trend (compare last 7 days to previous 7 days)
    const trend = this.calculateTrend(checkins);

    return {
      currentStreak,
      longestStreak,
      totalCheckins: checkins.length,
      averages,
      trend,
    };
  }

  /**
   * Calculate trend (improving/stable/worsening)
   */
  private calculateTrend(
    checkins: Array<{
      mood: number;
      sleep: number;
      energy: number;
      focus: number;
      appetite: number;
      motivation: number;
    }>,
  ): 'improving' | 'stable' | 'worsening' {
    if (checkins.length < 14) {
      return 'stable';
    }

    const recent = checkins.slice(0, 7);
    const previous = checkins.slice(7, 14);

    const recentAvg =
      recent.reduce((sum, c) => sum + c.mood + c.energy + c.motivation, 0) /
      (recent.length * 3);
    const previousAvg =
      previous.reduce((sum, c) => sum + c.mood + c.energy + c.motivation, 0) /
      (previous.length * 3);

    const diff = recentAvg - previousAvg;

    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'worsening';
    return 'stable';
  }

  /**
   * Get DSM summaries for a patient
   * Returns cached precomputed summaries
   */
  async getDsmSummaries(
    patientId: string,
    windows: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d'],
  ): Promise<DsmSummaryDto[]> {
    const summaries = await this.prisma.dsmSummary.findMany({
      where: {
        patientId,
        window: { in: windows.map(w => w.toUpperCase().replace('D', '_DAYS') as any) },
      },
    });

    return summaries.map(s => ({
      window: s.window.toLowerCase().replace('_days', 'd') as '7d' | '30d' | '90d',
      conditionCode: s.conditionCode,
      conditionName: this.getConditionName(s.conditionCode),
      confidence: s.confidence,
      matchedCriteria: s.matchedCriteria as Record<string, number> | null,
      interpretation: this.generateInterpretation(s.conditionCode, s.confidence),
      lastRunAt: s.lastRunAt.toISOString(),
    }));
  }

  /**
   * Get condition name from code
   */
  private getConditionName(code: string | null): string | null {
    const names: Record<string, string> = {
      MDD: 'Depression',
      GAD: 'Anxiety',
      BP2: 'Bipolar II',
      ADHD_INATTENTIVE: 'ADHD',
      INSOMNIA: 'Insomnia',
    };
    return code ? names[code] || code : null;
  }

  /**
   * Generate plain-language interpretation
   * Grade-4 reading level
   */
  private generateInterpretation(
    code: string | null,
    confidence: number | null,
  ): string {
    if (!code || !confidence) {
      return 'Your provider will review your check-ins.';
    }

    if (confidence < 0.3) {
      return 'Not enough information yet. Keep checking in!';
    }

    const conditionName = this.getConditionName(code);
    if (confidence < 0.5) {
      return `Some signs of ${conditionName}. Your provider will talk with you about this.`;
    } else if (confidence < 0.75) {
      return `Patterns suggest ${conditionName}. Your provider will review this with you.`;
    } else {
      return `Strong patterns of ${conditionName}. Your provider will discuss treatment options.`;
    }
  }

  /**
   * Get recent check-ins for a patient
   */
  async getRecentCheckins(patientId: string, limit: number = 30) {
    return this.prisma.moodCheckin.findMany({
      where: { patientId },
      orderBy: { day: 'desc' },
      take: limit,
    });
  }
}
