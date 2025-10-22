# NeuroBridge Backend API

HIPAA-compliant NestJS backend for the NeuroBridge AI Mental Health Platform.

## Quick Start

### One-Command Setup

```bash
./dev-setup.sh
```

This script will:
- Install dependencies
- Create .env file with secure defaults
- Check PostgreSQL connection
- Run database migrations
- Seed sample data (optional)
- Generate Prisma Client

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL**
   ```bash
   # Using Docker (recommended for development)
   docker run -d --name neurobridge-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_USER=user \
     -e POSTGRES_DB=neurobridge \
     -p 5432:5432 postgres:15
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed Database** (optional)
   ```bash
   npx prisma db seed
   ```

6. **Start Development Server**
   ```bash
   npm run start:dev
   ```

## Development

### Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code

### Database

- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create a new migration
- `npx prisma db seed` - Seed database with sample data
- `npx prisma generate` - Regenerate Prisma Client

### Sample Users (after seeding)

**Patients:**
- patient1@test.com / password
- patient2@test.com / password
- patient3@test.com / password

**Provider:**
- provider@test.com / password

**Mentor:**
- mentor@test.com / password

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/api
- **API Base URL**: http://localhost:3000

### Key Endpoints

#### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user

#### Patients
- `GET /patients` - List all patients
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create new patient
- `PATCH /patients/:id` - Update patient

#### Medications
- `GET /medications` - List medications
- `POST /medications` - Add medication
- `DELETE /medications/:id` - Remove medication

#### AI Features
- `POST /ai/medication-suggestions` - Get AI medication safety analysis
- `POST /ai/soap-note` - Generate SOAP note
- `POST /ai/next-question` - Get next best question

#### Scheduling
- `POST /scheduling/create-meeting` - Create Google Meet appointment
- `GET /scheduling/appointments/:userId` - Get user appointments

#### Gamification
- `GET /gamification/achievements/:patientId` - Get patient achievements
- `POST /gamification/track-event` - Track gamification event

## Architecture

### Technology Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **AI**: Google Gemini (Vertex AI)
- **Scheduling**: Google Calendar API
- **Payments**: Stripe
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Swagger/OpenAPI

### Project Structure

```
backend/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── patients/        # Patient management
│   │   ├── medications/     # Medication tracking
│   │   ├── ai/              # AI integrations (Gemini)
│   │   ├── scheduling/      # Appointments & Google Meet
│   │   ├── gamification/    # Achievements & events
│   │   └── billing/         # E/M code calculation
│   ├── common/              # Shared utilities
│   │   ├── audit/           # HIPAA audit logging
│   │   ├── filters/         # Exception filters
│   │   └── middleware/      # Request logging, etc.
│   └── config/              # Configuration
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed data
└── test/                    # Tests
```

### HIPAA Compliance Features

✅ **Audit Logging**: All PHI access logged with 7-year retention
✅ **Encryption**: PHI encrypted at rest and in transit
✅ **Authentication**: JWT-based with secure password hashing
✅ **Rate Limiting**: Prevents brute force attacks (100 req/min)
✅ **Security Headers**: Helmet.js for secure HTTP headers
✅ **No PHI in External APIs**: Generic descriptions for calendar events
✅ **Session Timeout**: Automatic logout after inactivity

## Environment Variables

### Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/neurobridge?schema=public"
JWT_SECRET="your-secret-key"
```

### Optional (for full functionality)

```env
# AI Features
GEMINI_API_KEY="your-gemini-api-key"
VERTEX_AI_LOCATION="us-central1"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# Google Calendar/Meet
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Stripe Billing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Deployment

### Docker

```bash
# Build
docker build -t neurobridge-backend .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  neurobridge-backend
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/neurobridge-backend

# Deploy
gcloud run deploy neurobridge-backend \
  --image gcr.io/PROJECT_ID/neurobridge-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**: Ensure PostgreSQL is running
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL container
docker start neurobridge-postgres
```

### Migration Issues

**Error**: `Migration failed`

**Solution**: Reset database (development only!)
```bash
npx prisma migrate reset
npx prisma db seed
```

### Missing Prisma Client

**Error**: `Cannot find module '@prisma/client'`

**Solution**: Generate Prisma Client
```bash
npx prisma generate
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Change port in .env
```env
PORT=3001
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

Proprietary - NeuroBridge AI Mental Health Platform
