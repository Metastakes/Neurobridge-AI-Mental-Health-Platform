# NeuroBridge AI - Quick Setup Guide

Get your mental health platform running in **5 minutes**!

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Gemini API Key** ([Get Free Key](https://ai.google.dev/))

---

## Automated Setup (Recommended)

```bash
# Run the automated setup script
./setup.sh

# Or using npm
npm run setup
```

The script will:
- ✅ Install all dependencies (frontend + backend)
- ✅ Create .env files
- ✅ Start Docker services (optional)

---

## Manual Setup

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Configure Environment

**Backend `.env`** (backend/.env):
```env
DATABASE_URL="postgresql://neurobridge:neurobridge_dev_password@localhost:5432/neurobridge"
JWT_SECRET="your-secret-key-here"
GEMINI_API_KEY="your-gemini-api-key"  # Get from ai.google.dev
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Frontend `.env.local`**:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Database

```bash
docker run -d --name neurobridge-postgres \
  -e POSTGRES_USER=neurobridge \
  -e POSTGRES_PASSWORD=neurobridge_dev_password \
  -e POSTGRES_DB=neurobridge \
  -p 5432:5432 \
  postgres:15-alpine
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

You should see:
```
🎉 Database seeded successfully!

📧 Demo Login Credentials:
   Patient: patient@neuro.io / password
   Provider: provider@neuro.io / password
   Mentor: mentor@neuro.io / password
```

### 5. Start Servers

**Option A: Start Both** (Recommended)
```bash
npm run dev:all
```

**Option B: Start Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
npm run dev
```

---

## Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api |
| **Swagger Docs** | http://localhost:3000/api/docs |
| **Health Check** | http://localhost:3000/api/health |
| **Prisma Studio** | Run `npm run db:studio` |

---

## Test the API

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@neuro.io","password":"password"}'
```

### 3. Get Patient Data

```bash
# Replace YOUR_TOKEN with token from login response
curl http://localhost:3000/api/patients/PATIENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Patient** | patient@neuro.io | password |
| **Provider** | provider@neuro.io | password |
| **Mentor** | mentor@neuro.io | password |

---

## Troubleshooting

### "Database connection failed"

**Check PostgreSQL is running:**
```bash
docker ps | grep postgres
```

**Restart PostgreSQL:**
```bash
docker restart neurobridge-postgres
```

### "Prisma Client not generated"

```bash
cd backend
npx prisma generate
```

### "Port 3000 already in use"

**Find and kill the process:**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "GEMINI_API_KEY not set"

1. Go to https://ai.google.dev/
2. Click "Get API Key in Google AI Studio"
3. Copy your key
4. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your-key-here
   ```
5. Restart backend

---

## What's Next?

### Test AI Features

1. **Login as Provider** (provider@neuro.io / password)
2. **Select a Patient** from the caseload
3. **Add a Medication** and click "AI Analyze"
4. **View AI Suggestions** with safety alerts

### Test Scheduling

1. **Create an appointment** (requires Google Calendar setup)
2. **Get Google Meet link** automatically
3. **View in calendar**

### Test Gamification

1. **Login as Patient** (patient@neuro.io / password)
2. **Complete actions** to earn points
3. **Unlock achievements**
4. **Redeem rewards**

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + backend |
| `npm run dev` | Frontend only |
| `npm run dev:backend` | Backend only |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `docker-compose up` | Start all services with Docker |
| `docker-compose logs -f` | View logs |

---

## Docker Compose (Alternative)

```bash
# Start everything (PostgreSQL + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

## Production Deployment

See [README.md](./README.md#-deployment) for:
- Google Cloud Run deployment
- Vercel frontend deployment
- Neon/Supabase database setup
- Environment variable configuration

---

## Need Help?

- 📚 **Full Documentation**: [README.md](./README.md)
- 🔧 **API Reference**: http://localhost:3000/api/docs
- 🗄️ **Database Schema**: `backend/prisma/schema.prisma`
- 💬 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**🎉 You're all set! Start building your mental health platform!**
