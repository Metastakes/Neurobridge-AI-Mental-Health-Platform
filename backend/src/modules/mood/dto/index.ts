import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Patch 04: Mood Check-ins & DSM Tracking
 * Grade-4 reading level for patient-facing content
 */

// ============================================
// SCHEMAS (Zod)
// ============================================

// Mood value validator (-2 to +2)
const moodValueSchema = z.number().int().min(-2).max(2);

// Create Mood Check-in
export const CreateMoodCheckinSchema = z.object({
  mood: moodValueSchema.describe('How you feel today'),
  sleep: moodValueSchema.describe('How well you slept'),
  energy: moodValueSchema.describe('Your energy level'),
  focus: moodValueSchema.describe('How well you can focus'),
  appetite: moodValueSchema.describe('Your appetite'),
  motivation: moodValueSchema.describe('Your motivation to do things'),
  day: z.string().datetime().optional().describe('Date for this check-in (defaults to today)'),
});

// Mood Summary Request
export const GetMoodSummarySchema = z.object({
  patientId: z.string().cuid(),
  windows: z.array(z.enum(['7d', '30d', '90d'])).optional(),
});

// DSM Summary Response
export const DsmSummarySchema = z.object({
  window: z.enum(['7d', '30d', '90d']),
  conditionCode: z.string().nullable(),
  conditionName: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  matchedCriteria: z.record(z.number()).nullable(),
  interpretation: z.string(),
  lastRunAt: z.string().datetime(),
});

// Mood Check-in Response
export const MoodCheckinResponseSchema = z.object({
  success: z.boolean(),
  checkinId: z.string().cuid(),
  streak: z.number().int().min(0),
  points: z.number().int().min(0),
  message: z.string(),
});

// Mood Stats Response
export const MoodStatsSchema = z.object({
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  totalCheckins: z.number().int(),
  averages: z.object({
    mood: z.number(),
    sleep: z.number(),
    energy: z.number(),
    focus: z.number(),
    appetite: z.number(),
    motivation: z.number(),
  }),
  trend: z.enum(['improving', 'stable', 'worsening']),
});

// ============================================
// DTOs (NestJS/Swagger)
// ============================================

export class CreateMoodCheckinDto extends createZodDto(CreateMoodCheckinSchema) {
  @ApiProperty({ description: 'How you feel today (-2 = very sad, 0 = okay, +2 = very happy)', minimum: -2, maximum: 2 })
  mood!: number;

  @ApiProperty({ description: 'How well you slept (-2 = very poorly, 0 = okay, +2 = very well)', minimum: -2, maximum: 2 })
  sleep!: number;

  @ApiProperty({ description: 'Your energy level (-2 = very tired, 0 = okay, +2 = lots of energy)', minimum: -2, maximum: 2 })
  energy!: number;

  @ApiProperty({ description: 'How well you can focus (-2 = very hard to focus, 0 = okay, +2 = very focused)', minimum: -2, maximum: 2 })
  focus!: number;

  @ApiProperty({ description: 'Your appetite (-2 = no appetite, 0 = normal, +2 = increased appetite)', minimum: -2, maximum: 2 })
  appetite!: number;

  @ApiProperty({ description: 'Your motivation to do things (-2 = no motivation, 0 = okay, +2 = very motivated)', minimum: -2, maximum: 2 })
  motivation!: number;

  @ApiProperty({ description: 'Date for this check-in (ISO 8601)', required: false, example: '2025-01-22T00:00:00Z' })
  day?: string;
}

export class GetMoodSummaryDto extends createZodDto(GetMoodSummarySchema) {
  @ApiProperty({ description: 'Patient ID' })
  patientId!: string;

  @ApiProperty({ description: 'Time windows to retrieve', required: false, example: ['7d', '30d', '90d'] })
  windows?: Array<'7d' | '30d' | '90d'>;
}

export class DsmSummaryDto extends createZodDto(DsmSummarySchema) {
  @ApiProperty({ description: 'Time window', example: '30d' })
  window!: '7d' | '30d' | '90d';

  @ApiProperty({ description: 'DSM condition code (e.g., MDD, GAD)', nullable: true })
  conditionCode!: string | null;

  @ApiProperty({ description: 'Condition name', nullable: true })
  conditionName!: string | null;

  @ApiProperty({ description: 'Confidence score (0-1)', nullable: true, minimum: 0, maximum: 1 })
  confidence!: number | null;

  @ApiProperty({ description: 'Matched DSM criteria counts', nullable: true })
  matchedCriteria!: Record<string, number> | null;

  @ApiProperty({ description: 'Plain-language interpretation (grade-4 reading level)' })
  interpretation!: string;

  @ApiProperty({ description: 'When this summary was last computed' })
  lastRunAt!: string;
}

export class MoodCheckinResponseDto extends createZodDto(MoodCheckinResponseSchema) {
  @ApiProperty({ description: 'Operation success' })
  success!: boolean;

  @ApiProperty({ description: 'Check-in ID' })
  checkinId!: string;

  @ApiProperty({ description: 'Current check-in streak (days)', minimum: 0 })
  streak!: number;

  @ApiProperty({ description: 'Points earned', minimum: 0 })
  points!: number;

  @ApiProperty({ description: 'Encouragement message (grade-4 reading level)' })
  message!: string;
}

export class MoodStatsDto extends createZodDto(MoodStatsSchema) {
  @ApiProperty({ description: 'Current consecutive days of check-ins' })
  currentStreak!: number;

  @ApiProperty({ description: 'Longest streak ever' })
  longestStreak!: number;

  @ApiProperty({ description: 'Total check-ins completed' })
  totalCheckins!: number;

  @ApiProperty({ description: 'Average scores across all dimensions' })
  averages!: {
    mood: number;
    sleep: number;
    energy: number;
    focus: number;
    appetite: number;
    motivation: number;
  };

  @ApiProperty({ description: 'Overall trend', enum: ['improving', 'stable', 'worsening'] })
  trend!: 'improving' | 'stable' | 'worsening';
}

// ============================================
// TYPES
// ============================================

export type CreateMoodCheckin = z.infer<typeof CreateMoodCheckinSchema>;
export type GetMoodSummary = z.infer<typeof GetMoodSummarySchema>;
export type DsmSummary = z.infer<typeof DsmSummarySchema>;
export type MoodCheckinResponse = z.infer<typeof MoodCheckinResponseSchema>;
export type MoodStats = z.infer<typeof MoodStatsSchema>;
