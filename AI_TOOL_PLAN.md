# 🧠 NeuroBridge - AI Clinical Assistant for PMHNP Students

**Real-time AI-powered session assistance for telepsychiatry training**

---

## 🎯 PRODUCT VISION

**What It Is:**
A zero-storage, HIPAA-compliant clinical assistant that provides **REAL-TIME** AI guidance during telehealth sessions.

**Key Difference from Competitors:**
- ❌ NOT post-session analysis (everyone does that)
- ✅ LIVE co-pilot DURING the session
- ✅ Real-time suggestions as you talk
- ✅ Safety alerts in the moment
- ✅ Auto-generates documentation after

**Value Proposition:**
"It's like having a clinical supervisor whispering suggestions in your ear during every session."

---

## 📋 Core Features

### For Students During Session:
1. 🎙️ **Live transcription** of telehealth sessions (via Chrome extension)
2. 💡 **AI suggestions** for next questions to ask
3. ⚠️ **Safety alerts** for critical items (SI/HI screening, risk assessment)
4. 📋 **Auto-generated SOAP notes** and CORE ELMS output
5. 🎮 **Gamified learning** with XP, badges, and streaks
6. 🔒 **Zero PHI storage** - all content deleted after session

### Student Workflow:
```
1. Open NeuroBridge web app → Start new session
2. Join telehealth call (Zoom/Meet)
3. Click Chrome extension → Start capture
4. Audio streams → AI analyzes → Shows suggestions in real-time
5. Fill MSE/Meds/Diagnoses as session progresses
6. End session → Get CORE ELMS + SOAP note
7. Email to self or copy/paste
8. ALL DATA DELETED (except metadata for gamification)
```

---

## 🏗️ Technical Architecture

### System Overview
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Chrome     │──WSS──│   Backend    │       │   Database   │
│  Extension   │       │   (FastAPI)  │       │  (Supabase)  │
│              │       │              │       │              │
│ Audio        │       │ Speech-to-   │       │ User         │
│ Capture      │       │ Text         │       │ Metadata     │
│              │       │              │       │ Only         │
└──────────────┘       │ Gemini AI    │       └──────────────┘
                       │              │
┌──────────────┐       │ In-Memory    │
│   Next.js    │──WSS──│ Session      │
│   Frontend   │       │ Storage      │
│              │       └──────────────┘
│ Real-time    │
│ Display      │
└──────────────┘
```

### Components

**1. Chrome Extension (Manifest V3)**
- Captures audio from active telehealth tab
- Streams PCM audio to backend via WebSocket
- Works with Zoom, Google Meet, Webex, Teams
- Minimal UI (start/stop button)

**2. Backend (FastAPI + Python)**
- WebSocket server for real-time audio streaming
- Google Speech-to-Text for transcription
- Gemini AI for:
  - Next question suggestions
  - Safety alert detection
  - SOAP note generation
  - CORE ELMS formatting
- Drug interaction checking (custom database)
- In-memory session storage (deleted after session)
- Email service (Resend) for sending outputs

**3. Frontend (Next.js 14 + TypeScript)**
- Real-time WebSocket connection to backend
- Minimalist Tesla-inspired UI (light/dark mode)
- Session interface:
  - Live transcript display
  - AI suggestion cards
  - MSE input (sliders/checkboxes)
  - Medication builder with interaction checks
  - Diagnosis selector (ICD-10 search)
  - Generated outputs display
- Progress dashboard (gamification)
- Zero client-side PHI storage

**4. Database (Supabase/PostgreSQL)**
- Stores ONLY metadata for gamification
- NO PHI, NO content, NO transcripts
- Schema:
  - Users (profile, subscription)
  - Sessions metadata (date, duration, completed)
  - User progress (XP, level, streaks)
  - Achievements (badges earned)

---

## 📁 Project Structure

```
neurobridge/
│
├── frontend/                  # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── session/       # Main session interface
│   │   │   │   └── page.tsx
│   │   │   └── progress/      # Stats & gamification
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── session/
│   │   │   ├── TranscriptView.tsx
│   │   │   ├── AISuggestions.tsx
│   │   │   ├── MSEInputs.tsx
│   │   │   ├── MedicationBuilder.tsx
│   │   │   └── DiagnosisSelector.tsx
│   │   ├── quiz/
│   │   │   └── PostSessionQuiz.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── websocket.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── package.json
│
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── main.py           # FastAPI app + Socket.io
│   │   ├── models.py         # Pydantic models
│   │   ├── services/
│   │   │   ├── gemini_service.py      # AI suggestions & analysis
│   │   │   ├── speech_service.py      # Google Speech-to-Text
│   │   │   ├── drug_service.py        # Drug interactions
│   │   │   ├── email_service.py       # Resend integration
│   │   │   ├── session_service.py     # In-memory session mgmt
│   │   │   └── supabase_service.py    # DB operations
│   │   ├── data/
│   │   │   ├── drugs.json            # Psych medications database
│   │   │   ├── interactions.json     # Drug interactions
│   │   │   └── icd10.json           # Mental health diagnoses
│   │   └── utils/
│   │       ├── prompts.py
│   │       └── validators.py
│   ├── requirements.txt
│   └── .env.example
│
├── extension/                 # Chrome extension
│   ├── manifest.json
│   ├── background.js          # Audio capture worker
│   ├── content.js             # Tab injection
│   ├── popup.html
│   ├── popup.js
│   └── icons/
│
└── database/
    └── schema.sql             # Supabase schema
