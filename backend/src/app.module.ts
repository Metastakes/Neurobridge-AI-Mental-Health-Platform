import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { DiagnosesModule } from './modules/diagnoses/diagnoses.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { AiModule } from './modules/ai/ai.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './common/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    PatientsModule,
    MedicationsModule,
    DiagnosesModule,
    EncountersModule,
    AiModule,
    SchedulingModule,
    GamificationModule,
    BillingModule,
  ],
})
export class AppModule {}
