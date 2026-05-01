"use client";

import Link from "next/link";
import { Crown, Shield, ExternalLink, Hammer } from "lucide-react";
import BankOverview from "@/components/admin/economy/BankOverview";
import MarketPrices from "@/components/admin/economy/MarketPrices";
import TreasuryActions from "@/components/admin/economy/TreasuryActions";
import SwapPanel from "@/components/admin/economy/SwapPanel";

export default function EconomyControlCenter() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-amber-300" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-amber-200">Admin</div>
              <h1 className="text-3xl font-bold text-white">Economy Control Center</h1>
              <p className="text-white/60">Live blockchain bank, market prices, on-chain treasury actions, and Jupiter swap.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/forge"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/20"
            >
              <Hammer className="h-3 w-3" /> Token Forge
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/trap"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/20"
            >
              <Shield className="h-3 w-3" /> The Trap (off-chain)
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              ← Admin home
            </Link>
          </div>
        </header>

        <BankOverview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketPrices />
          <SwapPanel />
        </div>

        <TreasuryActions />

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold mb-2">Operator notes</h2>
          <ul className="text-xs text-white/60 list-disc list-inside space-y-1">
            <li>Treasury actions require <code>TREASURY_WALLET_SECRET</code> (base64 secret key). Mint requires <code>TAP_MINT_AUTH_SECRET</code>.</li>
            <li>SOL price refreshes from CoinGecko on demand and caches for 60 seconds. TAP is set manually here.</li>
            <li>Swap quote/execute proxies Jupiter (<code>JUPITER_API_BASE</code>, default lite-api.jup.ag/swap/v1). Use <code>JUPITER_API_KEY</code> for pro tier.</li>
            <li>Burn here is on-chain and irreversible — it reduces total supply. Off-chain burns/airdrops live at <Link href="/admin/trap" className="text-cyan-300 hover:underline">/admin/trap</Link>.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
