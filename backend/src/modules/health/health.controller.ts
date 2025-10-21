import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Cloud Run' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/Cloud Run' })
  async getLiveness() {
    return this.healthService.getLiveness();
  }
}
