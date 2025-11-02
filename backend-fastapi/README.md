# NeuroBridge FastAPI Backend

HIPAA-compliant telepsychiatry platform backend with all GUARANTEES enforced.

## Features

### GUARANTEES Enforcement

All platform guarantees are enforced at multiple levels:

1. **Payment Method Required**: Database validation + API enforcement
2. **No-Show Fees ≥ $50**: Database constraint + rules engine enforcement
3. **Pre-Session Check-ins**: 3-question micro-check-ins due 7 days before visit
4. **Medication Education**: Quiz + acknowledgment required before prescribing
5. **HIPAA-Safe SMS**: PHI filtering prevents sensitive data in SMS body
6. **Referrals Across Scopes**: Therapist → PMHNP/Psychiatrist → FNP validation
7. **Provider Earnings Dashboard**: Optimized queries with cash vs insurance tracking
8. **Admin Fees Disabled**: Policy rules engine defaults to disabled

### Fixes Applied

All 15 audit fixes from code review have been pre-applied:

- **Critical Fixes**: Relationship corrections, audit middleware, N+1 query optimization
- **Performance**: 7 composite database indexes
- **Validation**: Password strength, phone normalization, date/time checks
- **Security**: Rate limiting, SQL injection prevention
- **Error Handling**: Stripe error handling with user-friendly messages

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy 2.0**: ORM with type safety
- **Alembic**: Database migrations
- **PostgreSQL**: Primary database
- **Redis**: Caching and Celery broker
- **Celery**: Background task processing
- **Stripe**: Payment processing
- **Twilio**: SMS notifications
- **Pydantic**: Data validation

## Setup

### 1. Install Dependencies

```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual configuration
```

**Important**: Change `SECRET_KEY` in production:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb neurobridge

# Run migrations
alembic upgrade head
```

### 4. Start Services

#### Start FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

#### Start Celery Worker
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

#### Start Celery Beat (Scheduler)
```bash
celery -A app.tasks.celery_app beat --loglevel=info
```

## API Documentation

Once running, access interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend-fastapi/
├── app/
│   ├── api/              # API route handlers
│   │   └── v1/           # API version 1
│   │       ├── auth.py
│   │       ├── appointments.py
│   │       ├── earnings.py
│   │       ├── payments.py
│   │       ├── pre_session.py
│   │       ├── medication.py
│   │       └── referrals.py
│   ├── core/             # Core configuration
│   │   ├── config.py     # Environment settings
│   │   └── security.py   # JWT, password hashing
│   ├── db/               # Database setup
│   │   ├── base.py
│   │   ├── session.py
│   │   └── repository.py
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py
│   │   ├── provider.py
│   │   ├── patient.py
│   │   ├── appointment.py
│   │   ├── earnings_ledger.py
│   │   └── ...
│   ├── schemas/          # Pydantic schemas
│   │   ├── auth.py
│   │   ├── appointment.py
│   │   ├── earnings.py
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── payment.py
│   │   ├── sms.py
│   │   ├── encryption.py
│   │   ├── hipaa_logger.py
│   │   └── billing/      # Billing rules
│   ├── middleware/       # FastAPI middleware
│   │   ├── audit.py      # HIPAA audit logging
│   │   └── rate_limit.py # DDoS protection
│   ├── tasks/            # Celery background tasks
│   │   ├── no_show_tasks.py
│   │   └── reminder_tasks.py
│   └── main.py           # Application entry point
├── alembic/              # Database migrations
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_add_performance_indexes.py
├── requirements.txt
├── alembic.ini
├── .env.example
└── README.md
```

## Database Schema

Key tables:
- **users**: Base user accounts (patient/provider/admin)
- **providers**: Provider profiles with billing settings
- **patients**: Patient profiles with payment methods
- **appointments**: Scheduled/completed sessions
- **earnings_ledger**: Provider earnings tracking
- **pre_session_tasks**: 3-question check-ins
- **medication_education**: Medication modules + quizzes
- **referrals**: Cross-scope provider referrals
- **policy_rules**: State-specific billing rules
- **audit_logs**: HIPAA-compliant access logs

## Background Tasks

### Scheduled Tasks (Celery Beat)

1. **Process No-Shows** (every 15 minutes)
   - Identifies missed appointments
   - Charges no-show fees (≥$50)
   - Records in earnings ledger

2. **Appointment Reminders** (daily at 9 AM)
   - Sends HIPAA-safe SMS to patients
   - 24-hour advance notice

3. **Pre-Session Reminders** (daily at 10 AM)
   - Reminds patients to complete check-ins
   - Marks overdue tasks

## Security

### HIPAA Compliance

- **PHI Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: All PHI access logged (who, what, when, where, why)
- **SMS Safety**: PHI filtering prevents exposure in messages
- **Access Control**: Role-based permissions (RBAC)
- **Rate Limiting**: 100 requests/minute per IP

### Authentication

- JWT Bearer tokens
- 7-day expiration
- Bcrypt password hashing

## Testing

```bash
# Run tests (when implemented)
pytest

# Check code coverage
pytest --cov=app

# Lint code
black app/
flake8 app/
```

## Deployment

### Production Checklist

- [ ] Change SECRET_KEY to strong random value
- [ ] Set DEBUG=false
- [ ] Configure production DATABASE_URL
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure backup strategy
- [ ] Review ALLOWED_ORIGINS
- [ ] Set up log aggregation
- [ ] Configure Redis persistence
- [ ] Review rate limiting settings

### Environment Variables

See `.env.example` for all required configuration.

## Documentation

- **FIXES_APPLIED.md**: Detailed list of all 15 fixes applied
- **API Docs**: http://localhost:8000/docs

## Support

For issues or questions, contact the development team.
