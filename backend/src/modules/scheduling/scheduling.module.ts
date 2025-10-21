import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { GoogleCalendarService } from './google-calendar.service';
import { EncountersModule } from '../encounters/encounters.module';

@Module({
  imports: [EncountersModule],
  controllers: [SchedulingController],
  providers: [SchedulingService, GoogleCalendarService],
})
export class SchedulingModule {}
