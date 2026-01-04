function Test-Cli {
  param([Parameter(Mandatory=$true)][string]$Name)
  $null = & $Name --version 2>$null
  return $LASTEXITCODE -eq 0
}
function Ensure-Dir { param([Parameter(Mandatory=$true)][string]$Path); if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null } }
function Write-Step($msg){ Write-Host "→ $msg" -ForegroundColor Cyan }
function Write-Next($msg){ Write-Host "› $msg" -ForegroundColor DarkCyan }
function Write-Todo($msg){ Write-Host "• TODO: $msg" -ForegroundColor Yellow }
Export-ModuleMember -Function Test-Cli,Ensure-Dir,Write-Step,Write-Next,Write-Todo

