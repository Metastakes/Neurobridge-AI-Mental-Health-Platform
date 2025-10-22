import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MoodService } from './mood.service';
import {
  CreateMoodCheckinDto,
  MoodCheckinResponseDto,
  DsmSummaryDto,
  MoodStatsDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Patch 04: Mood Check-ins Controller
 * Patient-facing mood tracking with DSM summaries for providers
 */
@ApiTags('Mood Check-ins')
@Controller('mood')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  /**
   * POST /mood/checkins/:patientId
   * Patient creates daily mood check-in
   * Returns streak and points
   */
  @Post('checkins/:patientId')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create mood check-in',
    description: 'Patient submits daily mood check-in. Awards points and tracks streak. One check-in per day.',
  })
  @ApiResponse({
    status: 201,
    description: 'Check-in created successfully',
    type: MoodCheckinResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Already checked in today or invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  async createCheckin(
    @Param('patientId') patientId: string,
    @Body() dto: CreateMoodCheckinDto,
  ): Promise<MoodCheckinResponseDto> {
    return this.moodService.createCheckin(patientId, dto);
  }

  /**
   * GET /mood/stats/:patientId
   * Get mood statistics (streaks, averages, trend)
   */
  @Get('stats/:patientId')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get mood statistics',
    description: 'Retrieve current/longest streak, averages, and trend analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: MoodStatsDto,
  })
  async getMoodStats(@Param('patientId') patientId: string): Promise<MoodStatsDto> {
    return this.moodService.getMoodStats(patientId);
  }

  /**
   * GET /mood/summary/:patientId
   * Get DSM summaries (cached, fast)
   */
  @Get('summary/:patientId')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get DSM summaries',
    description: 'Retrieve precomputed AI-derived DSM summaries for 7d, 30d, 90d windows. Provider-only access.',
  })
  @ApiResponse({
    status: 200,
    description: 'DSM summaries retrieved',
    type: [DsmSummaryDto],
  })
  async getDsmSummaries(
    @Param('patientId') patientId: string,
  ): Promise<DsmSummaryDto[]> {
    return this.moodService.getDsmSummaries(patientId);
  }

  /**
   * GET /mood/checkins/:patientId
   * Get recent check-ins (for sparkline charts)
   */
  @Get('checkins/:patientId')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get recent check-ins',
    description: 'Retrieve up to 30 recent mood check-ins for visualization',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-ins retrieved',
  })
  async getRecentCheckins(@Param('patientId') patientId: string) {
    return this.moodService.getRecentCheckins(patientId, 30);
  }

  /**
   * POST /mood/compute/:patientId (internal)
   * Trigger DSM analysis (called by worker/cron)
   * Provider/Admin only for manual triggers
   */
  @Post('compute/:patientId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger DSM analysis (internal)',
    description: 'Manually trigger DSM summary computation. Normally runs nightly via cron.',
  })
  @ApiResponse({
    status: 202,
    description: 'Analysis queued',
  })
  async computeDsmSummary(@Param('patientId') patientId: string) {
    // This will be implemented when we build the DSM worker
    return {
      success: true,
      message: 'DSM analysis queued',
      patientId,
    };
  }
}
