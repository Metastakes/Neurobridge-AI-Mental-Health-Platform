import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DsmAnalysisWorker } from './dsm-analysis.worker';
import { RiskFusionWorker } from './risk-fusion.worker';
import { RiskFusionWorker as RiskFusionEnhanced } from './risk-fusion-enhanced.worker';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RiskModule } from '../modules/risk/risk.module';

/**
 * Patch 04 & 04A: Background Workers Module
 * Cron jobs and background processing
 * Includes DSM analysis, risk fusion, and enhanced risk detection
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RiskModule,
  ],
  providers: [DsmAnalysisWorker, RiskFusionWorker, RiskFusionEnhanced],
  exports: [DsmAnalysisWorker, RiskFusionWorker, RiskFusionEnhanced],
})
export class WorkersModule {}
