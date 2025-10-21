/**
 * Google AI Studio Integration Example
 * Test your Gemini prompts directly in AI Studio
 */

// COPY THIS PROMPT TO GOOGLE AI STUDIO
// https://aistudio.google.com/

export const MEDICATION_SAFETY_PROMPT = `You are NeuroBridge-Gemini, an AI clinical decision support system for psychiatric medication management.
Provide evidence-based, safety-focused guidance for medication prescribing.
Consider drug interactions, contraindications, side effects, and patient safety.

## Patient Context
Age Range: 25-34
Sex: Male

## Current Diagnoses
- Major Depressive Disorder (F32.9)
- Generalized Anxiety Disorder (F41.1)

## Current Medications
- Sertraline 100mg (SSRI)
- Buspirone 15mg (Anxiolytic)

## Known Allergies
- Penicillin (Severity: 7/10)

## Proposed Medication
Bupropion 150mg
Category: NDRI

Provide comprehensive clinical decision support covering safety, next steps, and treatment planning.

Respond ONLY with valid JSON in this exact structure:
{
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

// HOW TO USE IN GOOGLE AI STUDIO:
// 1. Go to https://aistudio.google.com/
// 2. Create a new prompt
// 3. Paste the prompt above
// 4. Click "Run"
// 5. See the AI response
// 6. Adjust the prompt to test different scenarios

export const SOAP_NOTE_PROMPT = `You are an AI clinical documentation assistant for NeuroBridge. Generate a professional SOAP note based on the following information:

Subjective (Patient Report):
Patient reports improved mood over the past 2 weeks. Sleep has normalized. Appetite has returned. Denies suicidal ideation. Reports occasional anxiety in social situations.

Vitals:
{
  "bloodPressure": "120/80",
  "heartRate": 72,
  "temperature": "98.6°F"
}

Current Medications:
- Sertraline 100mg Once daily (SSRI)
- Buspirone 15mg Twice daily (Anxiolytic)

Diagnoses:
- Major Depressive Disorder (F32.9)
- Generalized Anxiety Disorder (F41.1)

Plan Notes:
Continue current medication regimen. Follow up in 4 weeks. Referred to CBT therapy.

Generate a complete SOAP note in JSON format:
{
  "subjective": "Detailed subjective section",
  "objective": "Detailed objective section with vitals and observations",
  "assessment": "Clinical assessment with diagnosis codes",
  "plan": "Detailed treatment plan"
}

Respond ONLY with valid JSON.`;

// TESTING IN AI STUDIO:
// This allows you to test and refine your prompts before deploying
// You can see how Gemini responds to different scenarios
// Then copy the refined prompts to your backend code
