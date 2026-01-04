# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  \.mastery = @{ precision=95; creativity=90; speed=87; consistency=98; collaboration=92 }
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: Mastery stats set"
