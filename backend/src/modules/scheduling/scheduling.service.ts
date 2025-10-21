import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GoogleCalendarService } from './google-calendar.service';
import { EncountersService } from '../encounters/encounters.service';

@Injectable()
export class SchedulingService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
    private encounters: EncountersService,
  ) {}

  /**
   * Book a new appointment with Google Meet link
   */
  async bookAppointment(data: {
    patientId: string;
    providerId: string;
    scheduledAt: Date;
    durationMinutes?: number;
  }) {
    // Get patient and provider details
    const [patient, provider] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: data.patientId },
        include: { user: true },
      }),
      this.prisma.provider.findUnique({
        where: { id: data.providerId },
        include: { user: true },
      }),
    ]);

    if (!patient || !provider) {
      throw new Error('Patient or provider not found');
    }

    // Create Google Meet event
    const meeting = await this.googleCalendar.createMeeting({
      patientEmail: patient.user.email,
      providerEmail: provider.user.email,
      startTime: data.scheduledAt,
      durationMinutes: data.durationMinutes || 50,
      patientName: `${patient.user.firstName} ${patient.user.lastName}`,
      providerName: `${provider.user.firstName} ${provider.user.lastName}`,
    });

    // Create encounter in database
    const encounter = await this.encounters.create({
      patientId: data.patientId,
      providerId: data.providerId,
      scheduledAt: data.scheduledAt,
      meetLink: meeting.meetLink,
      meetEventId: meeting.eventId,
    });

    return {
      encounter,
      meetLink: meeting.meetLink,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    };
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(encounterId: string, newTime: Date) {
    const encounter = await this.encounters.findOne(encounterId);

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    if (encounter.meetEventId) {
      await this.googleCalendar.updateMeeting(encounter.meetEventId, {
        startTime: newTime,
      });
    }

    return this.encounters.update(encounterId, {
      scheduledAt: newTime,
    });
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(encounterId: string) {
    const encounter = await this.encounters.findOne(encounterId);

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    if (encounter.meetEventId) {
      await this.googleCalendar.cancelMeeting(encounter.meetEventId);
    }

    return this.encounters.update(encounterId, {
      status: 'CANCELLED',
    });
  }
}
