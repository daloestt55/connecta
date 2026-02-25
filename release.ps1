# Release script for Connecta (Windows)
# Usage: .\release.ps1 -Version "1.0.0"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "🚀 Preparing release v$Version..." -ForegroundColor Cyan

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
    $continue = Read-Host "Do you want to continue? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Release cancelled" -ForegroundColor Red
        exit 1
    }
}

# Update version in package.json
Write-Host "📝 Updating package.json version to $Version..." -ForegroundColor Cyan
npm version $Version --no-git-tag-version

# Update CHANGELOG.md date
$today = Get-Date -Format "yyyy-MM-dd"
Write-Host "📅 Updating CHANGELOG.md with date $today..." -ForegroundColor Cyan
$changelog = Get-Content "CHANGELOG.md" -Raw
$changelog = $changelog -replace "\[Unreleased\]", "[$Version] - $today"
$changelog | Set-Content "CHANGELOG.md"

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git add package.json CHANGELOG.md package-lock.json
git commit -m "Release v$Version"

# Create git tag
Write-Host "🏷️  Creating git tag v$Version..." -ForegroundColor Cyan
git tag -a "v$Version" -m "Release version $Version"

# Push to remote
Write-Host "📤 Pushing to remote..." -ForegroundColor Cyan
git push origin main
git push origin "v$Version"

Write-Host ""
Write-Host "✅ Release v$Version created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. GitHub Actions will automatically build and create a release"
Write-Host "2. Check GitHub Actions: https://github.com/yourusername/connecta/actions"
Write-Host "3. View release: https://github.com/yourusername/connecta/releases/tag/v$Version"
