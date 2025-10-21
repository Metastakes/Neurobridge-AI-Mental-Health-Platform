import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getHealth() {
    const startTime = Date.now();

    // Check database connection
    let databaseStatus = 'healthy';
    let databaseLatency = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - dbStart;
    } catch (error) {
      databaseStatus = 'unhealthy';
    }

    // Check AI service
    const aiStatus = this.config.get('GEMINI_API_KEY') ? 'configured' : 'not_configured';

    // Check Google Calendar
    const calendarStatus = this.config.get('GOOGLE_APPLICATION_CREDENTIALS')
      ? 'configured'
      : 'not_configured';

    // Check Stripe
    const stripeStatus = this.config.get('STRIPE_SECRET_KEY') ? 'configured' : 'not_configured';

    const totalLatency = Date.now() - startTime;

    return {
      status: databaseStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: this.config.get('NODE_ENV'),
      services: {
        database: {
          status: databaseStatus,
          latency: `${databaseLatency}ms`,
        },
        ai: {
          status: aiStatus,
          provider: 'gemini',
        },
        calendar: {
          status: calendarStatus,
          provider: 'google',
        },
        payments: {
          status: stripeStatus,
          provider: 'stripe',
        },
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      responseTime: `${totalLatency}ms`,
    };
  }

  async getReadiness() {
    try {
      // Check if database is accessible
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        checks: {
          database: 'ok',
        },
      };
    } catch (error) {
      return {
        status: 'not_ready',
        checks: {
          database: 'failed',
        },
        error: error.message,
      };
    }
  }

  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
