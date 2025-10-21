# Preview NeuroBridge on Google AI Studio

## What is Google AI Studio?

Google AI Studio is for **testing AI prompts**, not hosting full applications. However, I'll show you how to:

1. **Test your AI features** in AI Studio
2. **Deploy a live preview** you can share
3. **Create a demo** environment

---

## Option 1: Test AI Features in Google AI Studio

### Step 1: Open AI Studio
Go to: https://aistudio.google.com/

### Step 2: Create a New Prompt

Click "Create new prompt" and paste this:

```
You are NeuroBridge-Gemini, an AI clinical decision support system for psychiatric medication management.

## Patient Context
Age: 28
Current Medications:
- Sertraline 100mg (SSRI)
- Buspirone 15mg (Anxiolytic)

Diagnoses:
- Major Depressive Disorder (F32.9)

## Proposed Medication
Bupropion 150mg (NDRI)

Analyze safety and provide:
1. Safety alerts
2. Drug interactions
3. Next best clinical questions
4. Treatment recommendations

Respond in JSON format.
```

### Step 3: Click "Run"

You'll see the AI response immediately! This lets you test and refine your prompts before deploying.

### Step 4: Copy Refined Prompts to Your Code

Once you're happy with the prompt, copy it to:
`backend/src/modules/ai/gemini.service.ts`

---

## Option 2: Deploy Live Preview (Recommended)

### 🚀 Fastest: Deploy to Vercel (2 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then you get a live URL:
# https://neurobridge-xyz.vercel.app
```

**Share this URL with anyone!**

### 🐳 Alternative: Deploy to Railway (5 minutes)

Railway deploys your entire stack (frontend + backend + database):

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

Railway gives you:
- ✅ Frontend URL
- ✅ Backend API URL
- ✅ PostgreSQL database
- ✅ All environment variables set

---

## Option 3: Create Local Demo (Share via Tunneling)

If you want to demo locally without deploying:

### Using ngrok (Instant Share)

```bash
# Start your app locally
npm run dev:all

# In another terminal, install ngrok
npm install -g ngrok

# Create public URL for frontend
ngrok http 5173

# You get a URL like: https://abc123.ngrok.io
# Share this URL - anyone can access your local app!
```

### Using Cloudflare Tunnel (Free, Persistent)

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:5173

# Get shareable URL: https://xyz.trycloudflare.com
```

---

## Option 4: Create AI Studio Demo Project

### Step 1: Create Gemini API Project

1. Go to https://aistudio.google.com/
2. Click "Get API key"
3. Create a new project: "NeuroBridge Demo"
4. Copy your API key

### Step 2: Test Prompts

Use `ai-studio-examples.ts` prompts in AI Studio to test:
- Medication safety analysis
- SOAP note generation
- Clinical decision support

### Step 3: Share Results

Screenshot your AI responses and share:
- Show the safety analysis
- Show the SOAP notes generated
- Demo the clinical suggestions

---

## 🎥 Create a Video Demo

### Record a Walkthrough

1. **Start your app**: `npm run dev:all`
2. **Use screen recording**:
   - Mac: Cmd + Shift + 5
   - Windows: Win + G
   - Loom.com (free, easy sharing)

3. **Demo flow**:
   - Login as provider
   - Select patient
   - Add medication
   - Click "AI Analyze"
   - Show AI suggestions

4. **Share video**: Upload to YouTube, Loom, or Google Drive

---

## 📊 Create Interactive Demo

### Use StackBlitz (Live Code Demo)

1. Go to https://stackblitz.com/
2. Create new Vite + React project
3. Copy your frontend code
4. Point to your deployed backend API
5. Get shareable link: `https://stackblitz.com/edit/neurobridge`

---

## 🌐 What I Recommend

For **Google AI Studio specifically**, you want to:

### 1. Test AI Prompts (AI Studio)
- Use the prompts in `ai-studio-examples.ts`
- Test medication safety analysis
- Refine the JSON schema
- Screenshot results

### 2. Deploy Full App (Vercel + Cloud Run)
```bash
# Deploy frontend
vercel --prod

# Deploy backend
gcloud run deploy neurobridge-backend --source ./backend
```

### 3. Share Live URLs
- Frontend: `https://neurobridge.vercel.app`
- Backend API: `https://backend-xyz.run.app/api`
- Swagger: `https://backend-xyz.run.app/api/docs`

---

## 🎯 Quickest Path to Share

**If you just want to show someone NOW:**

```bash
# Option 1: Local + ngrok (30 seconds)
npm run dev:all
# In new terminal:
ngrok http 5173
# Share the ngrok URL

# Option 2: Deploy to Vercel (2 minutes)
vercel
# Share the vercel URL
```

---

## Need Help Deploying?

Tell me which option you prefer:
1. **Test in AI Studio** - I'll create ready-to-paste prompts
2. **Deploy to Vercel** - I'll guide you through deployment
3. **Use ngrok** - I'll help you tunnel your local app
4. **Deploy full stack** - I'll create deployment scripts

**Which would you like to do?**
