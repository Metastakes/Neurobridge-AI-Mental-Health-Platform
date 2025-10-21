import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EncountersService {
  constructor(private prisma: PrismaService) {}

  async findByPatient(patientId: string) {
    return this.prisma.encounter.findMany({
      where: { patientId },
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
        caseNotes: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
            medications: true,
            diagnoses: true,
          },
        },
        provider: {
          include: {
            user: true,
          },
        },
        caseNotes: true,
        billingCodes: true,
      },
    });
  }

  async create(data: {
    patientId: string;
    providerId: string;
    scheduledAt: Date;
    meetLink?: string;
    meetEventId?: string;
  }) {
    return this.prisma.encounter.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.encounter.update({
      where: { id },
      data,
    });
  }

  async addCaseNote(encounterId: string, providerId: string, note: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    generatedByAI?: boolean;
  }) {
    return this.prisma.caseNote.create({
      data: {
        encounterId,
        providerId,
        ...note,
      },
    });
  }
}
