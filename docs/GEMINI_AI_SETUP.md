# Gemini AI Integration Setup Guide

## Overview

NeuroBridge uses Google's Gemini AI for clinical decision support, including:
- **Medication safety analysis** - Drug interactions, contraindications, dosage validation
- **SOAP note generation** - Automated clinical documentation
- **Next-best-question recommendations** - Clinical interview guidance
- **Crisis detection** - Safety risk assessment

---

## Quick Setup (5 minutes)

### 1. Get Your Gemini API Key

**Option A: Free Tier (Google AI Studio)** - Recommended for development
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select your Google Cloud project (or create new one)
4. Copy the API key (starts with `AIza...`)

**Option B: Production (Vertex AI)** - For production deployment
1. Go to: https://console.cloud.google.com
2. Create or select a project
3. Enable Vertex AI API
4. Create service account with Vertex AI user role
5. Download service account JSON key

### 2. Add to Environment Variables

**For Development (Google AI Studio):**
```bash
cd backend
echo 'GEMINI_API_KEY="AIza..."' >> .env
```

**For Production (Vertex AI):**
```bash
cd backend
echo 'GOOGLE_CLOUD_PROJECT_ID="your-project-id"' >> .env
echo 'GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"' >> .env
echo 'VERTEX_AI_LOCATION="us-central1"' >> .env
```

### 3. Restart Backend

```bash
npm run start:dev
```

### 4. Test AI Endpoints

```bash
# Test medication safety analysis
curl -X POST http://localhost:3000/ai/medication-suggestions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "patient-id",
    "proposedMedication": {
      "name": "Sertraline",
      "dosage": "50mg",
      "frequency": "daily"
    }
  }'
```

---

## API Endpoints

### 1. Medication Safety Analysis

**POST** `/ai/medication-suggestions`

Analyzes proposed medication for safety concerns, interactions, and contraindications.

**Request:**
```json
{
  "patientId": "clx123abc",
  "proposedMedication": {
    "name": "Sertraline",
    "dosage": "50mg",
    "frequency": "daily"
  }
}
```

**Response:**
```json
{
  "safety_alerts": [
    {
      "severity": "warning",
      "category": "interaction",
      "message": "May interact with existing MAOIs",
      "recommendation": "Monitor for serotonin syndrome"
    }
  ],
  "next_best_questions": [
    {
      "priority": "high",
      "question": "History of seizures?",
      "rationale": "Sertraline can lower seizure threshold"
    }
  ],
  "plan_reviews": [
    {
      "aspect": "dosing",
      "suggestion": "Start at 25mg and titrate up",
      "evidence": "Standard practice for anxiety"
    }
  ],
  "safetyScore": 8,
  "confidence": 0.92
}
```

**Safety Score Scale:**
- 9-10: Very safe, minimal concerns
- 7-8: Generally safe with precautions
- 5-6: Moderate risk, careful monitoring required
- 3-4: Significant concerns, consider alternatives
- 1-2: High risk, do not prescribe

---

### 2. SOAP Note Generation

**POST** `/ai/soap-note`

Generates structured clinical documentation from encounter data.

**Request:**
```json
{
  "encounterId": "encounter-123"
}
```

**Response:**
```json
{
  "subjective": "Patient reports feeling anxious...",
  "objective": "Alert and oriented x3. Appropriate affect...",
  "assessment": "Generalized Anxiety Disorder (F41.1)...",
  "plan": "1. Start Sertraline 50mg daily\n2. Follow-up in 2 weeks...",
  "generatedByAI": true,
  "confidence": 0.88
}
```

---

### 3. Next-Best-Question

**POST** `/ai/next-question`

Provides clinical interview guidance based on current encounter context.

**Request:**
```json
{
  "encounterId": "encounter-123",
  "currentContext": "Patient reports sleep disturbance"
}
```

**Response:**
```json
{
  "questions": [
    {
      "priority": "high",
      "question": "How many hours of sleep per night?",
      "rationale": "Quantify sleep deficit",
      "expectedAnswers": ["number", "range"]
    },
    {
      "priority": "medium",
      "question": "Difficulty falling asleep or staying asleep?",
      "rationale": "Differentiate insomnia type",
      "expectedAnswers": ["falling asleep", "staying asleep", "both"]
    }
  ]
}
```

---

## Configuration Options

### Model Selection

The backend uses `gemini-1.5-flash` by default for speed and cost-efficiency.

