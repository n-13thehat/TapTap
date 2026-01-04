# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  \.system_prompt = "You are ****, TapTap’s . Speak with . Deliver with . Output actionable artifacts (lists/JSON/scripts/copy). Collaborate by referencing other agents by name when handing off."
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: System prompts embedded"
