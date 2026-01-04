@echo off
title TapTap Matrix Launcher
color 0A

echo.
echo  ████████╗ █████╗ ██████╗ ████████╗ █████╗ ██████╗ 
echo  ╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
echo     ██║   ███████║██████╔╝   ██║   ███████║██████╔╝
echo     ██║   ██╔══██║██╔═══╝    ██║   ██╔══██║██╔═══╝ 
echo     ██║   ██║  ██║██║        ██║   ██║  ██║██║     
echo     ╚═╝   ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝     
echo.
echo                    MATRIX LAUNCHER
echo.
echo [1] Launch TapTap Matrix (Development)
echo [2] Launch TapTap Matrix (Production Build)
echo [3] Build Electron App
echo [4] Open Project Folder
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto build
if "%choice%"=="4" goto folder
if "%choice%"=="5" goto exit

:dev
echo.
echo Starting TapTap Matrix in development mode...
echo.
cd /d "%~dp0"
npm run electron:dev
pause
goto menu

:prod
echo.
echo Starting TapTap Matrix production build...
echo.
cd /d "%~dp0"
if exist "dist-electron" (
    start "" "dist-electron\win-unpacked\TapTap Matrix.exe"
) else (
    echo Production build not found. Please build first using option 3.
    pause
)
goto menu

:build
echo.
echo Building TapTap Matrix Electron app...
echo.
cd /d "%~dp0"
npm run electron:build
pause
goto menu

:folder
echo.
echo Opening project folder...
start "" "%~dp0"
goto menu

:exit
echo.
echo Goodbye! Thanks for using TapTap Matrix.
timeout /t 2 >nul
exit

:menu
cls
goto start