To change the model, edit `backend/src/modules/ai/gemini.service.ts`:

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro' // More accurate, slower, more expensive
});
```

**Available Models:**
- `gemini-1.5-flash` - Fast, cost-effective (recommended)
- `gemini-1.5-pro` - Most capable, slower, higher cost
- `gemini-1.0-pro` - Legacy, still supported

### Temperature & Parameters

Adjust creativity vs. consistency:

```typescript
const generationConfig = {
  temperature: 0.3, // Lower = more deterministic (0.0-1.0)
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};
```

**Recommended Settings:**
- **Medication Safety:** temperature = 0.2 (very conservative)
- **SOAP Notes:** temperature = 0.3 (factual)
- **Next Questions:** temperature = 0.5 (slightly creative)

---

## Safety & Compliance

### ⚠️ HIPAA Requirements

**DO:**
- ✅ Use Vertex AI (not Google AI Studio) for production
- ✅ Enable VPC Service Controls
- ✅ Sign Google Cloud BAA (Business Associate Agreement)
- ✅ Audit all AI requests with patient data
- ✅ Implement rate limiting

**DON'T:**
- ❌ Send raw PHI without de-identification
- ❌ Use free tier for production patient data
- ❌ Store API responses with PHI indefinitely
- ❌ Share API keys across environments

### De-identification

The backend automatically strips PHI before sending to Gemini:

```typescript
// Instead of sending: "Patient John Doe, age 45..."
// Sends: "Patient, age 45..."
```

### Audit Logging

All AI requests are logged with:
- Patient ID (for internal audit)
- Timestamp
- Request type
- Response summary (no PHI)
- Provider ID

---

## Cost Estimation

### Google AI Studio (Free Tier)
- **Free:** 15 requests per minute
- **Cost:** $0
- **Limit:** 1,500 requests per day

### Vertex AI (Production)

**gemini-1.5-flash:**
- Input: $0.000125 per 1K characters
- Output: $0.000375 per 1K characters
- **Example:** Medication analysis (~2K characters) = $0.001 per request

**gemini-1.5-pro:**
- Input: $0.00125 per 1K characters (10x more)
- Output: $0.00375 per 1K characters (10x more)
- **Example:** Medication analysis = $0.01 per request

**Monthly Cost Estimate (1000 patients, avg 10 AI requests/patient/month):**
- Flash: 10,000 requests × $0.001 = **$10/month**
- Pro: 10,000 requests × $0.01 = **$100/month**

---

## Troubleshooting

### Error: "GEMINI_API_KEY not found"

**Solution:**
```bash
cd backend
cat .env | grep GEMINI_API_KEY
# If empty, add it:
echo 'GEMINI_API_KEY="AIza..."' >> .env
npm run start:dev
```

### Error: "Invalid API key"

**Causes:**
1. Expired or revoked key
2. Wrong project selected
3. API not enabled

**Solution:**
1. Go to https://aistudio.google.com/app/apikey
2. Regenerate API key
3. Enable Generative Language API in Cloud Console

### Error: "Rate limit exceeded"

**Free Tier Limits:**
- 15 requests per minute
- 1,500 requests per day

**Solution:**
1. Implement caching for common queries
2. Upgrade to Vertex AI (no rate limits)
3. Add request queue with delays

### Error: "Safety filter triggered"

**Cause:** Gemini blocked response due to safety concerns (extremely rare for medical content)

**Solution:**
1. Review input for inappropriate content
2. Adjust safety settings in `gemini.service.ts`:
```typescript
safetySettings: [
  {
    category: HarmCategory.HARM_CATEGORY_MEDICAL,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]
```

---

## Testing

### Unit Tests

```bash
cd backend
npm test -- src/modules/ai/gemini.service.spec.ts
```

### Integration Tests

```bash
# Test medication analysis
npm run test:e2e -- --grep "AI medication suggestions"

# Test SOAP note generation
npm run test:e2e -- --grep "SOAP note generation"
```

### Manual Testing

Use the Swagger UI at http://localhost:3000/api

1. Click "Authorize" and enter JWT token
2. Navigate to "AI" section
3. Try "POST /ai/medication-suggestions"
4. View response with safety analysis

---

## Production Deployment

### 1. Switch to Vertex AI

Update `.env`:
```bash
# Remove this line:
GEMINI_API_KEY="..."

# Add these:
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
VERTEX_AI_LOCATION="us-central1"
```

### 2. Update Service Account Permissions

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 3. Sign BAA

Contact Google Cloud sales to sign Business Associate Agreement for HIPAA compliance.

### 4. Enable Audit Logs

```bash
gcloud logging sinks create gemini-audit-sink \
  bigquery.googleapis.com/projects/YOUR_PROJECT/datasets/audit_logs \
  --log-filter='resource.type="aiplatform.googleapis.com/Endpoint"'
```

---

## Advanced Features

### Custom Prompts

Edit `backend/src/modules/ai/prompts/` to customize AI behavior:

**medication-safety.prompt.txt:**
```
You are a clinical pharmacist AI assistant. Analyze the proposed medication
for a mental health patient. Consider:
1. Drug interactions with existing medications
2. Contraindications based on diagnoses
3. Age-appropriate dosing
4. Side effect profile
...
```

### Fine-Tuning (Future)

Gemini supports fine-tuning with your own clinical data:
1. Collect 500+ annotated examples
2. Use Vertex AI fine-tuning API
3. Deploy custom model endpoint

---

## Support

- **Gemini Documentation:** https://ai.google.dev/docs
- **Vertex AI Console:** https://console.cloud.google.com/vertex-ai
- **NeuroBridge Issues:** https://github.com/your-org/neurobridge/issues

---

## Summary

✅ **Quick Start:** Get API key → Add to `.env` → Restart server
✅ **Free Tier:** 1,500 requests/day for development
✅ **Production:** Use Vertex AI with BAA for HIPAA compliance
✅ **Cost:** ~$10/month for 10,000 AI requests (Flash model)
✅ **Safety:** De-identification, audit logging, safety filters

**Ready to test?** Run the backend and try the Swagger UI at `/api` 🚀
