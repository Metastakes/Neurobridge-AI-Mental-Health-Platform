import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { AiSoapController } from './ai-soap.controller';
import { AiSoapService } from './ai-soap.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule, EventEmitterModule],
  controllers: [AiController, AiSoapController],
  providers: [AiService, GeminiService, AiSoapService],
  exports: [AiService, GeminiService, AiSoapService],
})
export class AiModule {}
