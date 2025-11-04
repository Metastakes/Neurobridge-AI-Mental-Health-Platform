# 🎓 Quick Start Guide for Beginners

**Welcome to NeuroBridge AI Mental Health Platform!**

This guide will help you get started quickly, even if you're new to the project or development in general.

---

## 🎯 What Is This Project?

NeuroBridge AI is a mental health platform with three main parts:
1. **Patient App** - For people seeking mental health care
2. **Provider Dashboard** - For therapists and mental health professionals
3. **Mentor Portal** - For experienced providers mentoring new ones

Think of it as a complete mental health ecosystem powered by AI!

---

## 📚 Essential Documents to Read

Start here in this order:

1. **[README.md](./README.md)** - Overview of the entire project (5 min read)
2. **[BRANCHES.md](./BRANCHES.md)** - Understanding which code version to use (3 min read)
3. **This file** - You're reading it now! (2 min read)
4. **[REPOSITORY_RENAME_GUIDE.md](./REPOSITORY_RENAME_GUIDE.md)** - If you need to rename the repo (optional)

---

## 🚀 Getting Started in 5 Steps

### Step 1: Clone the Repository

```bash
# Copy the project to your computer
git clone https://github.com/Metastakes/Neurobridge-AI-Mental-Health-Platform.git
cd Neurobridge-AI-Mental-Health-Platform
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

**What this does**: Downloads all the code libraries the project needs.

### Step 3: Set Up Your API Key

1. Create a file named `.env.local` in the project folder
2. Add this line (replace with your actual key):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

**Don't have an API key?** Get one from [Google AI Studio](https://ai.google.dev/)

### Step 4: Run the Project

```bash
# Start the development server
npm run dev
```

### Step 5: Open in Browser

- Go to: `http://localhost:5173`
- You should see the NeuroBridge AI platform!

---

## 🌳 Which Branch Should I Use?

**New to the project?** Use one of these:

| Your Goal | Branch to Use | Command |
|-----------|--------------|---------|
| **Just exploring** | `main` | `git checkout main` |
| **See all features** | `claude/fix-duplicate-sessions-*` | See BRANCHES.md for full name |
| **Start developing** | Create your own branch | `git checkout -b feature/my-feature` |

**Read [BRANCHES.md](./BRANCHES.md) for detailed explanations of each branch.**

---

## 📁 Project Structure (Simplified)

```
neurobridge-ai-mental-health-platform/
│
├── components/          ← All UI components
│   ├── patient/        ← Patient app screens
│   ├── provider/       ← Provider dashboard screens
│   └── mentor/         ← Mentor portal screens
│
├── App.tsx             ← Main app entry point
├── PatientApp.tsx      ← Patient app entry point
│
├── types.ts            ← TypeScript type definitions
├── userData.ts         ← User data and mock data
├── medicationData.ts   ← Medication information
│
└── README.md           ← Project documentation
```

---

## 💡 Common Tasks

### Task: Make a Code Change

1. Create a new branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes in the code

3. Test your changes:
   ```bash
   npm run dev
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: Describe what you changed"
   ```

5. Push to GitHub:
   ```bash
   git push origin feature/my-new-feature
   ```

### Task: View Different Features

To see what different branches contain:

```bash
# List all branches
git branch -a

# Switch to a different branch
git checkout branch-name

# Go back to main
git checkout main
```

### Task: Update Your Local Code

```bash
# Get latest changes from GitHub
git fetch origin

# Update your current branch
git pull origin your-branch-name
```

---

## 🐛 Common Issues & Solutions

### Issue: "Command not found: npm"
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### Issue: "Port 5173 is already in use"
**Solution**:
- Stop the other process using that port
- Or the server will automatically use a different port

### Issue: "API key not found"
**Solution**:
- Make sure you created `.env.local` file
- Check that you added `GEMINI_API_KEY=your_key`
- Restart the dev server after creating the file

### Issue: "Cannot push to branch"
**Solution**:
- Make sure you're on the correct branch
- Use: `git push -u origin your-branch-name`
- Check that the branch name starts with `claude/` and ends with the session ID

---

## 📖 Understanding the Code

### What is React?
- A JavaScript library for building user interfaces
- Think of it as building blocks for web pages

### What is TypeScript?
- JavaScript with types (makes code more reliable)
- Files end in `.ts` or `.tsx`

### What is Vite?
- A tool that runs your development server
- Makes your code run fast in the browser

### What is Gemini AI?
- Google's AI model
- Powers the intelligent features of the platform

---

## 🎓 Learning Resources

### For This Project
- **README.md** - Complete project overview
- **BRANCHES.md** - Branch structure explained
- **Code Comments** - Read comments in the code files

### For React
- [React Official Docs](https://react.dev/) - Learn React basics
- [React Tutorial](https://react.dev/learn) - Interactive tutorial

### For TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Learn TypeScript

### For Git
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) - Learn version control

---

## 🤝 Getting Help

### Documentation Files in This Project
1. **README.md** - Main documentation
2. **BRANCHES.md** - Branch strategy
3. **REPOSITORY_RENAME_GUIDE.md** - How to rename the repo
4. **This file** - Beginner guide

### External Resources
- **GitHub Issues** - Report bugs or ask questions
- **Project AI Studio** - https://ai.studio/apps/drive/1tWSTShKjO_onvut69ijnGa21P58nuZts

---

## ✅ Checklist: Am I Ready to Start?

- [ ] I cloned the repository
- [ ] I ran `npm install`
- [ ] I created `.env.local` with my API key
- [ ] I can run `npm run dev` successfully
- [ ] I can see the app in my browser
- [ ] I read the README.md
- [ ] I understand the branch structure from BRANCHES.md

**All checked?** You're ready to start developing! 🎉

---

## 🎯 Next Steps

Now that you're set up:

1. **Explore the code**: Look at `App.tsx` and component files
2. **Make a small change**: Try changing some text in a component
3. **See your change**: The browser will automatically update
4. **Read BRANCHES.md**: Understand which branch has which features
5. **Choose a task**: Pick something small to work on

---

## 💬 Tips for Success

1. **Start small**: Don't try to understand everything at once
2. **Read the code**: The best way to learn is by reading existing code
3. **Use git branches**: Always create a new branch for your changes
4. **Commit often**: Make small, frequent commits
5. **Ask questions**: Don't hesitate to ask for help when stuck
6. **Test everything**: Always test your changes before pushing

---

## 🚀 You're Ready!

Welcome to the NeuroBridge AI team! Happy coding! 🎉

---

**Questions?** Check the documentation or open an issue on GitHub.

**Last Updated**: 2025-11-04
