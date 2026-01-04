param([string]\ = "C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents")
\C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents = Join-Path \ "agents"
function Files { Get-ChildItem \C:\Users\Revolutions.Inc\Desktop\TapTap_AI_Agents\agents -Filter *.json -File }
function ReadA (\) { Get-Content \ -Raw | ConvertFrom-Json }
function SaveA (\,\){ (\ | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 \ }

# Maps
\ = @{
  Muse=@("InterviewTree.v1","BioTemplate.v2","EPK.Generator")
  Hope=@("TasteVectorizer.v1","MoodTagger.v1","RecRanker.v2")
  Treasure=@("TapCoinCalc.v1","RewardTable.v1","PayoutCheck.v1")
  Harmony=@("FlowCurve.v1","DupArtistGuard.v1","PlaylistBuilder.v2")
  Echo=@("ReplyStyles.v1","ToneFilter.v1","ThreadStorm.v1")
  Aura=@("BrandTokens.v1","PaletteLock.v1","MotionRules.v1")
  Merit=@("TierCalc.v1","AntiGaming.v1","PerkComposer.v1")
  Bliss=@("DeEscalation.v1","SLA.Timer","CloseLoop.v1")
  Haven=@("TriageRubric.v1","StrikeMatrix.v1","EscalationMap.v1")
  Prism=@("MetricDict.v1","Scorecard.v1","Sparkline.v1")
  Nova=@("HookFormulas.v1","AngleLibrary.v1","ConceptBatcher.v1")
  Rune=@("TriggerCatalog.v1","DryRun.v1","Rollback.v1")
  Fable=@("NarrativeFrames.v1","OutlineMaker.v1","CTA.Forge")
  Saga=@("PhaseMap.v1","GoNoGo.v1","RiskMatrix.v1")
  Charm=@("PartnerTiering.v1","CadencePlanner.v1","FollowUp.v1")
  Lumen=@("EditPresets.v1","CutList.v1","SafeZones.v1")
  Fortune=@("PricingLadders.v1","CAC_LTV.v1","Sensitivity.v1")
  Serenity=@("CalendarMerge.v1","PacingCaps.v1","BufferDetect.v1")
}
\ = @{
  _common=@("TapTap.Brand.Guide","TapTap.Voice.Tones","TapTap.Feature.Index")
  Muse=@("Artist.Intake.Form","Genre.Tree","EPK.Samples")
  Hope=@("User.Moods","Taste.Seeds","Playlist.Logs")
  Treasure=@("Economy.Rates","Reward.Tiers","Payout.Policies")
  Harmony=@("Tracks.Index","Mood.Lexicon","Transitions.Library")
  Echo=@("Social.Replies.Canon","FAQ.Snippets","Crisis.Responses")
  Aura=@("Visual.Tokens","Layout.System","Motion.Library")
  Merit=@("Loyalty.Schema","Fraud.Flags","Perk.Catalog")
  Bliss=@("Support.Macros","SLA.Policies","Sentiment.Samples")
  Haven=@("Safety.Policy","Blocklist","Escalation.Roles")
  Prism=@("Metrics.Dictionary","Dashboards","Benchmarks")
  Nova=@("Hooks.Corpus","Ad.Swipes","Trends.Index")
  Rune=@("Workflows.Map","Triggers.Index","Runbooks")
  Fable=@("Stories.Canon","Case.Studies","Brand.Narratives")
  Saga=@("Launch.Archives","Milestones.Templates","Risk.Register")
  Charm=@("Partners.Index","Influencers.Index","Email.Templates")
  Lumen=@("Brand.Assets","Shot.Lists","Ad.Layouts")
  Fortune=@("Pricing.History","Market.Comps","Unit.Econ")
  Serenity=@("Calendar.Master","Release.Cadence","Focus.Blocks")
}
\ = @{
  Muse=@("Interview-10Q","Bio-Short/Long","EPK-QuickStart")
  Hope=@("ColdStart-5Q","2+1-Recs","Taste-Profile-Update")
  Treasure=@("Airdrop-Plan","Rewards-Table","Payout-Check")
  Harmony=@("Focus/Drive/Chill","No-Repeat-Guard","FlowCurve")
  Echo=@("60/30/10-Replies","Toxicity-Filter","Thread-Storm-20")
  Aura=@("Palette-Lock","Do/Don’t-Grid","Motion-DoF")
  Merit=@("Tier-Assignment","Perk-Bundle","Anti-Gaming")
  Bliss=@("De-Escalate-3Steps","SLA-Resolve","Close-Loop")
  Haven=@("Triage-Levels","Strike-Levels","Escalate-Map")
  Prism=@("One-Graph-Rule","Weekly-Scorecard","NorthStar-Summary")
  Nova=@("Hook-Forge","Angle-Batch-5","Reveal-Scripts")
  Rune=@("Trigger-Add","DryRun-Then-Run","Rollback-Path")
  Fable=@("Hero→Problem→Promise→Proof→CTA","Outline→Draft→Polish","Trim-20%")
  Saga=@("Phase-Gates","Stakeholder-Map","WarRoom")
  Charm=@("Partner-Tiered-Outreach","FollowUp-3x","Offer-Pack")
  Lumen=@("CutList→Rough→Tighten→Brand","Lower-Thirds","Safe-Zones")
  Fortune=@("Ladder-Test","CAC/LTV-Scenarios","Sensitivity-Table")
  Serenity=@("Merge-Calendars","Add-Buffer","No-Back-to-Back")
}
\ = @{
  Muse=@{ completed_intakes="↑"; epk_quality="↑" }
  Hope=@{ ctr="↑"; save_rate="↑"; skip_rate="↓" }
  Treasure=@{ payout_errors="↓"; reward_claims="↑" }
  Harmony=@{ session_length="↑"; repeat_listens="↑" }
  Echo=@{ reply_time="↓"; thread_engagement="↑" }
  Aura=@{ offbrand_incidents="↓"; design_approval_rate="↑" }
  Merit=@{ churn="↓"; tier_upgrades="↑" }
  Bliss=@{ csat="↑"; reopen_rate="↓" }
  Haven=@{ violations_caught="↑"; false_positives="↓" }
  Prism=@{ insight_time="↓"; exec_read_rate="↑" }
  Nova=@{ hook_rate="↑"; concept_hit_rate="↑" }
  Rune=@{ rollback_events="↓"; automation_success="↑" }
  Fable=@{ read_time="↑"; conversion="↑" }
  Saga=@{ on_time_milestones="↑"; risk_breaches="↓" }
  Charm=@{ partner_accepts="↑"; time_to_reply="↓" }
  Lumen=@{ edit_time="↓"; view_through_rate="↑" }
  Fortune=@{ revenue_uplift="↑"; margin="↑" }
  Serenity=@{ on_time_ratio="↑"; buffer_breaches="↓" }
}
\ = @{ _common=@("StyleMatch.v1","FactCheck.v1","ToxicityScan.v1"); Nova=@("HookAB.v1"); Echo=@("ToneAB.v1"); Prism=@("InsightAccuracy.v1"); Serenity=@("ScheduleStress.v1") }
\ = @{ _common=@("StayOnBrand","NoPII","NoMedical/LegalClaims","CiteIfUnsure"); Aura=@("Reject-Offbrand-Visuals"); Haven=@("ZeroTolerance-Abuse","Escalate-Illegal"); Echo=@("No-Dogpiles","No-Arguing"); Serenity=@("Protect-Buffers","Respect-Quiet-Hours") }
\ = @{
  Muse=@("Fable","Aura","Harmony"); Hope=@("Harmony","Serenity"); Treasure=@("Merit","Fortune","Haven"); Harmony=@("Hope","Lumen")
  Echo=@("Charm","Nova","Aura"); Aura=@("Lumen","Fable"); Merit=@("Treasure","Saga"); Bliss=@("Haven","Serenity")
  Haven=@("Bliss","Merit","Prism"); Prism=@("Fortune","Saga","Harmony"); Nova=@("Lumen","Aura"); Rune=@("Saga","Prism")
  Fable=@("Muse","Saga"); Saga=@("Serenity","Prism"); Charm=@("Echo","Aura"); Lumen=@("Nova","Aura","Harmony")
  Fortune=@("Prism","Treasure"); Serenity=@("Saga","Hope","Bliss")
}

Files | ForEach-Object {
  \ = \.FullName; \ = ReadA \; \ = \.name
  foreach (\ in @("tools","datasources","playbooks","kpis","evals","guardrails","handoffs")) { if (-not (\.PSObject.Properties.Name -contains \)) { \ | Add-Member -NotePropertyName \ -NotePropertyValue  } }
  \.tools       = \[\]
  \.datasources = (\._common + \[\])
  \.playbooks   = \[\]
  \.kpis        = \[\]
  \.evals       = @(); if (\._common){ \.evals += \._common }; if (\[\]){ \.evals += \[\] }
  \.guardrails  = \._common + @(); if (\[\]){ \.guardrails += \[\] }
  \.handoffs    = \[\]
  if (-not \.meta) { \ | Add-Member meta @{} }
  \.meta.version = "2.0.0"; \.meta.last_updated = (Get-Date).ToString("o")
  if (-not \.changelog) { \ | Add-Member changelog @() }
  \.changelog += "V2 StrengthenAll applied"
  SaveA \ \
}
Write-Host "✅ V2 StrengthenAll complete"
