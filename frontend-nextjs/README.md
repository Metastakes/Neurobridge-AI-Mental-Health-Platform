# NeuroBridge Frontend (Next.js 14)

Modern, HIPAA-compliant frontend for the NeuroBridge telepsychiatry platform.

## Features

### Patient Features
- **Account Management**: Register, login, profile management
- **Payment Methods**: Secure Stripe integration (GUARANTEE: payment method required to book)
- **Appointment Booking**: Browse providers and book sessions
- **Pre-Session Tasks**: 3-question micro-check-ins (GUARANTEE enforced)
- **Medication Education**: Interactive lessons with quizzes (GUARANTEE enforced)
- **Appointment History**: View past and upcoming sessions

### Provider Features
- **Earnings Dashboard**: Complete breakdown with charts
  - Cash vs Insurance tracking (GUARANTEE enforced)
  - No-show fees ≥ $50 visualization
  - Admin fees tracking (disabled by default)
  - Session revenue, insurance top-ups, late cancel fees
- **Appointment Management**: View and manage patient sessions
- **Referrals**: Create and accept cross-scope referrals (GUARANTEE enforced)

### Security & Compliance
- **HIPAA-Safe Design**: No PHI exposure in client-side code
- **Secure Authentication**: JWT tokens with automatic refresh
- **Type Safety**: Full TypeScript coverage (Fix #12 applied: snake_case matching backend)
- **Payment Security**: Stripe Elements integration (PCI-compliant)

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client with interceptors
- **Stripe**: Payment processing
- **Recharts**: Data visualization for earnings
- **date-fns**: Date formatting

## Setup

### 1. Install Dependencies

```bash
cd frontend-nextjs
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend-nextjs/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── patient/            # Patient portal
│   │   │   ├── dashboard/
│   │   │   ├── book/
│   │   │   ├── appointments/
│   │   │   ├── pre-session/
│   │   │   └── payment/
│   │   ├── provider/           # Provider portal
│   │   │   ├── dashboard/
│   │   │   ├── appointments/
│   │   │   └── referrals/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Alert.tsx
│   │   ├── PaymentMethodForm.tsx
│   │   ├── PreSessionTaskForm.tsx
│   │   ├── MedicationLesson.tsx
│   │   └── EarningsChart.tsx
│   ├── lib/                    # Utilities
│   │   └── api-client.ts       # API client with auth
│   └── types/                  # TypeScript types
│       └── index.ts            # Types matching backend
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Client Usage

The API client (`src/lib/api-client.ts`) handles all backend communication:

```typescript
import { apiClient } from '@/lib/api-client'

// Authentication
await apiClient.login({ email, password })
await apiClient.registerPatient({ email, password, name })

// Appointments
const appointments = await apiClient.getMyAppointments()
await apiClient.bookAppointment({...})

// Earnings (Providers)
const earnings = await apiClient.getEarningsDashboard(30)

// Pre-Session Tasks
const tasks = await apiClient.getMyPreSessionTasks()
await apiClient.submitPreSessionTask(taskId, {...})

// Medication Education
const education = await apiClient.getMedicationEducation(id)
await apiClient.submitMedicationQuiz({...})
```

## Components

### PaymentMethodForm
Stripe Elements integration for adding payment methods.
- **GUARANTEE**: Enforces payment method requirement
- **PCI Compliant**: Stripe handles card data securely

### PreSessionTaskForm
3-question micro-check-in form.
- **GUARANTEE**: Enforces completion before appointments
- **Validation**: All 3 questions required

### MedicationLesson
Interactive medication education with quiz.
- **GUARANTEE**: Quiz + acknowledgment required
- **Passing Score**: Configurable threshold (default 80%)

### EarningsChart
Provider earnings visualization with Recharts.
- **GUARANTEE**: Cash vs insurance breakdown
- **Charts**: Bar chart, pie chart, summary cards
- **Filters**: 7, 30, 90 day views

## Type Safety

All types in `src/types/index.ts` match the backend exactly (Fix #12):

```typescript
// Snake_case matching backend
export interface Appointment {
  patient_id: number
  provider_id: number
  starts_at: string
  ends_at: string
  amount_cents: number
  // ...
}
```

## Build

```bash
# Type check
npm run type-check

# Production build
npm run build

# Start production server
npm run start
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```bash
docker build -t neurobridge-frontend .
docker run -p 3000:3000 neurobridge-frontend
```

## GUARANTEES Enforced

1. ✅ **Payment Method Required**: Booking blocked without payment method
2. ✅ **Pre-Session Check-Ins**: 3-question forms with validation
3. ✅ **Medication Education**: Quiz + acknowledgment workflow
4. ✅ **Earnings Dashboard**: Complete cash vs insurance breakdown
5. ✅ **No PHI in Client**: All sensitive data stays server-side

## Security Best Practices

- **No Secrets in Client**: All API keys are NEXT_PUBLIC_ only
- **Token Storage**: JWT in localStorage with auto-refresh
- **HTTPS Only**: Production requires SSL
- **CORS**: Backend validates allowed origins
- **Input Validation**: Client-side + server-side validation

## Troubleshooting

### API Connection Issues
```bash
# Check backend is running
curl http://localhost:8000/health

# Verify API_URL in .env.local
echo $NEXT_PUBLIC_API_URL
```

### Stripe Integration
```bash
# Verify Stripe key
echo $NEXT_PUBLIC_STRIPE_PUBLIC_KEY

# Test mode keys start with pk_test_
```

## Support

For issues or questions, contact the development team.
