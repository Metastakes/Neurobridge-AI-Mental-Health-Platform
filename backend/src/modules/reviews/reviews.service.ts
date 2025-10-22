import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  SubmitReviewDto,
  SubmitGoogleReviewDto,
  ModerateReviewDto,
  ReviewPromptCheckDto,
  ProviderReviewStatsDto,
  ReviewDto,
} from './dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit a post-session review
   */
  async submitReview(patientId: string, dto: SubmitReviewDto): Promise<any> {
    // Verify provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Verify session exists (if provided)
    let session = null;
    if (dto.sessionId) {
      session = await this.prisma.encounter.findUnique({
        where: { id: dto.sessionId },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      // Check if review already submitted for this session
      const existingReview = await this.prisma.review.findFirst({
        where: {
          patientId,
          sessionId: dto.sessionId,
        },
      });

      if (existingReview) {
        throw new BadRequestException('Review already submitted for this session');
      }
    }

    // Calculate points to award
    const pointsAwarded = dto.shareOnGoogle ? 100 : 50;

    // Create review
    const review = await this.prisma.review.create({
      data: {
        patientId,
        providerId: dto.providerId,
        sessionId: dto.sessionId,
        rating: dto.rating,
        feedback: dto.feedback,
        quickTags: dto.quickTags || [],
        isInternal: true,
        isPublic: dto.isPublic || false,
        isGoogleReview: dto.shareOnGoogle || false,
        pointsAwarded,
        approved: !dto.isPublic, // Auto-approve internal reviews, require moderation for public
      },
    });

    // Award gamification points
    await this.prisma.gamificationEvent.create({
      data: {
        patientId,
        eventType: 'SESSION_REVIEW',
        points: pointsAwarded,
        metadata: {
          reviewId: review.id,
          providerId: dto.providerId,
          rating: dto.rating,
          isGoogleReview: dto.shareOnGoogle,
        },
      },
    });

    // Mark session as reviewed (if applicable)
    if (dto.sessionId) {
      await this.prisma.encounter.update({
        where: { id: dto.sessionId },
        data: { reviewSubmitted: true },
      });
    }

    return {
      success: true,
      reviewId: review.id,
      pointsEarned: pointsAwarded,
      googleReviewPrompt: dto.rating === 5 && !dto.shareOnGoogle,
    };
  }

  /**
   * Submit review to Google
   */
  async submitToGoogle(dto: SubmitGoogleReviewDto): Promise<any> {
    const review = await this.prisma.review.findUnique({
      where: { id: dto.reviewId },
      include: {
        provider: {
          include: { user: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Generate Google review URL
    // In production, this would use Google Places API to get the actual place ID
    const googlePlaceId = process.env.GOOGLE_PLACE_ID || 'YOUR_GOOGLE_PLACE_ID';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`;

    // Update review
    await this.prisma.review.update({
      where: { id: dto.reviewId },
      data: {
        isGoogleReview: true,
        googleReviewUrl,
        pointsAwarded: 100, // Upgrade to 100 points
        bonusAwarded: true,
      },
    });

    // Award bonus points (if not already awarded)
    if (review.pointsAwarded < 100) {
      await this.prisma.gamificationEvent.create({
        data: {
          patientId: review.patientId,
          eventType: 'SESSION_REVIEW',
          points: 50, // Bonus 50 points
          metadata: {
            reviewId: review.id,
            googleReview: true,
          },
        },
      });
    }

    return {
      success: true,
      googleReviewUrl,
      totalPointsEarned: 100,
    };
  }

  /**
   * Check if review prompt should be shown for a session
   */
  async checkReviewPrompt(sessionId: string): Promise<ReviewPromptCheckDto> {
    const session = await this.prisma.encounter.findUnique({
      where: { id: sessionId },
      include: {
        provider: {
          include: { user: true },
        },
        reviews: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Don't show prompt if review already submitted
    if (session.reviewSubmitted || session.reviews.length > 0) {
      return {
        shouldPrompt: false,
        session: {
          id: session.id,
          completedAt: session.completedAt!,
        },
        provider: {
          id: session.provider.id,
          name: `${session.provider.user.firstName} ${session.provider.user.lastName}`,
          rating: 0,
        },
      };
    }

    // Check if session is completed
    if (!session.completedAt) {
      return {
        shouldPrompt: false,
        session: {
          id: session.id,
          completedAt: new Date(),
        },
        provider: {
          id: session.provider.id,
          name: `${session.provider.user.firstName} ${session.provider.user.lastName}`,
          rating: 0,
        },
      };
    }

    // Calculate provider's average rating
    const providerRating = await this.getProviderAverageRating(session.provider.id);

    return {
      shouldPrompt: true,
      session: {
        id: session.id,
        completedAt: session.completedAt,
      },
      provider: {
        id: session.provider.id,
        name: `${session.provider.user.firstName} ${session.provider.user.lastName}`,
        rating: providerRating,
      },
    };
  }

  /**
   * Get provider review stats
   */
  async getProviderReviewStats(providerId: string): Promise<ProviderReviewStatsDto> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Get all reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        providerId,
        approved: true,
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    // Get public reviews
    const publicReviews = reviews.filter((r) => r.isPublic).map((r) => this.formatReview(r));

    // Get recent reviews (last 10)
    const recentReviews = reviews.slice(0, 10).map((r) => this.formatReview(r));

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingDistribution,
      publicReviews,
      recentReviews,
    };
  }

  /**
   * Moderate a review
   */
  async moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<any> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        approved: dto.approved,
        flagged: !dto.approved,
        flagReason: dto.flagReason,
        moderatedAt: new Date(),
      },
    });

    return {
      success: true,
      approved: dto.approved,
    };
  }

  /**
   * Get reviews for a patient
   */
  async getPatientReviews(patientId: string): Promise<ReviewDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { patientId },
      include: {
        provider: {
          include: { user: true },
        },
        patient: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => this.formatReview(r));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getProviderAverageRating(providerId: string): Promise<number> {
    const reviews = await this.prisma.review.findMany({
      where: {
        providerId,
        approved: true,
      },
    });

    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
  }

  private formatReview(review: any): ReviewDto {
    const patientName = review.patient?.user
      ? `${review.patient.user.firstName} ${review.patient.user.lastName.charAt(0)}.`
      : 'Anonymous';

    return {
      id: review.id,
      patientName,
      rating: review.rating,
      feedback: review.feedback,
      quickTags: review.quickTags,
      isPublic: review.isPublic,
      isGoogleReview: review.isGoogleReview,
      createdAt: review.createdAt,
    };
  }
}
