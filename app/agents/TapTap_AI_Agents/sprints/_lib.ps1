# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
param([string]\ = "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents")

\C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents = Join-Path \ "agents"
if (!(Test-Path \C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents)) { Write-Error "Agents folder not found: \C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents"; exit 1 }

function Get-AgentFiles { Get-ChildItem \C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents -Filter *.json -File }
function Read-Agent([string]\) { Get-Content \ -Raw | ConvertFrom-Json }
function Save-Agent(\, [string]\) {
  \ = \ | ConvertTo-Json -Depth 20
  \ | Set-Content -Encoding UTF8 \
}
