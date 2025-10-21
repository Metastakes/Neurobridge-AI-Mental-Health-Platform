# 🚀 NeuroBridge Quick Demo

Get your mental health platform running in **2 minutes**!

## One-Command Demo

```bash
./quick-demo.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Start PostgreSQL database
- ✅ Run migrations
- ✅ Seed demo data
- ✅ Start frontend + backend

---

## What You Need

1. **Node.js 18+** → [Download](https://nodejs.org/)
2. **Docker** → [Download](https://docker.com/products/docker-desktop)

---

## Step-by-Step (If Script Fails)

### 1. Install Dependencies (1 minute)
```bash
npm install
cd backend && npm install && cd ..
```

### 2. Start Database (30 seconds)
```bash
docker run -d --name neurobridge-postgres \
  -e POSTGRES_USER=neurobridge \
  -e POSTGRES_PASSWORD=neurobridge_dev_password \
  -e POSTGRES_DB=neurobridge \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Setup Database (30 seconds)
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Start Servers (instant)
```bash
npm run dev:all
```

---

## Access the Demo

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | patient@neuro.io / password |
| **Backend API** | http://localhost:3000/api | - |
| **Swagger Docs** | http://localhost:3000/api/docs | Interactive API docs |
| **Health Check** | http://localhost:3000/api/health | System status |

---

## Demo Features to Try

### 1. Login as Patient
```
Email: patient@neuro.io
Password: password
```

**What to see:**
- ✅ Points: 1250
- ✅ Achievements unlocked
- ✅ Next appointment scheduled
- ✅ Current medications
- ✅ Progress tracking

### 2. Login as Provider
```
Email: provider@neuro.io
Password: password
```

**What to test:**
- ✅ View patient caseload
- ✅ Click on a patient
- ✅ Add a medication
- ✅ Click "AI Analyze" (needs GEMINI_API_KEY)
- ✅ View case notes
- ✅ Generate SOAP note

### 3. Test API with Swagger
Go to: http://localhost:3000/api/docs

**Try these:**
1. **POST /api/auth/login** - Get auth token
2. **GET /api/patients/{id}** - Get patient data
3. **POST /api/medications** - Add medication
4. **GET /api/health** - Check system health

---

## Test AI Features (Optional)

### Get Gemini API Key (Free)
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Copy your key

### Add to Backend
```bash
# Edit backend/.env
GEMINI_API_KEY=your-key-here
```

### Restart Backend
```bash
# Press Ctrl+C
# Then run again:
npm run dev:all
```

### Test AI
1. Login as Provider
2. Select patient "Alex Johnson"
3. Click "Add Medication"
4. Add: Bupropion 150mg, Once daily
5. Click "AI Analyze"
6. See safety score and recommendations!

---

## Quick API Test

```bash
# Health Check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@neuro.io","password":"password"}'

# Get Patient (use token from login)
curl http://localhost:3000/api/patients/PATIENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### "Port 5173 already in use"
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9
```

### "Database connection failed"
```bash
# Restart PostgreSQL
docker restart neurobridge-postgres

# Wait 3 seconds, then retry
```

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Database needs reset
```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

---

## Stop the Demo

Press **Ctrl + C** in the terminal

### Stop Database
```bash
docker stop neurobridge-postgres
```

### Restart Later
```bash
docker start neurobridge-postgres
npm run dev:all
```

---

## What's Running?

| Process | Port | What It Does |
|---------|------|--------------|
| **Vite** | 5173 | React frontend |
| **NestJS** | 3000 | Backend API |
| **PostgreSQL** | 5432 | Database |

---

## Demo Data

The seed creates:

**3 Patients:**
- Alex Johnson (MDD, GAD)
- Maria Garcia (Bipolar I)
- Chen Wei (PTSD)

**1 Provider:**
- Dr. Evelyn Reed

**1 Mentor:**
- Dr. Ben Carter

**Sample:**
- 5+ Medications
- 3+ Diagnoses
- 1 Upcoming appointment
- 3 Achievements
- Chat histories

---

## Next Steps

After demo:

1. **Explore the code**
   - `backend/src/modules/` - API endpoints
   - `components/` - React components
   - `services/api.ts` - API client

2. **Read the docs**
   - `README.md` - Full documentation
   - `SETUP_GUIDE.md` - Detailed setup
   - `backend/prisma/schema.prisma` - Database schema

3. **Deploy it**
   - `DEPLOY_PREVIEW.md` - Deployment guide
   - Vercel (frontend)
   - Cloud Run (backend)

---

## Need Help?

- 📚 Full docs: `README.md`
- 🔧 API docs: http://localhost:3000/api/docs
- 🗄️ Database: `npm run db:studio`

---

**🎉 Enjoy your demo!**
