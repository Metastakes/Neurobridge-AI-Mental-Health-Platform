# Branch Structure Documentation

This document explains the purpose and contents of each branch in the NeuroBridge AI Mental Health Platform repository, making it easy for beginners to understand the development workflow.

## Repository Overview

**Repository Name**: `Neurobridge-AI-Mental-Health-Platform`
**Main Purpose**: AI-powered mental health platform connecting providers with mentorship while engaging patients through gamified care

---

## Branch Hierarchy & Development Stages

### 🏠 Production Branch

#### `main`
- **Status**: Stable baseline
- **Commit**: 148332d
- **Features**:
  - Initial project setup
  - Basic NeuroBridge AI platform initialization
  - Patient navigation components with ArrowLeft icon
- **Use Case**: Production-ready stable code

---

### 🚀 Development Branches (Claude-Assisted Development)

All `claude/*` branches represent different development sessions/features being worked on by AI assistance.

---

#### `claude/resume-and-verify-011CUo1dvJdJuxLeLZ1mWhge` ⭐ **CURRENT BRANCH**
- **Status**: Active development - resuming and verifying previous work
- **Based on**: main branch (same commits)
- **Commit**: 148332d
- **Purpose**: Resume previous development work and verify implementations
- **Features**: Same as main branch currently
- **Next Steps**: Being used to verify and resume development

---

#### `claude/fetch-latest-session-011CUQi4Xukhiw9D1AUXKwun`
- **Status**: Feature branch with session management
- **Commit**: 233e24e
- **Built on top of**: Basic initialization
- **Key Addition**:
  - ✨ Fetch and display most recent session functionality
- **Purpose**: Adds session retrieval and display capabilities
- **Development Stage**: Phase 1 - Session Management

---

#### `claude/merge-sessions-011CULu6eWx5SLvLPEs1TMb3`
- **Status**: Mid-stage development with notifications & crisis features
- **Commit**: 9055165
- **Development Stage**: Phase 3-4 Features
- **Key Features**:
  - 🚨 Crisis Response Workflow UI & API
  - 📬 Notification Dashboard UI Component
  - 📝 Notification History & Delivery Tracking System (Backend)
  - ⚙️ Provider Notification Preferences System
  - 📧 SMS & Email Emergency Notification Fallback System
- **Purpose**: Implements critical communication and crisis management features
- **Use Case**: Emergency response and provider notification systems

---

#### `claude/fix-duplicate-sessions-011CUQinrMwc7Rv8xgRx9JmX` 🏆 **MOST COMPLETE**
- **Status**: Most advanced development branch with full feature set
- **Commit**: 9ee458b
- **Development Stage**: Phase 5 - Complete Implementation
- **Comprehensive Features**:

  **Phase 5 - Advanced Features:**
  - 💊 Medication Education & Rewards Marketplace
  - 🎮 Gamification UI (Beautiful, Engaging Assessment Experience)
  - 🎯 Gamification System (Backend)
  - 📊 Progress Tracking Infrastructure & UI (Complete)
  - 📈 Progress Tracking & Outcomes Measurement (Backend)

  **Phase 4 - Telehealth:**
  - 📹 Telehealth Video Session UI Components
  - 🔗 Telehealth Video Integration (Backend)

  **Phase 3 - Scheduling:**
  - 📅 Provider Detail Page with Booking Calendar
  - 📋 Patient Intake & Scheduling Frontend

  **Phase 2 - Bug Fixes:**
  - 🐛 Critical bug fixes for Phase 2 & 3

- **Purpose**: Full-featured implementation with gamification, progress tracking, telehealth, and medication management
- **Use Case**: Complete patient engagement platform with all core features
- **Recommended**: This branch contains the most complete implementation

---

## Quick Reference Guide

### For Beginners: Which Branch Should I Use?

| Your Goal | Recommended Branch | Why? |
|-----------|-------------------|------|
| **Start fresh development** | `main` | Clean, stable baseline |
| **See the complete platform** | `claude/fix-duplicate-sessions-011CUQinrMwc7Rv8xgRx9JmX` | Has all features implemented |
| **Work on notifications** | `claude/merge-sessions-011CULu6eWx5SLvLPEs1TMb3` | Focus on communication features |
| **Add session features** | `claude/fetch-latest-session-011CUQi4Xukhiw9D1AUXKwun` | Session management focus |
| **Resume/verify work** | `claude/resume-and-verify-011CUo1dvJdJuxLeLZ1mWhge` | Current active development |

---

## Branch Naming Convention

### Format: `claude/[purpose]-[session-id]`

- **claude/**: Indicates AI-assisted development
- **[purpose]**: Brief description of the branch's goal
  - `resume-and-verify`: Resuming and verifying implementations
  - `fetch-latest-session`: Session fetching functionality
  - `merge-sessions`: Merging session-related features
  - `fix-duplicate-sessions`: Fixing session duplication issues (contains full feature set)
- **[session-id]**: Unique identifier for the development session (e.g., `011CUo1dvJdJuxLeLZ1mWhge`)

---

## Development Phases Overview

| Phase | Features | Branch |
|-------|----------|--------|
| **Phase 1** | Project Setup, Basic Navigation | `main`, `resume-and-verify` |
| **Phase 2** | Session Management | `fetch-latest-session` |
| **Phase 3-4** | Notifications, Crisis Response, Scheduling, Telehealth | `merge-sessions`, `fix-duplicate-sessions` |
| **Phase 5** | Gamification, Progress Tracking, Medication Education | `fix-duplicate-sessions` |

---

## How to Switch Branches

```bash
# View all branches
git branch -a

# Switch to a specific branch
git checkout [branch-name]

# Example: Switch to the most complete branch
git checkout claude/fix-duplicate-sessions-011CUQinrMwc7Rv8xgRx9JmX

# Example: Go back to main
git checkout main
```

---

## Merging Strategy

**⚠️ Important**: Before merging any branch:
1. Test thoroughly
2. Review all changes
3. Ensure no conflicts with main
4. Get team approval if working collaboratively

**Recommended merge order** (if merging to main):
1. Start with `fetch-latest-session` (basic session features)
2. Then `merge-sessions` (notifications & crisis)
3. Finally `fix-duplicate-sessions` (complete feature set)

---

## Contributing

When creating new branches:
- Use descriptive names that indicate the feature/fix
- Keep branches focused on specific features
- Regularly sync with main to avoid conflicts
- Document your changes in commit messages

---

## Need Help?

- **Project Documentation**: See [README.md](./README.md)
- **Issues**: Check GitHub Issues for known problems
- **Questions**: Contact the development team

---

**Last Updated**: 2025-11-04
**Maintained by**: NeuroBridge AI Development Team
