"use client";

import { useEffect, useState } from "react";
import { Wallet2, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

type Overview = {
  network: string;
  rpcUrl: string;
  treasury: { address: string | null; userId: string | null; sol: number; lamports: number; tap: number; tapRaw: string };
  mint: null | { address: string; supply: string; decimals: number; mintAuthority: string | null; freezeAuthority: string | null; isInitialized: boolean };
  offChainTrap: { balance: string };
  recentSignatures: Array<{ signature: string; slot: number | null; blockTime: number | null; err: string | null }>;
  warnings: string[];
};

function fmtNum(n: number | string) {
  const x = typeof n === "number" ? n : Number(n || 0);
  return Number.isFinite(x) ? x.toLocaleString() : "0";
}

function explorerTx(sig: string, network: string) {
  const cluster = network === "mainnet" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${sig}${cluster}`;
}

export default function BankOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bank/overview", { cache: "no-store" });
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
          <Wallet2 className="h-5 w-5 text-emerald-300" />
          <h2 className="text-lg font-semibold">Blockchain Bank</h2>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
            {data?.network || "?"}
          </span>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {data?.warnings?.length ? (
        <div className="mb-3 rounded border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Config warnings</div>
          <ul className="list-disc list-inside">
            {data.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Treasury SOL" value={data ? `${data.treasury.sol.toFixed(4)} SOL` : "—"} sub={data ? `${fmtNum(data.treasury.lamports)} lamports` : ""} />
        <Stat label="Treasury TAP" value={data ? `${fmtNum(data.treasury.tap)} TAP` : "—"} sub={data ? `${data.treasury.tapRaw} raw` : ""} />
        <Stat label="On-chain Supply" value={data?.mint ? fmtNum(data.mint.supply) : "—"} sub={data?.mint ? `${data.mint.decimals} decimals` : ""} />
        <Stat label="Off-chain Trap" value={data ? `${fmtNum(data.offChainTrap.balance)} TAP` : "—"} sub="TAPTAX_TREASURY ledger" />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-white/70">
        <Row label="Treasury address" value={data?.treasury.address || "—"} />
        <Row label="TAP mint" value={data?.mint?.address || "—"} />
        <Row label="Mint authority" value={data?.mint?.mintAuthority || "—"} />
        <Row label="Freeze authority" value={data?.mint?.freezeAuthority || "(none)"} />
      </div>

      {data?.recentSignatures?.length ? (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-white/50 mb-2">Recent Treasury Activity</div>
          <ul className="space-y-1 text-xs">
            {data.recentSignatures.slice(0, 8).map((s) => (
              <li key={s.signature} className="flex items-center justify-between gap-2 rounded bg-black/30 px-2 py-1">
                <span className={s.err ? "text-red-300" : "text-emerald-200"}>{s.err ? "✗" : "✓"}</span>
                <code className="truncate text-white/80 font-mono">{s.signature.slice(0, 24)}…</code>
                <span className="text-white/40">{s.blockTime ? new Date(s.blockTime * 1000).toLocaleTimeString() : ""}</span>
                <a href={explorerTx(s.signature, data.network)} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline inline-flex items-center gap-0.5">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {sub ? <div className="text-[10px] text-white/40 mt-1">{sub}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded bg-black/20 px-2 py-1">
      <span className="text-white/50">{label}</span>
      <code className="truncate font-mono text-white/80">{value}</code>
    </div>
  );
}
