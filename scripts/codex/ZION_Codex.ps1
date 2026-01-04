param([Parameter(Mandatory=$true)][string]$Agent,[hashtable]$Args,[switch]$Force)
$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { try { $PSStyle.OutputRendering = "Ansi" } catch {} }
function Write-Note($m){ Write-Host "NOTE" $m -ForegroundColor Cyan }
function Write-Ok($m){ Write-Host "OK" $m -ForegroundColor Green }
function Write-Warn($m){ Write-Host "WARN" $m -ForegroundColor Yellow }
$root = Split-Path -Parent $PSCommandPath; $agentsDir = Join-Path $root "agents"; $modsDir = Join-Path $root "modules"
Import-Module (Join-Path $modsDir "Util.psm1") -Force
Import-Module (Join-Path $modsDir "PrismaMigrationDoctor.psm1") -Force
Import-Module (Join-Path $modsDir "SocialForge.psm1") -Force
Import-Module (Join-Path $modsDir "LibraryArchitect.psm1") -Force
Import-Module (Join-Path $modsDir "MarketplaceSmith.psm1") -Force
Import-Module (Join-Path $modsDir "BattlesStudio.psm1") -Force
Import-Module (Join-Path $modsDir "SurfCrawler.psm1") -Force
$map = @{ "Orchestrator"="zion.orchestrator"; "ZION"="zion.orchestrator"; "PrismaMigrationDoctor"="prisma.migrationDoctor"; "MigrationDoctor"="prisma.migrationDoctor"; "SocialForge"="social.forge"; "LibraryArchitect"="library.architect"; "MarketplaceSmith"="marketplace.smith"; "BattlesStudio"="battles.studio"; "SurfCrawler"="surf.crawler" }
if ($map.ContainsKey($Agent)) { $Agent = $map[$Agent] }
$agentMap = @{
  "zion.orchestrator" = "ZION_Orchestrator.agent.json";
  "prisma.migrationDoctor" = "PrismaMigrationDoctor.agent.json";
  "social.forge" = "SocialForge.agent.json";
  "library.architect" = "LibraryArchitect.agent.json";
  "marketplace.smith" = "MarketplaceSmith.agent.json";
  "battles.studio" = "BattlesStudio.agent.json";
  "surf.crawler" = "SurfCrawler.agent.json";
}
if (-not $agentMap.ContainsKey($Agent)) { throw "Unknown agent '$Agent'." }
$agentFile = Join-Path $agentsDir $agentMap[$Agent]
$manifest = Get-Content $agentFile -Raw | ConvertFrom-Json
Write-Host "`n  " -NoNewline; Write-Host $manifest.name -ForegroundColor Magenta
Write-Note "id: $($manifest.id)"; Write-Note "danger: $($manifest.danger)"
switch ($manifest.id) {
  "zion.orchestrator" {
    $feature=$Args.feature
    if(-not $feature){ Write-Warn "No feature provided. Example: -Args @{ feature='Social DM typing indicator'; path='app/social' }" }
    if($feature -match "schema|migrat|prisma|db"){
      Write-Note "Routing to Prisma Migration Doctor (preview)..."; Invoke-PrismaMigrationDoctor -Mode "safe" -Seed:$false -Force:$Force
    } elseif($feature -match "social|dm|feed|profile|tweet|post"){
      Write-Note "Routing to Social Forge..."; Invoke-SocialForge -Features "threads,media,notifications,dms" -Route "app/social/page.tsx" -Realtime:$true
    } else { Write-Warn "Could not infer. Run with -Agent PrismaMigrationDoctor or -Agent SocialForge." }
  }
  "prisma.migrationDoctor" {
    $mode = $Args.mode; if(-not $mode){$mode="safe"}; $seed = $Args.seed; if(-not $seed){$seed=$false}
    Invoke-PrismaMigrationDoctor -Mode $mode -Seed:$seed -Force:$Force
  }
  "social.forge" {
    $features = $Args.features; if(-not $features){$features="threads,media,notifications,dms"}
    $route = $Args.route; if(-not $route){$route="app/social/page.tsx"}
    $realtime = $Args.realtime; if($null -eq $realtime){$realtime=$true}
    Invoke-SocialForge -Features $features -Route $route -Realtime:$realtime
  }
  "library.architect" {
    $theme = $Args.theme; if(-not $theme){$theme="matrixTeal"}
    $queue = $Args.queue; if(-not $queue){$queue="right"}
    $wavesurfer = $Args.wavesurfer; if($null -eq $wavesurfer){$wavesurfer=$true}
    $rightRail = $Args.rightRail; if($null -eq $rightRail){$rightRail=$true}
    $route = $Args.route; if(-not $route){$route="app/library/CodexLibrary.tsx"}
    Invoke-LibraryArchitect -Theme $theme -Queue $queue -WaveSurfer:$wavesurfer -RightRail:$rightRail -Route $route
  }
  "marketplace.smith" {
    $providers = $Args.providers; if(-not $providers){$providers="stripe,solana"}
    $products = $Args.products; if(-not $products){$products="TapPass,Tracks,Bundles"}
    $route = $Args.route; if(-not $route){$route="app/marketplace/CodexMarketplace.tsx"}
    Invoke-MarketplaceSmith -Providers $providers -Products $products -Route $route
  }
  "battles.studio" {
    $routePage = $Args.routePage; if(-not $routePage){$routePage="app/battles/page.tsx"}
    $routeApi  = $Args.routeApi; if(-not $routeApi){$routeApi="app/api/battles/route.ts"}
    $sort      = $Args.sort; if(-not $sort){$sort="recent"}
    $max       = $Args.maxResults; if(-not $max){$max=24}
    Invoke-BattlesStudio -RoutePage $routePage -RouteApi $routeApi -Sort $sort -MaxResults $max
  }
  "surf.crawler" {
    $allowance = $Args.allowance; if(-not $allowance){$allowance="25/day"}
    $quality = $Args.quality; if(-not $quality){$quality="720p"}
    $route = $Args.route; if(-not $route){$route="app/surf/CodexSurf.tsx"}
    Invoke-SurfCrawler -Allowance $allowance -Quality $quality -Route $route
  }
  default { throw "No handler for $($manifest.id)" }
}
Write-Ok "`nDone."
