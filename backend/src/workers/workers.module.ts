import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DsmAnalysisWorker } from './dsm-analysis.worker';
import { PrismaModule } from '../common/prisma/prisma.module';

/**
 * Patch 04: Background Workers Module
 * Cron jobs and background processing
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [DsmAnalysisWorker],
  exports: [DsmAnalysisWorker],
})
export class WorkersModule {}
