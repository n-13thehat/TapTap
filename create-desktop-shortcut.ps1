# Create Desktop Shortcut for TapTap Matrix
param(
    [switch]$Force
)

Write-Host "Creating TapTap Matrix Desktop Shortcut..." -ForegroundColor Cyan

# Get paths
$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "TapTap Matrix.lnk"
$iconPath = Join-Path $projectPath "public\branding\tap-logo.png"
$launcherPath = Join-Path $projectPath "launch-taptap-matrix.bat"

# Check if shortcut already exists
if ((Test-Path $shortcutPath) -and -not $Force) {
    $response = Read-Host "Desktop shortcut already exists. Overwrite? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Shortcut creation cancelled." -ForegroundColor Yellow
        exit
    }
}

try {
    # Create WScript Shell object
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    
    # Set shortcut properties
    $Shortcut.TargetPath = $launcherPath
    $Shortcut.WorkingDirectory = $projectPath
    $Shortcut.Description = "Launch TapTap Matrix - The Future of Music"
    $Shortcut.WindowStyle = 1  # Normal window
    
    # Set icon if it exists
    if (Test-Path $iconPath) {
        $Shortcut.IconLocation = $iconPath
    }
    
    # Save the shortcut
    $Shortcut.Save()
    
    Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host "📍 Location: $shortcutPath" -ForegroundColor Gray
    
    # Also create a Start Menu shortcut
    $startMenuPath = [Environment]::GetFolderPath("StartMenu")
    $startMenuShortcutPath = Join-Path $startMenuPath "Programs\TapTap Matrix.lnk"
    
    # Create Start Menu directory if it doesn't exist
    $startMenuDir = Split-Path $startMenuShortcutPath -Parent
    if (-not (Test-Path $startMenuDir)) {
        New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
    }
    
    $StartMenuShortcut = $WshShell.CreateShortcut($startMenuShortcutPath)
    $StartMenuShortcut.TargetPath = $launcherPath
    $StartMenuShortcut.WorkingDirectory = $projectPath
    $StartMenuShortcut.Description = "Launch TapTap Matrix - The Future of Music"
    $StartMenuShortcut.WindowStyle = 1
    
    if (Test-Path $iconPath) {
        $StartMenuShortcut.IconLocation = $iconPath
    }
    
    $StartMenuShortcut.Save()
    
    Write-Host "✅ Start Menu shortcut created successfully!" -ForegroundColor Green
    Write-Host "📍 Location: $startMenuShortcutPath" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to create shortcut: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 TapTap Matrix shortcuts are ready!" -ForegroundColor Cyan
Write-Host "You can now launch TapTap Matrix from:" -ForegroundColor White
Write-Host "  • Desktop shortcut" -ForegroundColor Green
Write-Host "  • Start Menu" -ForegroundColor Green
Write-Host "  • Double-clicking launch-taptap-matrix.bat" -ForegroundColor Green
Write-Host ""

# Ask if user wants to launch now
$launch = Read-Host "Would you like to launch TapTap Matrix now? (y/n)"
if ($launch -eq "y" -or $launch -eq "Y") {
    Write-Host "Launching TapTap Matrix..." -ForegroundColor Yellow
    Start-Process $launcherPath
}
