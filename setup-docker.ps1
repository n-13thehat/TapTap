# TapTap Matrix - Docker Setup Script
# This script starts Docker Desktop and launches the required services

Write-Host "TapTap Matrix - Docker Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker Desktop is installed
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (-not (Test-Path $dockerPath)) {
    Write-Host "Docker Desktop not found at: $dockerPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "Docker is already running!" -ForegroundColor Green
    }
} catch {
    $dockerRunning = $false
}

# Start Docker Desktop if not running
if (-not $dockerRunning) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process $dockerPath

    Write-Host "Waiting for Docker to start (this may take 30-60 seconds)..." -ForegroundColor Yellow

    $maxWait = 120
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 5
        $waited += 5

        try {
            $null = docker ps 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Docker is now running!" -ForegroundColor Green
                $dockerRunning = $true
                break
            }
        } catch {
            Write-Host "." -NoNewline
        }
    }

    if (-not $dockerRunning) {
        Write-Host ""
        Write-Host "Docker failed to start within $maxWait seconds" -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually and try again" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Starting TapTap services..." -ForegroundColor Cyan
Write-Host ""

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Start PostgreSQL and Redis
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be healthy
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Docker setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run database migrations: npm run prisma:push" -ForegroundColor White
Write-Host "  2. Seed the database: npm run db:seed" -ForegroundColor White
Write-Host "  3. Check database health: npm run db:health" -ForegroundColor White
Write-Host "  4. Start the app: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  Redis: localhost:6379" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"

