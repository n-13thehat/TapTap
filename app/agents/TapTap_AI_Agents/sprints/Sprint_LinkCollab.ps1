# TapTap SPRINT — Auto-upgrade agents (safe & idempotent)
. "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\sprints\_lib.ps1"

\ = @{
  Muse      = @("Fable","Aura","Harmony")
  Hope      = @("Harmony","Echo","Serenity")
  Treasure  = @("Merit","Fortune","Haven")
  Harmony   = @("Hope","Muse","Lumen")
  Echo      = @("Aura","Nova","Charm")
  Aura      = @("Lumen","Echo","Fable")
  Merit     = @("Treasure","Fortune","Saga")
  Bliss     = @("Haven","Serenity","Echo")
  Haven     = @("Bliss","Merit","Prism")
  Prism     = @("Fortune","Saga","Harmony")
  Nova      = @("Lumen","Echo","Aura")
  Rune      = @("Saga","Prism","Lumen")
  Fable     = @("Muse","Aura","Saga")
  Saga      = @("Serenity","Rune","Prism")
  Charm     = @("Echo","Aura","Nova")
  Lumen     = @("Nova","Aura","Harmony")
  Fortune   = @("Prism","Merit","Treasure")
  Serenity  = @("Saga","Hope","Bliss")
}

Get-AgentFiles | ForEach-Object {
  \ = Read-Agent \.FullName
  \.collab = \[\.name]
  Save-Agent \ \.FullName
}
Write-Host "✅ Sprint: Collaboration graph linked"
