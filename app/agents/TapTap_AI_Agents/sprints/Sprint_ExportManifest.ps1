param([string]$RootPath = "")
$RootPath = if($RootPath){$RootPath} else { Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent }
$Agents  = Join-Path $RootPath 'agents'
$Prompts = Join-Path $RootPath 'prompts'
if(!(Test-Path $Prompts)){ New-Item -ItemType Directory -Path $Prompts | Out-Null }
function Files { Get-ChildItem $Agents -Filter *.json -File }
function ReadA ($p) { Get-Content $p -Raw | ConvertFrom-Json }
$all=@(); Files | ForEach-Object { $all += (ReadA $_.FullName) }
($all | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 (Join-Path $RootPath 'agents.manifest.json')
Files | ForEach-Object {
  $o=ReadA $_.FullName
  $lines = @(
    'System: You are **'+$o.name+'**, TapTap’s '+$o.role+'.',
    'Tone: '+$o.tone+' | Vibe: '+$o.vibe+' | Signature: '+$o.signature,
    'Guardrails: '+(($o.guardrails -join ", ")),
    '',
    'Command:',
    '@'+$o.name+' → <action> :: <inputs>'
  )
  $content = [string]::Join("`r`n", $lines)
  Set-Content -Encoding UTF8 (Join-Path $Prompts ($o.name+'.prompt.txt')) $content
}
Write-Host '✅ Manifest & prompt stubs exported'
