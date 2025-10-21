import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseInterceptors(AuditInterceptor)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'Get AI medication suggestions with safety checks' })
  async getMedicationSuggestions(
    @Body() data: {
      patientId: string;
      proposedMedication: {
        name: string;
        dosage: string;
        category?: string;
      };
    },
  ) {
    return this.aiService.getMedicationSuggestions(
      data.patientId,
      data.proposedMedication,
    );
  }

  @Post('next-questions')
  @ApiOperation({ summary: 'Get next best clinical questions' })
  async getNextQuestions(
    @Body() data: {
      patientId: string;
      currentContext: string;
    },
  ) {
    return this.aiService.getNextQuestions(data);
  }

  @Post('soap-note')
  @ApiOperation({ summary: 'Generate AI SOAP note for encounter' })
  async generateSOAPNote(
    @Body() data: {
      encounterId: string;
    },
  ) {
    return this.aiService.generateSOAPNote(data.encounterId);
  }
}
