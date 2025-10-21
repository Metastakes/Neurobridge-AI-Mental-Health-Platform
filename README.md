# NeuroBridge AI Mental Health Platform

> **HIPAA-Compliant Mental Health Practice Management System**
>
> A full-stack AI-powered telehealth platform for mental health providers, featuring clinical decision support, automated documentation, and patient engagement tools.

---

## 🎯 Overview

NeuroBridge is a production-ready mental health platform with:

- **AI-Powered Clinical Support** - Gemini AI for medication safety, treatment suggestions, and SOAP note generation
- **Three User Roles** - Patient, Provider, and Mentor dashboards
- **HIPAA Compliance** - Audit logging, PHI encryption, secure communications
- **Telehealth Integration** - Google Meet appointments with Calendar sync
- **Gamification** - Patient engagement through achievements and rewards
- **Billing Automation** - E/M code calculation based on clinical complexity

---

## 🏗️ Architecture

```
/neurobridge-ai-mental-health-platform
├── backend/              # NestJS API Server
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   │   ├── patients/
│   │   │   ├── medications/
│   │   │   ├── ai/       # Gemini integration
│   │   │   ├── scheduling/ # Google Calendar
│   │   │   ├── gamification/
│   │   │   ├── billing/
│   │   │   └── auth/
│   │   ├── common/       # Shared utilities
│   │   │   ├── prisma/   # Database client
│   │   │   └── audit/    # HIPAA audit logging
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Sample data
│   └── Dockerfile
│
├── components/           # React Components
│   ├── patient/
│   ├── provider/
│   └── mentor/
│
├── services/             # Frontend API clients
│   └── api.ts
│
├── hooks/                # React Query hooks
│   ├── usePatient.ts
│   └── useAI.ts
│
├── docker-compose.yml    # Local development
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **PostgreSQL** 15+ (or use Docker)
- **API Keys**:
  - Google Gemini API ([Get Key](https://ai.google.dev/))
  - Google Cloud Project with Calendar API enabled
  - Stripe (optional, for payments)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Neurobridge-AI-Mental-Health-Platform

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

Create environment files:

**Backend: `backend/.env`**
```env
# Database
DATABASE_URL="postgresql://neurobridge:neurobridge_dev_password@localhost:5432/neurobridge?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Google Cloud (for Calendar API)
GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="./path/to/service-account-key.json"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Frontend: `.env.local`**
```env
VITE_API_URL=http://localhost:3000/api
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/api/docs
```

### 4. Or Run Locally (Without Docker)

**Start Database:**
```bash
# Start PostgreSQL (if you have it installed locally)
# OR use Docker for just the database:
docker run -d \
  --name neurobridge-postgres \
  -e POSTGRES_USER=neurobridge \
  -e POSTGRES_PASSWORD=neurobridge_dev_password \
  -e POSTGRES_DB=neurobridge \
  -p 5432:5432 \
  postgres:15-alpine
```

**Backend:**
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed

# Start backend server
npm run start:dev
```

**Frontend:**
```bash
# In the root directory
npm run dev
```

---

## 🔑 Demo Credentials

After seeding the database, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| **Patient** | patient@neuro.io | password |
| **Provider** | provider@neuro.io | password |
| **Mentor** | mentor@neuro.io | password |

---

## 🔄 Migrating from Mock Data to Real API

### Step 1: Update App.tsx to Use QueryProvider

```tsx
import { QueryProvider } from './QueryProvider';

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <GoogleApiProvider>
          {/* Your existing app content */}
        </GoogleApiProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
```

### Step 2: Update Components to Use React Query Hooks

**Before (Mock Data):**
```tsx
// components/provider/ProviderPatientDetail.tsx
const [patient, setPatient] = useState(patientData);
```

**After (Real API):**
```tsx
import { usePatient, useAddMedication, useRemoveMedication } from '../../hooks/usePatient';
import { useMedicationSuggestions } from '../../hooks/useAI';

