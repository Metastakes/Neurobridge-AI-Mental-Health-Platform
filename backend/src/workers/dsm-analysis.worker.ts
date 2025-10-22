import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Patch 04: DSM Analysis Worker
 * Nightly AI-powered analysis of mood check-ins
 * Generates DSM-aligned summaries for provider dashboard
 */
@Injectable()
export class DsmAnalysisWorker {
  private readonly logger = new Logger(DsmAnalysisWorker.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly dsmPolicy: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Initialize Gemini AI
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set - DSM analysis will be disabled');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

    // Load DSM policy
    const policyPath = path.join(__dirname, '../config/policies/dsm.json');
    this.dsmPolicy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  }

  /**
   * Cron: Run at 2:00 AM daily
   * Recompute DSM summaries for all active patients
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runNightlyAnalysis() {
    this.logger.log('Starting nightly DSM analysis...');

    try {
      // Get all active patients with mood check-ins
      const patients = await this.prisma.patient.findMany({
        where: {
          moodCheckins: {
            some: {},
          },
        },
        select: {
          id: true,
        },
      });

      this.logger.log(`Analyzing ${patients.length} patients`);

      let processed = 0;
      let errors = 0;

      for (const patient of patients) {
        try {
          await this.analyzePatient(patient.id);
          processed++;
        } catch (error) {
          this.logger.error(`Failed to analyze patient ${patient.id}:`, error);
          errors++;
        }
      }

      this.logger.log(
        `DSM analysis complete: ${processed} processed, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error('Nightly DSM analysis failed:', error);
    }
  }

  /**
   * Analyze a single patient
   * Generates summaries for 7d, 30d, 90d windows
   */
  async analyzePatient(patientId: string) {
    this.logger.debug(`Analyzing patient ${patientId}`);

    // Get patient demographics (minimal for privacy)
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        dateOfBirth: true,
        sex: true,
      },
    });

    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    // Calculate age (no DOB in AI prompt)
    const age = Math.floor(
      (Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    // Analyze each window
    for (const window of this.dsmPolicy.windows) {
      await this.analyzeWindow(patientId, window, { age, sex: patient.sex });
    }
  }

  /**
   * Analyze specific time window
   */
  private async analyzeWindow(
    patientId: string,
    window: '7d' | '30d' | '90d',
    demographics: { age: number; sex: string | null },
  ) {
    // Calculate date range
    const days = parseInt(window);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get mood check-ins
    const checkins = await this.prisma.moodCheckin.findMany({
      where: {
        patientId,
        day: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        day: 'asc',
      },
    });

    if (checkins.length === 0) {
      this.logger.debug(`No check-ins for patient ${patientId} in ${window} window`);
      return;
    }

    // Prepare data for AI
    const data = checkins.map(c => ({
      day: c.day.toISOString().split('T')[0],
      mood: c.mood,
      sleep: c.sleep,
      energy: c.energy,
      focus: c.focus,
      appetite: c.appetite,
      motivation: c.motivation,
    }));

    // Call AI
    const analysis = await this.callGeminiDsmAnalysis(data, window, demographics);

    // Map window to enum value
    const windowEnum = window.toUpperCase().replace('D', '_DAYS') as 'SEVEN_DAYS' | 'THIRTY_DAYS' | 'NINETY_DAYS';

    // Upsert summary
    await this.prisma.dsmSummary.upsert({
      where: {
        patientId_window: {
          patientId,
          window: windowEnum,
        },
      },
      create: {
        patientId,
        window: windowEnum,
        conditionCode: analysis.topCondition?.code || null,
        confidence: analysis.topCondition?.confidence || null,
        matchedCriteria: analysis.topCondition?.criteria || null,
        lastRunAt: new Date(),
      },
      update: {
        conditionCode: analysis.topCondition?.code || null,
        confidence: analysis.topCondition?.confidence || null,
        matchedCriteria: analysis.topCondition?.criteria || null,
        lastRunAt: new Date(),
      },
    });

    this.logger.debug(
      `Updated ${window} summary for patient ${patientId}: ${analysis.topCondition?.code || 'None'} (${analysis.topCondition?.confidence || 0})`,
    );
  }

  /**
   * Call Gemini AI for DSM analysis
   * Returns structured JSON response
   */
  private async callGeminiDsmAnalysis(
    data: Array<{
      day: string;
      mood: number;
      sleep: number;
      energy: number;
      focus: number;
      appetite: number;
      motivation: number;
    }>,
    window: string,
    demographics: { age: number; sex: string | null },
  ): Promise<{
    topCondition: {
      code: string;
      confidence: number;
      criteria: Record<string, number>;
    } | null;
    notes: string;
  }> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `You are NeuroBridge-Gemini, a clinical decision support AI. Return ONLY valid JSON.

Your task: Analyze daily mood check-in data and identify DSM-5 patterns. This is NOT a diagnosis - it's pattern detection to assist clinicians.

Rules:
1. Return valid JSON only (no markdown, no explanations outside JSON)
2. Each dimension is scored -2 (very low) to +2 (very high), 0 = normal
3. Look for PERSISTENT patterns over multiple days
4. Lower confidence if data is sparse or inconsistent
5. Consider DSM-5 criteria from the policy provided
6. If patterns don't clearly match any condition, return null

Output schema:
{
  "topCondition": {
    "code": "MDD|GAD|BP2|ADHD_INATTENTIVE|INSOMNIA|null",
    "confidence": 0.0 to 1.0,
    "criteria": {
      "mood": <days with low mood>,
      "sleep": <days with sleep issues>,
      "energy": <days with low energy>,
      "focus": <days with poor focus>,
      "appetite": <days with appetite changes>,
      "motivation": <days with low motivation>
    }
  },
  "notes": "Brief clinical note about patterns observed"
}`;

    const userPrompt = `Demographics: Age ${demographics.age}, Sex ${demographics.sex || 'Unknown'}

Check-in data (${window} window, ${data.length} days):
${JSON.stringify(data, null, 2)}

DSM Policy Thresholds:
${JSON.stringify(this.dsmPolicy.thresholds, null, 2)}

Analyze and return JSON only:`;

    try {
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const response = result.response;
      const text = response.text();

      // Parse JSON (remove markdown if present)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      // Return null analysis on error
      return {
        topCondition: null,
        notes: 'Analysis failed - insufficient data or AI error',
      };
    }
  }

  /**
   * Manual trigger for single patient analysis
   * Used by admin endpoint
   */
  async analyzePatientManual(patientId: string) {
    this.logger.log(`Manual DSM analysis triggered for patient ${patientId}`);
    await this.analyzePatient(patientId);
  }
}
