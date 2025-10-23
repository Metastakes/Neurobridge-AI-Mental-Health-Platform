/**
 * Notification History Controller
 * API for retrieving notification delivery logs and statistics
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationHistoryService } from './notification-history.service';

@Controller('notifications/history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
export class NotificationHistoryController {
  constructor(
    private readonly historyService: NotificationHistoryService,
  ) {}

  /**
   * Get notification history with filtering and pagination
   */
  @Get()
  async getHistory(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('channel') channel?: 'websocket' | 'sms' | 'email',
    @Query('type') notificationType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const providerId = req.user.providerId || req.user.id;

    return this.historyService.getProviderHistory(providerId, {
      limit,
      offset,
      channel,
      notificationType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get notification statistics
   */
  @Get('stats')
  async getStats(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const providerId = req.user.providerId || req.user.id;
    return this.historyService.getProviderStats(providerId, days || 30);
  }

  /**
   * Get recent notifications
   */
  @Get('recent')
  async getRecent(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const providerId = req.user.providerId || req.user.id;
    return this.historyService.getRecentNotifications(providerId, limit || 10);
  }

  /**
   * Get failed notifications
   */
  @Get('failed')
  async getFailed(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const providerId = req.user.providerId || req.user.id;
    return this.historyService.getFailedNotifications(providerId, limit || 20);
  }

  /**
   * Get notification timeline for charts
   */
  @Get('timeline')
  async getTimeline(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const providerId = req.user.providerId || req.user.id;
    return this.historyService.getNotificationTimeline(providerId, days || 30);
  }
}
