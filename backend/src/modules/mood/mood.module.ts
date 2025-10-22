import { Module } from '@nestjs/common';
import { MoodController } from './mood.controller';
import { MoodService } from './mood.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkersModule } from '../../workers/workers.module';

/**
 * Patch 04: Mood Check-ins Module
 * Daily DSM-aligned mood tracking with gamification
 */
@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
    WorkersModule,
  ],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}
