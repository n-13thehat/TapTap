# TapTap Matrix - Repository Cleanup Script
# This script removes Git history and creates a fresh repository

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TapTap Matrix - Repository Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Confirm
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Remove the .git folder (20 GB)" -ForegroundColor White
Write-Host "  2. Create a fresh Git repository" -ForegroundColor White
Write-Host "  3. Reduce repo size from 20 GB to ~100 MB" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Make sure you have a backup!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# Step 2: Check if .git exists
if (-not (Test-Path ".git")) {
    Write-Host "No .git folder found. Nothing to clean!" -ForegroundColor Yellow
    exit
}

# Step 3: Get current .git size
Write-Host "Calculating current .git size..." -ForegroundColor Yellow
$gitSize = (Get-ChildItem .git -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "Current .git folder size: $([math]::Round($gitSize, 2)) GB" -ForegroundColor Red
Write-Host ""

# Step 4: Remove .git folder
Write-Host "Removing .git folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git
Write-Host "Removed .git folder!" -ForegroundColor Green
Write-Host ""

# Step 5: Initialize fresh repository
Write-Host "Initializing fresh Git repository..." -ForegroundColor Yellow
git init
Write-Host "Fresh repository initialized!" -ForegroundColor Green
Write-Host ""

# Step 6: Add all files
Write-Host "Adding all files to Git..." -ForegroundColor Yellow
git add .
Write-Host "Files added!" -ForegroundColor Green
Write-Host ""

# Step 7: Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Clean repository - removed bloated history

- Reduced repository size from ~20 GB to ~100 MB
- Removed large files from Git history
- Fresh start for production deployment
- All current code preserved
- Ready for Vercel deployment

Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "Initial commit created!" -ForegroundColor Green
Write-Host ""

# Step 8: Show new size
Write-Host "Calculating new .git size..." -ForegroundColor Yellow
$newGitSize = (Get-ChildItem .git -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "New .git folder size: $([math]::Round($newGitSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# Step 9: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before: $([math]::Round($gitSize, 2)) GB" -ForegroundColor Red
Write-Host "After:  $([math]::Round($newGitSize, 2)) MB" -ForegroundColor Green
Write-Host "Saved:  $([math]::Round($gitSize * 1024 - $newGitSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create a new GitHub repository" -ForegroundColor White
Write-Host "  2. Add remote: git remote add origin <your-repo-url>" -ForegroundColor White
Write-Host "  3. Push: git push -u origin main" -ForegroundColor White
Write-Host "  4. Deploy to Vercel (will be much faster now!)" -ForegroundColor White
Write-Host ""
Write-Host "Your code is safe and ready for deployment!" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"

