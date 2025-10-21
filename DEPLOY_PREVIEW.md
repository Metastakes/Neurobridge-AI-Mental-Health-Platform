# Deploying NeuroBridge to Vercel (Frontend Preview)

## Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/neurobridge)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### Option 3: GitHub Integration

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel auto-detects Vite
5. Click "Deploy"

---

## Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend.run.app/api
```

---

## Backend Deployment (Google Cloud Run)

### Deploy Backend to Cloud Run

```bash
cd backend

# Build Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/neurobridge-backend

# Deploy to Cloud Run
gcloud run deploy neurobridge-backend \
  --image gcr.io/YOUR_PROJECT_ID/neurobridge-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://...,GEMINI_API_KEY=your-key,JWT_SECRET=your-secret"
```

You'll get a URL like: `https://neurobridge-backend-xxx.run.app`

---

## Database (Neon - Free Tier)

1. Go to https://neon.tech
2. Create a new project: "NeuroBridge"
3. Copy the connection string
4. Update `DATABASE_URL` in Cloud Run environment variables

---

## Full Stack Preview in 5 Minutes

### Step 1: Deploy Database (Neon)
```bash
# Sign up at neon.tech (free)
# Create project → Copy connection string
```

### Step 2: Deploy Backend (Cloud Run)
```bash
cd backend

# Update .env with Neon DATABASE_URL
# Then deploy
gcloud run deploy neurobridge-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 3: Deploy Frontend (Vercel)
```bash
# Update .env.local with your Cloud Run URL
echo "VITE_API_URL=https://your-backend.run.app/api" > .env.local

# Deploy
vercel --prod
```

### Step 4: Run Migrations
```bash
# Connect to Neon database
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
```

---

## Alternative: Railway (Easier Full-Stack Deploy)

Railway deploys both frontend + backend + database:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy
railway up
```

Railway will:
- ✅ Auto-detect NestJS backend
- ✅ Auto-detect Vite frontend
- ✅ Provision PostgreSQL database
- ✅ Set up environment variables
- ✅ Give you live URLs

---

## Preview URLs

After deployment, you'll get:

- **Frontend**: `https://neurobridge.vercel.app`
- **Backend API**: `https://neurobridge-backend-xxx.run.app/api`
- **Swagger Docs**: `https://neurobridge-backend-xxx.run.app/api/docs`

---

## Testing Your Preview

```bash
# Test health check
curl https://your-backend.run.app/api/health

# Test login
curl -X POST https://your-backend.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@neuro.io","password":"password"}'
```

---

## Share Your Preview

Once deployed, share:
- 🌐 **Live App**: https://your-app.vercel.app
- 📚 **API Docs**: https://your-backend.run.app/api/docs
- 💾 **GitHub Repo**: https://github.com/your-username/neurobridge

---

## Need Help?

**Quick Deploy (No Config):**
Use Railway - it handles everything automatically.

**Full Control:**
Use Vercel (frontend) + Cloud Run (backend) + Neon (database)
