import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Patch 04: Risk Alerts DTOs
 * Fusion of medication changes + mood patterns for early intervention
 */

// ============================================
// SCHEMAS (Zod)
// ============================================

// Risk Alert
export const RiskAlertSchema = z.object({
  id: z.string().cuid(),
  patientId: z.string().cuid(),
  kind: z.string(),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH']),
  message: z.string(),
  source: z.record(z.any()).nullable(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});

// Risk Alerts Response
export const RiskAlertsResponseSchema = z.object({
  activeAlerts: z.array(RiskAlertSchema),
  resolvedCount: z.number().int(),
  highSeverityCount: z.number().int(),
});

// Resolve Alert Request
export const ResolveAlertSchema = z.object({
  alertId: z.string().cuid(),
  resolution: z.string(),
  notes: z.string().optional(),
});

// Scan Patient Request
export const ScanPatientSchema = z.object({
  patientId: z.string().cuid(),
  windowDays: z.number().int().min(1).max(90).optional().default(30),
});

// Risk Score Response
export const RiskScoreSchema = z.object({
  patientId: z.string().cuid(),
  overallRisk: z.enum(['low', 'moderate', 'high']),
  scores: z.object({
    activation: z.number().min(0).max(1),
    worsening: z.number().min(0).max(1),
    nonadherence: z.number().min(0).max(1),
  }),
  recommendations: z.array(z.string()),
  lastUpdated: z.string().datetime(),
});

// ============================================
// DTOs (NestJS/Swagger)
// ============================================

export class RiskAlertDto extends createZodDto(RiskAlertSchema) {
  @ApiProperty({ description: 'Alert ID' })
  id!: string;

  @ApiProperty({ description: 'Patient ID' })
  patientId!: string;

  @ApiProperty({
    description: 'Alert type',
    example: 'activation',
    enum: ['activation', 'worsening_depression', 'nonadherence', 'rapid_cycling', 'med_interaction']
  })
  kind!: string;

  @ApiProperty({ description: 'Risk severity', enum: ['LOW', 'MODERATE', 'HIGH'] })
  severity!: 'LOW' | 'MODERATE' | 'HIGH';

  @ApiProperty({
    description: 'Human-readable alert message (provider-facing)',
    example: 'Patient started SSRI 3 days ago. Anxiety increased by 2 points. Monitor for activation syndrome.'
  })
  message!: string;

  @ApiProperty({
    description: 'Source data (medication changes, mood deltas, etc.)',
    nullable: true,
    example: {
      medicationId: 'abc123',
      medicationName: 'sertraline',
      startDate: '2025-01-20',
      moodDelta: { anxiety: +2, agitation: +1 },
      checkinCount: 3
    }
  })
  source!: Record<string, any> | null;

  @ApiProperty({ description: 'When alert was created' })
  createdAt!: string;

  @ApiProperty({ description: 'When alert was resolved', nullable: true })
  resolvedAt!: string | null;
}

export class RiskAlertsResponseDto extends createZodDto(RiskAlertsResponseSchema) {
  @ApiProperty({ description: 'Active (unresolved) alerts', type: [RiskAlertDto] })
  activeAlerts!: RiskAlertDto[];

  @ApiProperty({ description: 'Count of resolved alerts' })
  resolvedCount!: number;

  @ApiProperty({ description: 'Count of high-severity active alerts' })
  highSeverityCount!: number;
}

export class ResolveAlertDto extends createZodDto(ResolveAlertSchema) {
  @ApiProperty({ description: 'Alert ID to resolve' })
  alertId!: string;

  @ApiProperty({
    description: 'Resolution action taken',
    example: 'Contacted patient, scheduled follow-up'
  })
  resolution!: string;

  @ApiProperty({
    description: 'Additional provider notes',
    required: false
  })
  notes?: string;
}

export class ScanPatientDto extends createZodDto(ScanPatientSchema) {
  @ApiProperty({ description: 'Patient ID to scan' })
  patientId!: string;

  @ApiProperty({
    description: 'Time window in days to analyze',
    minimum: 1,
    maximum: 90,
    default: 30,
    required: false
  })
  windowDays?: number;
}

export class RiskScoreDto extends createZodDto(RiskScoreSchema) {
  @ApiProperty({ description: 'Patient ID' })
  patientId!: string;

  @ApiProperty({
    description: 'Overall risk level',
    enum: ['low', 'moderate', 'high']
  })
  overallRisk!: 'low' | 'moderate' | 'high';

  @ApiProperty({
    description: 'Individual risk scores (0-1 scale)',
    example: {
      activation: 0.75,
      worsening: 0.3,
      nonadherence: 0.1
    }
  })
  scores!: {
    activation: number;
    worsening: number;
    nonadherence: number;
  };

  @ApiProperty({
    description: 'Clinical recommendations',
    example: [
      'Monitor for activation syndrome - recent SSRI start',
      'Consider dose adjustment if anxiety persists',
      'Schedule follow-up within 1 week'
    ]
  })
  recommendations!: string[];

  @ApiProperty({ description: 'When risk score was last calculated' })
  lastUpdated!: string;
}

// ============================================
// TYPES
// ============================================

export type RiskAlert = z.infer<typeof RiskAlertSchema>;
export type RiskAlertsResponse = z.infer<typeof RiskAlertsResponseSchema>;
export type ResolveAlert = z.infer<typeof ResolveAlertSchema>;
export type ScanPatient = z.infer<typeof ScanPatientSchema>;
export type RiskScore = z.infer<typeof RiskScoreSchema>;
