"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Hammer, RefreshCw, ExternalLink } from "lucide-react";
import NetworkStatus from "@/components/admin/forge/NetworkStatus";
import CreateTokenForm from "@/components/admin/forge/CreateTokenForm";
import TokenRegistry from "@/components/admin/forge/TokenRegistry";
import TokenDetailView from "@/components/admin/forge/TokenDetail";
import type { TokenSummary } from "@/components/admin/forge/types";

export default function TokenForgePage() {
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bank/tokens?limit=200", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to load tokens");
      setTokens(j.tokens ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function onCreated(token: TokenSummary) {
    setTokens((prev) => [token, ...prev]);
    setSelectedId(token.id);
  }

  // Possible parents = ROOT or LAYER tokens (no EXPERIMENTAL parents)
  const parents = tokens.filter((t) => t.kind === "ROOT" || t.kind === "LAYER");

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Hammer className="h-8 w-8 text-amber-300" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-amber-200">Admin · Bank</div>
              <h1 className="text-3xl font-bold text-white">Token Forge</h1>
              <p className="text-white/60">
                Manage SPL token registry across Solana Devnet → Testnet → Mainnet. Mainnet operations
                require typed confirmation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh registry
            </button>
            <Link
              href="/admin/economy"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/20"
            >
              Economy hub <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              ← Admin home
            </Link>
          </div>
        </header>

        <NetworkStatus />

        <CreateTokenForm parents={parents} onCreated={onCreated} />

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <TokenRegistry tokens={tokens} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-3">
            {selectedId ? (
              <TokenDetailView tokenId={selectedId} onChanged={refresh} />
            ) : (
              <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
                Select a token from the registry to view deployments and run lifecycle actions
                (deploy, mint, revoke, promote).
              </section>
            )}
          </div>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold mb-2">Operator notes</h2>
          <ul className="text-xs text-white/60 list-disc list-inside space-y-1">
            <li>Forge requires <code>TOKEN_FORGE_KEK</code> (base64 32-byte) and <code>TREASURY_WALLET_SECRET</code>. Status shown above.</li>
            <li>New tokens start in <code>DRAFT</code>. Deploying on any chain transitions them to <code>DEPLOYED</code>.</li>
            <li>Mainnet ops require typing the exact confirmation string (<code>MAINNET-ACTION-SYMBOL</code>) into the panel.</li>
            <li>Revoking the <strong>MINT</strong> authority is permanent and freezes the deployment; revoking <strong>FREEZE</strong> only removes that capability.</li>
            <li>Promotion paths: Devnet → Testnet/Mainnet, Testnet → Mainnet. A fresh mint authority is generated on the target chain.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
