import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/genai';

export interface AISuggestionRequest {
  systemPrompt: string;
  context: {
    mode?: 'treatment_support' | 'questions_only' | 'safety_check' | 'billing' | 'compliance';
    patientRef?: string;
    demographics?: {
      ageRange?: string;
      sex?: string;
    };
    meds?: Array<{ name: string; dosage: string; category?: string }>;
    allergies?: Array<{ allergen: string; severity: number }>;
    dx?: Array<{ icdCode: string; description: string }>;
    proposedMedication?: {
      name: string;
      dosage: string;
      category?: string;
    };
    labs?: any;
    customPrompt?: string;
  };
}

export interface AISuggestionResponse {
  safety_alerts: Array<{
    severity: 'critical' | 'high' | 'moderate' | 'low';
    category: string;
    message: string;
    recommendation?: string;
  }>;
  next_best_questions: Array<{
    question: string;
    rationale: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  plan_reviews: Array<{
    item: string;
    assessment: string;
    alternatives?: string[];
  }>;
  billing_prompts?: Array<{
    code: string;
    basis: string;
    rationale: string;
  }>;
  safetyScore: number; // 1-10
  confidence: number; // 0-1
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genai: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('⚠️  GEMINI_API_KEY not set - AI features will be disabled');
      return;
    }

    this.genai = new GoogleGenerativeAI(apiKey);
    this.model = this.genai.getGenerativeModel({
      model: 'gemini-pro',
    });

