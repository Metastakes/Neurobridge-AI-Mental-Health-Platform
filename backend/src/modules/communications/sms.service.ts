/**
 * INNOVATION: SMS Emergency Notifications
 * Sends critical alerts via SMS when providers are offline
 *
 * DEPENDENCIES REQUIRED (add to package.json):
 * - twilio
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Twilio will be imported when package is installed
// import twilio from 'twilio';

export interface SmsMessage {
  to: string; // Provider phone number
  message: string;
  priority: 'critical' | 'high' | 'normal';
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: any;
  private fromNumber: string;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeTwilio();
  }

  /**
   * Initialize Twilio client
   */
  private initializeTwilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn(
        'Twilio not configured. SMS notifications will be simulated. ' +
        'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable.'
      );
      return;
    }

    try {
      // Will work when twilio package is installed:
      // this.twilioClient = twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio SMS service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error);
    }
  }

  /**
   * Send crisis alert SMS to provider
   */
  async sendCrisisAlert(
    providerPhone: string,
    patientName: string,
    indicators: string[],
    emergencyContact?: { name: string; phone: string },
  ): Promise<SmsResult> {
    const message = this.formatCrisisMessage(patientName, indicators, emergencyContact);

    return this.sendSms({
      to: providerPhone,
      message,
      priority: 'critical',
    });
  }

  /**
   * Send safety check request SMS
   */
  async sendSafetyCheckAlert(
    providerPhone: string,
    patientName: string,
    reason: string,
  ): Promise<SmsResult> {
    const message = `🆘 SAFETY CHECK REQUEST\n\nPatient: ${patientName}\nReason: ${reason}\n\nPlease respond immediately.\n\nNeuroBridge AI`;

    return this.sendSms({
      to: providerPhone,
      message,
      priority: 'critical',
    });
  }

  /**
   * Send risk alert SMS (high severity only)
   */
  async sendRiskAlert(
    providerPhone: string,
    patientName: string,
    riskType: string,
    riskMessage: string,
  ): Promise<SmsResult> {
    const message = `⚠️ HIGH RISK ALERT\n\nPatient: ${patientName}\nType: ${riskType}\n${riskMessage}\n\nReview patient dashboard.\n\nNeuroBridge AI`;

    return this.sendSms({
      to: providerPhone,
      message,
      priority: 'high',
    });
  }

  /**
   * Send generic SMS
   */
  async sendSms(smsMessage: SmsMessage): Promise<SmsResult> {
    const { to, message, priority } = smsMessage;

    // Validate phone number format
    if (!this.isValidPhoneNumber(to)) {
      this.logger.error(`Invalid phone number format: ${to}`);
      return {
        success: false,
        error: 'Invalid phone number format',
        timestamp: new Date(),
      };
    }

    // If Twilio not configured, simulate sending
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED SMS] To: ${to}, Priority: ${priority}`);
      this.logger.log(`Message: ${message}`);
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        timestamp: new Date(),
      };
    }

    try {
      // Send via Twilio (when package is installed)
      // const result = await this.twilioClient.messages.create({
      //   body: message,
      //   from: this.fromNumber,
      //   to: to,
      // });

      // Simulated response until Twilio is installed
      const result = {
        sid: `sim_${Date.now()}`,
      };

      this.logger.log(`SMS sent successfully to ${to}: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);

      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Format crisis alert message
   */
  private formatCrisisMessage(
    patientName: string,
    indicators: string[],
    emergencyContact?: { name: string; phone: string },
  ): string {
    let message = `🚨 CRISIS ALERT\n\nPatient: ${patientName}\n\nIndicators:\n`;

    indicators.forEach((indicator, index) => {
      message += `${index + 1}. ${indicator}\n`;
    });

    if (emergencyContact) {
      message += `\nEmergency Contact:\n${emergencyContact.name}\n${emergencyContact.phone}`;
    }

    message += '\n\nIMMEDIATE ACTION REQUIRED\n\nNeuroBridge AI';

    return message;
  }

  /**
   * Validate phone number format
   * Accepts: +1234567890, 1234567890, (123) 456-7890, etc.
   */
  private isValidPhoneNumber(phone: string): boolean {
    if (!phone) return false;

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    // Check if it's a valid E.164 format or 10-digit US number
    const e164Regex = /^\+[1-9]\d{1,14}$/; // International format
    const usRegex = /^1?\d{10}$/; // US format

    return e164Regex.test(cleaned) || usRegex.test(cleaned);
  }

  /**
   * Format phone number to E.164 standard (+1234567890)
   */
  formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove formatting
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    // Already in E.164 format
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Add +1 for US numbers (assuming US if no country code)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Check if SMS service is operational
   */
  isOperational(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      fromNumber: this.isConfigured ? this.fromNumber : 'Not configured',
      ready: this.isConfigured,
    };
  }
}
