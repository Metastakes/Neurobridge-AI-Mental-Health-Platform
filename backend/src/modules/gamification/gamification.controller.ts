import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('gamification')
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('summary/:patientId')
  async getSummary(@Param('patientId') patientId: string) {
    return this.gamificationService.getSummary(patientId);
  }

  @Post('events')
  async recordEvent(
    @Body() data: {
      patientId: string;
      eventType: string;
      points: number;
      metadata?: any;
    },
  ) {
    return this.gamificationService.recordEvent(data as any);
  }

  @Post('unlock-achievement')
  async unlockAchievement(
    @Body() data: {
      patientId: string;
      achievementKey: string;
    },
  ) {
    return this.gamificationService.unlockAchievement(
      data.patientId,
      data.achievementKey,
    );
  }
}
