# TapTap Matrix PowerShell Launcher
param(
    [string]$Mode = "menu"
)

# Set console colors
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

function Show-Banner {
    Write-Host ""
    Write-Host " ████████╗ █████╗ ██████╗ ████████╗ █████╗ ██████╗ " -ForegroundColor Cyan
    Write-Host " ╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗" -ForegroundColor Cyan
    Write-Host "    ██║   ███████║██████╔╝   ██║   ███████║██████╔╝" -ForegroundColor Cyan
    Write-Host "    ██║   ██╔══██║██╔═══╝    ██║   ██╔══██║██╔═══╝ " -ForegroundColor Cyan
    Write-Host "    ██║   ██║  ██║██║        ██║   ██║  ██║██║     " -ForegroundColor Cyan
    Write-Host "    ╚═╝   ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝     " -ForegroundColor Cyan
    Write-Host ""
    Write-Host "                   MATRIX LAUNCHER" -ForegroundColor Yellow
    Write-Host ""
}

function Show-Menu {
    Show-Banner
    Write-Host "[1] Launch TapTap Matrix (Development)" -ForegroundColor Green
    Write-Host "[2] Launch TapTap Matrix (Production Build)" -ForegroundColor Green
    Write-Host "[3] Build Electron App" -ForegroundColor Green
    Write-Host "[4] Open Project Folder" -ForegroundColor Green
    Write-Host "[5] Check System Requirements" -ForegroundColor Green
    Write-Host "[6] Exit" -ForegroundColor Red
    Write-Host ""
}

function Start-Development {
    Write-Host "Starting TapTap Matrix in development mode..." -ForegroundColor Yellow
    Write-Host ""
    Set-Location $PSScriptRoot
    npm run electron:dev
    Read-Host "Press Enter to continue"
}

function Start-Production {
    Write-Host "Starting TapTap Matrix production build..." -ForegroundColor Yellow
    Write-Host ""
    $exePath = Join-Path $PSScriptRoot "dist-electron\win-unpacked\TapTap Matrix.exe"
    if (Test-Path $exePath) {
        Start-Process $exePath
        Write-Host "TapTap Matrix launched successfully!" -ForegroundColor Green
    } else {
        Write-Host "Production build not found. Please build first using option 3." -ForegroundColor Red
        Read-Host "Press Enter to continue"
    }
}

function Build-App {
    Write-Host "Building TapTap Matrix Electron app..." -ForegroundColor Yellow
    Write-Host ""
    Set-Location $PSScriptRoot
    npm run electron:build
    Read-Host "Press Enter to continue"
}

function Open-ProjectFolder {
    Write-Host "Opening project folder..." -ForegroundColor Yellow
    Start-Process explorer.exe $PSScriptRoot
}

function Check-Requirements {
    Write-Host "Checking system requirements..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm not found" -ForegroundColor Red
    }
    
    # Check if dependencies are installed
    if (Test-Path "node_modules") {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Dependencies not installed. Run 'npm install'" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Main execution
if ($Mode -eq "dev") {
    Start-Development
    exit
} elseif ($Mode -eq "prod") {
    Start-Production
    exit
} elseif ($Mode -eq "build") {
    Build-App
    exit
}

# Interactive menu
do {
    Clear-Host
    Show-Menu
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" { Start-Development }
        "2" { Start-Production }
        "3" { Build-App }
        "4" { Open-ProjectFolder }
        "5" { Check-Requirements }
        "6" { 
            Write-Host ""
            Write-Host "Goodbye! Thanks for using TapTap Matrix." -ForegroundColor Cyan
            Start-Sleep -Seconds 2
            exit 
        }
        default { 
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($true)
