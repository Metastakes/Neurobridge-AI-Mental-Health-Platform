# GitHub Repository Rename Guide

This guide provides step-by-step instructions for renaming your GitHub repository to better reflect its purpose and branch structure.

---

## 📝 Why Rename Your Repository?

Currently: `Neurobridge-AI-Mental-Health-Platform`

**Suggested new names** (choose one based on your preference):

1. **Descriptive & Professional**:
   - `neurobridge-mental-health-ai-platform`
   - `neurobridge-ai-therapy-platform`
   - `neurobridge-provider-patient-portal`

2. **Concise & Clear**:
   - `neurobridge-ai`
   - `neurobridge-platform`
   - `mental-health-ai-platform`

3. **Feature-Focused**:
   - `neurobridge-gamified-therapy`
   - `ai-mental-health-engagement-platform`

**Recommendation**: `neurobridge-ai-platform` (Simple, clear, professional)

---

## 🚀 How to Rename Your Repository on GitHub

### Method 1: Via GitHub Web Interface (Easiest)

1. **Navigate to Your Repository**
   - Go to: https://github.com/Metastakes/Neurobridge-AI-Mental-Health-Platform

2. **Access Settings**
   - Click the **Settings** tab (top right of the repository page)
   - Scroll down to the **Repository name** section

3. **Rename the Repository**
   - In the text box, enter your new repository name
   - GitHub will show you if the name is available
   - Click **Rename** button

4. **Confirmation**
   - GitHub will automatically:
     - Update all links
     - Redirect old URLs to the new name
     - Preserve all branches, issues, and pull requests

5. **Important**: Copy the new repository URL that GitHub displays

---

### Method 2: Via GitHub CLI (If Available)

```bash
# If you have GitHub CLI installed locally (not available in this environment)
gh repo rename new-repository-name --repo Metastakes/Neurobridge-AI-Mental-Health-Platform
```

---

## 🔄 Update Your Local Repository After Renaming

After renaming on GitHub, update your local repository:

### Step 1: Update Remote URL

```bash
# Check current remote URL
git remote -v

# Update to new repository name (replace NEW-NAME with your chosen name)
git remote set-url origin https://github.com/Metastakes/NEW-NAME.git

# Verify the change
git remote -v
```

### Step 2: Fetch Latest Changes

```bash
# Fetch from new remote
git fetch origin

# Ensure you're on the correct branch
git branch -a
```

### Step 3: Update All Team Members

If you're working with a team, notify them to update their local repositories with the same commands.

---

## 📋 Repository Rename Checklist

After renaming, verify these items:

- [ ] Repository name updated on GitHub
- [ ] Local git remote URL updated
- [ ] All team members notified and updated their remotes
- [ ] README.md references correct repository name
- [ ] Documentation links updated (if any external docs exist)
- [ ] CI/CD pipelines updated (if using GitHub Actions or other CI)
- [ ] Package.json updated (if package name should match)
- [ ] Any deployment configurations updated

---

## 📄 Update Documentation After Rename

After renaming, you should update these files:

### 1. README.md

Update the clone command:

```bash
# Change from:
git clone https://github.com/Metastakes/Neurobridge-AI-Mental-Health-Platform.git

# To:
git clone https://github.com/Metastakes/NEW-NAME.git
```

### 2. package.json (Optional)

Consider updating the package name to match:

```json
{
  "name": "new-repository-name",
  ...
}
```

### 3. Any Hard-Coded URLs

Search for any hard-coded repository URLs in your codebase:

```bash
# Search for old repository name
grep -r "Neurobridge-AI-Mental-Health-Platform" .
```

---

## 🎯 Recommended Repository Naming Best Practices

When choosing a new name, consider:

1. **Lowercase with hyphens**: `neurobridge-ai-platform` ✅
   - Not: `NeuroBridge_AI_Platform` ❌

2. **Descriptive but concise**: Balance clarity with brevity
   - Good: `neurobridge-ai-platform`
   - Too long: `neurobridge-ai-mental-health-gamification-platform-with-telehealth`

3. **Avoid special characters**: Stick to letters, numbers, and hyphens
   - Good: `neurobridge-ai` ✅
   - Bad: `neurobridge@ai!` ❌

4. **Consider SEO**: If public, choose a searchable name

5. **Future-proof**: Choose a name that won't become outdated as features evolve

---

## 🔒 What GitHub Preserves When Renaming

GitHub automatically preserves:
- ✅ All commits and history
- ✅ All branches
- ✅ All issues and pull requests
- ✅ All releases and tags
- ✅ All GitHub Actions workflows
- ✅ All wikis and project boards
- ✅ Repository redirects (old URL → new URL)

**Note**: Redirects work for web browsing and git operations for a while, but it's best to update all references promptly.

---

## 💡 Recommended Workflow

1. **Choose a name**: `neurobridge-ai-platform` (or your preference)

2. **Rename on GitHub**:
   - Go to repository Settings
   - Change name in "Repository name" field
   - Click "Rename"

3. **Update local repository**:
   ```bash
   git remote set-url origin https://github.com/Metastakes/neurobridge-ai-platform.git
   git fetch origin
   ```

4. **Update documentation**:
   ```bash
   # Update README.md clone command
   # Update any hard-coded URLs
   # Commit changes
   git add .
   git commit -m "docs: Update repository references after rename"
   git push origin claude/resume-and-verify-011CUo1dvJdJuxLeLZ1mWhge
   ```

5. **Notify team members** (if applicable)

---

## 🆘 Troubleshooting

### "Repository name already taken"
- Try adding a suffix: `neurobridge-ai-v2` or `neurobridge-ai-platform-2024`
- Or choose a more unique name

### "Permission denied when pushing"
- Update your remote URL: `git remote set-url origin NEW-URL`
- Check your GitHub authentication

### "Cannot find repository"
- GitHub redirects take a moment to propagate
- Wait a few minutes and try again
- Or manually update to the new URL

---

## 📚 Additional Resources

- **GitHub Docs**: [Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- **Git Remote Management**: [Git Remote Documentation](https://git-scm.com/docs/git-remote)

---

## ✅ Final Recommendation

**Recommended new name**: `neurobridge-ai-platform`

**Why?**
- Clear and professional
- Easy to remember and type
- Describes the project concisely
- Follows GitHub naming conventions
- Future-proof and scalable

**Steps to implement**:
1. Go to GitHub repository Settings
2. Rename to: `neurobridge-ai-platform`
3. Update local remote URL
4. Update README.md clone command
5. Done!

---

**Need help?** Contact the repository maintainer or open an issue.

---

**Last Updated**: 2025-11-04
