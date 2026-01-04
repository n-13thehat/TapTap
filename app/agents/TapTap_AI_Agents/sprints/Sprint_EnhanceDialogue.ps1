# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  \.dialogue = @{
    phrasing="signature-refined"
    emotional_consistency="boosted"
    cadence="optimized"
    outputs="concise-actionable"
  }
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: Dialogue enhanced"
