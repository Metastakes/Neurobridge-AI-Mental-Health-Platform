import { Module } from '@nestjs/common';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';
import { EncounterOverviewController } from './encounter-overview.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EncountersController, EncounterOverviewController],
  providers: [EncountersService],
  exports: [EncountersService],
})
export class EncountersModule {}
