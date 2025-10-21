import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMedicationDto, UpdateMedicationDto } from './dto';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async findByPatient(patientId: string) {
    return this.prisma.medication.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(patientId: string) {
    return this.prisma.medication.findMany({
      where: {
        patientId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateMedicationDto) {
    return this.prisma.medication.create({
      data: {
        patientId: data.patientId,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        category: data.category,
        prescriberId: data.prescriberId,
        startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
        status: 'ACTIVE',
      },
    });
  }

  async update(id: string, data: UpdateMedicationDto) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException(`Medication with ID ${id} not found`);
    }

    return this.prisma.medication.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.dosage && { dosage: data.dosage }),
        ...(data.frequency && { frequency: data.frequency }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.stoppedAt && { stoppedAt: new Date(data.stoppedAt) }),
      },
    });
  }

  async remove(id: string) {
    // Soft delete: mark as DISCONTINUED
    return this.prisma.medication.update({
      where: { id },
      data: {
        status: 'DISCONTINUED',
        stoppedAt: new Date(),
      },
    });
  }

  async hardDelete(id: string) {
    // Hard delete for testing purposes only
    return this.prisma.medication.delete({
      where: { id },
    });
  }
}
