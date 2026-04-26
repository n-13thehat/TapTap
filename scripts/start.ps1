# TapTap Matrix - Startup Script
# Choose between Docker or Native PostgreSQL

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("docker", "native", "help")]
    [string]$Mode = "help"
)

function Show-Help {
    Write-Host @"

TapTap Matrix - Startup Options
================================

Usage: .\scripts\start.ps1 -Mode <docker|native>

Options:
  docker    Run everything in Docker (PostgreSQL + Redis + Next.js)
  native    Run Next.js locally with native PostgreSQL on port 5433
  help      Show this help message

Examples:
  .\scripts\start.ps1 -Mode docker
  .\scripts\start.ps1 -Mode native

"@ -ForegroundColor Cyan
}

function Start-Docker {
    Write-Host "🐳 Starting TapTap Matrix in Docker mode..." -ForegroundColor Green
    
    # Stop any running local dev server
    Write-Host "Stopping local dev servers..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*node.exe*"} | Stop-Process -Force
    
    # Start Docker services
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host @"

✅ Docker services started!

Services:
  - PostgreSQL: localhost:5432
  - Redis: localhost:6379
  - Next.js App: http://localhost:3000

View logs:
  docker-compose logs -f

Stop services:
  docker-compose down

"@ -ForegroundColor Green
}

function Start-Native {
    Write-Host "💻 Starting TapTap Matrix in Native mode..." -ForegroundColor Green
    
    # Check if native PostgreSQL is running
    $pgRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
    if (-not $pgRunning) {
        Write-Host "⚠️  PostgreSQL is not running!" -ForegroundColor Red
        Write-Host "Please start PostgreSQL service or install it using:" -ForegroundColor Yellow
        Write-Host "  .\scripts\install-postgres-windows.ps1" -ForegroundColor Cyan
        return
    }
    
    # Stop Docker services if running
    Write-Host "Stopping Docker services..." -ForegroundColor Yellow
    docker-compose down
    
    # Update .env.local for native mode
    Write-Host "Configuring for native PostgreSQL..." -ForegroundColor Yellow
    $envContent = Get-Content .env.local -Raw
    $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL="postgresql://postgres:password@localhost:5433/taptap_dev"'
    $envContent = $envContent -replace 'DIRECT_URL=.*', 'DIRECT_URL="postgresql://postgres:password@localhost:5433/taptap_dev"'
    $envContent | Set-Content .env.local
    
    # Start Next.js
    Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
    pnpm dev
}

# Main execution
switch ($Mode) {
    "docker" { Start-Docker }
    "native" { Start-Native }
    "help" { Show-Help }
    default { Show-Help }
}

