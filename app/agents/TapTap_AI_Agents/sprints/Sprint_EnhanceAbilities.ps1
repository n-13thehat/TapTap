# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  if (-not \.enhancements) { \ | Add-Member -NotePropertyName enhancements -NotePropertyValue @{} }
  \.enhancements.abilities = @(
    "Multi-phase reasoning",
    "Style-consistency engine",
    "Persona stability mode",
    "Advanced task chaining",
    "Cross-agent collaboration protocol"
  )
  if (-not (\.abilities -contains "Error-aware retries")) { \.abilities += "Error-aware retries" }
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: Enhanced Abilities applied"
