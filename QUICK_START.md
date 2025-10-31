# 🚀 NeuroBridge - Quick Start Guide

## Get Running in 5 Minutes

### Prerequisites
- Docker Desktop installed
- 8GB RAM minimum
- 10GB free disk space

### Step 1: Clone & Setup (1 minute)

```bash
cd /path/to/Neurobridge-AI-Mental-Health-Platform

# Run setup script
./setup.sh
```

### Step 2: Configure API Keys (2 minutes)

Edit `.env` file and add your keys:

```bash
# REQUIRED for basic functionality
STRIPE_API_KEY=sk_test_your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key

# OPTIONAL (can add later)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Where to get keys:**
- Stripe: https://dashboard.stripe.com/test/apikeys (free test account)
- Twilio: https://www.twilio.com/try-twilio (free trial)

### Step 3: Start Platform (2 minutes)

```bash
# Start all services
docker-compose up

# Or run in background:
docker-compose up -d
```

**Wait for**:
```
✅ postgres     | database system is ready to accept connections
✅ backend      | Application startup complete
✅ frontend     | Ready in 3.2s
```

### Step 4: Access Platform

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 5: Create First Account

1. Go to http://localhost:3000
2. Click "Get Started"
3. Choose "I'm a Provider" or "I'm a Patient"
4. Complete registration
5. You're in! 🎉

---

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove data (fresh start)
docker-compose down -v

# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed initial data
docker-compose exec backend python seed_data.py

# Access database
docker-compose exec postgres psql -U neurobridge -d neurobridge

# Access backend shell
docker-compose exec backend bash
```

---

## Troubleshooting

### Port Already in Use

If you see "port is already allocated":

```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Frontend Not Loading

```bash
# Check logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up frontend
```

### Backend API Errors

```bash
# Check logs
docker-compose logs backend

# Verify database migrations
docker-compose exec backend alembic current
docker-compose exec backend alembic upgrade head

# Restart backend
docker-compose restart backend
```

---

## Development Workflow

### Making Backend Changes

```bash
# Backend auto-reloads on file changes
# Just edit files in backend-fastapi/

# To run migrations:
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head
```

### Making Frontend Changes

```bash
# Frontend auto-reloads on file changes
# Just edit files in frontend-nextjs/

# To rebuild:
docker-compose restart frontend
```

### Adding New Packages

**Backend:**
```bash
# Add to requirements.txt
echo "new-package==1.0.0" >> backend-fastapi/requirements.txt

# Rebuild
docker-compose build backend
docker-compose up backend
```

**Frontend:**
```bash
# Access frontend container
docker-compose exec frontend sh

# Install package
npm install new-package

# Exit and restart
docker-compose restart frontend
```

---

## Next Steps

After getting it running:

1. ✅ Review [DEVELOPMENT_MASTER_PLAN.md](./DEVELOPMENT_MASTER_PLAN.md)
2. ✅ Complete Phase 2: Provider Onboarding
3. ✅ Complete Phase 3: Patient Scheduling
4. ✅ Add video sessions (Phase 4)
5. ✅ Deploy to production (Phase 8)

---

## Production Deployment

When ready for production:

1. Change all passwords in `.env`
2. Use production API keys (Stripe, Twilio, etc.)
3. Set `DEBUG=false`
4. Deploy to AWS/DigitalOcean (see Phase 8)

---

## Support

- 📚 Full docs: [DEVELOPMENT_MASTER_PLAN.md](./DEVELOPMENT_MASTER_PLAN.md)
- 🐛 Issues: Check logs first
- 💬 Questions: Review API docs at http://localhost:8000/docs

**You're now running a production-ready mental health platform!** 🏥
