"use client";

import { useEffect, useState } from "react";
import { Globe2, KeyRound, Wallet2, RefreshCw, Droplets, ShieldAlert } from "lucide-react";
import type { NetworksResponse } from "./types";
import { CHAIN_LABEL, CHAIN_TONE } from "./types";

export default function NetworkStatus() {
  const [data, setData] = useState<NetworksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bank/networks", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-semibold">Networks &amp; Forge readiness</h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
          <ShieldAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {data && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <EnvBadge ok={data.env.kekPresent} label="TOKEN_FORGE_KEK" icon={<KeyRound className="h-3 w-3" />} />
            <EnvBadge ok={data.env.treasuryPresent} label="TREASURY_WALLET_SECRET" icon={<Wallet2 className="h-3 w-3" />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.chains.map((c) => (
              <div
                key={c.chain}
                className={`rounded-lg border p-3 ${CHAIN_TONE[c.chain]}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{CHAIN_LABEL[c.chain]}</div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                      c.deployable
                        ? "bg-emerald-500/30 text-emerald-100"
                        : "bg-rose-500/30 text-rose-100"
                    }`}
                  >
                    {c.deployable ? "Deployable" : "Blocked"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-white/60 break-all">{c.rpcUrl}</div>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {c.rpcOverride && (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">RPC override</span>
                  )}
                  {c.supportsAirdrop && (
                    <span className="inline-flex items-center gap-1 rounded bg-sky-500/20 px-1.5 py-0.5 text-sky-100">
                      <Droplets className="h-2.5 w-2.5" /> Airdrop
                    </span>
                  )}
                  {c.isMainnet && (
                    <span className="rounded bg-rose-500/30 px-1.5 py-0.5 text-rose-100">Mainnet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!data && !error && (
        <div className="text-xs text-white/50">Loading network status…</div>
      )}
    </section>
  );
}

function EnvBadge({ ok, label, icon }: { ok: boolean; label: string; icon: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
        ok
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-rose-400/30 bg-rose-400/10 text-rose-200"
      }`}
    >
      {icon}
      {label}
      <span className="ml-1">{ok ? "OK" : "missing"}</span>
    </span>
  );
}
