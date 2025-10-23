import { Module } from '@nestjs/common';
import { CrisisController } from './crisis.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrisisController],
  providers: [],
  exports: [],
})
export class CrisisModule {}
