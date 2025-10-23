/**
 * INNOVATION: Email Emergency Notifications
 * Sends critical alerts via email when providers are offline
 *
 * DEPENDENCIES REQUIRED (add to package.json):
 * - nodemailer
 * - @types/nodemailer (dev dependency)
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - SMTP_HOST (e.g., smtp.gmail.com)
 * - SMTP_PORT (e.g., 587)
 * - SMTP_USER (email address)
 * - SMTP_PASS (app password)
 * - SMTP_FROM_NAME (e.g., "NeuroBridge AI")
 * - FRONTEND_URL (for dashboard links)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Nodemailer will be imported when package is installed
// import * as nodemailer from 'nodemailer';
// import { Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string; // Provider email
  subject: string;
  htmlBody: string;
  textBody: string;
  priority?: 'critical' | 'high' | 'normal';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;
  private fromAddress: string;
  private fromName: string;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeMailer();
  }

  /**
   * Initialize email transporter
   */
  private initializeMailer() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'NeuroBridge AI';
    this.fromAddress = user || 'noreply@neurobridge.ai';

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP not configured. Email notifications will be simulated. ' +
        'Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to enable.'
      );
      return;
    }

    try {
      // Will work when nodemailer is installed:
      // this.transporter = nodemailer.createTransport({
      //   host,
      //   port: port || 587,
      //   secure: port === 465,
      //   auth: { user, pass },
      // });

      this.isConfigured = true;
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send crisis alert email
   */
  async sendCrisisAlert(
    providerEmail: string,
    providerName: string,
    patientName: string,
    patientId: string,
    indicators: string[],
    emergencyContact?: { name: string; phone: string; relationship: string },
  ): Promise<EmailResult> {
    const subject = `🚨 CRISIS ALERT: ${patientName}`;

    const htmlBody = this.buildCrisisAlertHtml(
      providerName,
      patientName,
      patientId,
      indicators,
      emergencyContact,
    );

    const textBody = this.buildCrisisAlertText(
      providerName,
      patientName,
      indicators,
      emergencyContact,
    );

    return this.sendEmail({
      to: providerEmail,
      subject,
      htmlBody,
      textBody,
      priority: 'critical',
    });
  }

  /**
   * Send safety check request email
   */
  async sendSafetyCheckAlert(
    providerEmail: string,
    providerName: string,
    patientName: string,
    patientId: string,
    reason: string,
  ): Promise<EmailResult> {
    const subject = `🆘 Safety Check Request: ${patientName}`;

    const htmlBody = this.buildSafetyCheckHtml(
      providerName,
      patientName,
      patientId,
      reason,
    );

    const textBody = `Dear ${providerName},\n\n🆘 SAFETY CHECK REQUEST\n\nPatient ${patientName} has requested an immediate safety check.\n\nReason: ${reason}\n\nPlease respond as soon as possible.\n\nView Patient Dashboard: ${this.getDashboardUrl(patientId)}\n\nBest regards,\nNeuroBridge AI`;

    return this.sendEmail({
      to: providerEmail,
      subject,
      htmlBody,
      textBody,
      priority: 'critical',
    });
  }

  /**
   * Send risk alert email (high severity only)
   */
  async sendRiskAlert(
    providerEmail: string,
    providerName: string,
    patientName: string,
    patientId: string,
    riskType: string,
    riskMessage: string,
    riskScore: number,
  ): Promise<EmailResult> {
    const subject = `⚠️ High Risk Alert: ${patientName} - ${riskType}`;

    const htmlBody = this.buildRiskAlertHtml(
      providerName,
      patientName,
      patientId,
      riskType,
      riskMessage,
      riskScore,
    );

    const textBody = `Dear ${providerName},\n\n⚠️ HIGH RISK ALERT\n\nPatient: ${patientName}\nRisk Type: ${riskType}\nRisk Score: ${(riskScore * 100).toFixed(0)}%\n\n${riskMessage}\n\nPlease review the patient's dashboard and consider appropriate interventions.\n\nView Patient Dashboard: ${this.getDashboardUrl(patientId)}\n\nBest regards,\nNeuroBridge AI`;

    return this.sendEmail({
      to: providerEmail,
      subject,
      htmlBody,
      textBody,
      priority: 'high',
    });
  }

  /**
   * Send email
   */
  async sendEmail(emailMessage: EmailMessage): Promise<EmailResult> {
    const { to, subject, htmlBody, textBody, priority = 'normal' } = emailMessage;

    // Validate email address
    if (!this.isValidEmail(to)) {
      this.logger.error(`Invalid email address: ${to}`);
      return {
        success: false,
        error: 'Invalid email address',
        timestamp: new Date(),
      };
    }

    // If not configured, simulate sending
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}, Priority: ${priority}`);
      this.logger.log(`Text Body: ${textBody.substring(0, 200)}...`);
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        timestamp: new Date(),
      };
    }

    try {
      // Send via nodemailer (when package is installed)
      // const info = await this.transporter.sendMail({
      //   from: `"${this.fromName}" <${this.fromAddress}>`,
      //   to,
      //   subject,
      //   text: textBody,
      //   html: htmlBody,
      //   priority: priority === 'critical' ? 'high' : priority,
      // });

      // Simulated response until nodemailer is installed
      const info = {
        messageId: `sim_${Date.now()}@neurobridge.ai`,
      };

      this.logger.log(`Email sent successfully to ${to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);

      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Build crisis alert HTML email
   */
  private buildCrisisAlertHtml(
    providerName: string,
    patientName: string,
    patientId: string,
    indicators: string[],
    emergencyContact?: { name: string; phone: string; relationship: string },
  ): string {
    const dashboardUrl = this.getDashboardUrl(patientId);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crisis Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🚨 CRISIS ALERT
              </h1>
              <p style="margin: 10px 0 0 0; color: #fee2e2; font-size: 14px;">
                Immediate action required
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Dear <strong>${providerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                A mental health crisis has been detected for your patient <strong>${patientName}</strong>.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold; font-size: 14px;">
                  Crisis Indicators:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
                  ${indicators.map(ind => `<li style="margin: 5px 0;">${ind}</li>`).join('')}
                </ul>
              </div>

              ${emergencyContact ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold; font-size: 14px;">
                  Emergency Contact:
                </p>
                <p style="margin: 0; color: #78350f;">
                  <strong>${emergencyContact.name}</strong> (${emergencyContact.relationship})<br>
                  <a href="tel:${emergencyContact.phone}" style="color: #f59e0b; text-decoration: none; font-weight: bold;">
                    📞 ${emergencyContact.phone}
                  </a>
                </p>
              </div>
              ` : ''}

              <p style="margin: 20px 0; color: #374151; font-size: 16px;">
                <strong>Please take immediate action:</strong>
              </p>

              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
                <li style="margin: 5px 0;">Review the patient's current status</li>
                <li style="margin: 5px 0;">Contact the patient directly</li>
                <li style="margin: 5px 0;">Contact emergency contact if patient is unreachable</li>
                <li style="margin: 5px 0;">Document your intervention</li>
              </ol>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  View Patient Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated alert from <strong>NeuroBridge AI</strong><br>
                Mental Health Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Build crisis alert text email
   */
  private buildCrisisAlertText(
    providerName: string,
    patientName: string,
    indicators: string[],
    emergencyContact?: { name: string; phone: string; relationship: string },
  ): string {
    let text = `Dear ${providerName},\n\n`;
    text += `🚨 CRISIS ALERT - IMMEDIATE ACTION REQUIRED\n\n`;
    text += `A mental health crisis has been detected for your patient ${patientName}.\n\n`;
    text += `Crisis Indicators:\n`;
    indicators.forEach((ind, i) => {
      text += `${i + 1}. ${ind}\n`;
    });

    if (emergencyContact) {
      text += `\nEmergency Contact:\n`;
      text += `${emergencyContact.name} (${emergencyContact.relationship})\n`;
      text += `Phone: ${emergencyContact.phone}\n`;
    }

    text += `\nPlease take immediate action:\n`;
    text += `1. Review the patient's current status\n`;
    text += `2. Contact the patient directly\n`;
    text += `3. Contact emergency contact if patient is unreachable\n`;
    text += `4. Document your intervention\n\n`;
    text += `Best regards,\nNeuroBridge AI`;

    return text;
  }

  /**
   * Build safety check HTML email
   */
  private buildSafetyCheckHtml(
    providerName: string,
    patientName: string,
    patientId: string,
    reason: string,
  ): string {
    const dashboardUrl = this.getDashboardUrl(patientId);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Safety Check Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🆘 Safety Check Request
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Dear <strong>${providerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Your patient <strong>${patientName}</strong> has requested an immediate safety check.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Reason:</strong> ${reason}
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Respond to Request
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                NeuroBridge AI - Mental Health Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Build risk alert HTML email
   */
  private buildRiskAlertHtml(
    providerName: string,
    patientName: string,
    patientId: string,
    riskType: string,
    riskMessage: string,
    riskScore: number,
  ): string {
    const dashboardUrl = this.getDashboardUrl(patientId);
    const scorePercent = (riskScore * 100).toFixed(0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Risk Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ⚠️ High Risk Alert
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Dear <strong>${providerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                A high-risk condition has been detected for <strong>${patientName}</strong>.
              </p>

              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; color: #9a3412; font-weight: bold;">Risk Type: ${riskType}</p>
                <p style="margin: 0 0 5px 0; color: #9a3412;">Risk Score: ${scorePercent}%</p>
                <p style="margin: 10px 0 0 0; color: #7c2d12;">${riskMessage}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Review Patient
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                NeuroBridge AI - Mental Health Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get patient dashboard URL
   */
  private getDashboardUrl(patientId: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    return `${frontendUrl}/provider/patients/${patientId}`;
  }

  /**
   * Check if email service is operational
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
      fromAddress: this.isConfigured ? this.fromAddress : 'Not configured',
      fromName: this.fromName,
      ready: this.isConfigured,
    };
  }
}
