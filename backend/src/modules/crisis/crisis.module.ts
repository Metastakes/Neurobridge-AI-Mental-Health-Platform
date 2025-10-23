import { Module } from '@nestjs/common';
import { CrisisController } from './crisis.controller';
import { CrisisInterventionService } from './crisis-intervention.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrisisController],
  providers: [CrisisInterventionService],
  exports: [CrisisInterventionService],
})
export class CrisisModule {}
