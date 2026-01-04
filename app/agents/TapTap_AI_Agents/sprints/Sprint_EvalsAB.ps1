param([string]$RootPath = "")
$Agents = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent) "agents"
function Files { Get-ChildItem $Agents -Filter *.json -File }
function ReadA ($p) { Get-Content $p -Raw | ConvertFrom-Json }
function SaveA ($o,$p){ ($o | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 $p }
$abTargets = @('Nova','Echo','Prism','Aura','Lumen','Charm','Fable','Hope')
Files | ForEach-Object {
  $p=$_.FullName; $o=ReadA $p
  if($abTargets -contains $o.name){
    $o.ab_test=@{enabled=$true;variants=@('A','B');sample=0.2;metrics=@('ctr','hook_rate','reply_quality','exec_read_rate');log=("reports/ab_"+(Get-Date).ToString('yyyyMMdd_HHmmss')+"_"+($o.name)+".json")}
    if(-not $o.changelog){ $o | Add-Member changelog @() }
    $o.changelog += 'V2 AB eval config attached'
    SaveA $o $p
  }
}
Write-Host '✅ A/B eval configs attached'
