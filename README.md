# NeuroBridge AI Mental Health Platform

<div align="center">

**An AI-powered mental health platform connecting providers with mentorship while engaging patients through gamified care**

[![License](https://img.shields.io/badge/license-Private-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Branch Strategy](#branch-strategy)
- [Technology Stack](#technology-stack)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)

---

## 🎯 Overview

NeuroBridge AI is a comprehensive mental health platform that leverages artificial intelligence to:

- **Connect** new mental health providers with experienced mentors
- **Engage** patients through gamified therapeutic experiences
- **Track** patient progress and outcomes with real-time AI insights
- **Facilitate** telehealth sessions with integrated video capabilities
- **Manage** crisis situations with automated notification systems
- **Educate** patients about medications with rewards marketplace

The platform features three distinct interfaces:
1. **Patient App**: Gamified care experience with progress tracking
2. **Provider Dashboard**: Real-time insights and patient management
3. **Mentor Portal**: Mentorship tools and provider guidance

---

## ✨ Key Features

### For Patients
- 🎮 **Gamified Assessments**: Engaging, beautiful UI for mental health assessments
- 📊 **Progress Tracking**: Visual dashboards showing treatment progress
- 💊 **Medication Education**: Interactive learning with rewards system
- 📹 **Telehealth Sessions**: Secure video consultations with providers
- 📅 **Easy Scheduling**: Book appointments with integrated calendar

### For Providers
- 🤖 **AI-Powered Insights**: Real-time analysis and recommendations
- 👥 **Patient Management**: Comprehensive dashboard for patient care
- 📈 **Outcomes Measurement**: Track treatment effectiveness
- 🚨 **Crisis Alerts**: Automated notifications for urgent situations
- 📝 **Session Notes**: AI-assisted documentation

### For Mentors
- 🎓 **Provider Onboarding**: Guide new providers through the platform
- 📚 **Resource Library**: Best practices and training materials
- 💬 **Communication Tools**: Direct messaging and consultation scheduling

---

## 📚 Documentation

We've created comprehensive guides to help you navigate the project:

| Document | Purpose | Best For |
|----------|---------|----------|
| 📘 [README.md](./README.md) | Project overview and main documentation | Everyone - start here |
| 🌳 [BRANCHES.md](./BRANCHES.md) | Detailed branch structure and strategy | Understanding development workflow |
| 🎓 [QUICK_START_FOR_BEGINNERS.md](./QUICK_START_FOR_BEGINNERS.md) | Simple setup guide with troubleshooting | New developers and beginners |
| 🏷️ [REPOSITORY_RENAME_GUIDE.md](./REPOSITORY_RENAME_GUIDE.md) | Instructions for renaming the repository | Repository administrators |

**New to the project?** Start with [QUICK_START_FOR_BEGINNERS.md](./QUICK_START_FOR_BEGINNERS.md) - it's designed specifically for you!

---

## 📁 Project Structure

```
neurobridge-ai-mental-health-platform/
├── components/
│   ├── patient/          # Patient-facing UI components
│   ├── provider/         # Provider dashboard components
│   └── mentor/           # Mentor portal components
├── hooks/                # Custom React hooks
├── utils/                # Utility functions and helpers
├── App.tsx               # Main application component
├── PatientApp.tsx        # Patient application entry
├── types.ts              # TypeScript type definitions
├── userData.ts           # User data management
├── medicationData.ts     # Medication database
├── diagnosticToolsData.ts # Assessment tools data
├── legalDocumentsData.ts # Legal and compliance docs
├── googleApi.ts          # Google API integration
├── GoogleApiContext.tsx  # API context provider
├── ThemeContext.tsx      # Theme management
└── config.ts             # Application configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Metastakes/Neurobridge-AI-Mental-Health-Platform.git
   cd Neurobridge-AI-Mental-Health-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🌳 Branch Strategy

This repository uses a **feature branch workflow** with AI-assisted development. See [BRANCHES.md](./BRANCHES.md) for detailed documentation.

### Quick Branch Overview:

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Production-ready baseline |
| `claude/fix-duplicate-sessions-*` | 🏆 **Most Complete** | Full feature set with Phase 5 |
| `claude/merge-sessions-*` | Mid-stage | Notifications & crisis features |
| `claude/fetch-latest-session-*` | Early stage | Session management |
| `claude/resume-and-verify-*` | Active | Current development branch |

**📘 For beginners**: Read [BRANCHES.md](./BRANCHES.md) to understand which branch to use for your needs.

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool & dev server

### AI & APIs
- **Google Gemini AI** - Natural language processing and insights
- **@google/genai 1.25.0** - Gemini API integration

### Development Tools
- **@vitejs/plugin-react** - React fast refresh
- **@types/node** - Node.js type definitions

---

## 🗺️ Development Roadmap

### ✅ Phase 1: Foundation (Completed)
- Project initialization
- Basic navigation components
- Theme management

### ✅ Phase 2: Session Management (Completed)
- Session fetching and display
- User data management
- Basic provider/patient workflows

### ✅ Phase 3: Communication & Scheduling (Completed)
- Notification system (email, SMS, in-app)
- Crisis response workflow
- Appointment scheduling
- Patient intake forms

### ✅ Phase 4: Telehealth (Completed)
- Video session integration
- Provider detail pages
- Booking calendar

### ✅ Phase 5: Gamification & Engagement (Completed)
- Gamified assessments UI
- Progress tracking infrastructure
- Outcomes measurement backend
- Medication education
- Rewards marketplace

### 🔄 Phase 6: Current Development
- Resume and verify all implementations
- Bug fixes and optimization
- Integration testing
- Documentation

### 🔮 Phase 7: Future Enhancements
- Mobile app (React Native)
- Advanced analytics dashboard
- Insurance integration
- Multi-language support
- Wearable device integration

---

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Request review from team

### Commit Message Convention

Use conventional commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📞 Support & Resources

- **AI Studio App**: https://ai.studio/apps/drive/1tWSTShKjO_onvut69ijnGa21P58nuZts
- **Documentation**: See `BRANCHES.md` for branch strategy
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Team communication channels

---

## 📄 License

This project is private and proprietary. Unauthorized copying, distribution, or use is prohibited.

---

## 👥 Team

**Developed by**: NeuroBridge AI Development Team
**Maintained by**: Metastakes
**AI Assistance**: Claude (Anthropic)

---

## 🙏 Acknowledgments

- Google Gemini AI for powering intelligent features
- React and Vite communities for excellent development tools
- Mental health professionals for domain expertise and guidance

---

<div align="center">

**Made with ❤️ for better mental health care**

</div>
