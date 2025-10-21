import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService, AISuggestionRequest, AISuggestionResponse } from './gemini.service';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  /**
   * Get medication suggestions with safety checks
   */
  async getMedicationSuggestions(
    patientId: string,
    proposedMedication: { name: string; dosage: string; category?: string },
  ): Promise<AISuggestionResponse> {
    // Fetch patient data
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            dateOfBirth: false, // Don't send actual DOB
          },
        },
        medications: {
          where: { status: 'ACTIVE' },
        },
        allergies: true,
        diagnoses: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Calculate age range (not exact age for privacy)
    const ageRange = this.getAgeRange(patient.dateOfBirth);

    // Build request
    const request: AISuggestionRequest = {
      systemPrompt: `You are NeuroBridge-Gemini, an AI clinical decision support system for psychiatric medication management.
Provide evidence-based, safety-focused guidance for medication prescribing.
Consider drug interactions, contraindications, side effects, and patient safety.`,
      context: {
        mode: 'treatment_support',
        patientRef: patientId,
        demographics: {
          ageRange,
          sex: patient.sex || undefined,
        },
        meds: patient.medications.map(m => ({
          name: m.name,
          dosage: m.dosage,
          category: m.category || undefined,
        })),
        allergies: patient.allergies.map(a => ({
          allergen: a.allergen,
          severity: a.severity,
        })),
        dx: patient.diagnoses.map(d => ({
          icdCode: d.icdCode,
          description: d.description,
        })),
        proposedMedication,
      },
    };

    // Get AI suggestion
    const suggestion = await this.gemini.getSuggestion(request);

    // Store AI suggestion for audit
    await this.prisma.aISuggestion.create({
      data: {
        patientId,
        prompt: JSON.stringify(request.context),
        response: suggestion as any,
        modelUsed: 'gemini-pro',
        safetyScore: suggestion.safetyScore,
        flaggedConcerns: suggestion.safety_alerts.map(a => a.message),
      },
    });

    return suggestion;
  }

  /**
   * Get next best clinical questions
   */
  async getNextQuestions(context: {
    patientId: string;
    currentContext: string;
  }): Promise<AISuggestionResponse> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: context.patientId },
      include: {
        medications: { where: { status: 'ACTIVE' } },
        diagnoses: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const request: AISuggestionRequest = {
      systemPrompt: `You are NeuroBridge-Gemini, helping clinicians identify the next best questions to ask during a patient encounter.
Focus on questions that will guide treatment decisions, assess symptoms, and identify safety concerns.`,
      context: {
        mode: 'questions_only',
        patientRef: context.patientId,
        dx: patient.diagnoses.map(d => ({
          icdCode: d.icdCode,
          description: d.description,
        })),
        customPrompt: context.currentContext,
      },
    };

    return await this.gemini.getSuggestion(request);
  }

  /**
   * Generate SOAP note for encounter
   */
  async generateSOAPNote(encounterId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        patient: {
          include: {
            medications: { where: { status: 'ACTIVE' } },
            diagnoses: true,
          },
        },
      },
    });

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    // You would typically have more context from the session
    const soapNote = await this.gemini.generateSOAPNote({
      medications: encounter.patient.medications,
      diagnoses: encounter.patient.diagnoses,
    });

    return soapNote;
  }

  /**
   * Calculate age range for privacy
   */
  private getAgeRange(dob: Date): string {
    const age = new Date().getFullYear() - dob.getFullYear();

    if (age < 18) return 'Under 18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }
}
