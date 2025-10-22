import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMentorDto, UpdateMentorDto } from './dto';

@Injectable()
export class MentorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get mentor by ID with full related data
   */
  async findOne(id: string) {
    const mentor = await this.prisma.mentor.findUnique({
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
        mentees: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            patients: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                alertStatus: true,
              },
            },
          },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${id} not found`);
    }

    return mentor;
  }

  /**
   * Get all mentors (with pagination)
   */
  async findAll(skip = 0, take = 50) {
    const [mentors, total] = await Promise.all([
      this.prisma.mentor.findMany({
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
          mentees: {
            select: {
              id: true,
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
      this.prisma.mentor.count(),
    ]);

    return {
      data: mentors,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  /**
   * Get mentor's assigned providers (mentees)
   */
  async getMentees(mentorId: string) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        mentees: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            patients: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                alertStatus: true,
                diagnoses: {
                  where: { isPrimary: true },
                  select: {
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${mentorId} not found`);
    }

    return mentor.mentees;
  }

  /**
   * Create a new mentor
   */
  async create(data: CreateMentorDto) {
    return this.prisma.mentor.create({
      data: {
        userId: data.userId,
        npiNumber: data.npiNumber,
        licenseNumber: data.licenseNumber,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update mentor information
   */
  async update(id: string, data: UpdateMentorDto) {
    return this.prisma.mentor.update({
      where: { id },
      data: {
        npiNumber: data.npiNumber,
        licenseNumber: data.licenseNumber,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Assign a provider to this mentor
   */
  async assignProvider(mentorId: string, providerId: string) {
    // Verify mentor exists
    await this.findOne(mentorId);

    // Update provider's mentorId
    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: { mentorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mentor: {
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
    });

    return {
      success: true,
      provider,
      message: `Provider ${provider.user.firstName} ${provider.user.lastName} assigned to mentor`,
    };
  }

  /**
   * Unassign a provider from this mentor
   */
  async unassignProvider(mentorId: string, providerId: string) {
    // Verify mentor exists
    await this.findOne(mentorId);

    // Remove mentor assignment
    const provider = await this.prisma.provider.update({
      where: {
        id: providerId,
        mentorId: mentorId, // Ensure provider belongs to this mentor
      },
      data: { mentorId: null },
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

    return {
      success: true,
      provider,
      message: `Provider ${provider.user.firstName} ${provider.user.lastName} unassigned from mentor`,
    };
  }

  /**
   * Get mentor summary with stats
   */
  async getSummary(id: string) {
    const mentor = await this.findOne(id);

    const [totalMentees, totalPatients, recentChartAudits] = await Promise.all([
      this.prisma.provider.count({
        where: { mentorId: id },
      }),
      this.prisma.patient.count({
        where: {
          provider: {
            mentorId: id,
          },
        },
      }),
      this.prisma.chartAudit.findMany({
        where: { mentorId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
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
    ]);

    return {
      ...mentor,
      summary: {
        totalMentees,
        totalPatients,
        recentChartAudits,
      },
    };
  }
}
