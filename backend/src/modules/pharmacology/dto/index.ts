import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Patch 04: Pharmacology Module DTOs
 * AI-powered medication decision support + patient task generation
 */

// ============================================
// SCHEMAS (Zod)
// ============================================

// Next Steps Request
export const PharmNextStepsSchema = z.object({
  patientId: z.string().cuid(),
  context: z.object({
    currentDiagnoses: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    pregnancyStatus: z.boolean().optional(),
    recentLabs: z.record(z.any()).optional(),
  }).optional(),
});

// Pharmacology Option
export const PharmOptionSchema = z.object({
  drug: z.string(),
  genericName: z.string(),
  dose: z.string(),
  why: z.string(),
  contraindications: z.array(z.string()),
  washoutDays: z.number().int().min(0),
  requiresPdmp: z.boolean(),
  controlledSubstance: z.string().nullable(),
  pregnancyCategory: z.string().nullable(),
});

// Safety Flag
export const SafetyFlagSchema = z.object({
  code: z.string(),
  severity: z.enum(['low', 'moderate', 'high']),
  message: z.string(),
});

// Pharm Next Steps Response
export const PharmNextStepsResponseSchema = z.object({
  rankedOptions: z.array(PharmOptionSchema),
  safetyFlags: z.array(SafetyFlagSchema),
  labsRecommended: z.array(z.string()),
  advice: z.string(),
  generatedAt: z.string().datetime(),
});