    this.logger.log('✅ Gemini AI service initialized');
  }

  /**
   * Main entry point for AI suggestions
   * Returns structured clinical decision support
   */
  async getSuggestion(request: AISuggestionRequest): Promise<AISuggestionResponse> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    try {
      // Build the comprehensive prompt
      const fullPrompt = this.buildPrompt(request);

      this.logger.debug('Sending request to Gemini AI');

      // Call Gemini
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const parsed = this.parseAIResponse(text);

      this.logger.debug('Received AI suggestion successfully');

      return parsed;
    } catch (error) {
      this.logger.error('Gemini AI request failed:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for Gemini
   */
  private buildPrompt(request: AISuggestionRequest): string {
    const { systemPrompt, context } = request;

    let prompt = `${systemPrompt}\n\n`;

    // Add patient context (de-identified)
    if (context.demographics) {
      prompt += `## Patient Context\n`;
      prompt += `Age Range: ${context.demographics.ageRange || 'Not specified'}\n`;
      prompt += `Sex: ${context.demographics.sex || 'Not specified'}\n\n`;
    }

    // Add diagnoses
    if (context.dx && context.dx.length > 0) {
      prompt += `## Current Diagnoses\n`;
      context.dx.forEach(dx => {
        prompt += `- ${dx.description} (${dx.icdCode})\n`;
      });
      prompt += `\n`;
    }

    // Add current medications
    if (context.meds && context.meds.length > 0) {
      prompt += `## Current Medications\n`;
      context.meds.forEach(med => {
        prompt += `- ${med.name} ${med.dosage} ${med.category ? `(${med.category})` : ''}\n`;
      });
      prompt += `\n`;
    }

    // Add allergies
    if (context.allergies && context.allergies.length > 0) {
      prompt += `## Known Allergies\n`;
      context.allergies.forEach(allergy => {
        prompt += `- ${allergy.allergen} (Severity: ${allergy.severity}/10)\n`;
      });
      prompt += `\n`;
    }

    // Add proposed medication
    if (context.proposedMedication) {
      prompt += `## Proposed Medication\n`;
      prompt += `${context.proposedMedication.name} ${context.proposedMedication.dosage}\n`;
      prompt += `Category: ${context.proposedMedication.category || 'Not specified'}\n\n`;
    }

    // Add custom prompt
    if (context.customPrompt) {
      prompt += `## Specific Question\n${context.customPrompt}\n\n`;
    }

    // Add mode-specific instructions
    prompt += this.getModeInstructions(context.mode);

    // Request structured JSON output
    prompt += `\n\n## Output Format\n`;
    prompt += `Respond ONLY with valid JSON in this exact structure:\n`;
    prompt += `{
  "safety_alerts": [
    {
      "severity": "critical|high|moderate|low",
      "category": "drug_interaction|contraindication|adverse_effect|other",
      "message": "Description of the safety concern",
      "recommendation": "What action to take"
    }
  ],
  "next_best_questions": [
    {
      "question": "Specific clinical question to ask",
      "rationale": "Why this question is important",
      "priority": "high|medium|low"
    }
  ],
  "plan_reviews": [
    {
      "item": "Treatment component to review",
      "assessment": "Clinical assessment",
      "alternatives": ["Alternative option 1", "Alternative option 2"]
    }
  ],
  "billing_prompts": [
    {
      "code": "CPT/EM code",
      "basis": "MDM|Time",
      "rationale": "Why this code is appropriate"
    }
  ],
  "safetyScore": 8.5,
  "confidence": 0.92
}

Do not include any text outside the JSON object.`;

    return prompt;
  }

  /**
   * Get mode-specific instructions
   */
  private getModeInstructions(mode?: string): string {
    switch (mode) {
      case 'safety_check':
        return `Focus on safety alerts and drug interactions. Provide comprehensive contraindication checking.`;

      case 'questions_only':
        return `Focus on generating the next best clinical questions to ask the patient. Prioritize questions that will guide treatment decisions.`;

      case 'billing':
        return `Focus on appropriate billing codes (CPT, E/M codes) based on the clinical documentation and time spent. Consider complexity and medical decision making.`;

      case 'compliance':
        return `Focus on compliance checks: washout periods, serotonin syndrome risks, GLP-1 contraindications, PDMP requirements, and other regulatory concerns.`;

      case 'treatment_support':
      default:
        return `Provide comprehensive clinical decision support covering safety, next steps, and treatment planning.`;
    }
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(text: string): AISuggestionResponse {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and set defaults
      return {
        safety_alerts: parsed.safety_alerts || [],
        next_best_questions: parsed.next_best_questions || [],
        plan_reviews: parsed.plan_reviews || [],
        billing_prompts: parsed.billing_prompts || [],
        safetyScore: parsed.safetyScore || 5,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      this.logger.error('Raw response:', text);

      // Return safe defaults
      return {
        safety_alerts: [{
          severity: 'moderate',
          category: 'other',
          message: 'AI response parsing failed. Please review manually.',
          recommendation: 'Consult with supervising physician.',
        }],
        next_best_questions: [],
        plan_reviews: [],
        billing_prompts: [],
        safetyScore: 5,
        confidence: 0,
      };
    }
  }

  /**
   * Generate SOAP note using AI
   */
  async generateSOAPNote(context: {
    subjective?: string;
    vitals?: any;
    medications?: any[];
    diagnoses?: any[];
    planNotes?: string;
  }): Promise<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    const prompt = `You are an AI clinical documentation assistant. Generate a professional SOAP note based on the following information:

${context.subjective ? `Subjective (Patient Report):\n${context.subjective}\n\n` : ''}
${context.vitals ? `Vitals:\n${JSON.stringify(context.vitals, null, 2)}\n\n` : ''}
${context.medications ? `Current Medications:\n${context.medications.map(m => `- ${m.name} ${m.dosage}`).join('\n')}\n\n` : ''}
${context.diagnoses ? `Diagnoses:\n${context.diagnoses.map(d => `- ${d.description}`).join('\n')}\n\n` : ''}
${context.planNotes ? `Plan Notes:\n${context.planNotes}\n\n` : ''}

Generate a complete SOAP note in JSON format:
{
  "subjective": "Detailed subjective section",
  "objective": "Detailed objective section",
  "assessment": "Clinical assessment",
  "plan": "Treatment plan"
}

Respond ONLY with valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in SOAP note response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('SOAP note generation failed:', error);
      throw error;
    }
  }
}
