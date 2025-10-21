import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper to clean PHI from logs (HIPAA compliance)
  cleanForLogs(data: any): any {
    const cleaned = { ...data };
    const phiFields = ['email', 'phone', 'address', 'ssn', 'dateOfBirth', 'firstName', 'lastName'];

    phiFields.forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = '[REDACTED]';
      }
    });

    return cleaned;
  }
}
