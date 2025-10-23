/**
 * INNOVATION: AI SOAP Note API
 * Endpoints for AI-powered clinical documentation
 */

import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AiSoapService } from './ai-soap.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('AI SOAP Notes')
@Controller('ai/soap')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiSoapController {
  constructor(
    private readonly aiSoapService: AiSoapService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * POST /ai/soap/generate/:encounterId
   * Generate SOAP note using AI for an encounter
   */
  @Post('generate/:encounterId')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate AI SOAP note for encounter' })
  async generateSoapNote(@Param('encounterId') encounterId: string) {
    const soapNote = await this.aiSoapService.generateSoapNote(encounterId);

    return {
      success: true,
      soapNote,
      message: 'SOAP note generated successfully',
      disclaimer: 'AI-generated content. Please review and modify as needed before saving.',
    };
  }

  /**
   * POST /ai/soap/save/:encounterId
   * Save AI-generated SOAP note (with optional provider modifications)
   */
  @Post('save/:encounterId')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Save AI SOAP note to encounter' })
  async saveSoapNote(
    @Param('encounterId') encounterId: string,
    @Request() req: any,
    @Body() body: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
      wasModified: boolean;
      originalSoapNote?: any;
    },
  ) {
    const providerId = req.user.providerId || req.user.id;

    // Save the SOAP note
    const caseNote = await this.aiSoapService.saveSoapNote(
      encounterId,
      providerId,
      {
        subjective: body.subjective,
        objective: body.objective,
        assessment: body.assessment,
        plan: body.plan,
        confidence: 0.85,
        generatedAt: new Date(),
        modelUsed: 'gemini-pro',
      },
      body.wasModified,
    );

    // If modified, emit feedback event for AI improvement
    if (body.wasModified && body.originalSoapNote) {
      this.eventEmitter.emit('ai.soap.feedback', {
        encounterId,
        providerId,
        original: body.originalSoapNote,
        modified: {
          subjective: body.subjective,
          objective: body.objective,
          assessment: body.assessment,
          plan: body.plan,
        },
        timestamp: new Date(),
      });
    }

    return {
      success: true,
      caseNote,
      message: 'SOAP note saved successfully',
    };
  }

  /**
   * GET /ai/soap/history/:encounterId
   * Get SOAP note generation history for encounter
   */
  @Get('history/:encounterId')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get SOAP note history for encounter' })
  async getSoapHistory(@Param('encounterId') encounterId: string) {
    // This would fetch case notes for the encounter
    // For now, returning placeholder
    return {
      success: true,
      history: [],
      message: 'SOAP note history retrieved',
    };
  }

  /**
   * POST /ai/soap/feedback
   * Submit provider feedback on AI-generated SOAP note quality
   */
  @Post('feedback')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit feedback on AI SOAP note' })
  async submitFeedback(
    @Request() req: any,
    @Body() body: {
      encounterId: string;
      caseNoteId: string;
      rating: number; // 1-5 stars
      feedback: string;
      action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED';
    },
  ) {
    const providerId = req.user.providerId || req.user.id;

    // Emit feedback event for analytics
    this.eventEmitter.emit('ai.soap.quality_feedback', {
      providerId,
      encounterId: body.encounterId,
      caseNoteId: body.caseNoteId,
      rating: body.rating,
      feedback: body.feedback,
      action: body.action,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping improve our AI!',
    };
  }
}
