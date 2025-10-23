/**
 * INNOVATION: Provider Analytics API
 * Endpoints for efficiency metrics and ROI tracking
 */

import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@ApiTags('Provider Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/provider/metrics
   * Get comprehensive provider metrics (defaults to last 30 days)
   */
  @Get('provider/metrics')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get provider efficiency and outcome metrics' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze (default: 30)' })
  async getProviderMetrics(@Request() req: any, @Query('days') days?: string) {
    const providerId = req.user.providerId || req.user.id;
    const daysNum = days ? parseInt(days, 10) : 30;

    const metrics = await this.analyticsService.getProviderMetrics(providerId, daysNum);

    return {
      success: true,
      period: `Last ${daysNum} days`,
      metrics,
      insights: this.generateInsights(metrics),
    };
  }

  /**
   * GET /analytics/provider/timeseries
   * Get time series data for charts
   */
  @Get('provider/timeseries')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get time series data for analytics charts' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
  async getTimeSeries(@Request() req: any, @Query('days') days?: string) {
    const providerId = req.user.providerId || req.user.id;
    const daysNum = days ? parseInt(days, 10) : 30;

    const data = await this.analyticsService.getTimeSeriesData(providerId, daysNum);

    return {
      success: true,
      period: `Last ${daysNum} days`,
      data,
    };
  }

  /**
   * GET /analytics/provider/patients
   * Get patient outcomes summary
   */
  @Get('provider/patients')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get patient outcomes and trends' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of patients (default: 10)' })
  async getPatientOutcomes(@Request() req: any, @Query('limit') limit?: string) {
    const providerId = req.user.providerId || req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const outcomes = await this.analyticsService.getPatientOutcomes(providerId, limitNum);

    return {
      success: true,
      patients: outcomes,
    };
  }

  /**
   * GET /analytics/provider/roi
   * Calculate ROI from AI features
   */
  @Get('provider/roi')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate return on investment from AI features' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
  async calculateROI(@Request() req: any, @Query('days') days?: string) {
    const providerId = req.user.providerId || req.user.id;
    const daysNum = days ? parseInt(days, 10) : 30;

    const metrics = await this.analyticsService.getProviderMetrics(providerId, daysNum);

    // Calculate financial impact
    const hourlyRate = 150; // Average provider hourly rate
    const timeSavedHours = metrics.estimatedTimeSavedMinutes / 60;
    const financialValue = timeSavedHours * hourlyRate;

    // Calculate productivity gains
    const additionalPatientsCapacity = Math.floor(timeSavedHours / 0.75); // 45 min per session

    return {
      success: true,
      period: `Last ${daysNum} days`,
      roi: {
        timeSavings: {
          totalMinutes: metrics.estimatedTimeSavedMinutes,
          totalHours: timeSavedHours.toFixed(1),
          aiSoapNotes: metrics.aiSoapNotesGenerated,
          averagePerNote: 15,
        },
        financialImpact: {
          dollarValue: financialValue.toFixed(2),
          hourlyRate,
          equivalentSessions: additionalPatientsCapacity,
        },
        efficiencyGains: {
          aiAdoptionRate: metrics.totalEncounters > 0
            ? ((metrics.encountersWithAiSoap / metrics.totalEncounters) * 100).toFixed(1)
            : 0,
          crisisPreventionRate: (metrics.crisisPreventionRate * 100).toFixed(1),
          patientEngagementRate: (metrics.patientEngagementRate * 100).toFixed(1),
        },
        patientOutcomes: {
          averageMoodImprovement: metrics.averagePatientMoodImprovement.toFixed(2),
          medicationAdherence: (metrics.medicationAdherenceRate * 100).toFixed(1),
          activePatients: metrics.activePatients,
        },
      },
    };
  }

  /**
   * Helper: Generate insights from metrics
   */
  private generateInsights(metrics: any): string[] {
    const insights: string[] = [];

    // Time savings insights
    if (metrics.estimatedTimeSavedMinutes > 60) {
      const hours = (metrics.estimatedTimeSavedMinutes / 60).toFixed(1);
      insights.push(`You've saved ${hours} hours with AI SOAP notes this period`);
    }

    // Crisis management insights
    if (metrics.crisesDetected > 0) {
      const rate = (metrics.crisisPreventionRate * 100).toFixed(0);
      insights.push(`${rate}% of detected crises were successfully resolved`);
    }

    // Patient engagement insights
    if (metrics.patientEngagementRate > 0.7) {
      insights.push(`Strong patient engagement: ${(metrics.patientEngagementRate * 100).toFixed(0)}% of patients actively tracking mood`);
    } else if (metrics.patientEngagementRate < 0.3) {
      insights.push(`Consider strategies to improve patient engagement (currently ${(metrics.patientEngagementRate * 100).toFixed(0)}%)`);
    }

    // Mood improvement insights
    if (metrics.averagePatientMoodImprovement > 0.5) {
      insights.push(`Patients showing significant mood improvement (+${metrics.averagePatientMoodImprovement.toFixed(1)} on average)`);
    } else if (metrics.averagePatientMoodImprovement < -0.3) {
      insights.push(`Patient mood trending downward - review treatment plans`);
    }

    // Alert management insights
    if (metrics.averageAlertResolutionDays > 7) {
      insights.push(`Risk alerts taking ${metrics.averageAlertResolutionDays.toFixed(0)} days to resolve on average - consider prioritization`);
    } else if (metrics.averageAlertResolutionDays < 3) {
      insights.push(`Excellent alert response time: ${metrics.averageAlertResolutionDays.toFixed(1)} days average`);
    }

    // AI adoption insights
    const aiAdoptionRate = metrics.totalEncounters > 0
      ? (metrics.encountersWithAiSoap / metrics.totalEncounters)
      : 0;

    if (aiAdoptionRate > 0.8) {
      insights.push(`High AI adoption: ${(aiAdoptionRate * 100).toFixed(0)}% of encounters use AI SOAP notes`);
    } else if (aiAdoptionRate < 0.3) {
      insights.push(`Try using AI SOAP generation more frequently to save time`);
    }

    return insights;
  }
}
