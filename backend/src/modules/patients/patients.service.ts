import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

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
}
