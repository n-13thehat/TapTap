# TapTap Matrix - Optimized Docker Build Script
# This script creates a minimal build context to speed up Docker builds

Write-Host "🐳 TapTap Matrix - Docker Build Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Create a temporary build directory
$buildDir = "docker-build-temp"
Write-Host "📁 Creating temporary build directory..." -ForegroundColor Yellow

if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Copy only essential files
Write-Host "📋 Copying essential files..." -ForegroundColor Yellow

# Package files
Copy-Item "package.json" "$buildDir/"
Copy-Item "package-lock.json" "$buildDir/" -ErrorAction SilentlyContinue

# Configuration files
Copy-Item "next.config.js" "$buildDir/"
Copy-Item "tsconfig.json" "$buildDir/"
Copy-Item "tailwind.config.cjs" "$buildDir/"
Copy-Item "postcss.config.cjs" "$buildDir/"

# Prisma
Copy-Item -Recurse "prisma" "$buildDir/"

# Source code directories
Write-Host "📦 Copying source code..." -ForegroundColor Yellow
Copy-Item -Recurse "app" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "components" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "lib" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "hooks" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "providers" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "stores" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "types" "$buildDir/" -Exclude "*.test.*","*.spec.*"
Copy-Item -Recurse "styles" "$buildDir/"
Copy-Item -Recurse "config" "$buildDir/" -ErrorAction SilentlyContinue

# Public assets (minimal)
Write-Host "🖼️  Copying public assets..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$buildDir/public" -Force | Out-Null
Copy-Item "public/manifest.json" "$buildDir/public/" -ErrorAction SilentlyContinue
Copy-Item "public/favicon.ico" "$buildDir/public/" -ErrorAction SilentlyContinue
Copy-Item "public/sw.js" "$buildDir/public/" -ErrorAction SilentlyContinue
Copy-Item -Recurse "public/icons" "$buildDir/public/" -ErrorAction SilentlyContinue
Copy-Item -Recurse "public/favicons" "$buildDir/public/" -ErrorAction SilentlyContinue

# Other necessary files
Copy-Item "auth.config.js" "$buildDir/" -ErrorAction SilentlyContinue
Copy-Item ".env.local" "$buildDir/" -ErrorAction SilentlyContinue

# Copy Dockerfile
Copy-Item "Dockerfile.dev" "$buildDir/"

# Build the image
Write-Host ""
Write-Host "🔨 Building Docker image..." -ForegroundColor Green
Set-Location $buildDir
docker build -t taptap-matrix:latest -f Dockerfile.dev .
$buildResult = $LASTEXITCODE
Set-Location ..

# Cleanup
Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $buildDir

if ($buildResult -eq 0) {
    Write-Host ""
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start containers: docker-compose up -d" -ForegroundColor White
    Write-Host "  2. View logs: docker-compose logs -f app" -ForegroundColor White
    Write-Host "  3. Access app: http://localhost:3000" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

