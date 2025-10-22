import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  PharmNextStepsDto,
  PharmNextStepsResponseDto,
  CompleteTaskDto,
  CompleteTaskResponseDto,
  PatientTasksResponseDto,
  PharmTaskDto,
} from './dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Patch 04: Pharmacology Service
 * AI-powered medication decision support + automated patient task generation
 */
@Injectable()
export class PharmacologyService {
  private readonly logger = new Logger(PharmacologyService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly pharmPolicy: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize Gemini AI
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set - Pharm AI disabled');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

    // Load pharmacology policy
    const policyPath = path.join(__dirname, '../../config/policies/pharm_tasks.json');
    this.pharmPolicy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  }

  /**
   * Get AI-powered pharmacology next steps
   * Provider-facing decision support
   */
  async getNextSteps(dto: PharmNextStepsDto): Promise<PharmNextStepsResponseDto> {
    this.logger.log(`Getting pharm next steps for patient ${dto.patientId}`);

    // Fetch patient data
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: {
        diagnoses: true,
        medications: {
          where: { status: 'ACTIVE' },
        },
        allergies: true,
        moodCheckins: {
          orderBy: { day: 'desc' },
          take: 30,
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Calculate age
    const age = Math.floor(
      (Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    // Prepare context for AI
    const context = {
      age,
      sex: patient.sex,
      diagnoses: patient.diagnoses.map(d => ({
        icdCode: d.icdCode,
        description: d.description,
        isPrimary: d.isPrimary,
      })),
      currentMedications: patient.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        category: m.category,
      })),
      allergies: patient.allergies.map(a => ({
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.severity,
      })),
      pregnancyStatus: dto.context?.pregnancyStatus || false,
      recentMoodTrend: this.analyzeMoodTrend(patient.moodCheckins),
    };

    // Call AI
    const aiResponse = await this.callGeminiPharmAdvice(context);

    // Enrich with policy data
    const enrichedOptions = aiResponse.rankedOptions.map(opt => {
      const medPolicy = this.pharmPolicy.medications[opt.genericName.toLowerCase()];
      return {
        ...opt,
        requiresPdmp: medPolicy?.requires_pdmp_check || false,
        controlledSubstance: medPolicy?.controlled_substance || null,
        pregnancyCategory: medPolicy?.pregnancy_category || null,
      };
    });

    // Cache advice for Co-Pilot panel
    await this.prisma.aiAdviceCache.upsert({
      where: { patientId: dto.patientId },
      create: {
        patientId: dto.patientId,
        advice: aiResponse,
      },
      update: {
        advice: aiResponse,
        updatedAt: new Date(),
      },
    });

    return {
      rankedOptions: enrichedOptions,
      safetyFlags: aiResponse.safetyFlags,
      labsRecommended: aiResponse.labsRecommended,
      advice: aiResponse.advice,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze mood trend from recent check-ins
   */
  private analyzeMoodTrend(
    checkins: Array<{ mood: number; energy: number; motivation: number }>,
  ): string {
    if (checkins.length === 0) return 'No data';
    if (checkins.length < 7) return 'Limited data';

    const recent = checkins.slice(0, 7);
    const avgMood = recent.reduce((sum, c) => sum + c.mood, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, c) => sum + c.energy, 0) / recent.length;

    if (avgMood < -0.5 && avgEnergy < -0.5) return 'Depression pattern';
    if (avgMood > 0.5 && avgEnergy > 1) return 'Possible activation';
    if (avgMood < 0) return 'Low mood';
    return 'Stable';
  }

  /**
   * Call Gemini AI for pharmacology advice
   */
  private async callGeminiPharmAdvice(context: any): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `You are NeuroBridge-Gemini Pharmacology Advisor. Return ONLY valid JSON.

This is DECISION SUPPORT, not prescribing. Providers make final decisions.

Your task: Suggest ranked medication options based on patient context.

Rules:
1. Return valid JSON only (no markdown, no explanations outside JSON)
2. Consider diagnosis, current meds, allergies, side effects, interactions
3. Check for pregnancy contraindications
4. Calculate washout periods for switching
5. Flag safety concerns (activation, worsening, interactions)
6. Recommend necessary labs
7. Rank by efficacy + safety + tolerability

Output schema:
{
  "rankedOptions": [
    {
      "drug": "Bupropion",
      "genericName": "bupropion",
      "dose": "150mg qAM",
      "why": "Helps with fatigue and weight concerns",
      "contraindications": ["seizure_disorder"],
      "washoutDays": 0
    }
  ],
  "safetyFlags": [
    {
      "code": "activation_risk",
      "severity": "moderate",
      "message": "Recent anxiety spikes - monitor for activation"
    }
  ],
  "labsRecommended": ["A1c", "Lipids"],
  "advice": "Brief clinical summary"
}`;

    const userPrompt = `Patient Context:
${JSON.stringify(context, null, 2)}

Pharmacology Policy (available medications):
${JSON.stringify(Object.keys(this.pharmPolicy.medications), null, 2)}

Provide ranked medication recommendations as JSON:`;

    try {
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const response = result.response;
      const text = response.text();

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      // Return safe fallback
      return {
        rankedOptions: [],
        safetyFlags: [
          {
            code: 'ai_unavailable',
            severity: 'moderate',
            message: 'AI unavailable - use clinical judgment',
          },
        ],
        labsRecommended: [],
        advice: 'AI analysis unavailable. Review patient chart and use clinical judgment.',
      };
    }
  }

  /**
   * Get patient's pharmacology tasks
   */
  async getPatientTasks(patientId: string): Promise<PatientTasksResponseDto> {
    const tasks = await this.prisma.pharmTask.findMany({
      where: { patientId },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { dueOn: 'asc' },
      ],
    });

    const openTasks = tasks
      .filter(t => t.status === 'OPEN')
      .map(t => this.mapTaskToDto(t));

    const completedCount = tasks.filter(t => t.status === 'DONE').length;
    const totalPoints = tasks
      .filter(t => t.status === 'DONE')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      openTasks,
      completedCount,
      totalPoints,
    };
  }

  /**
   * Complete a pharmacology task
   */
  async completeTask(
    patientId: string,
    dto: CompleteTaskDto,
  ): Promise<CompleteTaskResponseDto> {
    const task = await this.prisma.pharmTask.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.patientId !== patientId) {
      throw new BadRequestException('Task does not belong to this patient');
    }

    if (task.status !== 'OPEN') {
      throw new BadRequestException('Task already completed or skipped');
    }

    // Mark complete
    await this.prisma.pharmTask.update({
      where: { id: dto.taskId },
      data: {
        status: 'DONE',
        completedAt: new Date(),
      },
    });

    // Award points
    await this.prisma.gamificationEvent.create({
      data: {
        patientId,
        eventType: 'LAB_COMPLETED',
        points: task.points,
        metadata: {
          taskId: task.id,
          taskLabel: task.label,
          notes: dto.notes,
        },
      },
    });

    const message = this.generateCompletionMessage(task.label, task.points);

    return {
      success: true,
      pointsEarned: task.points,
      message,
    };
  }

  /**
   * Generate task completion message (grade-4 reading level)
   */
  private generateCompletionMessage(taskLabel: string, points: number): string {
    const messages = [
      `Great job! You finished "${taskLabel}". You earned ${points} points!`,
      `Nice work! "${taskLabel}" is done. ${points} points for you!`,
      `Well done! You completed "${taskLabel}". ${points} points earned!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Map Prisma task to DTO
   */
  private mapTaskToDto(task: any): PharmTaskDto {
    return {
      id: task.id,
      patientId: task.patientId,
      medOrderId: task.medOrderId,
      label: task.label,
      dueOn: task.dueOn?.toISOString() || null,
      status: task.status,
      points: task.points,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString() || null,
    };
  }

  /**
   * Event handler: Generate tasks when medication ordered
   * Triggered by MED_ORDER_PLACED event
   */
  @OnEvent('medication.ordered')
  async handleMedicationOrdered(payload: {
    patientId: string;
    medicationId: string;
    medicationName: string;
  }) {
    this.logger.log(`Generating tasks for medication: ${payload.medicationName}`);

    const medName = payload.medicationName.toLowerCase();

    // Find matching medication in policy
    let medPolicy = this.pharmPolicy.medications[medName];

    // Try to match by partial name if exact match fails
    if (!medPolicy) {
      const matchKey = Object.keys(this.pharmPolicy.medications).find(key =>
        medName.includes(key) || key.includes(medName),
      );
      if (matchKey) {
        medPolicy = this.pharmPolicy.medications[matchKey];
      }
    }

    if (!medPolicy) {
      this.logger.warn(`No policy found for medication: ${medName}`);
      return;
    }

    // Generate lab tasks
    if (medPolicy.labs && medPolicy.labs.length > 0) {
      for (const lab of medPolicy.labs) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + lab.due_days);

        await this.prisma.pharmTask.create({
          data: {
            patientId: payload.patientId,
            medOrderId: payload.medicationId,
            label: `Get ${lab.name} blood test`,
            dueOn: dueDate,
            points: lab.points || 50,
            status: 'OPEN',
          },
        });
      }
    }

    // Generate symptom watch tasks
    if (medPolicy.watch_symptoms && medPolicy.watch_symptoms.length > 0) {
      const highSeveritySymptoms = medPolicy.watch_symptoms.filter(
        s => s.severity === 'high' || s.severity === 'moderate',
      );

      for (const symptom of highSeveritySymptoms.slice(0, 3)) {
        // Limit to top 3
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const actionText = this.formatActionText(symptom.action);

        await this.prisma.pharmTask.create({
          data: {
            patientId: payload.patientId,
            medOrderId: payload.medicationId,
            label: `Watch for ${this.formatSymptom(symptom.symptom)} - ${actionText}`,
            dueOn: dueDate,
            points: 25,
            status: 'OPEN',
          },
        });
      }
    }

    // Generate education task
    if (medPolicy.education && medPolicy.education.length > 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      await this.prisma.pharmTask.create({
        data: {
          patientId: payload.patientId,
          medOrderId: payload.medicationId,
          label: `Review ${medPolicy.generic} safety information`,
          dueOn: dueDate,
          points: 10,
          status: 'OPEN',
        },
      });
    }

    this.logger.log(`Created tasks for patient ${payload.patientId}`);
  }

  /**
   * Format symptom name for patient display
   */
  private formatSymptom(symptom: string): string {
    return symptom
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format action text for patient display
   */
  private formatActionText(action: string): string {
    const actionMap: Record<string, string> = {
      report_immediately: 'Tell your provider right away',
      report_within_24h: 'Tell your provider within 24 hours',
      report_within_7d: 'Tell your provider this week',
      report_at_next_visit: 'Mention at your next visit',
      emergency: 'Call 911 or go to ER',
    };
    return actionMap[action] || 'Tell your provider';
  }
}
