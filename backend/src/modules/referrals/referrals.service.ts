import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReferrerType, ReferralStatus } from '@prisma/client';
import {
  TrackReferralDto,
  ClaimReferralRewardDto,
  GenerateReferralCodeDto,
  ReferralStatsDto,
  UpdateReferralStatusDto,
  UpdateProviderProfileDto,
} from './dto';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique referral code
   */
  async generateReferralCode(
    userId: string,
    userType: ReferrerType,
    dto?: GenerateReferralCodeDto,
  ): Promise<{ referralCode: string; profileUrl?: string }> {
    // Check if user already has a referral code
    const existingCode = await this.getUserReferralCode(userId, userType);
    if (existingCode) {
      throw new ConflictException('User already has a referral code');
    }

    let referralCode: string;
    let profileUrl: string | undefined;

    if (dto?.customCode) {
      // Validate custom code
      const normalized = dto.customCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normalized.length < 4 || normalized.length > 20) {
        throw new BadRequestException('Custom code must be 4-20 alphanumeric characters');
      }

      // Check if code is already taken
      const existingPatient = await this.prisma.patient.findUnique({
        where: { referralCode: normalized },
      });
      const existingProvider = await this.prisma.provider.findUnique({
        where: { referralCode: normalized },
      });
      if (existingPatient || existingProvider) {
        throw new ConflictException('Referral code already taken');
      }

      referralCode = normalized;
    } else {
      // Auto-generate code
      referralCode = await this.generateUniqueCode(userType);
    }

    // Update user with referral code
    if (userType === ReferrerType.PATIENT) {
      await this.prisma.patient.update({
        where: { id: userId },
        data: { referralCode },
      });
    } else {
      // For providers, also generate profile URL
      const provider = await this.prisma.provider.findUnique({
        where: { id: userId },
        include: { user: true },
      });

      if (!provider) {
        throw new NotFoundException('Provider not found');
      }

      // Generate profile URL from name if not custom
      if (!provider.profileUrl) {
        profileUrl = this.generateProfileUrl(provider.user.firstName, provider.user.lastName);
      }

      await this.prisma.provider.update({
        where: { id: userId },
        data: { referralCode, profileUrl },
      });
    }

    return { referralCode, profileUrl };
  }

  /**
   * Track a referral signup
   */
  async trackReferralSignup(dto: TrackReferralDto): Promise<any> {
    // Find the referrer by referral code
    const patient = await this.prisma.patient.findUnique({
      where: { referralCode: dto.referralCode },
    });
    const provider = await this.prisma.provider.findUnique({
      where: { referralCode: dto.referralCode },
    });

    if (!patient && !provider) {
      throw new NotFoundException('Invalid referral code');
    }

    const referrerType = patient ? ReferrerType.PATIENT : ReferrerType.PROVIDER;
    const referrerId = patient?.id || provider?.id;

    // Create referral record
    const referral = await this.prisma.referral.create({
      data: {
        referrerType,
        patientId: patient?.id,
        providerId: provider?.id,
        refereeType: dto.userType,
        referralCode: dto.referralCode,
        status: ReferralStatus.PENDING,
        metadata: dto.metadata,
      },
    });

    // Award signup points (50 points)
    if (referrerType === ReferrerType.PATIENT) {
      await this.prisma.gamificationEvent.create({
        data: {
          patientId: patient!.id,
          eventType: 'REFERRAL_SIGNUP',
          points: 50,
          metadata: {
            referralId: referral.id,
            refereeEmail: dto.email,
          },
        },
      });
    }

    return {
      success: true,
      referralId: referral.id,
      pointsAwarded: referrerType === ReferrerType.PATIENT ? 50 : 0,
      bonusAwarded: referrerType === ReferrerType.PROVIDER ? 25 : 0,
    };
  }

  /**
   * Update referral status (called when referee completes milestones)
   */
  async updateReferralStatus(referralId: string, dto: UpdateReferralStatusDto): Promise<any> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        patient: true,
        provider: true,
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Calculate rewards based on status
    let pointsAwarded = 0;
    let bonusAwarded = 0;

    if (dto.status === ReferralStatus.SIGNED_UP && referral.status === ReferralStatus.PENDING) {
      // No additional reward for signup (already awarded in trackReferralSignup)
    } else if (dto.status === ReferralStatus.ONBOARDED && referral.status === ReferralStatus.SIGNED_UP) {
      pointsAwarded = 50; // +50 points for onboarding
    } else if (dto.status === ReferralStatus.FIRST_SESSION) {
      pointsAwarded = 100; // +100 points for first session
      bonusAwarded = referral.referrerType === ReferrerType.PROVIDER ? 50 : 0; // +$50 for provider
    } else if (dto.status === ReferralStatus.ACTIVE) {
      bonusAwarded = referral.referrerType === ReferrerType.PROVIDER ? 100 : 0; // +$100 for provider
    }

    // Update referral
    const updated = await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: dto.status,
        ...(dto.status === ReferralStatus.SIGNED_UP && { signupDate: new Date(dto.statusDate || Date.now()) }),
        ...(dto.status === ReferralStatus.FIRST_SESSION && { firstSessionDate: new Date(dto.statusDate || Date.now()) }),
        ...(pointsAwarded > 0 || bonusAwarded > 0
          ? {
              rewardAmount: (referral.rewardAmount || 0) + pointsAwarded + bonusAwarded,
            }
          : {}),
      },
    });

    // Award points to patient
    if (pointsAwarded > 0 && referral.referrerType === ReferrerType.PATIENT) {
      await this.prisma.gamificationEvent.create({
        data: {
          patientId: referral.patientId!,
          eventType: dto.status === ReferralStatus.FIRST_SESSION ? 'REFERRAL_FIRST_SESSION' : 'REFERRAL_SIGNUP',
          points: pointsAwarded,
          metadata: {
            referralId: referral.id,
            newStatus: dto.status,
          },
        },
      });
    }

    // Award bonus to provider
    if (bonusAwarded > 0 && referral.referrerType === ReferrerType.PROVIDER) {
      await this.prisma.provider.update({
        where: { id: referral.providerId! },
        data: {
          referralBonus: {
            increment: bonusAwarded,
          },
        },
      });
    }

    // Check for milestone rewards
    await this.checkMilestoneRewards(referral.referrerType === ReferrerType.PATIENT ? referral.patientId! : referral.providerId!, referral.referrerType);

    return {
      success: true,
      referralId: updated.id,
      newStatus: updated.status,
      pointsAwarded,
      bonusAwarded,
    };
  }

  /**
   * Get referral stats for a patient
   */
  async getPatientReferralStats(patientId: string): Promise<ReferralStatsDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        referralsGiven: {
          include: {
            refereePatient: {
              include: { user: true },
            },
            refereeProvider: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.referralCode) {
      throw new BadRequestException('Patient does not have a referral code yet');
    }

    const totalReferrals = patient.referralsGiven.length;
    const pendingReferrals = patient.referralsGiven.filter((r) => r.status === ReferralStatus.PENDING).length;
    const completedReferrals = patient.referralsGiven.filter((r) => r.status === ReferralStatus.FIRST_SESSION || r.status === ReferralStatus.ACTIVE).length;

    // Calculate total points earned from referrals
    const gamificationEvents = await this.prisma.gamificationEvent.findMany({
      where: {
        patientId,
        eventType: { in: ['REFERRAL_SIGNUP', 'REFERRAL_FIRST_SESSION'] },
      },
    });
    const totalPointsEarned = gamificationEvents.reduce((sum, event) => sum + event.points, 0);

    // Get next reward
    const nextReward = await this.getNextReward(patientId, ReferrerType.PATIENT);

    // Format referrals
    const referrals = patient.referralsGiven.map((r) => {
      const refereeName =
        r.refereePatient?.user
          ? `${r.refereePatient.user.firstName} ${r.refereePatient.user.lastName.charAt(0)}.`
          : r.refereeProvider?.user
          ? `${r.refereeProvider.user.firstName} ${r.refereeProvider.user.lastName.charAt(0)}.`
          : 'Unknown';

      return {
        id: r.id,
        refereeName,
        status: r.status,
        signupDate: r.signupDate,
        firstSessionDate: r.firstSessionDate,
        pointsEarned: r.rewardAmount || 0,
        bonusEarned: 0,
        rewardClaimed: r.rewardClaimed,
        createdAt: r.createdAt,
      };
    });

    return {
      referralCode: patient.referralCode,
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalPointsEarned,
      totalBonusEarned: 0,
      nextReward,
      referrals,
    };
  }

  /**
   * Get referral stats for a provider
   */
  async getProviderReferralStats(providerId: string): Promise<ReferralStatsDto> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        referralsGiven: {
          include: {
            refereePatient: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.referralCode) {
      throw new BadRequestException('Provider does not have a referral code yet');
    }

    const totalReferrals = provider.referralsGiven.length;
    const pendingReferrals = provider.referralsGiven.filter((r) => r.status === ReferralStatus.PENDING).length;
    const completedReferrals = provider.referralsGiven.filter((r) => r.status === ReferralStatus.FIRST_SESSION || r.status === ReferralStatus.ACTIVE).length;

    const nextReward = await this.getNextReward(providerId, ReferrerType.PROVIDER);

    const referrals = provider.referralsGiven.map((r) => ({
      id: r.id,
      refereeName: r.refereePatient?.user
        ? `${r.refereePatient.user.firstName} ${r.refereePatient.user.lastName.charAt(0)}.`
        : 'Unknown',
      status: r.status,
      signupDate: r.signupDate,
      firstSessionDate: r.firstSessionDate,
      pointsEarned: 0,
      bonusEarned: r.rewardAmount || 0,
      rewardClaimed: r.rewardClaimed,
      createdAt: r.createdAt,
    }));

    return {
      referralCode: provider.referralCode,
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalPointsEarned: 0,
      totalBonusEarned: provider.referralBonus,
      nextReward,
      referrals,
    };
  }

  /**
   * Claim a referral reward
   */
  async claimReferralReward(dto: ClaimReferralRewardDto): Promise<any> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: dto.referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.rewardClaimed) {
      throw new BadRequestException('Reward already claimed');
    }

    if (!referral.rewardAmount || referral.rewardAmount === 0) {
      throw new BadRequestException('No reward available to claim');
    }

    // Mark as claimed
    await this.prisma.referral.update({
      where: { id: dto.referralId },
      data: {
        rewardClaimed: true,
        rewardClaimedAt: new Date(),
      },
    });

    return {
      success: true,
      rewardAmount: referral.rewardAmount,
      rewardType: referral.rewardType,
    };
  }

  /**
   * Update provider profile
   */
  async updateProviderProfile(providerId: string, dto: UpdateProviderProfileDto): Promise<any> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Validate profile URL if provided
    if (dto.profileUrl) {
      const normalized = dto.profileUrl.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const existing = await this.prisma.provider.findUnique({
        where: { profileUrl: normalized },
      });
      if (existing && existing.id !== providerId) {
        throw new ConflictException('Profile URL already taken');
      }
      dto.profileUrl = normalized;
    }

    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        ...(dto.bio && { bio: dto.bio }),
        ...(dto.specialties && { specialties: dto.specialties }),
        ...(dto.credentials && { credentials: dto.credentials }),
        ...(dto.profileUrl && { profileUrl: dto.profileUrl }),
      },
    });

    return updated;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async generateUniqueCode(userType: ReferrerType): Promise<string> {
    const prefix = userType === ReferrerType.PATIENT ? 'PAT' : 'PRO';
    let code: string;
    let attempts = 0;

    do {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `${prefix}${random}`;
      attempts++;

      if (attempts > 10) {
        throw new Error('Failed to generate unique referral code');
      }

      const existingPatient = await this.prisma.patient.findUnique({ where: { referralCode: code } });
      const existingProvider = await this.prisma.provider.findUnique({ where: { referralCode: code } });

      if (!existingPatient && !existingProvider) {
        break;
      }
    } while (true);

    return code;
  }

  private generateProfileUrl(firstName: string, lastName: string): string {
    const base = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z-]/g, '');
    return base;
  }

  private async getUserReferralCode(userId: string, userType: ReferrerType): Promise<string | null> {
    if (userType === ReferrerType.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { id: userId } });
      return patient?.referralCode || null;
    } else {
      const provider = await this.prisma.provider.findUnique({ where: { id: userId } });
      return provider?.referralCode || null;
    }
  }

  private async getNextReward(userId: string, userType: ReferrerType): Promise<any> {
    // Get completed referrals
    const referrals = await this.prisma.referral.findMany({
      where: {
        ...(userType === ReferrerType.PATIENT ? { patientId: userId } : { providerId: userId }),
        status: { in: [ReferralStatus.FIRST_SESSION, ReferralStatus.ACTIVE] },
      },
    });

    const completedCount = referrals.length;

    // Get reward tiers
    const rewards = await this.prisma.referralReward.findMany({
      where: {
        isActive: true,
        applicableTo: { has: userType },
        referralCount: { gt: completedCount },
      },
      orderBy: { referralCount: 'asc' },
      take: 1,
    });

    if (rewards.length === 0) {
      return null;
    }

    const nextReward = rewards[0];
    return {
      name: nextReward.name,
      progress: completedCount,
      target: nextReward.referralCount,
      reward: `${nextReward.rewardType}: ${nextReward.rewardAmount}`,
    };
  }

  private async checkMilestoneRewards(userId: string, userType: ReferrerType): Promise<void> {
    // Get completed referrals count
    const completedReferrals = await this.prisma.referral.count({
      where: {
        ...(userType === ReferrerType.PATIENT ? { patientId: userId } : { providerId: userId }),
        status: { in: [ReferralStatus.FIRST_SESSION, ReferralStatus.ACTIVE] },
      },
    });

    // Check if any milestone rewards are unlocked
    const unlockedRewards = await this.prisma.referralReward.findMany({
      where: {
        isActive: true,
        applicableTo: { has: userType },
        referralCount: { lte: completedReferrals },
      },
    });

    // Award milestone rewards (implementation depends on reward type)
    for (const reward of unlockedRewards) {
      // TODO: Implement reward awarding logic
      // For now, this is a placeholder
      console.log(`Milestone reward unlocked: ${reward.name} for user ${userId}`);
    }
  }
}
