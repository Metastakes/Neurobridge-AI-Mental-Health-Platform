/**
 * INNOVATION: Notification Service
 * Handles event-based notification broadcasting with SMS/Email fallback
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsGateway } from './notifications.gateway';
import { SmsService } from '../communications/sms.service';
import { EmailService } from '../communications/email.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationHistoryService } from './notification-history.service';

export interface CrisisAlertEvent {
  providerId: string;
  patientId: string;
  patientName: string;
  indicators: string[];
  severity: 'critical' | 'high';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface RiskAlertEvent {
  providerId: string;
  patientId: string;
  patientName: string;
  kind: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  message: string;
}

export interface SafetyCheckEvent {
  providerId: string;
  patientId: string;
  patientName: string;
  reason: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly historyService: NotificationHistoryService,
  ) {}

  /**
   * Listen for crisis.detected events and broadcast to provider
   */
  @OnEvent('crisis.detected')
  async handleCrisisDetected(event: CrisisAlertEvent) {
    this.logger.warn(`Crisis detected event received: Patient ${event.patientId}`);

    // Send WebSocket notification to provider
    this.notificationsGateway.sendCrisisAlert(event.providerId, {
      patientId: event.patientId,
      patientName: event.patientName,
      indicators: event.indicators,
      severity: event.severity,
      emergencyContact: event.emergencyContact,
      detectedAt: new Date().toISOString(),
    });

    // Send SMS/Email if provider is offline (critical alerts always get sent)
    if (!this.notificationsGateway.isProviderOnline(event.providerId)) {
      this.logger.warn(`Provider ${event.providerId} is offline - sending SMS/Email fallback`);
      await this.sendCrisisAlertFallback(event);
    }
  }

  /**
   * Listen for risk.alert events and broadcast to provider
   */
  @OnEvent('risk.alert')
  async handleRiskAlert(event: RiskAlertEvent) {
    this.logger.log(`Risk alert event received: ${event.kind} for patient ${event.patientId}`);

    // Send WebSocket notification to provider
    this.notificationsGateway.sendRiskAlert(event.providerId, {
      patientId: event.patientId,
      patientName: event.patientName,
      kind: event.kind,
      severity: event.severity,
      score: event.score,
      message: event.message,
      detectedAt: new Date().toISOString(),
    });

    // Send SMS/Email only for high severity and offline providers
    if (event.severity === 'high' && !this.notificationsGateway.isProviderOnline(event.providerId)) {
      this.logger.warn(`Provider ${event.providerId} is offline - sending risk alert fallback`);
      await this.sendRiskAlertFallback(event);
    }
  }

  /**
   * Listen for safety.check.requested events
   */
  @OnEvent('safety.check.requested')
  async handleSafetyCheckRequest(event: SafetyCheckEvent) {
    this.logger.warn(`Safety check requested: Patient ${event.patientId}`);

    // Send WebSocket notification to provider
    this.notificationsGateway.sendSafetyCheckRequest(event.providerId, {
      patientId: event.patientId,
      patientName: event.patientName,
      reason: event.reason,
      requestedAt: new Date().toISOString(),
    });

    // Send SMS/Email if provider is offline
    if (!this.notificationsGateway.isProviderOnline(event.providerId)) {
      this.logger.warn(`Provider ${event.providerId} is offline - sending safety check fallback`);
      await this.sendSafetyCheckFallback(event);
    }
  }

  /**
   * Send custom notification to provider
   */
  async sendNotification(providerId: string, notification: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'error';
    action?: {
      label: string;
      url: string;
    };
  }) {
    this.notificationsGateway.sendNotification(providerId, notification);
  }

  /**
   * Broadcast system announcement to all providers
   */
  async broadcastAnnouncement(announcement: {
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    expiresAt?: Date;
  }) {
    this.notificationsGateway.broadcastAnnouncement(announcement);
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return {
      onlineProviders: this.notificationsGateway.getOnlineProviderCount(),
      connectedProviderIds: this.notificationsGateway.getConnectedProviderIds(),
      smsServiceReady: this.smsService.isOperational(),
      emailServiceReady: this.emailService.isOperational(),
    };
  }

  /**
   * Send crisis alert via SMS and Email (fallback for offline providers)
   * Respects provider notification preferences
   */
  private async sendCrisisAlertFallback(event: CrisisAlertEvent) {
    try {
      // Check SMS preferences
      const smsCheck = await this.preferencesService.shouldReceiveSms(
        event.providerId,
        'crisis',
      );

      if (smsCheck.should && smsCheck.number && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendCrisisAlert(
          smsCheck.number,
          event.patientName,
          event.indicators,
          event.emergencyContact,
        );

        // Log notification
        await this.historyService.logNotification({
          providerId: event.providerId,
          notificationType: 'crisis',
          channel: 'sms',
          recipient: smsCheck.number,
          patientId: event.patientId,
          patientName: event.patientName,
          alertData: { indicators: event.indicators, emergencyContact: event.emergencyContact },
          status: smsResult.success ? 'sent' : 'failed',
          statusMessage: smsResult.error,
          externalId: smsResult.messageId,
        });

        if (smsResult.success) {
          this.logger.log(`Crisis SMS sent to provider ${event.providerId}: ${smsResult.messageId}`);
        } else {
          this.logger.error(`Failed to send crisis SMS: ${smsResult.error}`);
        }
      } else {
        this.logger.log(`SMS not sent to provider ${event.providerId}: ${smsCheck.reason || 'preferences'}`);
      }

      // Check Email preferences
      const emailCheck = await this.preferencesService.shouldReceiveEmail(
        event.providerId,
        'crisis',
      );

      if (emailCheck.should && emailCheck.email && this.emailService.isOperational()) {
        const providerName = await this.preferencesService.getProviderName(event.providerId);

        const emailResult = await this.emailService.sendCrisisAlert(
          emailCheck.email,
          providerName,
          event.patientName,
          event.patientId,
          event.indicators,
          event.emergencyContact,
        );

        // Log notification
        await this.historyService.logNotification({
          providerId: event.providerId,
          notificationType: 'crisis',
          channel: 'email',
          recipient: emailCheck.email,
          patientId: event.patientId,
          patientName: event.patientName,
          alertData: { indicators: event.indicators, emergencyContact: event.emergencyContact },
          status: emailResult.success ? 'sent' : 'failed',
          statusMessage: emailResult.error,
          externalId: emailResult.messageId,
        });

        if (emailResult.success) {
          this.logger.log(`Crisis email sent to provider ${event.providerId}: ${emailResult.messageId}`);
        } else {
          this.logger.error(`Failed to send crisis email: ${emailResult.error}`);
        }
      } else {
        this.logger.log(`Email not sent to provider ${event.providerId}: ${emailCheck.reason || 'preferences'}`);
      }
    } catch (error) {
      this.logger.error(`Error sending crisis alert fallback: ${error.message}`);
    }
  }

  /**
   * Send safety check alert via SMS and Email (fallback for offline providers)
   * Respects provider notification preferences
   */
  private async sendSafetyCheckFallback(event: SafetyCheckEvent) {
    try {
      // Check SMS preferences
      const smsCheck = await this.preferencesService.shouldReceiveSms(
        event.providerId,
        'safety_check',
      );

      if (smsCheck.should && smsCheck.number && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendSafetyCheckAlert(
          smsCheck.number,
          event.patientName,
          event.reason,
        );

        if (smsResult.success) {
          this.logger.log(`Safety check SMS sent to provider ${event.providerId}`);
        }
      } else {
        this.logger.log(`SMS not sent to provider ${event.providerId}: ${smsCheck.reason || 'preferences'}`);
      }

      // Check Email preferences
      const emailCheck = await this.preferencesService.shouldReceiveEmail(
        event.providerId,
        'safety_check',
      );

      if (emailCheck.should && emailCheck.email && this.emailService.isOperational()) {
        const providerName = await this.preferencesService.getProviderName(event.providerId);

        const emailResult = await this.emailService.sendSafetyCheckAlert(
          emailCheck.email,
          providerName,
          event.patientName,
          event.patientId,
          event.reason,
        );

        if (emailResult.success) {
          this.logger.log(`Safety check email sent to provider ${event.providerId}`);
        }
      } else {
        this.logger.log(`Email not sent to provider ${event.providerId}: ${emailCheck.reason || 'preferences'}`);
      }
    } catch (error) {
      this.logger.error(`Error sending safety check fallback: ${error.message}`);
    }
  }

  /**
   * Send risk alert via SMS and Email (fallback for offline providers)
   * Respects provider notification preferences
   */
  private async sendRiskAlertFallback(event: RiskAlertEvent) {
    try {
      // Map severity to alert type
      const alertType = event.severity === 'high' ? 'high_risk' : event.severity === 'medium' ? 'medium_risk' : 'low_risk';

      // Check SMS preferences
      const smsCheck = await this.preferencesService.shouldReceiveSms(
        event.providerId,
        alertType as any,
      );

      if (smsCheck.should && smsCheck.number && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendRiskAlert(
          smsCheck.number,
          event.patientName,
          event.kind,
          event.message,
        );

        if (smsResult.success) {
          this.logger.log(`Risk alert SMS sent to provider ${event.providerId}`);
        }
      } else {
        this.logger.log(`SMS not sent to provider ${event.providerId}: ${smsCheck.reason || 'preferences'}`);
      }

      // Check Email preferences
      const emailCheck = await this.preferencesService.shouldReceiveEmail(
        event.providerId,
        alertType as any,
      );

      if (emailCheck.should && emailCheck.email && this.emailService.isOperational()) {
        const providerName = await this.preferencesService.getProviderName(event.providerId);

        const emailResult = await this.emailService.sendRiskAlert(
          emailCheck.email,
          providerName,
          event.patientName,
          event.patientId,
          event.kind,
          event.message,
          event.score,
        );

        if (emailResult.success) {
          this.logger.log(`Risk alert email sent to provider ${event.providerId}`);
        }
      } else {
        this.logger.log(`Email not sent to provider ${event.providerId}: ${emailCheck.reason || 'preferences'}`);
      }
    } catch (error) {
      this.logger.error(`Error sending risk alert fallback: ${error.message}`);
    }
  }
}
