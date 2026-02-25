# Release Instructions

## First Release (v1.0.0)

Follow these steps to create your first release:

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Connecta v1.0.0"
```

### 2. Create GitHub Repository

1. Go to GitHub and create a new repository named `connecta`
2. **Important**: Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
3. Add the repository as remote:
   ```bash
   git remote add origin https://github.com/yourusername/connecta.git
   git branch -M main
   git push -u origin main
   ```

### 3. Create First Release

#### Option A: Using PowerShell Script (Windows)

```powershell
.\release.ps1 -Version "1.0.0"
```

#### Option B: Using Bash Script (Linux/Mac)

```bash
chmod +x release.sh
./release.sh 1.0.0
```

#### Option C: Manual

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. Monitor GitHub Actions

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Watch the workflow progress:
   - **Build**: Compiles the application
   - **Release**: Creates release artifacts
   - **Deploy**: Publishes to GitHub Pages

### 5. Verify Release

Once the actions complete:

1. **Check Release Page**
   - Go to Releases tab
   - You should see v1.0.0 with:
     - `connecta-v1.0.0.zip`
     - `connecta-v1.0.0.tar.gz`
     - Release notes

2. **Check GitHub Pages**
   - Visit: `https://yourusername.github.io/connecta/`
   - Your app should be live!

---

## Subsequent Releases

For future releases (v1.1.0, v1.2.0, etc.):

### 1. Update CHANGELOG.md

Add a new section at the top:

```markdown
## [1.1.0] - 2026-03-01

### Added
- New feature description

### Changed
- Updated feature description

### Fixed
- Bug fix description
```

### 2. Create Release

Using the script:

```powershell
# Windows
.\release.ps1 -Version "1.1.0"

# Linux/Mac
./release.sh 1.1.0
```

Or manually:

```bash
npm version 1.1.0 --no-git-tag-version
git add .
git commit -m "Release v1.1.0"
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main --tags
```

---

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major (x.0.0)**: Breaking changes
- **Minor (0.x.0)**: New features, backwards compatible
- **Patch (0.0.x)**: Bug fixes, no new features

Examples:
- `1.0.0` → `1.0.1` - Bug fix
- `1.0.1` → `1.1.0` - New feature
- `1.1.0` → `2.0.0` - Breaking change

---

## Troubleshooting

### GitHub Actions Failed

1. Check the Actions tab for error messages
2. Common issues:
   - Missing permissions: Settings → Actions → Workflow permissions → Read and write
   - npm dependencies: Clear cache and retry
   - Build errors: Check locally with `npm run build`

### GitHub Pages Not Working

1. Settings → Pages → Source should be "GitHub Actions"
2. Wait 5-10 minutes after first deployment
3. Check Actions tab for deployment status
4. Make sure `base` in `vite.config.ts` matches your repository name:
   ```typescript
   base: '/connecta/'  // If using GitHub Pages
   ```

### Release Not Created

1. Make sure you pushed the tag: `git push origin v1.0.0`
2. Check that the tag format is correct: `v*.*.*`
3. Verify GitHub token permissions in Settings → Actions

---

## Configuration Checklist

Before first release, make sure:

- [ ] Repository created on GitHub
- [ ] GitHub Pages enabled (Settings → Pages)
- [ ] Workflow permissions set to "Read and write"
- [ ] Repository name matches in `vite.config.ts` if using subdirectory
- [ ] Environment variables configured (if needed)
- [ ] CHANGELOG.md updated
- [ ] package.json version updated
- [ ] All files committed

---

## Quick Reference

```bash
# Check current version
npm version

# Create new release
.\release.ps1 -Version "1.1.0"  # Windows
./release.sh 1.1.0              # Linux/Mac

# Manual tag and push
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin main --tags

# View tags
git tag -l

# Delete tag (if mistake)
git tag -d v1.0.0                    # Local
git push origin --delete v1.0.0     # Remote
```
