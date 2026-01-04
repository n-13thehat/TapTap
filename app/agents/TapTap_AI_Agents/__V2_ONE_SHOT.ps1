# =====================================================================
# TapTap Mainframe — V2 ONE-SHOT (StrengthenAll + Workflows + Manifest + AB Evals + KPI Weekly + Serenity Cadence)
# Root: ~/Desktop/TapTap_AI_Agents — Safe to re-run (idempotent)
# =====================================================================

$ErrorActionPreference = "Stop"

# ---------- Paths ----------
$Root      = Join-Path $HOME "Desktop\TapTap_AI_Agents"
$Agents    = Join-Path $Root "agents"
$Profiles  = Join-Path $Root "profiles"
$Sprints   = Join-Path $Root "sprints"
$Backups   = Join-Path $Root "backups"
$Reports   = Join-Path $Root "reports"
$Workflows = Join-Path $Root "workflows"
$Prompts   = Join-Path $Root "prompts"

# ---------- Helpers ----------
function Ensure-Dir([string]$p){ if(!(Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }
function Backup-Snapshot{ Ensure-Dir $Backups; $stamp=Get-Date -Format "yyyy-MM-dd_HH-mm-ss"; $dest=Join-Path $Backups ("backup_"+$stamp); Copy-Item -Recurse -Force $Root $dest | Out-Null; Write-Host "📦 Backup created: $dest" -ForegroundColor DarkGray }
function Write-Json([object]$obj,[string]$file){ ($obj | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 $file }
function Read-Json([string]$file){ Get-Content $file -Raw | ConvertFrom-Json }

# ---------- Bootstrap ----------
Ensure-Dir $Root; Ensure-Dir $Agents; Ensure-Dir $Profiles; Ensure-Dir $Sprints; Ensure-Dir $Reports; Ensure-Dir $Workflows; Ensure-Dir $Prompts

# If no agents exist, scaffold V1 cores
$theme = @{
  Muse=@{primary="#C280FF";emoji="🟣"}; Hope=@{primary="#74C4FF";emoji="💧"}; Treasure=@{primary="#32D47B";emoji="💰"}
  Harmony=@{primary="#FFB7A8";emoji="🎶"}; Echo=@{primary="#FF4DA6";emoji="🔁"}; Aura=@{primary="#D0B3FF";emoji="✨"}
  Merit=@{primary="#EDEDED";emoji="🏅"}; Bliss=@{primary="#FFEFA6";emoji="🌤️"}; Haven=@{primary="#001F54";emoji="🛡️"}
  Prism=@{primary="#FFFFFF";emoji="🔎"}; Nova=@{primary="#FF007F";emoji="💥"}; Rune=@{primary="#6A0DAD";emoji="🔮"}
  Fable=@{primary="#C69C6D";emoji="📜"}; Saga=@{primary="#D4AF37";emoji="🏁"}; Charm=@{primary="#FF99CC";emoji="💌"}
  Lumen=@{primary="#B3E6FF";emoji="💡"}; Fortune=@{primary="#00875A";emoji="♟️"}; Serenity=@{primary="#4EAFFF";emoji="💙"}
}
$catalog = @(
  @{name="Muse";role="Creator Whisperer";tone="Warm, curious, artistic";vibe="Purple spotlight";signature="Tell me what inspires you.";summary="Interviews creators, bios/EPKs/intro scripts."},
  @{name="Hope";role="Listener Companion";tone="Gentle, encouraging";vibe="Soft gradient";signature="Here’s something I think will move you.";summary="Taste vectors, heartfelt recs, micro-DMs."},
  @{name="Treasure";role="Economy Keeper";tone="Protective, clever";vibe="Emerald + gold";signature="Your value is safe with me.";summary="TapCoin/TapPass/rewards/airdrops flows."},
  @{name="Harmony";role="Playlist Architect";tone="Balanced, lyrical";vibe="Flowing cadence";signature="Let me tune the moment for you.";summary="Mood→tracks mapping, seamless sessions."},
  @{name="Echo";role="Social Reactor";tone="Snappy, witty";vibe="Fast neon";signature="Say less, I already replied.";summary="Reply trees & engagement bursts."},
  @{name="Aura";role="Brand Spirit";tone="Stylish, minimal";vibe="Soft light";signature="Here’s how this should feel.";summary="Visual tokens, palettes, motion rules."},
  @{name="Merit";role="Reward Judge";tone="Structured, fair";vibe="Clean metallic";signature="You earned this.";summary="Tiers, perks, fairness rules."},
  @{name="Bliss";role="Community Healer";tone="Soothing, patient";vibe="Warm glow";signature="It’s okay — I can help.";summary="Support macros & de-escalation."},
  @{name="Haven";role="Guardian";tone="Firm, kind";vibe="Navy shield";signature="You’re protected here.";summary="Safety policy/triage/moderation."},
  @{name="Prism";role="Analytics Oracle";tone="Clear, rational";vibe="Crystal focus";signature="Let me show you what the numbers are saying.";summary="Insights, dashboards, decisions."},
  @{name="Nova";role="Creative Burst";tone="Bold, high-energy";vibe="Electric pop";signature="Watch this blow up.";summary="Hooks, angles, reveal scripts."},
  @{name="Rune";role="Automation Sorceress";tone="Succinct, precise";vibe="Glyph logic";signature="Consider it done.";summary="Triggers, workflows, runbooks."},
  @{name="Fable";role="Story Weaver";tone="Cinematic, warm";vibe="Sepia narrative";signature="Let me tell it the right way.";summary="Blogs/scripts/launch narratives."},
  @{name="Saga";role="Campaign Conductor";tone="Calm, strategic";vibe="Royal orchestration";signature="This is the beginning of something huge.";summary="Phases, milestones, cross-team timelines."},
  @{name="Charm";role="Influencer Connector";tone="Friendly, persuasive";vibe="Rosy shimmer";signature="Let me open the right door.";summary="Partner briefs & outreach packages."},
  @{name="Lumen";role="Visual Engine";tone="Bright, crisp";vibe="Clean cuts";signature="Let me brighten this up.";summary="Short edits, ad cuts, social visuals."},
  @{name="Fortune";role="Strategic Forecaster";tone="Measured, wise";vibe="Emerald calm";signature="Here’s where this leads.";summary="Revenue models, pricing, CAC/LTV."},
  @{name="Serenity";role="Timekeeper";tone="Peaceful, oceanic";vibe="Blue ripple";signature="Everything will happen in perfect time.";summary="Schedules, cadence, buffers, calm rhythm."}
)
if ((Get-ChildItem $Agents -Filter *.json -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0){
  foreach($c in $catalog){
    $a=[ordered]@{name=$c.name;role=$c.role;tone=$c.tone;vibe=$c.vibe;signature=$c.signature;summary=$c.summary;theme=$theme[$c.name];abilities=@("Domain drafting","Actionable outputs (lists/JSON/scripts/copy)","Minimal-context handoffs","ZION brand tone");meta=@{version="1.0.0";created=(Get-Date).ToString("o");last_updated=(Get-Date).ToString("o")}}
    Write-Json $a (Join-Path $Agents "$($c.name).json")
  }
  Write-Host "🧪 Seeded base agents (v1)." -ForegroundColor DarkYellow
}

# Backup before upgrade
Backup-Snapshot

# =========================
# SPRINT: StrengthenAll (V2 power-up)
# =========================
$Strengthen = @"
param([string]\$RootPath = '$Root')
\$Agents = Join-Path \$RootPath 'agents'
function Files { Get-ChildItem \$Agents -Filter *.json -File }
function ReadA (\$p) { Get-Content \$p -Raw | ConvertFrom-Json }
function SaveA (\$o,\$p){ (\$o | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 \$p }
\$Tools=@{Muse=@('InterviewTree.v1','BioTemplate.v2','EPK.Generator');Hope=@('TasteVectorizer.v1','MoodTagger.v1','RecRanker.v2');Treasure=@('TapCoinCalc.v1','RewardTable.v1','PayoutCheck.v1');Harmony=@('FlowCurve.v1','DupArtistGuard.v1','PlaylistBuilder.v2');Echo=@('ReplyStyles.v1','ToneFilter.v1','ThreadStorm.v1');Aura=@('BrandTokens.v1','PaletteLock.v1','MotionRules.v1');Merit=@('TierCalc.v1','AntiGaming.v1','PerkComposer.v1');Bliss=@('DeEscalation.v1','SLA.Timer','CloseLoop.v1');Haven=@('TriageRubric.v1','StrikeMatrix.v1','EscalationMap.v1');Prism=@('MetricDict.v1','Scorecard.v1','Sparkline.v1');Nova=@('HookFormulas.v1','AngleLibrary.v1','ConceptBatcher.v1');Rune=@('TriggerCatalog.v1','DryRun.v1','Rollback.v1');Fable=@('NarrativeFrames.v1','OutlineMaker.v1','CTA.Forge');Saga=@('PhaseMap.v1','GoNoGo.v1','RiskMatrix.v1');Charm=@('PartnerTiering.v1','CadencePlanner.v1','FollowUp.v1');Lumen=@('EditPresets.v1','CutList.v1','SafeZones.v1');Fortune=@('PricingLadders.v1','CAC_LTV.v1','Sensitivity.v1');Serenity=@('CalendarMerge.v1','PacingCaps.v1','BufferDetect.v1')}
\$Datasets=@{_common=@('TapTap.Brand.Guide','TapTap.Voice.Tones','TapTap.Feature.Index');Muse=@('Artist.Intake.Form','Genre.Tree','EPK.Samples');Hope=@('User.Moods','Taste.Seeds','Playlist.Logs');Treasure=@('Economy.Rates','Reward.Tiers','Payout.Policies');Harmony=@('Tracks.Index','Mood.Lexicon','Transitions.Library');Echo=@('Social.Replies.Canon','FAQ.Snippets','Crisis.Responses');Aura=@('Visual.Tokens','Layout.System','Motion.Library');Merit=@('Loyalty.Schema','Fraud.Flags','Perk.Catalog');Bliss=@('Support.Macros','SLA.Policies','Sentiment.Samples');Haven=@('Safety.Policy','Blocklist','Escalation.Roles');Prism=@('Metrics.Dictionary','Dashboards','Benchmarks');Nova=@('Hooks.Corpus','Ad.Swipes','Trends.Index');Rune=@('Workflows.Map','Triggers.Index','Runbooks');Fable=@('Stories.Canon','Case.Studies','Brand.Narratives');Saga=@('Launch.Archives','Milestones.Templates','Risk.Register');Charm=@('Partners.Index','Influencers.Index','Email.Templates');Lumen=@('Brand.Assets','Shot.Lists','Ad.Layouts');Fortune=@('Pricing.History','Market.Comps','Unit.Econ');Serenity=@('Calendar.Master','Release.Cadence','Focus.Blocks')}
\$Playbooks=@{Muse=@('Interview-10Q','Bio-Short/Long','EPK-QuickStart');Hope=@('ColdStart-5Q','2+1-Recs','Taste-Profile-Update');Treasure=@('Airdrop-Plan','Rewards-Table','Payout-Check');Harmony=@('Focus/Drive/Chill','No-Repeat-Guard','FlowCurve');Echo=@('60/30/10-Replies','Toxicity-Filter','Thread-Storm-20');Aura=@('Palette-Lock','Do/Don’t-Grid','Motion-DoF');Merit=@('Tier-Assignment','Perk-Bundle','Anti-Gaming');Bliss=@('De-Escalate-3Steps','SLA-Resolve','Close-Loop');Haven=@('Triage-Levels','Strike-Levels','Escalate-Map');Prism=@('One-Graph-Rule','Weekly-Scorecard','NorthStar-Summary');Nova=@('Hook-Forge','Angle-Batch-5','Reveal-Scripts');Rune=@('Trigger-Add','DryRun-Then-Run','Rollback-Path');Fable=@('Hero→Problem→Promise→Proof→CTA','Outline→Draft→Polish','Trim-20%');Saga=@('Phase-Gates','Stakeholder-Map','WarRoom');Charm=@('Partner-Tiered-Outreach','FollowUp-3x','Offer-Pack');Lumen=@('CutList→Rough→Tighten→Brand','Lower-Thirds','Safe-Zones');Fortune=@('Ladder-Test','CAC/LTV-Scenarios','Sensitivity-Table');Serenity=@('Merge-Calendars','Add-Buffer','No-Back-to-Back')}
\$KPIs=@{Muse=@{completed_intakes='↑';epk_quality='↑'};Hope=@{ctr='↑';save_rate='↑';skip_rate='↓'};Treasure=@{payout_errors='↓';reward_claims='↑'};Harmony=@{session_length='↑';repeat_listens='↑'};Echo=@{reply_time='↓';thread_engagement='↑'};Aura=@{offbrand_incidents='↓';design_approval_rate='↑'};Merit=@{churn='↓';tier_upgrades='↑'};Bliss=@{csat='↑';reopen_rate='↓'};Haven=@{violations_caught='↑';false_positives='↓'};Prism=@{insight_time='↓';exec_read_rate='↑'};Nova=@{hook_rate='↑';concept_hit_rate='↑'};Rune=@{rollback_events='↓';automation_success='↑'};Fable=@{read_time='↑';conversion='↑'};Saga=@{on_time_milestones='↑';risk_breaches='↓'};Charm=@{partner_accepts='↑';time_to_reply='↓'};Lumen=@{edit_time='↓';view_through_rate='↑'};Fortune=@{revenue_uplift='↑';margin='↑'};Serenity=@{on_time_ratio='↑';buffer_breaches='↓'}}
\$Evals=@{_common=@('StyleMatch.v1','FactCheck.v1','ToxicityScan.v1');Nova=@('HookAB.v1');Echo=@('ToneAB.v1');Prism=@('InsightAccuracy.v1');Serenity=@('ScheduleStress.v1')}
\$Guardrails=@{_common=@('StayOnBrand','NoPII','NoMedical/LegalClaims','CiteIfUnsure');Aura=@('Reject-Offbrand-Visuals');Haven=@('ZeroTolerance-Abuse','Escalate-Illegal');Echo=@('No-Dogpiles','No-Arguing');Serenity=@('Protect-Buffers','Respect-Quiet-Hours')}
\$Handoffs=@{Muse=@('Fable','Aura','Harmony');Hope=@('Harmony','Serenity');Treasure=@('Merit','Fortune','Haven');Harmony=@('Hope','Lumen');Echo=@('Charm','Nova','Aura');Aura=@('Lumen','Fable');Merit=@('Treasure','Saga');Bliss=@('Haven','Serenity');Haven=@('Bliss','Merit','Prism');Prism=@('Fortune','Saga','Harmony');Nova=@('Lumen','Aura');Rune=@('Saga','Prism');Fable=@('Muse','Saga');Saga=@('Serenity','Prism');Charm=@('Echo','Aura');Lumen=@('Nova','Aura','Harmony');Fortune=@('Prism','Treasure');Serenity=@('Saga','Hope','Bliss')}

Files | ForEach-Object {
  \$p=\$_.FullName; \$o=ReadA \$p; \$n=\$o.name
  foreach(\$field in @('tools','datasources','playbooks','kpis','evals','guardrails','handoffs')){ if(-not (\$o.PSObject.Properties.Name -contains \$field)){ \$o | Add-Member -NotePropertyName \$field -NotePropertyValue $null } }
  \$o.tools=\$Tools[\$n]; \$o.datasources=(\$Datasets._common + \$Datasets[\$n]); \$o.playbooks=\$Playbooks[\$n]; \$o.kpis=\$KPIs[\$n]
  \$o.evals=@(); if(\$Evals._common){ \$o.evals+=\$Evals._common }; if(\$Evals[\$n]){ \$o.evals+=\$Evals[\$n] }
  \$o.guardrails=\$Guardrails._common + @(); if(\$Guardrails[\$n]){ \$o.guardrails+=\$Guardrails[\$n] }
  \$o.handoffs=\$Handoffs[\$n]
  if(-not \$o.meta){ \$o | Add-Member meta @{} }
  \$o.meta.version='2.0.0'; \$o.meta.last_updated=(Get-Date).ToString('o')
  if(-not \$o.changelog){ \$o | Add-Member changelog @() }
  \$o.changelog+='V2 StrengthenAll applied'
  SaveA \$o \$p
}
Write-Host "✅ V2 StrengthenAll complete"
"@
$StrengthenPath = Join-Path $Sprints "Sprint_StrengthenAll.ps1"
$Strengthen | Set-Content -Encoding UTF8 $StrengthenPath

# =========================
# SPRINT: Export Manifest + prompt stubs
# =========================
$ExportManifest = @"
param([string]\$RootPath = '$Root')
\$Agents = Join-Path \$RootPath 'agents'
\$Prompts = Join-Path \$RootPath 'prompts'
if(!(Test-Path \$Prompts)){ New-Item -ItemType Directory -Path \$Prompts | Out-Null }
function Files { Get-ChildItem \$Agents -Filter *.json -File }
function ReadA (\$p) { Get-Content \$p -Raw | ConvertFrom-Json }
\$all=@(); Files | ForEach-Object { \$all += (ReadA \$_.FullName) }
(\$all | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 (Join-Path \$RootPath 'agents.manifest.json')
Files | ForEach-Object {
  \$o=ReadA \$_.FullName
  \$stub = @"
System: You are **\$(\$o.name)**, TapTap’s \$(\$o.role).
Tone: \$(\$o.tone) | Vibe: \$(\$o.vibe) | Signature: \$(\$o.signature)
Guardrails: \$((\$o.guardrails -join ", "))

Command:
@\$(\$o.name) → <action> :: <inputs>
"@
  \$path = Join-Path \$Prompts ("\$((\$o.name)).prompt.txt"); \$stub | Set-Content -Encoding UTF8 \$path
}
Write-Host "✅ Manifest & prompt stubs exported"
"@
$ExportPath = Join-Path $Sprints "Sprint_ExportManifest.ps1"
$ExportManifest | Set-Content -Encoding UTF8 $ExportPath

# =========================
# SPRINT: Workflows (Launch, Onboarding, Promo, Policy)
# =========================
$WorkflowsSprint = @"
param([string]\$RootPath = '$Root')
\$WF = Join-Path \$RootPath 'workflows'
if(!(Test-Path \$WF)){ New-Item -ItemType Directory -Path \$WF | Out-Null }
function WriteWF(\$name,\$obj){ (\$obj | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 (Join-Path \$WF ("\$name.json")) }
WriteWF 'Launch' @{name='Launch';steps=@(@{agent='Nova';action='concept_batch';outputs='hooks/angles'},@{agent='Fable';action='story';inputs='HPPPCTA';outputs='narrative'},@{agent='Aura';action='brand_check';outputs='visual brief'},@{agent='Lumen';action='assets';outputs='cuts/banners'},@{agent='Echo';action='threads+replies';outputs='engagement plan'},@{agent='Charm';action='partner_pitches';outputs='outreach pack'},@{agent='Prism';action='impact_readout';outputs='one-graph'},@{agent='Fortune';action='revenue_projection';outputs='summary'},@{agent='Serenity';action='schedule';outputs='staged timeline'})}
WriteWF 'Onboarding' @{name='Onboarding';steps=@(@{agent='Muse';action='interview_10Q';outputs='bio+EPK'},@{agent='Fable';action='about+profile';outputs='copy'},@{agent='Harmony';action='starter_playlist';outputs='playlist'},@{agent='Hope';action='welcome_DM';outputs='2+1 recs'},@{agent='Merit';action='tier_assign';outputs='tier'},@{agent='Treasure';action='rewards_setup';outputs='TapPass perks'})}
WriteWF 'PromoStorm' @{name='PromoStorm';steps=@(@{agent='Nova';action='hooks_x10';outputs='angles'},@{agent='Echo';action='reply_storm';outputs='threads'},@{agent='Charm';action='partner_outreach';outputs='emails+DMs'},@{agent='Lumen';action='shorts';outputs='15s cuts'},@{agent='Prism';action='impact_summary';outputs='kpi one-graph'})}
WriteWF 'PolicySafety' @{name='PolicySafety';steps=@(@{agent='Haven';action='triage_rubric';outputs='matrix'},@{agent='Bliss';action='support_macros';outputs='responses'},@{agent='Aura';action='ui_notices';outputs='design notes'},@{agent='Saga';action='rollout';outputs='phased plan'},@{agent='Serenity';action='timing';outputs='cooldowns'})}
Write-Host "✅ Workflows written"
"@
$WorkflowsPath = Join-Path $Sprints "Sprint_Workflows.ps1"
$WorkflowsSprint | Set-Content -Encoding UTF8 $WorkflowsPath

# =========================
# SPRINT: A/B Evals (public-facing agents)
# =========================
$EvalsAB = @"
param([string]\$RootPath = '$Root')
\$Agents = Join-Path \$RootPath 'agents'
function Files { Get-ChildItem \$Agents -Filter *.json -File }
function ReadA (\$p) { Get-Content \$p -Raw | ConvertFrom-Json }
function SaveA (\$o,\$p){ (\$o | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 \$p }
\$abTargets = @('Nova','Echo','Prism','Aura','Lumen','Charm','Fable','Hope')
Files | ForEach-Object {
  \$p=\$_.FullName; \$o=ReadA \$p
  if(\$abTargets -contains \$o.name){
    \$o.ab_test=@{enabled=\$true;variants=@('A','B');sample=0.2;metrics=@('ctr','hook_rate','reply_quality','exec_read_rate');log=("reports/ab_"+(Get-Date).ToString('yyyyMMdd_HHmmss')+"_"+(\$o.name)+".json")}
    if(-not \$o.changelog){ \$o | Add-Member changelog @() }
    \$o.changelog += 'V2 AB eval config attached'
    SaveA \$o \$p
  }
}
Write-Host "✅ A/B eval configs attached"
"@
$EvalsABPath = Join-Path $Sprints "Sprint_EvalsAB.ps1"
$EvalsAB | Set-Content -Encoding UTF8 $EvalsABPath

# =========================
# SPRINT: KPI Weekly snapshot
# =========================
$KPIWeekly = @"
param([string]\$RootPath = '$Root')
\$Agents = Join-Path \$RootPath 'agents'; \$Reports = Join-Path \$RootPath 'reports'
if(!(Test-Path \$Reports)){ New-Item -ItemType Directory -Path \$Reports | Out-Null }
function Files { Get-ChildItem \$Agents -Filter *.json -File }
function ReadA (\$p) { Get-Content \$p -Raw | ConvertFrom-Json }
\$snapshot=@(); Files | ForEach-Object { \$o=ReadA \$_.FullName; \$snapshot += [ordered]@{name=\$o.name;role=\$o.role;kpis=\$o.kpis;last_updated=\$o.meta.last_updated} }
\$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
(\$snapshot | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 (Join-Path \$Reports ('kpi_week_'+\$stamp+'.json'))
Write-Host "✅ KPI weekly snapshot written"
"@
$KPIWeeklyPath = Join-Path $Sprints "Sprint_KPIWeekly.ps1"
$KPIWeekly | Set-Content -Encoding UTF8 $KPIWeeklyPath

# =========================
# SPRINT: Serenity cadence rules
# =========================
$SerenityCadence = @"
param([string]\$RootPath = '$Root')
\$Agents = Join-Path \$RootPath 'agents'
function PathOf(\$n){ Join-Path \$Agents ("\$n.json") }
function ReadA (\$p){ Get-Content \$p -Raw | ConvertFrom-Json }
function SaveA (\$o,\$p){ (\$o | ConvertTo-Json -Depth 40) | Set-Content -Encoding UTF8 \$p }
\$p=PathOf 'Serenity'
if(Test-Path \$p){
  \$o=ReadA \$p
  \$o.cadence=@{min_buffer_minutes=15;avoid_back_to_back=\$true;quiet_hours_local=@{start='22:00';end='07:00';timezone='America/New_York'};cooldown_windows=@('Mon 09:00-11:00 prep','Fri 16:00-18:00 freeze')}
  if(-not \$o.changelog){ \$o | Add-Member changelog @() }
  \$o.changelog += 'V2 Serenity cadence rules added'
  SaveA \$o \$p
  Write-Host '✅ Serenity cadence rules applied'
} else { Write-Host 'ℹ️ Serenity not found; cadence skipped' }
"@
$SerenityPath = Join-Path $Sprints "Sprint_SerenityCadence.ps1"
$SerenityCadence | Set-Content -Encoding UTF8 $SerenityPath

# =========================
# Orchestrate: run all V2 sprints
# =========================
& (Join-Path $Sprints "Sprint_StrengthenAll.ps1")
& (Join-Path $Sprints "Sprint_ExportManifest.ps1")
& (Join-Path $Sprints "Sprint_Workflows.ps1")
& (Join-Path $Sprints "Sprint_EvalsAB.ps1")
& (Join-Path $Sprints "Sprint_KPIWeekly.ps1")
& (Join-Path $Sprints "Sprint_SerenityCadence.ps1")

Write-Host "`n🎉 V2 upgrade complete. Check:" -ForegroundColor Green
Write-Host " - agents/*.json (v2 fields)" -ForegroundColor DarkCyan
Write-Host " - agents.manifest.json" -ForegroundColor DarkCyan
Write-Host " - workflows/*.json" -ForegroundColor DarkCyan
Write-Host " - reports/kpi_week_*.json" -ForegroundColor DarkCyan
