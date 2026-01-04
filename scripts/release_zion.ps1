param(
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "staging",
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$SkipDbSeed
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    try {
        & $Action
        Write-Host "✓ $Name completed" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $Name failed" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        throw
    }
}

function Ensure-Command {
    param(
        [string]$Command
    )

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Required command '$Command' was not found on PATH."
    }
}

Invoke-Step "Pre-flight checks" {
    Ensure-Command "pnpm"
    Ensure-Command "node"

    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    if (-not (Test-Path ".env.local")) {
        throw ".env.local is missing. Create it from .env.local.example before running this script."
    }

    $envLines = Get-Content ".env.local" | Where-Object { $_ -and -not $_.Trim().StartsWith("#") }
    $pairs = @()
    foreach ($line in $envLines) {
        if ($line -match "^\s*([^=\s\[]+)\s*=") {
            $pairs += $Matches[1].Trim()
        }
    }

    $dupes = $pairs | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dupes) {
        Write-Host "Warning: duplicate keys detected in .env.local:" -ForegroundColor Yellow
        $dupes | ForEach-Object { Write-Host "  $($_.Name) (count=$($_.Count))" -ForegroundColor Yellow }
        Write-Host "Review and normalize .env.local before production." -ForegroundColor Yellow
    }
}

Invoke-Step "Prisma generate" {
    pnpm prisma generate
}

Invoke-Step "Prisma db push" {
    if ($Environment -eq "production") {
        Write-Host "Warning: running prisma db push against production is risky." -ForegroundColor Yellow
        $confirm = Read-Host "Type 'YES' to continue with db push to production database"
        if ($confirm -ne "YES") {
            throw "Aborted prisma db push to production."
        }
    }
    pnpm prisma:push
}

if (-not $SkipDbSeed) {
    Invoke-Step "Database seed" {
        pnpm db:seed
    }
}
else {
    Write-Host "Skipping database seed (SkipDbSeed set)." -ForegroundColor Yellow
}

if (-not $SkipTests) {
    Invoke-Step "Run tests" {
        pnpm test
    }
}
else {
    Write-Host "Skipping tests (SkipTests set)." -ForegroundColor Yellow
}

if (-not $SkipBuild) {
    Invoke-Step "Build application" {
        pnpm build
    }
}
else {
    Write-Host "Skipping build (SkipBuild set)." -ForegroundColor Yellow
}

Invoke-Step "Health check (if server is running)" {
    $healthUrl = "http://localhost:3000/api/health?detailed=true"
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
        Write-Host "Health endpoint status code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Body:" -ForegroundColor DarkGray
        Write-Host $response.Content
    }
    catch {
        Write-Host "Unable to reach $healthUrl. Ensure 'pnpm dev' or 'pnpm start' is running." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Manual tasks remaining (summary) ===" -ForegroundColor Cyan
Write-Host "- Phase 2: Manual QA of key routes on desktop and mobile, fix any UI/navigation issues." -ForegroundColor Gray
Write-Host "- Phase 3: Add tests where coverage is low (auth, upload, library, surf/social, admin tools)." -ForegroundColor Gray
Write-Host "- Phase 4: Final security review (RBAC matrix, Zod validation, upload hardening, secret rotation)." -ForegroundColor Gray
Write-Host "- Phase 5: Configure CI/CD pipeline, Docker image, and monitoring/alerts in your infra." -ForegroundColor Gray
Write-Host "- Phase 6: Run media/admin flows end-to-end and decide v1 feature scope; gate others by flags/roles." -ForegroundColor Gray
Write-Host "- Phase 7: Finalize docs, launch checklist, and user-facing release notes." -ForegroundColor Gray

Write-Host ""
Write-Host "Release helper script completed." -ForegroundColor Green

