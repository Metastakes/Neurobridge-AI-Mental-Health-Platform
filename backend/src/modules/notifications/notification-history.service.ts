/**
 * Notification History Service
 * Tracks and retrieves notification delivery logs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface LogNotificationDto {
  providerId: string;
  notificationType: 'crisis' | 'safety_check' | 'high_risk' | 'medium_risk' | 'low_risk';
  channel: 'websocket' | 'sms' | 'email';
  recipient: string;
  patientId: string;
  patientName: string;
  alertData?: any;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  statusMessage?: string;
  externalId?: string;
}

export interface NotificationStats {
  totalSent: number;
  byChannel: {
    websocket: number;
    sms: number;
    email: number;
  };
  byType: {
    crisis: number;
    safety_check: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  byStatus: {
    sent: number;
    delivered: number;
    failed: number;
  };
  avgResponseTimeMinutes: number | null;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

@Injectable()
export class NotificationHistoryService {
  private readonly logger = new Logger(NotificationHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a sent notification
   */
  async logNotification(dto: LogNotificationDto) {
    try {
      const log = await this.prisma.notificationDeliveryLog.create({
        data: {
          providerId: dto.providerId,
          notificationType: dto.notificationType,
          channel: dto.channel,
          recipient: dto.recipient,
          patientId: dto.patientId,
          patientName: dto.patientName,
          alertData: dto.alertData || {},
          status: dto.status || 'sent',
          statusMessage: dto.statusMessage,
          externalId: dto.externalId,
          sentAt: new Date(),
        },
      });

      this.logger.log(
        `Logged ${dto.channel} notification: ${dto.notificationType} to provider ${dto.providerId}`
      );

      return log;
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error.message}`);
      // Don't throw - logging should not break notification delivery
      return null;
    }
  }

  /**
   * Update notification status (e.g., delivery confirmation)
   */
  async updateNotificationStatus(
    id: string,
    status: 'sent' | 'delivered' | 'failed',
    statusMessage?: string
  ) {
    return this.prisma.notificationDeliveryLog.update({
      where: { id },
      data: {
        status,
        statusMessage,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
        failedAt: status === 'failed' ? new Date() : undefined,
      },
    });
  }

  /**
   * Get notification history for a provider
   */
  async getProviderHistory(
    providerId: string,
    options: {
      limit?: number;
      offset?: number;
      channel?: 'websocket' | 'sms' | 'email';
      notificationType?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      channel,
      notificationType,
      status,
      startDate,
      endDate,
    } = options;

    const where: any = {
      providerId,
    };

    if (channel) where.channel = channel;
    if (notificationType) where.notificationType = notificationType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.notificationDeliveryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notificationDeliveryLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get notification statistics for a provider
   */
  async getProviderStats(providerId: string, days: number = 30): Promise<NotificationStats> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await this.prisma.notificationDeliveryLog.findMany({
      where: {
        providerId,
        createdAt: { gte: cutoff },
      },
      select: {
        channel: true,
        notificationType: true,
        status: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
      },
    });

    // Calculate stats
    const stats: NotificationStats = {
      totalSent: logs.length,
      byChannel: {
        websocket: 0,
        sms: 0,
        email: 0,
      },
      byType: {
        crisis: 0,
        safety_check: 0,
        high_risk: 0,
        medium_risk: 0,
        low_risk: 0,
      },
      byStatus: {
        sent: 0,
        delivered: 0,
        failed: 0,
      },
      avgResponseTimeMinutes: null,
      last24Hours: 0,
      last7Days: 0,
      last30Days: logs.length,
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const log of logs) {
      // Count by channel
      if (log.channel in stats.byChannel) {
        stats.byChannel[log.channel as keyof typeof stats.byChannel]++;
      }

      // Count by type
      if (log.notificationType in stats.byType) {
        stats.byType[log.notificationType as keyof typeof stats.byType]++;
      }

      // Count by status
      if (log.status in stats.byStatus) {
        stats.byStatus[log.status as keyof typeof stats.byStatus]++;
      }

      // Count by time period
      if (log.createdAt >= oneDayAgo) stats.last24Hours++;
      if (log.createdAt >= sevenDaysAgo) stats.last7Days++;

      // Calculate response time (sent to delivered)
      if (log.sentAt && log.deliveredAt) {
        const responseTime = log.deliveredAt.getTime() - log.sentAt.getTime();
        totalResponseTime += responseTime;
        responseTimeCount++;
      }
    }

    // Average response time in minutes
    if (responseTimeCount > 0) {
      stats.avgResponseTimeMinutes = Math.round(
        totalResponseTime / responseTimeCount / 1000 / 60
      );
    }

    return stats;
  }

  /**
   * Get recent notifications for dashboard
   */
  async getRecentNotifications(providerId: string, limit: number = 10) {
    return this.prisma.notificationDeliveryLog.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        notificationType: true,
        channel: true,
        recipient: true,
        patientName: true,
        status: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
        statusMessage: true,
      },
    });
  }

  /**
   * Get failed notifications for provider
   */
  async getFailedNotifications(providerId: string, limit: number = 20) {
    return this.prisma.notificationDeliveryLog.findMany({
      where: {
        providerId,
        status: 'failed',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        notificationType: true,
        channel: true,
        recipient: true,
        patientName: true,
        statusMessage: true,
        createdAt: true,
        failedAt: true,
      },
    });
  }

  /**
   * Delete old notification logs (cleanup)
   */
  async deleteOldLogs(daysToKeep: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const result = await this.prisma.notificationDeliveryLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    this.logger.log(`Deleted ${result.count} notification logs older than ${daysToKeep} days`);

    return result.count;
  }

  /**
   * Get notification timeline (for charts)
   */
  async getNotificationTimeline(
    providerId: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await this.prisma.notificationDeliveryLog.findMany({
      where: {
        providerId,
        createdAt: { gte: cutoff },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, number>();

    for (const log of logs) {
      const date = log.createdAt.toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }

    // Fill in missing dates with 0
    const timeline: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      timeline.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }

    return timeline;
  }
}
