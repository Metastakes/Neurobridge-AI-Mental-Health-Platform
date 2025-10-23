/**
 * INNOVATION: AI-Powered SOAP Note Generation
 * Automatically generates clinical documentation using patient context and AI
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../common/prisma/prisma.service';

interface SoapNoteContext {
  patient: {
    firstName: string;
    lastName: string;
    age: number;
    diagnoses: Array<{ icdCode: string; description: string }>;
    medications: Array<{ name: string; dosage: string; category: string }>;
    allergies: Array<{ allergen: string; reaction: string }>;
  };
  encounter: {
    scheduledAt: Date;
    durationMinutes?: number;
  };
  recentMood?: {
    last7Days: Array<{
      day: string;
      mood: number;
      sleep: number;
      energy: number;
      focus: number;
      appetite: number;
      motivation: number;
    }>;
    averages: {
      mood: number;
      sleep: number;
      energy: number;
      focus: number;
      appetite: number;
      motivation: number;
    };
  };
  dsmSummary?: {
    conditionCode: string;
    confidence: number;
    matchedCriteria: any;
  };
  riskAlerts?: Array<{
    kind: string;
    severity: string;
    message: string;
    createdAt: Date;
  }>;
  sideEffects?: Array<{
    medication: string;
    effect: string;
    severity: string;
    onset: Date;
  }>;
  previousNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

interface GeneratedSoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  generatedAt: Date;
  modelUsed: string;
}

@Injectable()
export class AiSoapService {
  private readonly logger = new Logger(AiSoapService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      this.logger.warn('GEMINI_API_KEY not configured - AI SOAP generation disabled');
    }
  }

  /**
   * Generate SOAP note from encounter context
   */
  async generateSoapNote(encounterId: string): Promise<GeneratedSoapNote> {
    if (!this.model) {
      throw new Error('AI service not configured');
    }

    this.logger.log(`Generating SOAP note for encounter ${encounterId}`);

    // Gather comprehensive context
    const context = await this.gatherEncounterContext(encounterId);

    // Build AI prompt
    const prompt = this.buildSoapPrompt(context);

    // Call Gemini API
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse SOAP sections from response
    const soapNote = this.parseSoapResponse(text);

    this.logger.log(`SOAP note generated successfully for encounter ${encounterId}`);

    return {
      ...soapNote,
      confidence: 0.85, // Could be calculated based on data completeness
      generatedAt: new Date(),
      modelUsed: 'gemini-pro',
    };
  }

  /**
   * Gather all relevant context for SOAP note generation
   */
  private async gatherEncounterContext(encounterId: string): Promise<SoapNoteContext> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        patient: {
          include: {
            user: true,
            diagnoses: true,
            medications: {
              where: { status: 'ACTIVE' },
            },
            allergies: true,
            moodCheckins: {
              orderBy: { day: 'desc' },
              take: 7,
            },
            dsmSummaries: {
              where: { window: '30d' },
            },
            riskAlerts: {
              where: { resolvedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        sideEffects: {
          include: {
            medication: true,
          },
        },
        caseNotes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    const patient = encounter.patient;
    const dob = new Date(patient.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Calculate mood averages
    const moodCheckins = patient.moodCheckins;
    const averages = this.calculateMoodAverages(moodCheckins);

    return {
      patient: {
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        age,
        diagnoses: patient.diagnoses.map(d => ({
          icdCode: d.icdCode,
          description: d.description,
        })),
        medications: patient.medications.map(m => ({
          name: m.name,
          dosage: m.dosage,
          category: m.category || 'unknown',
        })),
        allergies: patient.allergies.map(a => ({
          allergen: a.allergen,
          reaction: a.reaction || 'unknown',
        })),
      },
      encounter: {
        scheduledAt: encounter.scheduledAt,
        durationMinutes: encounter.durationMinutes || undefined,
      },
      recentMood: moodCheckins.length > 0 ? {
        last7Days: moodCheckins.map(c => ({
          day: c.day.toISOString(),
          mood: c.mood,
          sleep: c.sleep,
          energy: c.energy,
          focus: c.focus,
          appetite: c.appetite,
          motivation: c.motivation,
        })),
        averages,
      } : undefined,
      dsmSummary: patient.dsmSummaries[0] ? {
        conditionCode: patient.dsmSummaries[0].conditionCode || 'pending',
        confidence: patient.dsmSummaries[0].confidence || 0,
        matchedCriteria: patient.dsmSummaries[0].matchedCriteria,
      } : undefined,
      riskAlerts: patient.riskAlerts.map(a => ({
        kind: a.kind,
        severity: a.severity,
        message: a.message,
        createdAt: a.createdAt,
      })),
      sideEffects: encounter.sideEffects?.map(se => ({
        medication: se.medication.name,
        effect: se.effect,
        severity: se.severity,
        onset: se.onset || new Date(),
      })),
      previousNotes: encounter.caseNotes[0] ? {
        subjective: encounter.caseNotes[0].subjective || undefined,
        objective: encounter.caseNotes[0].objective || undefined,
        assessment: encounter.caseNotes[0].assessment || undefined,
        plan: encounter.caseNotes[0].plan || undefined,
      } : undefined,
    };
  }

  /**
   * Calculate mood dimension averages
   */
  private calculateMoodAverages(checkins: any[]) {
    if (checkins.length === 0) {
      return { mood: 0, sleep: 0, energy: 0, focus: 0, appetite: 0, motivation: 0 };
    }

    const sum = checkins.reduce((acc, c) => ({
      mood: acc.mood + c.mood,
      sleep: acc.sleep + c.sleep,
      energy: acc.energy + c.energy,
      focus: acc.focus + c.focus,
      appetite: acc.appetite + c.appetite,
      motivation: acc.motivation + c.motivation,
    }), { mood: 0, sleep: 0, energy: 0, focus: 0, appetite: 0, motivation: 0 });

    const count = checkins.length;
    return {
      mood: sum.mood / count,
      sleep: sum.sleep / count,
      energy: sum.energy / count,
      focus: sum.focus / count,
      appetite: sum.appetite / count,
      motivation: sum.motivation / count,
    };
  }

  /**
   * Build comprehensive SOAP generation prompt
   */
  private buildSoapPrompt(context: SoapNoteContext): string {
    return `You are an expert psychiatric provider generating a SOAP note for a telepsychiatry session.

PATIENT INFORMATION:
- Name: ${context.patient.firstName} ${context.patient.lastName}
- Age: ${context.patient.age}
- Diagnoses: ${context.patient.diagnoses.map(d => `${d.icdCode} (${d.description})`).join(', ') || 'None documented'}
- Current Medications: ${context.patient.medications.map(m => `${m.name} ${m.dosage} (${m.category})`).join(', ') || 'None'}
- Allergies: ${context.patient.allergies.map(a => `${a.allergen} (${a.reaction})`).join(', ') || 'NKDA'}

ENCOUNTER DETAILS:
- Session Date: ${context.encounter.scheduledAt.toLocaleDateString()}
- Duration: ${context.encounter.durationMinutes || 'Not recorded'} minutes

RECENT MOOD DATA (Last 7 Days):
${context.recentMood ? `
- Average Mood: ${context.recentMood.averages.mood.toFixed(1)} (scale: -2 to +2)
- Average Sleep: ${context.recentMood.averages.sleep.toFixed(1)}
- Average Energy: ${context.recentMood.averages.energy.toFixed(1)}
- Average Focus: ${context.recentMood.averages.focus.toFixed(1)}
- Average Appetite: ${context.recentMood.averages.appetite.toFixed(1)}
- Average Motivation: ${context.recentMood.averages.motivation.toFixed(1)}
` : 'No recent mood data available'}

DSM PATTERN ANALYSIS (AI-Detected):
${context.dsmSummary ? `
- Pattern: ${context.dsmSummary.conditionCode}
- Confidence: ${(context.dsmSummary.confidence * 100).toFixed(0)}%
- Matched Criteria: ${JSON.stringify(context.dsmSummary.matchedCriteria)}
` : 'No DSM analysis available'}

ACTIVE RISK ALERTS:
${context.riskAlerts && context.riskAlerts.length > 0 ?
  context.riskAlerts.map(a => `- [${a.severity}] ${a.kind}: ${a.message}`).join('\n') :
  'No active risk alerts'}

REPORTED SIDE EFFECTS:
${context.sideEffects && context.sideEffects.length > 0 ?
  context.sideEffects.map(se => `- ${se.medication}: ${se.effect} (${se.severity})`).join('\n') :
  'No side effects reported'}

Generate a professional SOAP note using the above data. Format your response EXACTLY as follows:

SUBJECTIVE:
[Patient's reported symptoms, complaints, and subjective experience. Include mood data trends, any concerns mentioned, medication adherence, side effects if reported.]

OBJECTIVE:
[Observable findings, affect, behavior during session. Reference mood tracking data, side effects, and any objective measurements.]

ASSESSMENT:
[Clinical assessment including DSM diagnoses, severity, response to treatment, risk assessment. Reference AI pattern analysis if available.]

PLAN:
[Treatment plan including medication management, therapy recommendations, follow-up schedule, safety planning if needed, patient education.]

IMPORTANT GUIDELINES:
- Be concise but thorough (2-4 sentences per section)
- Use professional psychiatric terminology
- Reference specific data points (mood scores, risk alerts, side effects)
- Maintain appropriate clinical tone
- Include safety considerations if risk alerts present
- Note medication changes or recommendations
- Specify follow-up timeline
- Use EXACT format above with section headers in ALL CAPS`;
  }

  /**
   * Parse AI response into structured SOAP sections
   */
  private parseSoapResponse(text: string): Omit<GeneratedSoapNote, 'confidence' | 'generatedAt' | 'modelUsed'> {
    const sections = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };

    // Extract each section using regex
    const subjectiveMatch = text.match(/SUBJECTIVE:\s*([\s\S]*?)(?=OBJECTIVE:|$)/i);
    const objectiveMatch = text.match(/OBJECTIVE:\s*([\s\S]*?)(?=ASSESSMENT:|$)/i);
    const assessmentMatch = text.match(/ASSESSMENT:\s*([\s\S]*?)(?=PLAN:|$)/i);
    const planMatch = text.match(/PLAN:\s*([\s\S]*?)$/i);

    sections.subjective = subjectiveMatch ? subjectiveMatch[1].trim() : '';
    sections.objective = objectiveMatch ? objectiveMatch[1].trim() : '';
    sections.assessment = assessmentMatch ? assessmentMatch[1].trim() : '';
    sections.plan = planMatch ? planMatch[1].trim() : '';

    return sections;
  }

  /**
   * Save generated SOAP note to database
   */
  async saveSoapNote(
    encounterId: string,
    providerId: string,
    soapNote: GeneratedSoapNote,
    modified: boolean = false,
  ) {
    return this.prisma.caseNote.create({
      data: {
        encounterId,
        providerId,
        subjective: soapNote.subjective,
        objective: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan,
        generatedByAI: !modified,
        aiModelUsed: soapNote.modelUsed,
      },
    });
  }
}