```

---

## 🗄️ Data Storage Model

### What Gets STORED (in database):
✅ Session date
✅ Session number
✅ Duration
✅ Safety checks completed (boolean)
✅ User XP, level, streaks
✅ Badges earned
✅ Anonymous stats (no PHI)

### What NEVER Gets Stored:
❌ Patient names or identifiers
❌ Transcripts
❌ SOAP notes
❌ Medications discussed
❌ Diagnoses
❌ ANY PHI whatsoever

**All session content lives only in server memory during the session, then is DELETED.**

---

## 🔐 HIPAA Compliance Strategy

### Zero-Storage Architecture:
1. Audio streams to backend, never saved
2. Transcripts held in memory only
3. After session ends, all PHI deleted
4. Only metadata logged for gamification

### Required BAAs:
- ✅ Google Cloud (Speech-to-Text + Gemini)
- ✅ Supabase (user data only, no PHI)

### PHI Protection:
- **Audio**: Never stored, only streamed
- **Transcripts**: Auto-redacted for names/addresses/SSN/phone
- **Patient data**: No names in system, only "Patient #1", "Patient #2"
- **Encryption**: TLS 1.3 in transit, AES-256 at rest (for metadata only)
- **Access**: Row-level security (users see only their data)

### Consent:
- Patient signs telehealth consent (includes AI monitoring clause)
- Student acknowledges session is being analyzed
- No recording stored (live transcription only)

---

## 🎮 Gamification System

### XP Awards:
- Complete session: **+25 XP**
- Safety checks completed: **+10 XP**
- Correct post-session quiz: **+10 XP**
- Daily login: **+5 XP**

### Levels:
- Level up every 100 XP
- Formula: XP needed = current_level × 100

### Badges:
- 🎯 **First Session** - Complete your first session
- 📚 **Dedicated Learner** - 10 sessions completed
- 👨‍⚕️ **Veteran Clinician** - 50 sessions completed
- 🏆 **Master Practitioner** - 100 sessions completed
- 🔥 **Week Warrior** - 7-day streak
- ⚡ **Month Master** - 30-day streak
- 🌟 **Level Milestones** - Reach levels 5, 10, 20

### Display:
- Subtle, bottom-right corner only
- No interruptions during session
- Award pop-ups after session ends

---

## 💊 Drug Interaction Database

**DIY Approach** (don't pay $150/month to DrugBank!)

### Files:
1. `backend/app/data/drugs.json` - Top 200 psych medications
2. `backend/app/data/interactions.json` - Major interactions only

### Drug Entry Format:
```json
{
  "id": "sertraline",
  "name": "Sertraline",
  "brand_names": ["Zoloft"],
  "class": "SSRI",
  "typical_dose_range": "25-200mg daily",
  "starting_dose": "25-50mg daily",
  "max_dose": "200mg daily",
  "common_uses": ["Depression", "Anxiety", "OCD", "PTSD"],
  "warnings": ["Serotonin syndrome risk"],
  "interactions": ["tramadol", "linezolid", "mao_inhibitors"]
}
```

### Interaction Entry Format:
```json
{
  "drug1": "sertraline",
  "drug2": "tramadol",
  "severity": "major",
  "description": "Increased risk of serotonin syndrome",
  "recommendation": "Avoid combination. Consider alternative analgesic."
}
```

### To Build:
1. Start with top 200 psych meds (SSRIs, SNRIs, antipsychotics, mood stabilizers, stimulants)
2. Focus on major interactions (contraindicated + high severity)
3. Sources: FDA labels, Micromedex, UpToDate, Lexicomp
4. Expand over time based on usage

---

## 🚀 10-Week Implementation Plan

### **Week 1: Foundation & Setup**
**Goal**: Get all services running locally

Tasks:
- [ ] Set up Supabase project & run schema
- [ ] Create Next.js project with TypeScript
- [ ] Set up FastAPI backend
- [ ] Get Google Cloud credentials (Speech-to-Text + Gemini)
- [ ] Get Resend API key
- [ ] Test all API connections

**Deliverable**: All services can talk to each other

---

### **Week 2: Chrome Extension**
**Goal**: Capture audio from telehealth tabs

Tasks:
- [ ] Create Manifest V3 extension structure
- [ ] Implement audio capture from active tab
- [ ] Test with Zoom
- [ ] Test with Google Meet
- [ ] Implement WebSocket connection to backend
- [ ] Add start/stop controls

**Deliverable**: Extension captures audio and sends to backend

---

### **Week 3: Backend Audio Pipeline**
**Goal**: Receive audio, transcribe, store in memory

Tasks:
- [ ] Implement WebSocket server (Socket.io)
- [ ] Integrate Google Speech-to-Text
- [ ] Create session service (in-memory storage)
- [ ] Implement session lifecycle (start/end/delete)
- [ ] Test transcription accuracy

**Deliverable**: Backend transcribes audio in real-time

---

### **Week 4: Gemini AI Integration**
**Goal**: Generate suggestions and safety alerts

Tasks:
- [ ] Write prompts for:
  - Next question suggestions
  - Safety alert detection (SI/HI)
  - Clinical reasoning feedback
- [ ] Implement gemini_service.py
- [ ] Test suggestion quality
- [ ] Refine prompts
- [ ] Add suggestion caching (avoid redundancy)

**Deliverable**: AI generates helpful real-time suggestions

---

### **Week 5: Frontend Session Interface**
**Goal**: Build the main session UI

Tasks:
- [ ] Create session page layout
- [ ] Implement WebSocket connection
- [ ] Build transcript display component
- [ ] Build AI suggestions component
- [ ] Add MSE input sliders/checkboxes
- [ ] Implement medication builder
- [ ] Add diagnosis selector (ICD-10 search)
- [ ] Test real-time updates

**Deliverable**: Functional session interface

---

### **Week 6: SOAP Note Generation**
**Goal**: Auto-generate clinical documentation

Tasks:
- [ ] Write prompt for SOAP note generation
- [ ] Write prompt for CORE ELMS formatting
- [ ] Implement de-identification logic
- [ ] Test output quality
- [ ] Add copy-to-clipboard function
- [ ] Implement email functionality (Resend)

**Deliverable**: Generate and export documentation

---

### **Week 7: Drug Interactions & Safety**
**Goal**: Build drug database and interaction checker

Tasks:
- [ ] Create drugs.json (top 50 meds to start)
- [ ] Create interactions.json (major interactions)
- [ ] Implement drug_service.py
- [ ] Add interaction warnings to UI
- [ ] Test with common combinations
- [ ] Expand database to 200 meds

**Deliverable**: Working drug interaction checker

---

### **Week 8: Gamification & Progress**
**Goal**: Implement XP, levels, badges, streaks

Tasks:
- [ ] Create achievements table in Supabase
- [ ] Implement XP calculation logic
- [ ] Build progress dashboard
- [ ] Create badge system
- [ ] Implement streak tracking
- [ ] Design badge icons
- [ ] Add level-up animations

**Deliverable**: Gamification system working

---

### **Week 9: Polish & Testing**
**Goal**: Make it production-ready

Tasks:
- [ ] Build landing page
- [ ] Add onboarding tutorial
- [ ] Implement dark mode
- [ ] Add loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Security audit

**Deliverable**: Polished, bug-free app

---

### **Week 10: Deploy & Launch**
**Goal**: Go live!

Tasks:
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Publish Chrome extension (Chrome Web Store)
- [ ] Create demo video
- [ ] Write launch blog post
- [ ] Soft launch to 10 beta users
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Public launch!

**Deliverable**: NeuroBridge is LIVE! 🚀

---

## 📊 Success Metrics

### Product Metrics:
- **Active users**: 50+ by Week 12
- **Sessions per user**: 5+ per week
- **Session completion rate**: >80%
- **AI suggestion helpfulness**: >70% (user rated)
- **Streak retention**: >30% at Day 7

### Technical Metrics:
- **Transcription accuracy**: >90%
- **Response time**: <2 seconds for suggestions
- **Uptime**: 99.5%+
- **Memory leaks**: 0 (critical for in-memory storage)

### Business Metrics:
- **Free tier**: Unlimited (for now, to get adoption)
- **Future revenue**: $29/month for advanced features
- **Target**: 500 users by Month 6

---

## 🛠️ Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js 14 + TypeScript | Modern, fast, great DX |
| Backend | FastAPI + Python | Fast, async, great for AI/ML |
| Database | Supabase (PostgreSQL) | Free tier, RLS, easy auth |
| Real-time | WebSocket (Socket.io) | Low latency for streaming |
| Speech | Google Speech-to-Text | Best accuracy for medical |
| AI | Gemini 1.5 Pro | Long context, good reasoning |
| Email | Resend | Simple, reliable |
| Hosting | Vercel + Railway | Easy deploy, free tiers |

**Total Monthly Cost**: $0-30 (first 6 months)

---

## 🚦 Ready to Start?

### Prerequisites:
1. Supabase account (free)
2. Google Cloud account (Speech-to-Text + Gemini)
3. Resend account (email)
4. Node.js 18+
5. Python 3.11+

### Day 1 Tasks:
1. Set up Supabase project
2. Run database schema
3. Create Next.js project
4. Create FastAPI project
5. Get API keys for all services

**Let's build Week 1!** 🚀

---

**Built by Kevin Lazar for PMHNP students everywhere**

*Making mental health care less confusing, one session at a time.*
