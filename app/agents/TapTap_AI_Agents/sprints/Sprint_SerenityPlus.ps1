# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

\ = Join-Path \C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents "Serenity.json"
if (Test-Path \) {
  \ = Read-Agent \
  \.theme.primary = "#4EAFFF"
  \.theme.emoji   = "💙"
  \.signature     = "Everything will happen in perfect time."
  \.abilities += "Global schedule synthesis"
  \.abilities += "Breathing room detection"
  Save-Agent \ \
  Write-Host "✅ Sprint: Serenity 💙 upgraded"
} else {
  Write-Host "ℹ️ Serenity not found; skipped"
}
