param([string]$RootPath = "")
$Agents = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent) "agents"
function PathOf($n){ Join-Path $Agents ($n+'.json') }
function ReadA ($p){ Get-Content $p -Raw | ConvertFrom-Json }
function SaveA ($o,$p){ ($o | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 $p }
$p=PathOf 'Serenity'
if(Test-Path $p){
  $o=ReadA $p
  $o.cadence=@{min_buffer_minutes=15;avoid_back_to_back=$true;quiet_hours_local=@{start='22:00';end='07:00';timezone='America/New_York'};cooldown_windows=@('Mon 09:00-11:00 prep','Fri 16:00-18:00 freeze')}
  if(-not $o.changelog){ $o | Add-Member changelog @() }
  $o.changelog += 'V2 Serenity cadence rules added'
  SaveA $o $p
  Write-Host '✅ Serenity cadence rules applied'
} else { Write-Host 'ℹ️ Serenity not found; cadence skipped' }
