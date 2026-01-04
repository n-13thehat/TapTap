Import-Module "$PSScriptRoot/Util.psm1" -Force
function Invoke-SocialForge {
  [CmdletBinding()]
  param([string]$Features="threads,media,notifications,dms",[string]$Route="app/social/page.tsx",[bool]$Realtime=$true)
  Write-Step "Ensuring shadcn/ui essentials"
  $needed=@("separator","tooltip","toast","scroll-area","avatar","badge","dropdown-menu","tabs")
  foreach($c in $needed){ Write-Next "shadcn: $c"; try{ & pnpm shadcn:add $c 2>$null | Out-Null }catch{} }
  $dir=Split-Path $Route -Parent; Ensure-Dir $dir
  $tsx=@"
"use client";
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
export default function SocialPage() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <main className="max-w-6xl mx-auto grid grid-cols-12 gap-4 p-4">
        <section className="col-span-3 hidden lg:block">
          <nav className="space-y-2">
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Home</a>
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Explore</a>
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Messages</a>
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Notifications</a>
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Profile</a>
            <a className="block px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800">Settings</a>
          </nav>
        </section>
        <section className="col-span-12 lg:col-span-6">
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 bg-zinc-950/60"><h1 className="text-xl font-semibold">TapTap Social</h1></div>
            <Separator />
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-zinc-900/60 p-4">Composer (placeholder)</div>
              <div className="rounded-xl bg-zinc-900/60 p-4">Feed item</div>
              <div className="rounded-xl bg-zinc-900/60 p-4">Feed item</div>
              <div className="rounded-xl bg-zinc-900/60 p-4">Feed item</div>
            </div>
          </div>
        </section>
        <section className="col-span-3 hidden lg:block">
          <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/60">
            <h2 className="font-medium mb-2">Now</h2>
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-3">
                <div className="rounded-lg bg-zinc-900/60 p-3">Trending topic</div>
                <div className="rounded-lg bg-zinc-900/60 p-3">Suggested profile</div>
                <div className="rounded-lg bg-zinc-900/60 p-3">System notice</div>
              </div>
            </ScrollArea>
          </div>
        </section>
      </main>
      <Toaster />
    </div>
  )
}
"@; $utf8=New-Object System.Text.UTF8Encoding($false); [IO.File]::WriteAllText((Resolve-Path (New-Item -ItemType File -Force -Path $Route)),$tsx,$utf8)
  Write-Next "Next steps:"; Write-Todo "Wire Prisma models (posts, profiles, follows)"; Write-Todo "Socket.IO presence + typing"; Write-Todo "API routes w/ zod"; Write-Todo "Notifications + toasts"; Write-Todo "Playwright tests"
}
Export-ModuleMember -Function Invoke-SocialForge

