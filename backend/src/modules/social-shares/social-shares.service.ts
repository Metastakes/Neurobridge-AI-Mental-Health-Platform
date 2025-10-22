import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ShareType, Platform, ReferrerType } from '@prisma/client';
import {
  GenerateShareCardDto,
  TrackShareDto,
  ShareCardDto,
  ShareAnalyticsDto,
  UserShareStatsDto,
} from './dto';

@Injectable()
export class SocialSharesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a shareable card
   */
  async generateShareCard(userId: string, userType: ReferrerType, dto: GenerateShareCardDto): Promise<ShareCardDto> {
    // Verify user exists
    if (userType === ReferrerType.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { id: userId } });
      if (!patient) throw new NotFoundException('Patient not found');
    } else {
      const provider = await this.prisma.provider.findUnique({ where: { id: userId } });
      if (!provider) throw new NotFoundException('Provider not found');
    }

    // Generate content based on share type
    const content = await this.generateShareContent(userId, userType, dto);

    // Create share record
    const share = await this.prisma.socialShare.create({
      data: {
        ...(userType === ReferrerType.PATIENT ? { patientId: userId } : { providerId: userId }),
        shareType: dto.shareType,
        platform: dto.platform,
        title: dto.customTitle || content.title,
        description: dto.customDescription || content.description,
        imageUrl: content.imageUrl,
        shareUrl: content.shareUrl,
        pointsEarned: 0, // Will be awarded when share is tracked
        metadata: {
          achievementId: dto.achievementId,
          milestoneName: dto.milestoneName,
        },
      },
    });

    // Format share text for platform
    const shareText = this.formatShareText(dto.platform, content.title, content.description, content.shareUrl);

    return {
      shareId: share.id,
      title: share.title,
      description: share.description,
      imageUrl: share.imageUrl!,
      shareUrl: share.shareUrl,
      platform: share.platform,
      shareText,
      pointsEarned: 25, // Points to be earned after sharing
    };
  }

  /**
   * Track a share (when user posts or when someone clicks)
   */
  async trackShare(dto: TrackShareDto): Promise<any> {
    const share = await this.prisma.socialShare.findUnique({
      where: { id: dto.shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    if (dto.action === 'posted') {
      // Award points when user posts the share
      const pointsToAward = 25;

      await this.prisma.socialShare.update({
        where: { id: dto.shareId },
        data: { pointsEarned: pointsToAward },
      });

      // Award gamification points (if patient)
      if (share.patientId) {
        await this.prisma.gamificationEvent.create({
          data: {
            patientId: share.patientId,
            eventType: 'SOCIAL_SHARE',
            points: pointsToAward,
            metadata: {
              shareId: share.id,
              shareType: share.shareType,
              platform: share.platform,
            },
          },
        });
      }

      return {
        success: true,
        pointsEarned: pointsToAward,
      };
    } else if (dto.action === 'clicked') {
      // Track click
      await this.prisma.socialShare.update({
        where: { id: dto.shareId },
        data: { clicks: { increment: 1 } },
      });

      return {
        success: true,
        clicks: share.clicks + 1,
      };
    } else if (dto.action === 'signup') {
      // Track signup from share
      await this.prisma.socialShare.update({
        where: { id: dto.shareId },
        data: { signups: { increment: 1 } },
      });

      return {
        success: true,
        signups: share.signups + 1,
      };
    }

    throw new BadRequestException('Invalid action type');
  }

  /**
   * Get analytics for a specific share
   */
  async getShareAnalytics(shareId: string): Promise<ShareAnalyticsDto> {
    const share = await this.prisma.socialShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    return {
      shareId: share.id,
      title: share.title,
      shareType: share.shareType,
      platform: share.platform,
      clicks: share.clicks,
      signups: share.signups,
      pointsEarned: share.pointsEarned,
      createdAt: share.createdAt,
    };
  }

  /**
   * Get user's share statistics
   */
  async getUserShareStats(userId: string, userType: ReferrerType): Promise<UserShareStatsDto> {
    const shares = await this.prisma.socialShare.findMany({
      where: {
        ...(userType === ReferrerType.PATIENT ? { patientId: userId } : { providerId: userId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const totalShares = shares.length;
    const totalClicks = shares.reduce((sum, s) => sum + s.clicks, 0);
    const totalSignups = shares.reduce((sum, s) => sum + s.signups, 0);
    const totalPointsEarned = shares.reduce((sum, s) => sum + s.pointsEarned, 0);

    // Platform distribution
    const platformDistribution = {
      INSTAGRAM: shares.filter((s) => s.platform === Platform.INSTAGRAM).length,
      FACEBOOK: shares.filter((s) => s.platform === Platform.FACEBOOK).length,
      LINKEDIN: shares.filter((s) => s.platform === Platform.LINKEDIN).length,
      TWITTER: shares.filter((s) => s.platform === Platform.TWITTER).length,
    };

    // Recent shares (last 10)
    const recentShares = shares.slice(0, 10).map((s) => ({
      shareId: s.id,
      title: s.title,
      shareType: s.shareType,
      platform: s.platform,
      clicks: s.clicks,
      signups: s.signups,
      pointsEarned: s.pointsEarned,
      createdAt: s.createdAt,
    }));

    return {
      totalShares,
      totalClicks,
      totalSignups,
      totalPointsEarned,
      platformDistribution,
      recentShares,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async generateShareContent(
    userId: string,
    userType: ReferrerType,
    dto: GenerateShareCardDto,
  ): Promise<{ title: string; description: string; imageUrl: string; shareUrl: string }> {
    let title: string;
    let description: string;
    let imageUrl: string;
    let shareUrl: string;

    // Get user's referral code for share URL
    let referralCode: string;
    if (userType === ReferrerType.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { id: userId } });
      referralCode = patient?.referralCode || 'JOIN';
    } else {
      const provider = await this.prisma.provider.findUnique({ where: { id: userId } });
      referralCode = provider?.referralCode || 'JOIN';
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://neurobridge.com';
    shareUrl = `${baseUrl}/join?ref=${referralCode}&utm_source=${dto.platform.toLowerCase()}&utm_medium=social_share&utm_campaign=${dto.shareType.toLowerCase()}`;

    switch (dto.shareType) {
      case ShareType.ACHIEVEMENT:
        title = '🏆 Achievement Unlocked!';
        description = "I'm making progress on my mental health journey with NeuroBridge!";
        imageUrl = `${baseUrl}/api/social-shares/cards/achievement/${dto.achievementId}.png`;
        break;

      case ShareType.MILESTONE:
        title = `🎉 ${dto.milestoneName || 'Milestone Reached'}!`;
        description = 'Taking care of my mental health with consistent therapy!';
        imageUrl = `${baseUrl}/api/social-shares/cards/milestone/${dto.milestoneName?.replace(/\s+/g, '-').toLowerCase()}.png`;
        break;

      case ShareType.REVIEW:
        title = '⭐ Great Therapy Experience';
        description = 'Finding quality mental health support with NeuroBridge';
        imageUrl = `${baseUrl}/api/social-shares/cards/review.png`;
        break;

      case ShareType.PROFILE:
        if (userType === ReferrerType.PROVIDER) {
          const provider = await this.prisma.provider.findUnique({
            where: { id: userId },
            include: { user: true },
          });
          title = `${provider?.user.firstName} ${provider?.user.lastName} - Mental Health Provider`;
          description = provider?.bio || 'Accepting new patients on NeuroBridge';
          imageUrl = `${baseUrl}/api/social-shares/cards/provider/${userId}.png`;
        } else {
          title = 'Join me on NeuroBridge!';
          description = 'Prioritizing mental health and wellness';
          imageUrl = `${baseUrl}/api/social-shares/cards/patient.png`;
        }
        break;

      case ShareType.REFERRAL:
        title = 'Get Help with Your Mental Health';
        description = 'Join me on NeuroBridge - quality therapy and support!';
        imageUrl = `${baseUrl}/api/social-shares/cards/referral.png`;
        break;

      default:
        throw new BadRequestException('Invalid share type');
    }

    return { title, description, imageUrl, shareUrl };
  }

  private formatShareText(platform: Platform, title: string, description: string, shareUrl: string): string {
    switch (platform) {
      case Platform.INSTAGRAM:
        // Instagram doesn't support clickable links in posts, so keep it short
        return `${title}\n\n${description}\n\nLink in bio! #MentalHealth #Therapy #SelfCare`;

      case Platform.FACEBOOK:
        return `${title}\n\n${description}\n\nJoin me: ${shareUrl}\n\n#MentalHealthMatters #Therapy`;

      case Platform.LINKEDIN:
        return `${title}\n\n${description}\n\nLearn more: ${shareUrl}`;

      case Platform.TWITTER:
        // Twitter has character limit, keep it concise
        const tweetText = `${title} ${description}`;
        const maxLength = 280 - shareUrl.length - 2; // -2 for spaces
        const trimmedText = tweetText.length > maxLength ? tweetText.substring(0, maxLength - 3) + '...' : tweetText;
        return `${trimmedText} ${shareUrl}`;

      default:
        return `${title}\n\n${description}\n\n${shareUrl}`;
    }
  }
}
