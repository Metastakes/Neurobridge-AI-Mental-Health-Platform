import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

export interface CreateMeetingRequest {
  patientEmail: string;
  providerEmail: string;
  startTime: Date;
  durationMinutes: number;
  patientName: string;
  providerName: string;
}

export interface MeetingResult {
  eventId: string;
  meetLink: string;
  startTime: string;
  endTime: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: any;

  constructor(private config: ConfigService) {
    this.initializeCalendar();
  }

  private async initializeCalendar() {
    try {
      const credentialsPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

      if (!credentialsPath) {
        this.logger.warn('⚠️  Google Calendar not configured - scheduling features disabled');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.logger.log('✅ Google Calendar service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Calendar:', error);
    }
  }

  /**
   * Create a Google Meet appointment
   * HIPAA Note: Summary contains NO PHI, only generic "Mental Health Appointment"
   */
  async createMeeting(request: CreateMeetingRequest): Promise<MeetingResult> {
    if (!this.calendar) {
      throw new Error('Google Calendar is not configured');
    }

    const endTime = new Date(request.startTime);
    endTime.setMinutes(endTime.getMinutes() + request.durationMinutes);

    try {
      // HIPAA Compliant: NO PHI in event summary or description
      const event = {
        summary: 'Mental Health Appointment',  // Generic, no patient name
        description: 'Telehealth session',
        start: {
          dateTime: request.startTime.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: request.providerEmail },
          // Patient email removed for HIPAA - they get link via secure portal
        ],
        conferenceData: {
          createRequest: {
            requestId: `neurobridge-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },  // 1 day before
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video',
      )?.uri;

      if (!meetLink) {
        throw new Error('Failed to create Google Meet link');
      }

      this.logger.log(`✅ Created Google Meet appointment: ${response.data.id}`);

      return {
        eventId: response.data.id,
        meetLink,
        startTime: response.data.start.dateTime,
        endTime: response.data.end.dateTime,
      };
    } catch (error) {
      this.logger.error('Failed to create Google Meet event:', error);
      throw error;
    }
  }

  /**
   * Update an existing meeting
   */
  async updateMeeting(eventId: string, updates: {
    startTime?: Date;
    durationMinutes?: number;
  }): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar is not configured');
    }

    try {
      const event = await this.calendar.events.get({
        calendarId: 'primary',
        eventId,
      });

      const updatedEvent: any = { ...event.data };

      if (updates.startTime) {
        updatedEvent.start.dateTime = updates.startTime.toISOString();

        const endTime = new Date(updates.startTime);
        endTime.setMinutes(endTime.getMinutes() + (updates.durationMinutes || 50));
        updatedEvent.end.dateTime = endTime.toISOString();
      }

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: updatedEvent,
      });

      this.logger.log(`✅ Updated Google Meet appointment: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to update Google Meet event:', error);
      throw error;
    }
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar is not configured');
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      this.logger.log(`✅ Cancelled Google Meet appointment: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to cancel Google Meet event:', error);
      throw error;
    }
  }
}
