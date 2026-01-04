Import-Module "$PSScriptRoot/Util.psm1" -Force
function Invoke-PrismaMigrationDoctor {
  [CmdletBinding()]
  param([ValidateSet("safe","force")][string]$Mode="safe",[bool]$Seed=$false,[switch]$Force)
  Write-Step "Checking prisma CLI"
  if (-not (Test-Cli -Name "npx")) { throw "npx not found. Install Node.js / pnpm." }
  Write-Step "Validating schema"; & npx prisma validate; if ($LASTEXITCODE -ne 0){ throw "Prisma schema invalid." }
  Write-Step "DB Introspection (pull, info only)"; & npx prisma db pull; if ($LASTEXITCODE -ne 0){ throw "Failed db pull." }
  Write-Step "Preview diff (no changes applied)"; & npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script; if ($LASTEXITCODE -ne 0){ throw "migrate diff failed." }
  if ($Mode -eq "force"){ Write-Step "Applying migrations (dev)"; & npx prisma migrate dev; if ($LASTEXITCODE -ne 0){ throw "migrate dev failed." } } else { Write-Next "Preview shown. Re-run with -Mode force to apply." }
  if ($Seed){ Write-Step "Seeding database"; & npx prisma db seed; if ($LASTEXITCODE -ne 0){ throw "db seed failed." } }
  Write-Next "Recommended checks:"; Write-Next " - Unique duplicates (Follow, User.username, Wallet.address)"; Write-Next " - Supabase RLS for affected tables"
}
Export-ModuleMember -Function Invoke-PrismaMigrationDoctor

