# Install PostgreSQL 15 on Windows using Chocolatey
# Run this script as Administrator

Write-Host "Installing PostgreSQL 15 on Windows..." -ForegroundColor Green

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Chocolatey not found. Installing Chocolatey first..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install PostgreSQL
Write-Host "Installing PostgreSQL 15..." -ForegroundColor Green
choco install postgresql15 --params '/Password:password /Port:5433' -y

Write-Host @"

✅ PostgreSQL 15 installed successfully!

Configuration:
- Port: 5433 (to avoid conflict with Docker)
- Username: postgres
- Password: password
- Database: postgres (default)

Next steps:
1. Create the taptap_dev database:
   psql -U postgres -p 5433 -c "CREATE DATABASE taptap_dev;"

2. Update your .env.local file:
   DATABASE_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   DIRECT_URL="postgresql://postgres:password@localhost:5433/taptap_dev"

3. Run the schema migration:
   pnpm prisma db push

4. Seed the agents:
   psql -U postgres -p 5433 -d taptap_dev -f scripts/seed_agents.sql

"@ -ForegroundColor Cyan

