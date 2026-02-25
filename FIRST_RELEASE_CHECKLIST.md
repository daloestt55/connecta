# 🚀 First Release Checklist

Use this checklist to ensure everything is ready for your first release.

## Pre-Release Preparation

### 1. Code & Build
- [ ] All features tested and working
- [ ] No critical bugs remaining
- [ ] Code committed to git
- [ ] Build succeeds locally: `npm run build`
- [ ] Preview build works: `npm run preview`

### 2. Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md has v1.0.0 entry with today's date
- [ ] All features documented
- [ ] Release notes prepared

### 3. Version & Configuration
- [ ] package.json version is 1.0.0
- [ ] vite.config.ts base path configured correctly
- [ ] Environment variables documented
- [ ] .gitignore includes all necessary files

### 4. GitHub Repository Setup
- [ ] Repository created on GitHub
- [ ] Local repository initialized: `git init`
- [ ] Remote added: `git remote add origin https://github.com/yourusername/connecta.git`
- [ ] All files added: `git add .`
- [ ] Initial commit: `git commit -m "Initial commit - Connecta v1.0.0"`
- [ ] Pushed to GitHub: `git push -u origin main`

### 5. GitHub Settings
- [ ] Repository is public (or private if intended)
- [ ] GitHub Pages enabled:
  - Settings → Pages → Source: "GitHub Actions"
- [ ] Workflow permissions set:
  - Settings → Actions → General → Workflow permissions: "Read and write permissions"
  - ✓ "Allow GitHub Actions to create and approve pull requests"

### 6. GitHub Actions Files
- [ ] `.github/workflows/build.yml` exists
- [ ] `.github/workflows/release.yml` exists
- [ ] `.github/workflows/deploy.yml` exists
- [ ] All workflows committed and pushed

### 7. Release Scripts
- [ ] `release.ps1` (Windows) exists and is executable
- [ ] `release.sh` (Linux/Mac) exists and is executable
- [ ] Scripts tested (dry run if possible)

## Release Execution

### Step 1: Final Verification
```powershell
# Check version
npm run version:check

# Test build
npm run build

# Preview build
npm run preview
```

### Step 2: Create Release

**Option A: Using Script (Recommended)**
```powershell
# Windows
.\release.ps1 -Version "1.0.0"
```

```bash
# Linux/Mac
chmod +x release.sh
./release.sh 1.0.0
```

**Option B: Manual**
```bash
# Create tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0
```

### Step 3: Monitor Deployment
- [ ] Go to GitHub → Actions tab
- [ ] Verify "Build" workflow completes successfully
- [ ] Verify "Release" workflow completes successfully
- [ ] Verify "Deploy to GitHub Pages" workflow completes successfully

### Step 4: Verify Release
- [ ] GitHub Release created at: `https://github.com/yourusername/connecta/releases/tag/v1.0.0`
- [ ] Release includes:
  - [ ] `connecta-v1.0.0.zip`
  - [ ] `connecta-v1.0.0.tar.gz`
  - [ ] Release notes with features
- [ ] GitHub Pages deployed at: `https://yourusername.github.io/connecta/`
- [ ] Application loads and works correctly

## Post-Release

### 1. Announcement
- [ ] Announce release on social media
- [ ] Update project description
- [ ] Add tags/topics to repository

### 2. Documentation
- [ ] Link to live demo in README
- [ ] Update repository description on GitHub
- [ ] Add relevant topics: `react`, `typescript`, `vite`, `discord-clone`, `communication-app`

### 3. Monitoring
- [ ] Check GitHub Issues for bug reports
- [ ] Monitor GitHub Pages uptime
- [ ] Review GitHub Actions usage

## Common Issues & Solutions

### Build fails locally
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### GitHub Actions fails
1. Check workflow logs in Actions tab
2. Verify permissions: Settings → Actions → Workflow permissions
3. Check secrets are configured if needed
4. Re-run failed workflow

### GitHub Pages not working
1. Wait 5-10 minutes after first deployment
2. Settings → Pages → Source should be "GitHub Actions"
3. Check deployment status in Actions tab
4. Verify `base` path in `vite.config.ts`

### Release not created
1. Verify tag format: `v1.0.0` (must start with 'v')
2. Check workflow logs for errors
3. Verify GITHUB_TOKEN permissions
4. Re-push tag if needed: `git push origin v1.0.0 --force`

## Success Indicators

✅ You're done when:
- GitHub Release exists with v1.0.0
- Archives are attached to release
- GitHub Pages shows your app
- App is functional at live URL
- No errors in GitHub Actions

## Next Steps

After successful first release:
1. Share the live URL
2. Gather user feedback
3. Plan next features for v1.1.0
4. Update CHANGELOG.md for next release
5. Use the same process for future releases

---

## Quick Commands Reference

```bash
# Check version
npm run version:check

# Build and preview
npm run build && npm run preview

# Create release (Windows)
.\release.ps1 -Version "1.0.0"

# Create release (Linux/Mac)
./release.sh 1.0.0

# View tags
git tag -l

# Check git status
git status

# View remotes
git remote -v
```

---

**Good luck with your release! 🎉**
