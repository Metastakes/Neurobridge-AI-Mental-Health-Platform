/**
 * INNOVATION: Notification Service
 * Handles event-based notification broadcasting
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsGateway } from './notifications.gateway';

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

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

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

    // TODO: Send SMS/Email if provider is offline
    if (!this.notificationsGateway.isProviderOnline(event.providerId)) {
      this.logger.warn(`Provider ${event.providerId} is offline - should send SMS/Email`);
      // await this.sendSmsAlert(event);
      // await this.sendEmailAlert(event);
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

    // Also send email if not online
    if (!this.notificationsGateway.isProviderOnline(event.providerId)) {
      this.logger.warn(`Provider ${event.providerId} is offline - should send email notification`);
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
    };
  }
}
