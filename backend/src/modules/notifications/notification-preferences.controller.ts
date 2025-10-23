/**
 * Provider Notification Preferences Controller
 * API for managing provider notification settings
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  NotificationPreferencesService,
  NotificationPreferencesDto,
} from './notification-preferences.service';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
export class NotificationPreferencesController {
  constructor(
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  /**
   * Get current provider's notification preferences
   */
  @Get()
  async getPreferences(@Request() req) {
    const providerId = req.user.providerId || req.user.id;
    return this.preferencesService.getPreferences(providerId);
  }

  /**
   * Update current provider's notification preferences
   */
  @Put()
  async updatePreferences(
    @Request() req,
    @Body() dto: NotificationPreferencesDto,
  ) {
    const providerId = req.user.providerId || req.user.id;
    return this.preferencesService.updatePreferences(providerId, dto);
  }

  /**
   * Reset preferences to defaults
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPreferences(@Request() req) {
    const providerId = req.user.providerId || req.user.id;
    return this.preferencesService.resetToDefaults(providerId);
  }

  /**
   * Test if SMS would be sent for a specific alert type
   */
  @Get('test/sms/:alertType')
  async testSms(@Request() req, @Request() params) {
    const providerId = req.user.providerId || req.user.id;
    const alertType = params.alertType as any;

    return this.preferencesService.shouldReceiveSms(providerId, alertType);
  }

  /**
   * Test if Email would be sent for a specific alert type
   */
  @Get('test/email/:alertType')
  async testEmail(@Request() req, @Request() params) {
    const providerId = req.user.providerId || req.user.id;
    const alertType = params.alertType as any;

    return this.preferencesService.shouldReceiveEmail(providerId, alertType);
  }
}
