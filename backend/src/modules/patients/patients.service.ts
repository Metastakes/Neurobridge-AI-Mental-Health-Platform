import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, SessionReviewDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get patient by ID with full related data
   */
  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        diagnoses: {
          orderBy: { isPrimary: 'desc' },
        },
        medications: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
        allergies: {
          orderBy: { severity: 'desc' },
        },
        encounters: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: 'desc' },
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  /**
   * Get all patients (with pagination)
   */
  async findAll(skip = 0, take = 50) {
    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          diagnoses: {
            where: { isPrimary: true },
          },
          provider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.patient.count(),
    ]);

    return {
      data: patients,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  /**
   * Get patients assigned to a specific provider
   */
  async findByProvider(providerId: string) {
    return this.prisma.patient.findMany({
      where: { providerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        diagnoses: {
          where: { isPrimary: true },
        },
      },
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });
  }

  /**
   * Create a new patient
   */
  async create(data: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        userId: data.userId,
        dateOfBirth: new Date(data.dateOfBirth),
        sex: data.sex,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        providerId: data.providerId,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update patient information
   */
  async update(id: string, data: UpdatePatientDto) {
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        sex: data.sex,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        pharmacyName: data.pharmacyName,
        pharmacyPhone: data.pharmacyPhone,
        pharmacyAddress: data.pharmacyAddress,
        height: data.height,
        weight: data.weight,
        alertStatus: data.alertStatus,
        onboardingComplete: data.onboardingComplete,
        providerId: data.providerId,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get patient's gamification summary
   */
  async getGamificationSummary(patientId: string) {
    const [totalPoints, achievements, recentEvents] = await Promise.all([
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
    ]);

    return {
      totalPoints: totalPoints._sum.points || 0,
      achievements,
      recentEvents,
    };
  }

  /**
   * Mark patient onboarding as complete
   */
  async completeOnboarding(id: string) {
    const patient = await this.prisma.patient.update({
      where: { id },
      data: { onboardingComplete: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Award points for completing onboarding
    await this.prisma.gamificationEvent.create({
      data: {
        patientId: id,
        eventType: 'ONBOARDING_COMPLETE',
        points: 100,
        metadata: { timestamp: new Date().toISOString() },
      },
    });

    return patient;
  }

  /**
   * Get patient summary with stats
   */
  async getSummary(id: string) {
    const patient = await this.findOne(id);

    const [totalSessions, nextAppointment, pendingReviews] = await Promise.all([
      this.prisma.encounter.count({
        where: {
          patientId: id,
          status: 'COMPLETED',
        },
      }),
      this.prisma.encounter.findFirst({
        where: {
          patientId: id,
          status: 'SCHEDULED',
          scheduledAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.encounter.count({
        where: {
          patientId: id,
          status: 'COMPLETED',
          reviewSubmitted: false,
        },
      }),
    ]);

    return {
      ...patient,
      summary: {
        totalSessions,
        nextAppointment,
        pendingReviews,
      },
    };
  }

  /**
   * Submit session review and earn points
   */
  async submitSessionReview(id: string, review: SessionReviewDto) {
    // Record the review in the database
    const reviewRecord = await this.prisma.sessionReview.create({
      data: {
        patientId: id,
        rating: review.rating,
        feedback: review.feedback,
        sessionId: review.sessionId,
        wouldRecommend: review.wouldRecommend,
      },
    });

    // Mark session as reviewed if sessionId provided
    if (review.sessionId) {
      await this.prisma.encounter.update({
        where: { id: review.sessionId },
        data: { reviewSubmitted: true },
      });
    }

    // Award points for submitting review
    await this.prisma.gamificationEvent.create({
      data: {
        patientId: id,
        eventType: 'SESSION_REVIEW',
        points: 50,
        metadata: {
          rating: review.rating,
          sessionId: review.sessionId,
        },
      },
    });

    return {
      success: true,
      review: reviewRecord,
      pointsEarned: 50,
    };
  }
}
