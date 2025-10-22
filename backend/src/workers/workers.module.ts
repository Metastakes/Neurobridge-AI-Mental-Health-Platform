import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DsmAnalysisWorker } from './dsm-analysis.worker';
import { RiskFusionWorker } from './risk-fusion.worker';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RiskModule } from '../modules/risk/risk.module';

/**
 * Patch 04: Background Workers Module
 * Cron jobs and background processing
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RiskModule,
  ],
  providers: [DsmAnalysisWorker, RiskFusionWorker],
  exports: [DsmAnalysisWorker, RiskFusionWorker],
})
export class WorkersModule {}