// Patient Task
export const PharmTaskSchema = z.object({
  id: z.string().cuid(),
  patientId: z.string().cuid(),
  medOrderId: z.string().cuid().nullable(),
  label: z.string(),
  dueOn: z.string().datetime().nullable(),
  status: z.enum(['OPEN', 'DONE', 'SKIPPED']),
  points: z.number().int(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

// Complete Task Request
export const CompleteTaskSchema = z.object({
  taskId: z.string().cuid(),
  notes: z.string().optional(),
});

// Complete Task Response
export const CompleteTaskResponseSchema = z.object({
  success: z.boolean(),
  pointsEarned: z.number().int(),
  message: z.string(),
});

// Patient Tasks Response
export const PatientTasksResponseSchema = z.object({
  openTasks: z.array(PharmTaskSchema),
  completedCount: z.number().int(),
  totalPoints: z.number().int(),
});

// ============================================
// DTOs (NestJS/Swagger)
// ============================================

export class PharmNextStepsDto extends createZodDto(PharmNextStepsSchema) {
  @ApiProperty({ description: 'Patient ID' })
  patientId!: string;

  @ApiProperty({
    description: 'Optional context for decision support',
    required: false,
    example: {
      currentDiagnoses: ['MDD', 'GAD'],
      currentMedications: ['sertraline 50mg'],
      allergies: ['penicillin'],
      pregnancyStatus: false,
    },
  })
  context?: {
    currentDiagnoses?: string[];
    currentMedications?: string[];
    allergies?: string[];
    pregnancyStatus?: boolean;
    recentLabs?: Record<string, any>;
  };
}

export class PharmOptionDto extends createZodDto(PharmOptionSchema) {
  @ApiProperty({ description: 'Medication name', example: 'Bupropion' })
  drug!: string;

  @ApiProperty({ description: 'Generic name', example: 'bupropion' })
  genericName!: string;

  @ApiProperty({ description: 'Recommended dose', example: '150mg qAM' })
  dose!: string;

  @ApiProperty({ description: 'Clinical rationale', example: 'Helps with fatigue and weight concerns' })
  why!: string;

  @ApiProperty({ description: 'Contraindications', example: ['seizure_disorder', 'bulimia'] })
  contraindications!: string[];

  @ApiProperty({ description: 'Washout period in days', minimum: 0 })
  washoutDays!: number;

  @ApiProperty({ description: 'Requires PDMP check' })
  requiresPdmp!: boolean;

  @ApiProperty({ description: 'Controlled substance schedule', nullable: true, example: 'Schedule II' })
  controlledSubstance!: string | null;

  @ApiProperty({ description: 'FDA pregnancy category', nullable: true, example: 'C' })
  pregnancyCategory!: string | null;
}

export class SafetyFlagDto extends createZodDto(SafetyFlagSchema) {
  @ApiProperty({ description: 'Flag code', example: 'activation_risk' })
  code!: string;

  @ApiProperty({ description: 'Severity level', enum: ['low', 'moderate', 'high'] })
  severity!: 'low' | 'moderate' | 'high';

  @ApiProperty({ description: 'Human-readable message', example: 'Recent anxiety spikes - monitor for activation' })
  message!: string;
}

export class PharmNextStepsResponseDto extends createZodDto(PharmNextStepsResponseSchema) {
  @ApiProperty({ description: 'Ranked medication options', type: [PharmOptionDto] })
  rankedOptions!: PharmOptionDto[];

  @ApiProperty({ description: 'Safety alerts', type: [SafetyFlagDto] })
  safetyFlags!: SafetyFlagDto[];

  @ApiProperty({ description: 'Recommended labs', example: ['A1c', 'Lipids'] })
  labsRecommended!: string[];

  @ApiProperty({ description: 'Clinical advice summary' })
  advice!: string;

  @ApiProperty({ description: 'When this advice was generated' })
  generatedAt!: string;
}

export class PharmTaskDto extends createZodDto(PharmTaskSchema) {
  @ApiProperty({ description: 'Task ID' })
  id!: string;

  @ApiProperty({ description: 'Patient ID' })
  patientId!: string;

  @ApiProperty({ description: 'Medication order ID', nullable: true })
  medOrderId!: string | null;

  @ApiProperty({ description: 'Task label (grade-4 reading level)', example: 'Get blood test for lithium level' })
  label!: string;

  @ApiProperty({ description: 'Due date', nullable: true })
  dueOn!: string | null;

  @ApiProperty({ description: 'Task status', enum: ['OPEN', 'DONE', 'SKIPPED'] })
  status!: 'OPEN' | 'DONE' | 'SKIPPED';

  @ApiProperty({ description: 'Points awarded on completion' })
  points!: number;

  @ApiProperty({ description: 'When task was created' })
  createdAt!: string;

  @ApiProperty({ description: 'When task was completed', nullable: true })
  completedAt!: string | null;
}

export class CompleteTaskDto extends createZodDto(CompleteTaskSchema) {
  @ApiProperty({ description: 'Task ID to mark complete' })
  taskId!: string;

  @ApiProperty({ description: 'Optional patient notes', required: false })
  notes?: string;
}

export class CompleteTaskResponseDto extends createZodDto(CompleteTaskResponseSchema) {
  @ApiProperty({ description: 'Operation success' })
  success!: boolean;

  @ApiProperty({ description: 'Points earned' })
  pointsEarned!: number;

  @ApiProperty({ description: 'Encouragement message (grade-4 reading level)' })
  message!: string;
}

export class PatientTasksResponseDto extends createZodDto(PatientTasksResponseSchema) {
  @ApiProperty({ description: 'Open tasks for patient', type: [PharmTaskDto] })
  openTasks!: PharmTaskDto[];

  @ApiProperty({ description: 'Number of completed tasks' })
  completedCount!: number;

  @ApiProperty({ description: 'Total points earned from pharm tasks' })
  totalPoints!: number;
}

// ============================================
// TYPES
// ============================================

export type PharmNextSteps = z.infer<typeof PharmNextStepsSchema>;
export type PharmOption = z.infer<typeof PharmOptionSchema>;
export type SafetyFlag = z.infer<typeof SafetyFlagSchema>;
export type PharmNextStepsResponse = z.infer<typeof PharmNextStepsResponseSchema>;
export type PharmTask = z.infer<typeof PharmTaskSchema>;
export type CompleteTask = z.infer<typeof CompleteTaskSchema>;
export type CompleteTaskResponse = z.infer<typeof CompleteTaskResponseSchema>;
export type PatientTasksResponse = z.infer<typeof PatientTasksResponseSchema>;
