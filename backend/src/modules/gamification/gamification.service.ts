import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a gamification event and award points
   */
  async recordEvent(data: {
    patientId: string;
    eventType: 'SESSION_COMPLETED' | 'MEDICATION_ADHERENCE' | 'SIDE_EFFECT_REPORT' | 'SAFETY_CHECK' | 'LAB_COMPLETED' | 'ACHIEVEMENT_UNLOCKED';
    points: number;
    metadata?: any;
  }) {
    const event = await this.prisma.gamificationEvent.create({
      data: {
        patientId: data.patientId,
        eventType: data.eventType,
        points: data.points,
        metadata: data.metadata || {},
      },
    });

    // Check for achievement unlocks
    await this.checkAchievements(data.patientId);

    return event;
  }

  /**
   * Get gamification summary for a patient
   */
  async getSummary(patientId: string) {
    const [totalPoints, achievements, recentEvents, stats] = await Promise.all([
      this.prisma.gamificationEvent.aggregate({
        where: { patientId },
        _sum: { points: true },
      }),
      this.prisma.patientAchievement.findMany({
        where: { patientId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.prisma.gamificationEvent.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.gamificationEvent.groupBy({
        by: ['eventType'],
        where: { patientId },
        _count: { eventType: true },
      }),
    ]);

    return {
      totalPoints: totalPoints._sum.points || 0,
      achievements: achievements.map(a => ({
        ...a.achievement,
        unlockedAt: a.unlockedAt,
      })),
      recentEvents,
      stats,
    };
  }

  /**
   * Check and unlock achievements
   */
  private async checkAchievements(patientId: string) {
    const events = await this.prisma.gamificationEvent.findMany({
      where: { patientId },
    });

    const sessionCount = events.filter(e => e.eventType === 'SESSION_COMPLETED').length;
    const safetyChecks = events.filter(e => e.eventType === 'SAFETY_CHECK').length;

    // Check for "First Session" achievement
    if (sessionCount === 1) {
      await this.unlockAchievement(patientId, 'first_session');
    }

    // Check for "Safety Expert" achievement
    if (safetyChecks >= 10) {
      await this.unlockAchievement(patientId, 'safety_expert');
    }

    // Check for "7-Day Streak" achievement
    // (simplified - would need more complex logic for actual streaks)
    if (sessionCount >= 7) {
      await this.unlockAchievement(patientId, 'streak_7');
    }
  }

  /**
   * Unlock an achievement for a patient
   */
  async unlockAchievement(patientId: string, achievementKey: string) {
    // Check if achievement exists
    const achievement = await this.prisma.achievement.findUnique({
      where: { key: achievementKey },
    });

    if (!achievement) {
      return; // Achievement doesn't exist
    }

    // Check if already unlocked
    const existing = await this.prisma.patientAchievement.findUnique({
      where: {
        patientId_achievementId: {
          patientId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return; // Already unlocked
    }

    // Unlock achievement
    const unlocked = await this.prisma.patientAchievement.create({
      data: {
        patientId,
        achievementId: achievement.id,
      },
      include: {
        achievement: true,
      },
    });

    // Record event with points
    await this.prisma.gamificationEvent.create({
      data: {
        patientId,
        eventType: 'ACHIEVEMENT_UNLOCKED',
        points: achievement.points,
        metadata: {
          achievementKey,
          achievementName: achievement.name,
        },
      },
    });

    return unlocked;
  }
}
