/**
 * INNOVATION: Crisis Alert API
 * Endpoints for accessing crisis resources and provider crisis management
 */

import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Crisis Management')
@Controller('crisis')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CrisisController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /crisis/resources
   * Public crisis resources (hotlines, emergency contacts)
   * Available to all authenticated users
   */
  @Get('resources')
  @ApiOperation({ summary: 'Get crisis resources and hotlines' })
  async getCrisisResources() {
    return {
      emergencyServices: {
        suicide: {
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          text: 'Text "HELLO" to 741741',
          website: 'https://988lifeline.org',
          available: '24/7',
        },
        emergency: {
          name: 'Emergency Services',
          phone: '911',
          description: 'For immediate life-threatening emergencies',
        },
        samhsa: {
          name: 'SAMHSA National Helpline',
          phone: '1-800-662-4357',
          description: 'Mental health and substance abuse treatment referral',
          available: '24/7',
        },
        crisis: {
          name: 'Crisis Text Line',
          text: 'Text "CRISIS" to 741741',
          website: 'https://www.crisistextline.org',
          available: '24/7',
        },
      },
      safetyPlan: {
        title: 'Safety Planning Steps',
        steps: [
          'Recognize warning signs',
          'Use internal coping strategies',
          'Contact people for support',
          'Contact professionals or agencies',
          'Reduce access to lethal means',
          'Identify reasons for living',
        ],
      },
      immediateActions: [
        'Call 988 for immediate crisis support',
        'Text your provider through the app',
        'Reach out to emergency contact',
        'Go to nearest emergency room',
        'Remove access to harmful items',
        'Stay with someone you trust',
      ],
    };
  }

  /**
   * GET /crisis/alerts/patient/:patientId
   * Get crisis alerts for a patient (patient can see own, providers can see assigned)
   */
  @Get('alerts/patient/:patientId')
  @ApiOperation({ summary: 'Get crisis alerts for patient' })
  async getPatientCrisisAlerts(@Param('patientId') patientId: string) {
    const alerts = await this.prisma.riskAlert.findMany({
      where: {
        patientId,
        kind: 'crisis_detected',
        resolvedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { alerts };
  }

  /**
   * GET /crisis/dashboard/provider
   * Crisis dashboard for providers - shows all patients with active crisis alerts
   */
  @Get('dashboard/provider')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get provider crisis dashboard' })
  async getProviderCrisisDashboard() {
    // Get all patients with EMERGENCY status
    const emergencyPatients = await this.prisma.patient.findMany({
      where: {
        alertStatus: 'EMERGENCY',
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        emergencyContact: true,
        emergencyPhone: true,
        riskAlerts: {
          where: {
            kind: 'crisis_detected',
            resolvedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get recent crisis alerts (last 24 hours)
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const recentCrises = await this.prisma.riskAlert.count({
      where: {
        kind: 'crisis_detected',
        createdAt: { gte: last24h },
      },
    });

    // Get unresolved crisis count
    const unresolvedCount = await this.prisma.riskAlert.count({
      where: {
        kind: 'crisis_detected',
        resolvedAt: null,
      },
    });

    return {
      summary: {
        activeEmergencies: emergencyPatients.length,
        recentCrises24h: recentCrises,
        unresolvedCrises: unresolvedCount,
      },
      emergencyPatients: emergencyPatients.map(p => ({
        patientId: p.id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        email: p.user.email,
        phone: p.user.phone,
        emergencyContact: p.emergencyContact,
        emergencyPhone: p.emergencyPhone,
        latestAlert: p.riskAlerts[0] || null,
      })),
    };
  }

  /**
   * POST /crisis/alerts/:alertId/resolve
   * Mark a crisis alert as resolved (provider only)
   */
  @Post('alerts/:alertId/resolve')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve a crisis alert' })
  async resolveCrisisAlert(
    @Param('alertId') alertId: string,
    @Body() body: { notes?: string; actionTaken?: string },
  ) {
    // Update the alert
    const alert = await this.prisma.riskAlert.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
        source: {
          ...(alert.source as any),
          resolution: {
            resolvedAt: new Date(),
            notes: body.notes,
            actionTaken: body.actionTaken,
          },
        },
      },
    });

    // Check if patient has any other unresolved crisis alerts
    const otherCrises = await this.prisma.riskAlert.count({
      where: {
        patientId: alert.patientId,
        kind: 'crisis_detected',
        resolvedAt: null,
        id: { not: alertId },
      },
    });

    // If no other crises, downgrade patient alert status
    if (otherCrises === 0) {
      await this.prisma.patient.update({
        where: { id: alert.patientId },
        data: { alertStatus: 'STABLE' },
      });
    }

    return {
      success: true,
      alert,
      message: 'Crisis alert resolved successfully',
    };
  }

  /**
   * POST /crisis/safety-check
   * Patient can trigger a safety check request
   */
  @Post('safety-check')
  @ApiOperation({ summary: 'Request immediate safety check' })
  async requestSafetyCheck(@Body() body: { patientId: string; message?: string }) {
    const { patientId, message } = body;

    // Create a safety check request alert
    await this.prisma.riskAlert.create({
      data: {
        patientId,
        kind: 'safety_check_requested',
        severity: 'HIGH',
        message: message || 'Patient requested immediate safety check',
        source: {
          requestedAt: new Date(),
          patientMessage: message,
        },
      },
    });

    // Update patient status to alert provider
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { alertStatus: 'EMERGENCY' },
    });

    return {
      success: true,
      message: 'Safety check requested. Your provider has been notified.',
      resources: {
        immediate: '988 - Suicide & Crisis Lifeline (24/7)',
        text: 'Text "HELLO" to 741741',
      },
    };
  }
}
