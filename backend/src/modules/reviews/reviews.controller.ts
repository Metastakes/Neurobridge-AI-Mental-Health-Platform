import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  SubmitReviewDto,
  SubmitGoogleReviewDto,
  ModerateReviewDto,
  ReviewPromptCheckDto,
  ProviderReviewStatsDto,
  ReviewDto,
} from './dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================
  // PATIENT REVIEW ENDPOINTS
  // ============================================

  @Post('patients/:patientId/submit')
  @ApiOperation({ summary: 'Submit a post-session review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Review already submitted' })
  @ApiResponse({ status: 404, description: 'Provider or session not found' })
  @HttpCode(HttpStatus.CREATED)
  async submitReview(@Param('patientId') patientId: string, @Body() dto: SubmitReviewDto): Promise<any> {
    return this.reviewsService.submitReview(patientId, dto);
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: 'Get all reviews submitted by a patient' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved', type: [ReviewDto] })
  async getPatientReviews(@Param('patientId') patientId: string): Promise<ReviewDto[]> {
    return this.reviewsService.getPatientReviews(patientId);
  }

  // ============================================
  // REVIEW PROMPT ENDPOINTS
  // ============================================

  @Get('prompt/:sessionId')
  @ApiOperation({ summary: 'Check if review prompt should be shown for a session' })
  @ApiResponse({ status: 200, description: 'Prompt check result', type: ReviewPromptCheckDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async checkReviewPrompt(@Param('sessionId') sessionId: string): Promise<ReviewPromptCheckDto> {
    return this.reviewsService.checkReviewPrompt(sessionId);
  }

  // ============================================
  // GOOGLE REVIEW ENDPOINTS
  // ============================================

  @Post('google/submit')
  @ApiOperation({ summary: 'Submit review to Google Reviews' })
  @ApiResponse({ status: 200, description: 'Google review link generated' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @HttpCode(HttpStatus.OK)
  async submitToGoogle(@Body() dto: SubmitGoogleReviewDto): Promise<any> {
    return this.reviewsService.submitToGoogle(dto);
  }

  // ============================================
  // PROVIDER REVIEW ENDPOINTS
  // ============================================

  @Get('providers/:providerId/stats')
  @ApiOperation({ summary: 'Get provider review statistics' })
  @ApiResponse({ status: 200, description: 'Review stats retrieved', type: ProviderReviewStatsDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderReviewStats(@Param('providerId') providerId: string): Promise<ProviderReviewStatsDto> {
    return this.reviewsService.getProviderReviewStats(providerId);
  }

  // ============================================
  // ADMIN/MODERATION ENDPOINTS
  // ============================================

  @Put(':reviewId/moderate')
  @ApiOperation({ summary: 'Moderate a review (admin only)' })
  @ApiResponse({ status: 200, description: 'Review moderated' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(@Param('reviewId') reviewId: string, @Body() dto: ModerateReviewDto): Promise<any> {
    return this.reviewsService.moderateReview(reviewId, dto);
  }
}
