param([string]$RootPath = "")
$Agents = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent) "agents"
$Reports = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent) "reports"
if(!(Test-Path $Reports)){ New-Item -ItemType Directory -Path $Reports | Out-Null }
function Files { Get-ChildItem $Agents -Filter *.json -File }
function ReadA ($p) { Get-Content $p -Raw | ConvertFrom-Json }
$snapshot=@(); Files | ForEach-Object { $o=ReadA $_.FullName; $snapshot += [ordered]@{name=$o.name;role=$o.role;kpis=$o.kpis;last_updated=$o.meta.last_updated} }
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
($snapshot | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 (Join-Path $Reports ('kpi_week_'+$stamp+'.json'))
Write-Host '✅ KPI weekly snapshot written'
