# 🚀 NeuroBridge - Getting Started Guide

Welcome! You're about to build a real-time AI clinical assistant for PMHNP students.

This guide will get you from **zero to running locally** in about 30 minutes.

---

## 📋 What You're Building

NeuroBridge captures audio from telehealth sessions, transcribes it in real-time, and provides AI suggestions as you talk to patients. Zero PHI storage, HIPAA-compliant.

**Tech Stack**:
- Frontend: Next.js 14 + TypeScript
- Backend: FastAPI + Python
- Extension: Chrome Manifest V3
- Database: Supabase (PostgreSQL)
- AI: Google Gemini + Speech-to-Text

---

## ✅ Prerequisites

Before starting, make sure you have:

### Required:
- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Python 3.11+ installed ([Download](https://python.org/))
- [ ] Git installed
- [ ] Chrome browser
- [ ] Code editor (VS Code recommended)

### Accounts (all have free tiers):
- [ ] Supabase account ([Sign up](https://supabase.com/))
- [ ] Google Cloud account ([Sign up](https://cloud.google.com/))
- [ ] Resend account ([Sign up](https://resend.com/))

### Time:
- Setup: ~30 minutes
- Week 1 development: ~10-15 hours

---

## 🎯 Quick Start (5 Steps)

### Step 1: Clone & Navigate

```bash
cd neurobridge
# You're now in the project root
```

### Step 2: Set Up Supabase (5 min)

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Wait for it to provision (~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `database/schema.sql`
6. Paste and click **Run**
7. Go to **Project Settings** → **API**
8. Copy:
   - Project URL
   - `anon` public key

### Step 3: Set Up Google Cloud (10 min)

#### A. Enable Speech-to-Text API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Cloud Speech-to-Text API**
4. Enable **Generative AI API** (for Gemini)

#### B. Create Service Account:
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it `neurobridge-service`
4. Grant role: **Cloud Speech Client**
5. Click **Done**
6. Click on the service account
7. Go to **Keys** tab
8. Click **Add Key** → **Create new key** → **JSON**
9. Save the JSON file to your computer

#### C. Get Gemini API Key:
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **Get API Key**
3. Copy the key

### Step 4: Configure Environment

#### Frontend `.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

#### Backend `.env`:

```bash
cd ../backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=8000
HOST=0.0.0.0

GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
GEMINI_API_KEY=your-gemini-api-key-here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

RESEND_API_KEY=your-resend-key-here

ALLOWED_ORIGINS=http://localhost:3000
```

### Step 5: Install & Run

#### Terminal 1 - Backend:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn app.main:socket_app --reload --port 8000
```

Backend should start at `http://localhost:8000`

#### Terminal 2 - Frontend:

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend should start at `http://localhost:3000`

#### Load Chrome Extension:

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `extension/` folder
6. Extension should appear in your toolbar

---

## ✅ Verify Setup

### 1. Check Backend:

Open `http://localhost:8000` in browser. You should see:
```json
{
  "status": "ok",
  "message": "NeuroBridge API is running",
  "version": "0.1.0"
}
```

### 2. Check Frontend:

Open `http://localhost:3000` in browser. You should see the NeuroBridge landing page.

### 3. Check Extension:

Click the extension icon. You should see a popup with "Session ID" input.

### 4. Check Database:

1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see tables: `profiles`, `session_metadata`, `user_progress`, etc.

---

## 🎓 Week 1 Checklist

Now that you're set up, here's what to build this week:

### Day 1: Auth & Dashboard (Today!)
- [ ] Test Supabase auth
- [ ] Create signup/login pages
- [ ] Build basic dashboard layout
- [ ] Add user profile page

### Day 2: Extension Testing
- [ ] Test extension loads correctly
- [ ] Join a Google Meet test call
- [ ] Click extension → verify popup works
- [ ] Check browser console for errors

### Day 3: WebSocket Connection
- [ ] Frontend connects to backend WebSocket
- [ ] Extension connects to backend
- [ ] Send test messages
- [ ] Verify messages appear in console

### Day 4: Backend Services Setup
- [ ] Test Google Speech-to-Text API (send sample audio)
- [ ] Test Gemini API (send test prompt)
- [ ] Create placeholder service responses

### Day 5: Integration Test
- [ ] End-to-end test: Extension → Backend → Frontend
- [ ] Verify data flows correctly
- [ ] Document any issues

---

## 📁 Project Structure Overview

```
neurobridge/
│
├── frontend/              # Next.js app (Port 3000)
│   ├── app/              # Pages
│   ├── components/       # React components
│   ├── lib/              # Utilities (Supabase, WebSocket)
│   └── types/            # TypeScript types
│
├── backend/              # FastAPI app (Port 8000)
│   ├── app/
│   │   ├── main.py      # Entry point + WebSocket
│   │   ├── models.py    # Pydantic models
│   │   └── services/    # AI, Speech, Drug, Email services
│   └── requirements.txt
│
├── extension/            # Chrome extension
│   ├── manifest.json    # Extension config
│   ├── background.js    # Audio capture worker
│   ├── popup.html/js    # UI controls
│   └── content.js       # Injected into telehealth pages
│
└── database/
    └── schema.sql       # Supabase schema
```

---

## 🔧 Common Issues & Solutions

### Backend won't start:

**Error**: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: Make sure virtual environment is activated
```bash
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
```

### Frontend won't start:

**Error**: `Error: Cannot find module 'next'`
**Solution**: Install dependencies
```bash
cd frontend
npm install
```

### Extension not loading:

**Error**: "Manifest file is missing or unreadable"
**Solution**: Make sure you selected the `extension/` folder, not a file

### Supabase connection error:

**Error**: `Failed to fetch`
**Solution**: Check `.env.local` has correct Supabase URL and key

### Google Cloud auth error:

**Error**: `Could not load the default credentials`
**Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` to full path of JSON file

---

## 📚 Next Steps

### Week 2: Chrome Extension
Read `AI_TOOL_PLAN.md` for detailed Week 2 tasks:
- Implement audio capture
- Stream audio to backend
- Test with Zoom and Google Meet

### Week 3: Speech-to-Text
- Set up Google Speech-to-Text streaming
- Process audio chunks
- Display transcripts in real-time

### Week 4: Gemini Integration
- Write AI prompts
- Generate suggestions
- Detect safety alerts

---

## 🆘 Getting Help

### Resources:
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Supabase Docs**: https://supabase.com/docs
- **Chrome Extensions**: https://developer.chrome.com/docs/extensions/
- **Gemini API**: https://ai.google.dev/docs

### Debug Tips:
1. Check browser console (F12)
2. Check backend terminal output
3. Check Supabase logs
4. Use `console.log()` liberally
5. Test one component at a time

---

## 🎉 You're Ready!

If you completed all 5 setup steps and verified everything works, you're ready to start Week 1 development!

**Recommended next action**:
1. Read `AI_TOOL_PLAN.md` for the full 10-week roadmap
2. Start with Day 1 tasks (Auth & Dashboard)
3. Commit your changes daily

---

## 📝 Development Workflow

```bash
# Morning routine:
1. Pull latest changes: git pull
2. Start backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:socket_app --reload
3. Start frontend: cd frontend && npm run dev
4. Open browser: http://localhost:3000

# During development:
- Make changes
- Test immediately
- Commit frequently (git add . && git commit -m "message")

# End of day:
- Push changes: git push
- Document what you built
- Plan tomorrow's tasks
```

---

**Good luck building NeuroBridge! 🚀**

*Questions? Check AI_TOOL_PLAN.md or review the code comments.*