function ProviderPatientDetail({ patientId }) {
  // Fetch patient data
  const { data: patient, isLoading, error } = usePatient(patientId);

  // Medication mutations
  const addMedication = useAddMedication();
  const removeMedication = useRemoveMedication();

  // AI suggestions
  const getMedSuggestions = useMedicationSuggestions();

  const handleAddMedication = async (medication) => {
    await addMedication.mutateAsync({
      patientId,
      ...medication,
    });
  };

  const handleAnalyzeMedication = async (med) => {
    const suggestions = await getMedSuggestions.mutateAsync({
      patientId,
      proposedMedication: med,
    });

    // Display suggestions in your UI
    setAiSuggestion(suggestions);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading patient</div>;

  return (
    <div>
      {/* Your existing UI */}
    </div>
  );
}
```

### Step 3: API Calls Available

All API functions are in `services/api.ts`:

```tsx
import { patientsApi, medicationsApi, aiApi, schedulingApi, gamificationApi } from './services/api';

// Patients
const patient = await patientsApi.getById(id);
await patientsApi.update(id, { height: 72, weight: 180 });

// Medications
const meds = await medicationsApi.getByPatient(patientId);
await medicationsApi.create({ patientId, name: 'Sertraline', dosage: '100mg', frequency: 'Once daily' });
await medicationsApi.remove(medicationId);

// AI Suggestions
const aiResponse = await aiApi.getMedicationSuggestions(patientId, {
  name: 'Sertraline',
  dosage: '100mg',
  category: 'SSRI',
});

// Scheduling with Google Meet
const appointment = await schedulingApi.bookAppointment({
  patientId,
  providerId,
  scheduledAt: '2025-01-15T14:00:00Z',
  durationMinutes: 50,
});
// Returns: { encounter, meetLink, startTime, endTime }

// Gamification
await gamificationApi.recordEvent({
  patientId,
  eventType: 'MEDICATION_ADHERENCE',
  points: 25,
});

const summary = await gamificationApi.getSummary(patientId);
// Returns: { totalPoints, achievements, recentEvents, stats }
```

---

## 📊 Database Schema

Key tables in PostgreSQL:

- **User** - Base authentication (email, password, role)
- **Patient** - Patient demographics, biometrics, pharmacy
- **Provider** - Clinician credentials (NPI, DEA, license)
- **Mentor** - Supervisor credentials
- **Medication** - Current and historical medications
- **Diagnosis** - ICD-10 diagnoses
- **Encounter** - Appointments with Google Meet links
- **CaseNote** - SOAP notes (can be AI-generated)
- **GamificationEvent** - Points and achievements
- **AuditLog** - HIPAA-required audit trail (7-year retention)
- **BillingCode** - E/M codes for encounters

View full schema: `backend/prisma/schema.prisma`

---

## 🤖 AI Features

### Medication Safety Checks

```tsx
const response = await aiApi.getMedicationSuggestions(patientId, {
  name: 'Bupropion',
  dosage: '150mg',
  category: 'NDRI',
});

// Response structure:
{
  safety_alerts: [
    {
      severity: 'high',
      category: 'contraindication',
      message: 'Patient has history of seizures',
      recommendation: 'Consider alternative medication'
    }
  ],
  next_best_questions: [
    {
      question: 'Have you experienced any recent seizure activity?',
      rationale: 'Bupropion lowers seizure threshold',
      priority: 'high'
    }
  ],
  plan_reviews: [...],
  billing_prompts: [...],
  safetyScore: 6.5, // 1-10 scale
  confidence: 0.89
}
```

### SOAP Note Generation

```tsx
const soapNote = await aiApi.generateSOAPNote(encounterId);

// Returns:
{
  subjective: 'Patient reports improved mood...',
  objective: 'Affect brightened, speech normal rate...',
  assessment: 'MDD responding to Sertraline 100mg...',
  plan: 'Continue current regimen, follow up in 4 weeks...'
}
```

---

## 📅 Google Calendar Integration

### Booking Appointments

Appointments automatically:
- Create Google Meet links (no PHI in calendar summary for HIPAA)
- Send calendar invites to provider
- Store meet link in database
- Create Encounter record

```tsx
const result = await schedulingApi.bookAppointment({
  patientId: 'patient-id',
  providerId: 'provider-id',
  scheduledAt: '2025-01-20T10:00:00Z',
  durationMinutes: 50,
});

console.log(result.meetLink); // https://meet.google.com/abc-defg-hij
```

### Setup Required

1. Create Google Cloud Project
2. Enable Google Calendar API
3. Create Service Account
4. Download JSON key
5. Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

[Full Guide](https://developers.google.com/calendar/api/quickstart/nodejs)

---

## 💳 Billing & Compliance

### Automatic E/M Code Calculation

```tsx
const billing = await billingApi.evaluateCodes(encounterId);

// Returns:
{
  emCode: '99214',        // Level 4 established patient
  basis: 'MDM',           // Medical Decision Making
  modifiers: ['95'],      // Telehealth
  g2211: true,            // Complexity add-on
  rationale: 'Code 99214 selected based on MDM. Clinical complexity assessed as high. G2211 applicable...'
}
```

---

## 🔒 HIPAA Compliance Features

### Audit Logging

Every API request that accesses PHI is automatically logged:

```ts
// Automatic via AuditInterceptor
{
  userId: 'provider-123',
  action: 'GET_/patients/456',
  resource: 'Patient',
  resourceId: '456',
  ipAddress: '192.168.1.1',
  timestamp: '2025-01-15T14:30:00Z'
}
```

Logs retained for 7 years (HIPAA requirement).

### PHI Protection

- No PHI in Google Calendar event summaries
- Passwords bcrypt-hashed
- JWT tokens for authentication
- API rate limiting (production)
- Input validation with class-validator

---

## 🚢 Deployment

### Production Checklist

- [ ] Change all default secrets/passwords
- [ ] Enable MFA for user accounts
- [ ] Set up Google OAuth (replace demo login)
- [ ] Configure HTTPS/SSL certificates
- [ ] Enable Google Cloud HIPAA BAA
- [ ] Set up Stripe in live mode
- [ ] Configure backup strategy (PostgreSQL)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Review HIPAA compliance requirements
- [ ] Sign BAAs with all third-party services

### Deploy to Google Cloud Run

**Backend:**
```bash
cd backend

# Build Docker image
docker build -t gcr.io/[PROJECT-ID]/neurobridge-backend .

# Push to Google Container Registry
docker push gcr.io/[PROJECT-ID]/neurobridge-backend

# Deploy to Cloud Run
gcloud run deploy neurobridge-backend \
  --image gcr.io/[PROJECT-ID]/neurobridge-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_URL = https://your-backend.run.app/api
```

**Database (Neon or Supabase):**

1. Create PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Update `DATABASE_URL` in backend env
3. Run migrations: `npx prisma migrate deploy`
4. Seed: `npx prisma db seed`

---

## 📚 API Documentation

Swagger/OpenAPI docs available at:

```
http://localhost:3000/api/docs
```

Interactive API testing interface with all endpoints documented.

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## 🔧 Common Issues

### "Gemini API Key not set"

**Solution:** Add `GEMINI_API_KEY` to `backend/.env`

### "Google Calendar API failed"

**Solutions:**
1. Enable Calendar API in Google Cloud Console
2. Download service account JSON
3. Set `GOOGLE_APPLICATION_CREDENTIALS` path
4. Ensure service account has Calendar permissions

### "Database connection failed"

**Solutions:**
1. Check PostgreSQL is running: `docker ps`
2. Verify `DATABASE_URL` format is correct
3. Run: `docker-compose up postgres`

### "CORS errors"

**Solution:** Update `FRONTEND_URL` in backend `.env` to match your frontend URL

---

## 🤝 Contributing

This is your proprietary platform. To add features:

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Add backend module in `backend/src/modules/`
3. Add frontend components in `components/`
4. Update API client in `services/api.ts`
5. Create React Query hooks in `hooks/`
6. Test locally
7. Commit and push

---

## 📞 Support

- **Documentation:** This README
- **API Docs:** http://localhost:3000/api/docs
- **Database Schema:** `backend/prisma/schema.prisma`

---

## 📄 License

Proprietary - All Rights Reserved

---

## 🎯 Next Steps

1. **Set up API keys** (Gemini, Google Cloud)
2. **Run `docker-compose up`** to start the stack
3. **Log in** with demo credentials
4. **Test AI features** - Try medication suggestions
5. **Book an appointment** - Test Google Meet integration
6. **Migrate frontend** - Replace mock data with `usePatient()` hooks
7. **Deploy** to production when ready

---

**Built with ❤️ for mental health providers**
