import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SocialSharesService } from './social-shares.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  GenerateShareCardDto,
  TrackShareDto,
  ShareCardDto,
  ShareAnalyticsDto,
  UserShareStatsDto,
} from './dto';
import { ReferrerType } from '@prisma/client';

@ApiTags('Social Shares')
@Controller('social-shares')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialSharesController {
  constructor(private readonly socialSharesService: SocialSharesService) {}

  // ============================================
  // PATIENT SHARE ENDPOINTS
  // ============================================

  @Post('patients/:id/generate')
  @ApiOperation({ summary: 'Generate shareable card for patient' })
  @ApiResponse({ status: 201, description: 'Share card generated', type: ShareCardDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @HttpCode(HttpStatus.CREATED)
  async generatePatientShareCard(@Param('id') patientId: string, @Body() dto: GenerateShareCardDto): Promise<ShareCardDto> {
    return this.socialSharesService.generateShareCard(patientId, ReferrerType.PATIENT, dto);
  }

  @Get('patients/:id/stats')
  @ApiOperation({ summary: 'Get patient share statistics' })
  @ApiResponse({ status: 200, description: 'Share stats retrieved', type: UserShareStatsDto })
  async getPatientShareStats(@Param('id') patientId: string): Promise<UserShareStatsDto> {
    return this.socialSharesService.getUserShareStats(patientId, ReferrerType.PATIENT);
  }

  // ============================================
  // PROVIDER SHARE ENDPOINTS
  // ============================================

  @Post('providers/:id/generate')
  @ApiOperation({ summary: 'Generate shareable marketing material for provider' })
  @ApiResponse({ status: 201, description: 'Share card generated', type: ShareCardDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @HttpCode(HttpStatus.CREATED)
  async generateProviderShareCard(@Param('id') providerId: string, @Body() dto: GenerateShareCardDto): Promise<ShareCardDto> {
    return this.socialSharesService.generateShareCard(providerId, ReferrerType.PROVIDER, dto);
  }

  @Get('providers/:id/stats')
  @ApiOperation({ summary: 'Get provider share statistics' })
  @ApiResponse({ status: 200, description: 'Share stats retrieved', type: UserShareStatsDto })
  async getProviderShareStats(@Param('id') providerId: string): Promise<UserShareStatsDto> {
    return this.socialSharesService.getUserShareStats(providerId, ReferrerType.PROVIDER);
  }

  // ============================================
  // TRACKING ENDPOINTS
  // ============================================

  @Post('track')
  @ApiOperation({ summary: 'Track a share action (posted, clicked, signup)' })
  @ApiResponse({ status: 200, description: 'Share tracked successfully' })
  @ApiResponse({ status: 404, description: 'Share not found' })
  @HttpCode(HttpStatus.OK)
  async trackShare(@Body() dto: TrackShareDto): Promise<any> {
    return this.socialSharesService.trackShare(dto);
  }

  @Get(':shareId/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific share' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved', type: ShareAnalyticsDto })
  @ApiResponse({ status: 404, description: 'Share not found' })
  async getShareAnalytics(@Param('shareId') shareId: string): Promise<ShareAnalyticsDto> {
    return this.socialSharesService.getShareAnalytics(shareId);
  }
}
