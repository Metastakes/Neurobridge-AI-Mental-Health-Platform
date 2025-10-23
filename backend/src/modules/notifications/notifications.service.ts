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
   */
  private async sendCrisisAlertFallback(event: CrisisAlertEvent) {
    try {
      // Get provider contact info
      const provider = await this.prisma.provider.findUnique({
        where: { id: event.providerId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!provider) {
        this.logger.error(`Provider ${event.providerId} not found for fallback notification`);
        return;
      }

      const providerName = `${provider.user.firstName} ${provider.user.lastName}`;
      const providerEmail = provider.user.email;
      const providerPhone = provider.user.phone;

      // Send SMS if phone number available
      if (providerPhone && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendCrisisAlert(
          providerPhone,
          event.patientName,
          event.indicators,
          event.emergencyContact,
        );

        if (smsResult.success) {
          this.logger.log(`Crisis SMS sent to provider ${event.providerId}: ${smsResult.messageId}`);
        } else {
          this.logger.error(`Failed to send crisis SMS: ${smsResult.error}`);
        }
      } else {
        this.logger.warn(`SMS not sent: phone=${providerPhone}, operational=${this.smsService.isOperational()}`);
      }

      // Send Email
      if (providerEmail && this.emailService.isOperational()) {
        const emailResult = await this.emailService.sendCrisisAlert(
          providerEmail,
          providerName,
          event.patientName,
          event.patientId,
          event.indicators,
          event.emergencyContact,
        );

        if (emailResult.success) {
          this.logger.log(`Crisis email sent to provider ${event.providerId}: ${emailResult.messageId}`);
        } else {
          this.logger.error(`Failed to send crisis email: ${emailResult.error}`);
        }
      } else {
        this.logger.warn(`Email not sent: email=${providerEmail}, operational=${this.emailService.isOperational()}`);
      }
    } catch (error) {
      this.logger.error(`Error sending crisis alert fallback: ${error.message}`);
    }
  }

  /**
   * Send safety check alert via SMS and Email (fallback for offline providers)
   */
  private async sendSafetyCheckFallback(event: SafetyCheckEvent) {
    try {
      // Get provider contact info
      const provider = await this.prisma.provider.findUnique({
        where: { id: event.providerId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!provider) {
        this.logger.error(`Provider ${event.providerId} not found for fallback notification`);
        return;
      }

      const providerName = `${provider.user.firstName} ${provider.user.lastName}`;
      const providerEmail = provider.user.email;
      const providerPhone = provider.user.phone;

      // Send SMS
      if (providerPhone && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendSafetyCheckAlert(
          providerPhone,
          event.patientName,
          event.reason,
        );

        if (smsResult.success) {
          this.logger.log(`Safety check SMS sent to provider ${event.providerId}`);
        }
      }

      // Send Email
      if (providerEmail && this.emailService.isOperational()) {
        const emailResult = await this.emailService.sendSafetyCheckAlert(
          providerEmail,
          providerName,
          event.patientName,
          event.patientId,
          event.reason,
        );

        if (emailResult.success) {
          this.logger.log(`Safety check email sent to provider ${event.providerId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending safety check fallback: ${error.message}`);
    }
  }

  /**
   * Send risk alert via SMS and Email (fallback for offline providers)
   */
  private async sendRiskAlertFallback(event: RiskAlertEvent) {
    try {
      // Get provider contact info
      const provider = await this.prisma.provider.findUnique({
        where: { id: event.providerId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!provider) {
        this.logger.error(`Provider ${event.providerId} not found for fallback notification`);
        return;
      }

      const providerName = `${provider.user.firstName} ${provider.user.lastName}`;
      const providerEmail = provider.user.email;
      const providerPhone = provider.user.phone;

      // Send SMS
      if (providerPhone && this.smsService.isOperational()) {
        const smsResult = await this.smsService.sendRiskAlert(
          providerPhone,
          event.patientName,
          event.kind,
          event.message,
        );

        if (smsResult.success) {
          this.logger.log(`Risk alert SMS sent to provider ${event.providerId}`);
        }
      }

      // Send Email
      if (providerEmail && this.emailService.isOperational()) {
        const emailResult = await this.emailService.sendRiskAlert(
          providerEmail,
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
      }
    } catch (error) {
      this.logger.error(`Error sending risk alert fallback: ${error.message}`);
    }
  }
}
