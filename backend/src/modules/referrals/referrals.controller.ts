import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  TrackReferralDto,
  ClaimReferralRewardDto,
  GenerateReferralCodeDto,
  ReferralStatsDto,
  UpdateReferralStatusDto,
  UpdateProviderProfileDto,
} from './dto';
import { ReferrerType } from '@prisma/client';

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // ============================================
  // PATIENT REFERRAL ENDPOINTS
  // ============================================

  @Get('patients/:id/stats')
  @ApiOperation({ summary: 'Get patient referral stats and history' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved', type: ReferralStatsDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientReferralStats(@Param('id') patientId: string): Promise<ReferralStatsDto> {
    return this.referralsService.getPatientReferralStats(patientId);
  }

  @Post('patients/:id/generate-code')
  @ApiOperation({ summary: 'Generate referral code for patient' })
  @ApiResponse({ status: 201, description: 'Referral code generated' })
  @ApiResponse({ status: 409, description: 'Patient already has a referral code' })
  @HttpCode(HttpStatus.CREATED)
  async generatePatientReferralCode(
    @Param('id') patientId: string,
    @Body() dto: GenerateReferralCodeDto,
  ): Promise<{ referralCode: string }> {
    return this.referralsService.generateReferralCode(patientId, ReferrerType.PATIENT, dto);
  }

  // ============================================
  // PROVIDER REFERRAL ENDPOINTS
  // ============================================

  @Get('providers/:id/stats')
  @ApiOperation({ summary: 'Get provider referral stats and history' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved', type: ReferralStatsDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderReferralStats(@Param('id') providerId: string): Promise<ReferralStatsDto> {
    return this.referralsService.getProviderReferralStats(providerId);
  }

  @Post('providers/:id/generate-code')
  @ApiOperation({ summary: 'Generate referral code and profile URL for provider' })
  @ApiResponse({ status: 201, description: 'Referral code generated' })
  @ApiResponse({ status: 409, description: 'Provider already has a referral code' })
  @HttpCode(HttpStatus.CREATED)
  async generateProviderReferralCode(
    @Param('id') providerId: string,
    @Body() dto: GenerateReferralCodeDto,
  ): Promise<{ referralCode: string; profileUrl?: string }> {
    return this.referralsService.generateReferralCode(providerId, ReferrerType.PROVIDER, dto);
  }

  @Put('providers/:id/profile')
  @ApiOperation({ summary: 'Update provider profile and marketing information' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async updateProviderProfile(@Param('id') providerId: string, @Body() dto: UpdateProviderProfileDto): Promise<any> {
    return this.referralsService.updateProviderProfile(providerId, dto);
  }

  // ============================================
  // REFERRAL TRACKING ENDPOINTS
  // ============================================

  @Post('track')
  @ApiOperation({ summary: 'Track a referral signup (when someone uses a referral code)' })
  @ApiResponse({ status: 201, description: 'Referral tracked successfully' })
  @ApiResponse({ status: 404, description: 'Invalid referral code' })
  @HttpCode(HttpStatus.CREATED)
  async trackReferralSignup(@Body() dto: TrackReferralDto): Promise<any> {
    return this.referralsService.trackReferralSignup(dto);
  }

  @Put(':referralId/status')
  @ApiOperation({ summary: 'Update referral status (onboarded, first session, active)' })
  @ApiResponse({ status: 200, description: 'Referral status updated' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async updateReferralStatus(@Param('referralId') referralId: string, @Body() dto: UpdateReferralStatusDto): Promise<any> {
    return this.referralsService.updateReferralStatus(referralId, dto);
  }

  @Post('claim-reward')
  @ApiOperation({ summary: 'Claim a referral reward' })
  @ApiResponse({ status: 200, description: 'Reward claimed successfully' })
  @ApiResponse({ status: 400, description: 'Reward already claimed or not available' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @HttpCode(HttpStatus.OK)
  async claimReferralReward(@Body() dto: ClaimReferralRewardDto): Promise<any> {
    return this.referralsService.claimReferralReward(dto);
  }
}
