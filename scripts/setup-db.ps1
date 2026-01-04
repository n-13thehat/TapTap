# TapTap Matrix Database Setup Script
# This script sets up the local development database

Write-Host "🎵 TapTap Matrix - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Docker is available
$dockerAvailable = $false
try {
    docker --version | Out-Null
    $dockerAvailable = $true
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not available" -ForegroundColor Red
}

# Check if PostgreSQL is installed locally
$postgresAvailable = $false
try {
    psql --version | Out-Null
    $postgresAvailable = $true
    Write-Host "✅ PostgreSQL is available locally" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not available locally" -ForegroundColor Red
}

if ($dockerAvailable) {
    Write-Host "🐳 Setting up database with Docker..." -ForegroundColor Yellow
    
    # Start Docker containers
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker containers started successfully" -ForegroundColor Green
        
        # Wait for database to be ready
        Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Update environment for local database
        $env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/taptap_dev"
        
        Write-Host "🔄 Running Prisma migrations..." -ForegroundColor Yellow
        npx prisma migrate dev --name init
        
        Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
        npx prisma db seed
        
        Write-Host "✅ Database setup complete!" -ForegroundColor Green
        Write-Host "📊 Database URL: postgresql://postgres:password@localhost:5432/taptap_dev" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start Docker containers" -ForegroundColor Red
        Write-Host "💡 Make sure Docker Desktop is running" -ForegroundColor Yellow
    }
} elseif ($postgresAvailable) {
    Write-Host "🐘 Setting up database with local PostgreSQL..." -ForegroundColor Yellow
    
    # Create database
    createdb taptap_dev 2>$null
    
    # Update environment for local database
    $env:DATABASE_URL = "postgresql://postgres@localhost:5432/taptap_dev"
    
    Write-Host "🔄 Running Prisma migrations..." -ForegroundColor Yellow
    npx prisma migrate dev --name init
    
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    npx prisma db seed
    
    Write-Host "✅ Database setup complete!" -ForegroundColor Green
    Write-Host "📊 Database URL: postgresql://postgres@localhost:5432/taptap_dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ Neither Docker nor PostgreSQL is available" -ForegroundColor Red
    Write-Host "💡 Please install either Docker Desktop or PostgreSQL" -ForegroundColor Yellow
    Write-Host "🐳 Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host "🐘 PostgreSQL: https://www.postgresql.org/download/" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup complete! You can now run:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
