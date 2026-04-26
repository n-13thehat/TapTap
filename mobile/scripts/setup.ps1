# TapTap Mobile App - Quick Setup Script (Windows)

Write-Host "🚀 TapTap Mobile App Setup" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version must be 18 or higher. Current: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check npm
Write-Host "📦 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check for Expo CLI
Write-Host "📦 Checking Expo CLI..." -ForegroundColor Yellow
try {
    expo --version | Out-Null
    Write-Host "✅ Expo CLI ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Expo CLI not found. Installing globally..." -ForegroundColor Yellow
    npm install -g expo-cli
    Write-Host "✅ Expo CLI installed" -ForegroundColor Green
}
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# TapTap Mobile App Environment Variables

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000

# App Configuration
EXPO_PUBLIC_APP_NAME=TapTap Matrix
EXPO_PUBLIC_APP_VERSION=1.0.0
"@
    
    $envContent | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
}

# Success message
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the development server:" -ForegroundColor White
Write-Host "     npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Run on Android emulator:" -ForegroundColor White
Write-Host "     npm run android" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Or scan the QR code with Expo Go app on your phone" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

