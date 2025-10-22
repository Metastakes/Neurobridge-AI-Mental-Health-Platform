import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Patch 04: Risk Module
 * Risk alerts fusion (medication changes + mood patterns)
 */
@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
