import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { HealthModule } from './modules/health/health.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ThrottleGuard } from './common/guards/throttle.guard';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuditModule,
    HealthModule,
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
