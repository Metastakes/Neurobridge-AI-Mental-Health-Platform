import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingController {
  constructor(private schedulingService: SchedulingService) {}

  @Post('book')
  async bookAppointment(
    @Body() data: {
      patientId: string;
      providerId: string;
      scheduledAt: string;
      durationMinutes?: number;
    },
  ) {
    return this.schedulingService.bookAppointment({
      ...data,
      scheduledAt: new Date(data.scheduledAt),
    });
  }

  @Put(':encounterId/reschedule')
  async rescheduleAppointment(
    @Param('encounterId') encounterId: string,
    @Body() data: { newTime: string },
  ) {
    return this.schedulingService.rescheduleAppointment(
      encounterId,
      new Date(data.newTime),
    );
  }

  @Delete(':encounterId/cancel')
  async cancelAppointment(@Param('encounterId') encounterId: string) {
    return this.schedulingService.cancelAppointment(encounterId);
  }
}
