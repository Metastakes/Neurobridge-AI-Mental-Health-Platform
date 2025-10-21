import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DiagnosesService {
  constructor(private prisma: PrismaService) {}

  async findByPatient(patientId: string) {
    return this.prisma.diagnosis.findMany({
      where: { patientId },
      orderBy: [{ isPrimary: 'desc' }, { diagnosedAt: 'desc' }],
    });
  }

  async create(data: {
    patientId: string;
    icdCode: string;
    description: string;
    isPrimary?: boolean;
  }) {
    return this.prisma.diagnosis.create({
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.diagnosis.delete({
      where: { id },
    });
  }
}
