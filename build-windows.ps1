# Quick Build Script for Windows
# Run this to create the Windows installer

Write-Host "🚀 Starting Connecta Desktop Build Process..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Check if icon exists
if (-not (Test-Path "build\icon.ico") -and -not (Test-Path "build\icon.png")) {
    Write-Host "⚠️  Warning: No icon found (icon.ico or icon.png)" -ForegroundColor Yellow
    Write-Host "   The app will use a default icon." -ForegroundColor Yellow
    Write-Host "   To add custom icon, see build\ICON_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "dist-electron") { Remove-Item -Recurse -Force "dist-electron" }
if (Test-Path "release") { Remove-Item -Recurse -Force "release" }

# Build the app
Write-Host ""
Write-Host "🔨 Building Connecta Desktop App..." -ForegroundColor Cyan
Write-Host "   This may take 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

$env:ELECTRON = "true"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Create installer
Write-Host ""
Write-Host "📦 Creating Windows installer..." -ForegroundColor Cyan
npx electron-builder --win

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installer creation failed!" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Output files:" -ForegroundColor Cyan
if (Test-Path "release") {
    Get-ChildItem "release" -File | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   📦 $($_.Name) ($size MB)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎉 Done! You can find your installers in the 'release' folder." -ForegroundColor Green
Write-Host ""
Write-Host "To install:" -ForegroundColor Yellow
Write-Host "   1. Open the 'release' folder" -ForegroundColor White
Write-Host "   2. Run 'Connecta-Setup-1.0.0.exe'" -ForegroundColor White
Write-Host "   3. Follow the installation wizard" -ForegroundColor White
Write-Host ""
