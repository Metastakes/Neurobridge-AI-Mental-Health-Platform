/**
 * Provider Notification Preferences Service
 * Manages provider notification settings for SMS/Email/WebSocket alerts
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface NotificationPreferencesDto {
  // Channel preferences
  enableSms?: boolean;
  enableEmail?: boolean;
  enableWebSocket?: boolean;

  // Alert type preferences
  crisisAlerts?: boolean;
  safetyCheckAlerts?: boolean;
  highRiskAlerts?: boolean;
  mediumRiskAlerts?: boolean;
  lowRiskAlerts?: boolean;

  // Quiet hours
  enableQuietHours?: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  quietHoursTimezone?: string; // "America/New_York"

  // Delivery preferences
  smsForCriticalOnly?: boolean;
  emailDigestEnabled?: boolean;

  // Contact overrides
  overrideSmsNumber?: string;
  overrideEmail?: string;
}

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get provider notification preferences
   * Creates default preferences if none exist
   */
  async getPreferences(providerId: string) {
    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { providerId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      this.logger.log(`Creating default notification preferences for provider ${providerId}`);
      prefs = await this.createDefaultPreferences(providerId);
    }

    return prefs;
  }

  /**
   * Update provider notification preferences
   */
  async updatePreferences(providerId: string, dto: NotificationPreferencesDto) {
    // Ensure preferences exist
    await this.getPreferences(providerId);

    // Update preferences
    const updated = await this.prisma.notificationPreferences.update({
      where: { providerId },
      data: dto,
    });

    this.logger.log(`Updated notification preferences for provider ${providerId}`);

    return updated;
  }

  /**
   * Create default notification preferences for provider
   */
  async createDefaultPreferences(providerId: string) {
    return this.prisma.notificationPreferences.create({
      data: {
        providerId,
        // Defaults are set in Prisma schema
      },
    });
  }

  /**
   * Check if provider should receive SMS for a specific alert
   */
  async shouldReceiveSms(
    providerId: string,
    alertType: 'crisis' | 'safety_check' | 'high_risk' | 'medium_risk' | 'low_risk',
  ): Promise<{ should: boolean; reason?: string; number?: string }> {
    const prefs = await this.getPreferences(providerId);

    // Check if SMS enabled globally
    if (!prefs.enableSms) {
      return { should: false, reason: 'SMS disabled in preferences' };
    }

    // Check if in quiet hours
    if (prefs.enableQuietHours) {
      const isQuietHours = this.isInQuietHours(
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        prefs.quietHoursTimezone,
      );

      if (isQuietHours) {
        // Allow crisis and safety checks even during quiet hours
        if (alertType !== 'crisis' && alertType !== 'safety_check') {
          return { should: false, reason: 'Currently in quiet hours' };
        }
      }
    }

    // Check if SMS for critical only
    if (prefs.smsForCriticalOnly) {
      if (alertType !== 'crisis' && alertType !== 'safety_check') {
        return { should: false, reason: 'SMS for critical alerts only' };
      }
    }

    // Check alert type preferences
    const alertPreferenceMap = {
      crisis: prefs.crisisAlerts,
      safety_check: prefs.safetyCheckAlerts,
      high_risk: prefs.highRiskAlerts,
      medium_risk: prefs.mediumRiskAlerts,
      low_risk: prefs.lowRiskAlerts,
    };

    if (!alertPreferenceMap[alertType]) {
      return { should: false, reason: `${alertType} alerts disabled` };
    }

    // Get phone number (override or from user profile)
    const number = await this.getSmsNumber(providerId, prefs.overrideSmsNumber);

    if (!number) {
      return { should: false, reason: 'No phone number configured' };
    }

    return { should: true, number };
  }

  /**
   * Check if provider should receive Email for a specific alert
   */
  async shouldReceiveEmail(
    providerId: string,
    alertType: 'crisis' | 'safety_check' | 'high_risk' | 'medium_risk' | 'low_risk',
  ): Promise<{ should: boolean; reason?: string; email?: string }> {
    const prefs = await this.getPreferences(providerId);

    // Check if Email enabled globally
    if (!prefs.enableEmail) {
      return { should: false, reason: 'Email disabled in preferences' };
    }

    // Check if in quiet hours (email also respects quiet hours)
    if (prefs.enableQuietHours) {
      const isQuietHours = this.isInQuietHours(
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        prefs.quietHoursTimezone,
      );

      if (isQuietHours) {
        // Allow crisis and safety checks even during quiet hours
        if (alertType !== 'crisis' && alertType !== 'safety_check') {
          return { should: false, reason: 'Currently in quiet hours' };
        }
      }
    }

    // Check alert type preferences
    const alertPreferenceMap = {
      crisis: prefs.crisisAlerts,
      safety_check: prefs.safetyCheckAlerts,
      high_risk: prefs.highRiskAlerts,
      medium_risk: prefs.mediumRiskAlerts,
      low_risk: prefs.lowRiskAlerts,
    };

    if (!alertPreferenceMap[alertType]) {
      return { should: false, reason: `${alertType} alerts disabled` };
    }

    // Get email address (override or from user profile)
    const email = await this.getEmail(providerId, prefs.overrideEmail);

    if (!email) {
      return { should: false, reason: 'No email address configured' };
    }

    return { should: true, email };
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(
    start?: string,
    end?: string,
    timezone?: string,
  ): boolean {
    if (!start || !end) return false;

    try {
      // Get current time in provider's timezone
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: timezone || 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
      });

      const [currentHour, currentMinute] = timeString.split(':').map(Number);
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      const currentMinutes = currentHour * 60 + currentMinute;
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Handle overnight quiet hours (e.g., 22:00 - 08:00)
      if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      // Normal quiet hours (e.g., 08:00 - 18:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch (error) {
      this.logger.error(`Error checking quiet hours: ${error.message}`);
      return false;
    }
  }

  /**
   * Get SMS phone number for provider
   */
  private async getSmsNumber(providerId: string, override?: string): Promise<string | null> {
    if (override) return override;

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: { phone: true },
        },
      },
    });

    return provider?.user.phone || null;
  }

  /**
   * Get email address for provider
   */
  private async getEmail(providerId: string, override?: string): Promise<string | null> {
    if (override) return override;

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    return provider?.user.email || null;
  }

  /**
   * Get provider name for notifications
   */
  async getProviderName(providerId: string): Promise<string> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider ${providerId} not found`);
    }

    return `${provider.user.firstName} ${provider.user.lastName}`;
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(providerId: string) {
    await this.prisma.notificationPreferences.deleteMany({
      where: { providerId },
    });

    return this.createDefaultPreferences(providerId);
  }
}
