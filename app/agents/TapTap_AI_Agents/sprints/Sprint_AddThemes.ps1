# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  if (-not \.theme) { \ | Add-Member -NotePropertyName theme -NotePropertyValue @{ primary="#888888"; emoji="✨" } }
  if (-not \.theme.accent) { \.theme.accent = "auto" }
  if (-not \.theme.anim) { \.theme.anim = "soft-glow" }
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: Theme tokens added"
