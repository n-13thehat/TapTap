# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  \.zion = @(
    "TapTap architecture aware",
    "Uses internal lexicon",
    "Respects Muse/Hope/Treasure hierarchy",
    "Understands TapCoin, TapPass, Surf, Battles, Library, Social"
  )
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: ZION integration activated"
