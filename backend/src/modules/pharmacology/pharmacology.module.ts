import { Module } from '@nestjs/common';
import { PharmacologyController } from './pharmacology.controller';
import { PharmacologyService } from './pharmacology.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Patch 04: Pharmacology Module
 * AI-powered medication decision support + automated patient task generation
 */
@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [PharmacologyController],
  providers: [PharmacologyService],
  exports: [PharmacologyService],
})
export class PharmacologyModule {}
