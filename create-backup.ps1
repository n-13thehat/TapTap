# TapTap Matrix - Create Backup Script
# This script creates a backup of your repository before cleanup

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TapTap Matrix - Create Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory name
$currentDir = Split-Path -Leaf (Get-Location)
Write-Host "Current directory: $currentDir" -ForegroundColor White
Write-Host ""

# Create backup name with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupName = "TapTap_Matrix_BACKUP_$timestamp"
$parentDir = Split-Path -Parent (Get-Location)
$backupPath = Join-Path $parentDir $backupName

Write-Host "Backup will be created at:" -ForegroundColor Yellow
Write-Host "  $backupPath" -ForegroundColor White
Write-Host ""

# Estimate size
Write-Host "Calculating repository size..." -ForegroundColor Yellow
$totalSize = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "Repository size: $([math]::Round($totalSize, 2)) GB" -ForegroundColor White
Write-Host ""

Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Create backup? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Green
Write-Host "Please wait, this may take 5-10 minutes for a 20 GB repository..." -ForegroundColor Yellow
Write-Host ""

# Create backup
try {
    Copy-Item -Path (Get-Location) -Destination $backupPath -Recurse -ErrorAction Stop
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "BACKUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backup location:" -ForegroundColor Green
    Write-Host "  $backupPath" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now safely run cleanup-repo.ps1" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a manual backup before proceeding." -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"

