import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DsmAnalysisWorker } from './dsm-analysis.worker';
import { RiskFusionWorker } from './risk-fusion.worker';
import { RiskFusionWorker as RiskFusionEnhanced } from './risk-fusion-enhanced.worker';
import { CrisisDetectionWorker } from './crisis-detection.worker';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RiskModule } from '../modules/risk/risk.module';

/**
 * Patch 04, 04A & Innovation: Background Workers Module
 * Cron jobs and background processing
 * Includes DSM analysis, risk fusion, enhanced risk detection, and crisis detection
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RiskModule,
  ],
  providers: [DsmAnalysisWorker, RiskFusionWorker, RiskFusionEnhanced, CrisisDetectionWorker],
  exports: [DsmAnalysisWorker, RiskFusionWorker, RiskFusionEnhanced, CrisisDetectionWorker],
})
export class WorkersModule {}
